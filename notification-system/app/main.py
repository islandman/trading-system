import asyncio
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

import redis.asyncio as redis
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from pydantic import BaseModel, Field
import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, init_db
from app.models import Event, Notification, NotificationChannelJob, UserChannelPrefs
from app.channels import ChannelManager
from app.orchestrator import NotificationOrchestrator
from app.templates import TemplateManager
from app.auth import get_current_user, create_access_token, verify_api_key, get_current_user_from_api_key
from app.config import settings
from app.metrics import metrics

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Notification System",
    description="A standalone notification system for trading applications",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# API Key authentication
async def get_user_from_api_key_or_token(
    authorization: Optional[str] = Depends(HTTPBearer(auto_error=False)),
    x_api_key: Optional[str] = Depends(lambda: None)  # We'll handle this manually
) -> str:
    """Get user from either API key or JWT token"""
    # Check for API key in headers first
    from fastapi import Request
    request = Request()
    api_key = request.headers.get("X-API-Key")
    
    if api_key:
        return await get_current_user_from_api_key(api_key)
    
    # Fall back to JWT token
    if authorization:
        return await get_current_user(authorization)
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
        headers={"WWW-Authenticate": "Bearer"},
    )

# Redis connection
redis_client: Optional[redis.Redis] = None

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        logger.info(f"User {user_id} connected to WebSocket")

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            logger.info(f"User {user_id} disconnected from WebSocket")

    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_text(message)
            except Exception as e:
                logger.error(f"Failed to send message to user {user_id}: {e}")
                self.disconnect(user_id)

    async def broadcast(self, message: str, user_ids: List[str]):
        for user_id in user_ids:
            await self.send_personal_message(message, user_id)

manager = ConnectionManager()

# Initialize services
channel_manager = ChannelManager()
orchestrator = NotificationOrchestrator(channel_manager)
template_manager = TemplateManager()

# Pydantic models
class EventCreate(BaseModel):
    event_id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str
    producer: str
    payload: Dict
    severity: str = "medium"
    dedupe_key: Optional[str] = None

class NotificationAck(BaseModel):
    notification_id: str

class UserPreferences(BaseModel):
    channels: Dict[str, bool] = Field(default_factory=dict)
    quiet_hours: Dict[str, str] = Field(default_factory=dict)
    severity_min: str = "low"
    locale: str = "en"

# Startup event
@app.on_event("startup")
async def startup_event():
    global redis_client
    redis_client = redis.from_url(settings.REDIS_URL)
    await init_db()
    logger.info("Notification system started")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    if redis_client:
        await redis_client.close()
    logger.info("Notification system shutdown")

# Health check endpoints
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc)}

@app.get("/health/detailed")
async def detailed_health_check():
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc),
        "components": {}
    }
    
    # Check Redis
    try:
        await redis_client.ping()
        health_status["components"]["redis"] = "healthy"
    except Exception as e:
        health_status["components"]["redis"] = f"unhealthy: {e}"
        health_status["status"] = "degraded"
    
    # Check database
    try:
        async with get_db() as db:
            await db.execute("SELECT 1")
        health_status["components"]["database"] = "healthy"
    except Exception as e:
        health_status["components"]["database"] = f"unhealthy: {e}"
        health_status["status"] = "degraded"
    
    return health_status

# Metrics endpoint
@app.get("/metrics")
async def get_metrics():
    return metrics.get_metrics()

# Event publishing endpoint
@app.post("/v1/events")
async def publish_event(
    event: EventCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Publish a domain event to the notification system"""
    # Handle authentication
    api_key = request.headers.get("X-API-Key")
    if api_key:
        current_user = await get_current_user_from_api_key(api_key)
    else:
        # Fall back to JWT token
        authorization = request.headers.get("Authorization")
        if authorization and authorization.startswith("Bearer "):
            token = authorization[7:]  # Remove "Bearer " prefix
            from app.auth import verify_token
            payload = verify_token(token)
            if payload:
                current_user = payload.get("sub", "unknown")
            else:
                raise HTTPException(status_code=401, detail="Invalid token")
        else:
            raise HTTPException(status_code=401, detail="Authentication required")
    """Publish a domain event to the notification system"""
    try:
        # Create event record
        db_event = Event(
            event_id=event.event_id,
            type=event.type,
            producer=event.producer,
            payload=event.payload,
            severity=event.severity,
            dedupe_key=event.dedupe_key,
            occurred_at=datetime.now(timezone.utc)
        )
        
        db.add(db_event)
        await db.commit()
        await db.refresh(db_event)
        
        # Publish to event bus (Redis)
        event_message = {
            "event_id": event.event_id,
            "type": event.type,
            "producer": event.producer,
            "payload": event.payload,
            "severity": event.severity,
            "dedupe_key": event.dedupe_key,
            "occurred_at": db_event.occurred_at.isoformat()
        }
        
        await redis_client.publish("events", json.dumps(event_message))
        
        # Increment metrics
        metrics.increment_counter("notifications_emitted_total", {"event_type": event.type})
        
        logger.info(f"Event published: {event.type} by {event.producer}")
        
        return {"status": "published", "event_id": event.event_id}
        
    except Exception as e:
        logger.error(f"Failed to publish event: {e}")
        raise HTTPException(status_code=500, detail="Failed to publish event")

# Get user notifications
@app.get("/v1/notifications")
async def get_notifications(
    cursor: Optional[str] = None,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get user's notifications with pagination"""
    try:
        query = db.query(Notification).filter(Notification.user_id == current_user)
        
        if cursor:
            query = query.filter(Notification.id > cursor)
        
        notifications = await db.execute(
            query.order_by(Notification.created_at.desc()).limit(limit)
        )
        
        return {
            "notifications": [n.to_dict() for n in notifications.scalars()],
            "has_more": len(notifications.scalars()) == limit
        }
        
    except Exception as e:
        logger.error(f"Failed to get notifications: {e}")
        raise HTTPException(status_code=500, detail="Failed to get notifications")

# Mark notification as read
@app.post("/v1/notifications/ack")
async def acknowledge_notification(
    ack: NotificationAck,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Mark a notification as read"""
    try:
        notification = await db.execute(
            db.query(Notification).filter(
                Notification.id == ack.notification_id,
                Notification.user_id == current_user
            )
        )
        
        notification = notification.scalar_one_or_none()
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        notification.read_at = datetime.now(timezone.utc)
        await db.commit()
        
        return {"status": "acknowledged"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to acknowledge notification: {e}")
        raise HTTPException(status_code=500, detail="Failed to acknowledge notification")

# WebSocket endpoint for real-time notifications
@app.websocket("/v1/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time notifications"""
    try:
        # Get token from query parameters
        token = websocket.query_params.get("token")
        if not token:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Verify token and get user
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
            user_id = payload.get("sub")
            if not user_id:
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return
        except jwt.InvalidTokenError:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Connect to WebSocket
        await manager.connect(websocket, user_id)
        
        try:
            while True:
                # Keep connection alive
                data = await websocket.receive_text()
                # Echo back for heartbeat
                await websocket.send_text(json.dumps({"type": "heartbeat", "timestamp": datetime.now().isoformat()}))
                
        except WebSocketDisconnect:
            manager.disconnect(user_id)
            
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except:
            pass

# User preferences endpoints
@app.get("/v1/prefs")
async def get_user_preferences(
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get user's notification preferences"""
    try:
        prefs = await db.execute(
            db.query(UserChannelPrefs).filter(UserChannelPrefs.user_id == current_user)
        )
        
        preferences = {}
        for pref in prefs.scalars():
            preferences[pref.channel] = {
                "enabled": pref.enabled,
                "severity_min": pref.severity_min,
                "quiet_hours": pref.quiet_hours
            }
        
        return {"preferences": preferences}
        
    except Exception as e:
        logger.error(f"Failed to get user preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user preferences")

@app.post("/v1/prefs")
async def update_user_preferences(
    prefs: UserPreferences,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Update user's notification preferences"""
    try:
        # Update or create preferences for each channel
        for channel, enabled in prefs.channels.items():
            existing_pref = await db.execute(
                db.query(UserChannelPrefs).filter(
                    UserChannelPrefs.user_id == current_user,
                    UserChannelPrefs.channel == channel
                )
            )
            
            existing_pref = existing_pref.scalar_one_or_none()
            
            if existing_pref:
                existing_pref.enabled = enabled
                existing_pref.severity_min = prefs.severity_min
                existing_pref.quiet_hours = prefs.quiet_hours
            else:
                new_pref = UserChannelPrefs(
                    user_id=current_user,
                    channel=channel,
                    enabled=enabled,
                    severity_min=prefs.severity_min,
                    quiet_hours=prefs.quiet_hours
                )
                db.add(new_pref)
        
        await db.commit()
        
        return {"status": "updated"}
        
    except Exception as e:
        logger.error(f"Failed to update user preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user preferences")

# Test notification endpoint
@app.post("/v1/test/notify")
async def test_notification(
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Send a test notification to the current user"""
    try:
        # Create test event
        test_event = EventCreate(
            type="TEST_NOTIFICATION",
            producer="notification-system",
            payload={
                "user_id": current_user,
                "message": "This is a test notification",
                "timestamp": datetime.now(timezone.utc).isoformat()
            },
            severity="low"
        )
        
        # Publish event
        await publish_event(test_event, db, current_user)
        
        return {"status": "test_notification_sent"}
        
    except Exception as e:
        logger.error(f"Failed to send test notification: {e}")
        raise HTTPException(status_code=500, detail="Failed to send test notification")

# Admin endpoints
@app.get("/admin/dlq")
async def get_dead_letter_queue(
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get dead letter queue items (admin only)"""
    # TODO: Add admin role check
    try:
        failed_jobs = await db.execute(
            db.query(NotificationChannelJob).filter(
                NotificationChannelJob.status == "failed"
            ).order_by(NotificationChannelJob.created_at.desc()).limit(100)
        )
        
        return {
            "failed_jobs": [job.to_dict() for job in failed_jobs.scalars()]
        }
        
    except Exception as e:
        logger.error(f"Failed to get DLQ: {e}")
        raise HTTPException(status_code=500, detail="Failed to get DLQ")

@app.post("/admin/dlq/replay")
async def replay_dead_letter_queue_item(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Replay a failed notification job (admin only)"""
    # TODO: Add admin role check
    try:
        job = await db.execute(
            db.query(NotificationChannelJob).filter(NotificationChannelJob.id == job_id)
        )
        
        job = job.scalar_one_or_none()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Reset job status and retry
        job.status = "queued"
        job.attempts = 0
        job.last_error = None
        await db.commit()
        
        # Re-queue the job
        await redis_client.lpush(f"channel_queue:{job.channel}", job.id)
        
        return {"status": "replayed"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to replay DLQ item: {e}")
        raise HTTPException(status_code=500, detail="Failed to replay DLQ item")

# Background task to process events
async def process_events():
    """Background task to process events from Redis"""
    pubsub = redis_client.pubsub()
    await pubsub.subscribe("events")
    
    logger.info("Event processor started")
    
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    event_data = json.loads(message["data"])
                    await orchestrator.process_event(event_data)
                except Exception as e:
                    logger.error(f"Failed to process event: {e}")
    except Exception as e:
        logger.error(f"Event processor error: {e}")
    finally:
        await pubsub.close()

# Start background tasks
@app.on_event("startup")
async def start_background_tasks():
    asyncio.create_task(process_events())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
