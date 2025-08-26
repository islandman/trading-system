import logging
import json
from typing import Optional

from . import BaseChannelAdapter, SendResult, TemplateOutput
from app.models import NotificationChannelJob
from app.main import manager  # Import the WebSocket connection manager
from app.config import settings

logger = logging.getLogger(__name__)

class InAppAdapter(BaseChannelAdapter):
    """In-app channel adapter for real-time browser notifications"""
    
    def __init__(self):
        super().__init__()
    
    async def send(self, job: NotificationChannelJob, rendered: TemplateOutput) -> SendResult:
        """Send in-app notification via WebSocket"""
        try:
            # Check rate limit
            if not await self.check_rate_limit(job.notification.user_id, "inapp"):
                return SendResult(False, error="Rate limit exceeded")
            
            # Prepare notification payload
            notification_payload = self._prepare_notification_payload(job, rendered)
            
            # Send via WebSocket
            await manager.send_personal_message(
                json.dumps(notification_payload),
                job.notification.user_id
            )
            
            logger.info(f"In-app notification sent to user {job.notification.user_id}")
            return SendResult(True, provider_msg_id=f"inapp-{job.id}")
            
        except Exception as e:
            logger.error(f"Error sending in-app notification: {e}")
            return SendResult(False, error=str(e))
    
    def _prepare_notification_payload(self, job: NotificationChannelJob, rendered: TemplateOutput) -> dict:
        """Prepare notification payload for WebSocket"""
        return {
            "type": "notification",
            "notification_id": str(job.notification.id),
            "title": rendered.subject or "Notification",
            "message": rendered.body,
            "priority": job.notification.priority,
            "timestamp": job.notification.created_at.isoformat() if job.notification.created_at else None,
            "cta_url": rendered.cta_url,
            "channel": "inapp"
        }
    
    def get_rate_limit(self) -> int:
        """Get rate limit for in-app channel"""
        return settings.RATE_LIMIT_CHANNELS.get("inapp", 1000)
    
    async def broadcast_to_users(self, user_ids: list, notification_payload: dict) -> SendResult:
        """Broadcast notification to multiple users"""
        try:
            await manager.broadcast(
                json.dumps(notification_payload),
                user_ids
            )
            
            logger.info(f"Broadcast notification sent to {len(user_ids)} users")
            return SendResult(True, provider_msg_id="broadcast")
            
        except Exception as e:
            logger.error(f"Error broadcasting notification: {e}")
            return SendResult(False, error=str(e))
    
    async def get_connected_users(self) -> list:
        """Get list of currently connected users"""
        return list(manager.active_connections.keys())
    
    async def is_user_connected(self, user_id: str) -> bool:
        """Check if a user is currently connected"""
        return user_id in manager.active_connections
