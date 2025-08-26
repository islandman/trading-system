import logging
import yaml
from typing import Dict, List, Optional
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import Event, Notification, NotificationChannelJob, UserChannelPrefs, Template
from app.channels import ChannelManager, TemplateOutput
from app.templates import TemplateManager
from app.rules import RulesEngine
from app.config import settings

logger = logging.getLogger(__name__)

class NotificationOrchestrator:
    """Orchestrates the notification process from events to delivery"""
    
    def __init__(self, channel_manager: ChannelManager):
        self.channel_manager = channel_manager
        self.template_manager = TemplateManager()
        self.rules_engine = RulesEngine()
        self._load_rules()
    
    def _load_rules(self):
        """Load notification rules from configuration"""
        try:
            # Load rules from YAML file or use defaults
            rules_config = self._get_default_rules()
            self.rules_engine.load_rules(rules_config)
            logger.info("Notification rules loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load notification rules: {e}")
    
    def _get_default_rules(self) -> dict:
        """Get default notification rules"""
        return {
            "rules": [
                {
                    "name": "Order Filled",
                    "event_type": "ORDER_FILLED",
                    "conditions": [
                        {
                            "field": "severity",
                            "operator": "gte",
                            "value": "low"
                        }
                    ],
                    "actions": [
                        {
                            "type": "notify",
                            "channels": ["inapp", "email"],
                            "template": "order.filled",
                            "priority": "normal"
                        }
                    ]
                },
                {
                    "name": "Margin Call",
                    "event_type": "MARGIN_CALL",
                    "conditions": [
                        {
                            "field": "severity",
                            "operator": "eq",
                            "value": "critical"
                        }
                    ],
                    "actions": [
                        {
                            "type": "notify",
                            "channels": ["inapp", "sms", "voice", "email"],
                            "template": "risk.margin_call",
                            "priority": "high",
                            "bypass_quiet_hours": True
                        }
                    ]
                },
                {
                    "name": "Price Alert",
                    "event_type": "PRICE_ALERT",
                    "conditions": [
                        {
                            "field": "severity",
                            "operator": "gte",
                            "value": "medium"
                        }
                    ],
                    "actions": [
                        {
                            "type": "notify",
                            "channels": ["inapp", "email"],
                            "template": "market.price_alert",
                            "priority": "medium"
                        }
                    ]
                },
                {
                    "name": "Risk Breach",
                    "event_type": "RISK_BREACH",
                    "conditions": [
                        {
                            "field": "severity",
                            "operator": "gte",
                            "value": "high"
                        }
                    ],
                    "actions": [
                        {
                            "type": "notify",
                            "channels": ["inapp", "email", "sms"],
                            "template": "risk.breach",
                            "priority": "high"
                        }
                    ]
                }
            ]
        }
    
    async def process_event(self, event_data: dict):
        """Process an incoming event and create notifications"""
        try:
            logger.info(f"Processing event: {event_data['type']}")
            
            # Apply rules to determine notifications
            notifications_to_create = await self.rules_engine.apply_rules(event_data)
            
            if not notifications_to_create:
                logger.info(f"No notifications to create for event: {event_data['type']}")
                return
            
            # Create notifications for each rule match
            for notification_config in notifications_to_create:
                await self._create_notification(event_data, notification_config)
                
        except Exception as e:
            logger.error(f"Error processing event: {e}")
            # TODO: Send to dead letter queue
    
    async def _create_notification(self, event_data: dict, notification_config: dict):
        """Create a notification based on event and configuration"""
        try:
            # Get user ID from event payload
            user_id = event_data.get("payload", {}).get("user_id")
            if not user_id:
                logger.warning(f"No user_id found in event payload: {event_data['type']}")
                return
            
            # Check user preferences
            user_prefs = await self._get_user_preferences(user_id)
            if not user_prefs:
                logger.warning(f"No user preferences found for user: {user_id}")
                return
            
            # Filter channels based on user preferences
            channels = self._filter_channels_by_preferences(
                notification_config["channels"],
                user_prefs,
                event_data.get("severity", "medium")
            )
            
            if not channels:
                logger.info(f"No enabled channels for user {user_id} and event {event_data['type']}")
                return
            
            # Create notification record
            notification = await self._create_notification_record(event_data, notification_config)
            
            # Create channel jobs
            await self._create_channel_jobs(notification, channels, notification_config)
            
            logger.info(f"Created notification {notification.id} for user {user_id}")
            
        except Exception as e:
            logger.error(f"Error creating notification: {e}")
    
    async def _get_user_preferences(self, user_id: str) -> Optional[Dict]:
        """Get user's notification preferences"""
        # TODO: Implement database query to get user preferences
        # For now, return default preferences
        return {
            "inapp": {"enabled": True, "severity_min": "low"},
            "email": {"enabled": True, "severity_min": "medium"},
            "sms": {"enabled": True, "severity_min": "high"},
            "voice": {"enabled": True, "severity_min": "critical"},
            "push": {"enabled": True, "severity_min": "medium"}
        }
    
    def _filter_channels_by_preferences(self, channels: List[str], user_prefs: Dict, severity: str) -> List[str]:
        """Filter channels based on user preferences and severity"""
        filtered_channels = []
        
        severity_levels = ["low", "medium", "high", "critical"]
        event_severity_index = severity_levels.index(severity) if severity in severity_levels else 1
        
        for channel in channels:
            if channel in user_prefs:
                channel_pref = user_prefs[channel]
                if channel_pref.get("enabled", True):
                    min_severity = channel_pref.get("severity_min", "low")
                    min_severity_index = severity_levels.index(min_severity) if min_severity in severity_levels else 0
                    
                    if event_severity_index >= min_severity_index:
                        filtered_channels.append(channel)
        
        return filtered_channels
    
    async def _create_notification_record(self, event_data: dict, notification_config: dict) -> Notification:
        """Create a notification record in the database"""
        # TODO: Implement database creation
        # For now, create a mock notification
        from app.models import Notification, Event
        
        # Mock event
        event = Event(
            event_id=event_data.get("event_id", "mock-event-id"),
            type=event_data["type"],
            producer=event_data.get("producer", "unknown"),
            payload=event_data.get("payload", {}),
            severity=event_data.get("severity", "medium")
        )
        
        # Mock notification
        notification = Notification(
            event_id=event.id,
            user_id=event_data.get("payload", {}).get("user_id", "unknown-user"),
            title=notification_config.get("template", "Notification"),
            message="Notification message",  # Will be rendered from template
            priority=notification_config.get("priority", "normal")
        )
        
        return notification
    
    async def _create_channel_jobs(self, notification: Notification, channels: List[str], notification_config: dict):
        """Create channel delivery jobs"""
        for channel in channels:
            try:
                # Create channel job
                channel_job = NotificationChannelJob(
                    notification_id=notification.id,
                    channel=channel,
                    status="queued"
                )
                
                # TODO: Save to database
                
                # Queue the job for delivery
                await self._queue_channel_job(channel_job, notification_config)
                
            except Exception as e:
                logger.error(f"Error creating channel job for {channel}: {e}")
    
    async def _queue_channel_job(self, channel_job: NotificationChannelJob, notification_config: dict):
        """Queue a channel job for delivery"""
        try:
            # Add to Redis queue for processing
            import redis.asyncio as redis
            redis_client = redis.from_url(settings.REDIS_URL)
            
            job_data = {
                "job_id": str(channel_job.id),
                "notification_id": str(channel_job.notification_id),
                "channel": channel_job.channel,
                "template": notification_config.get("template"),
                "priority": notification_config.get("priority", "normal")
            }
            
            await redis_client.lpush(f"channel_queue:{channel_job.channel}", str(job_data))
            logger.info(f"Queued {channel_job.channel} job: {channel_job.id}")
            
        except Exception as e:
            logger.error(f"Error queuing channel job: {e}")
    
    async def process_channel_job(self, job_data: dict):
        """Process a channel delivery job"""
        try:
            # Get notification and template
            notification = await self._get_notification(job_data["notification_id"])
            if not notification:
                logger.error(f"Notification not found: {job_data['notification_id']}")
                return
            
            template = await self._get_template(job_data["template"], job_data["channel"])
            if not template:
                logger.error(f"Template not found: {job_data['template']}")
                return
            
            # Render template
            rendered = await self.template_manager.render_template(
                template,
                notification,
                job_data["channel"]
            )
            
            # Send via channel
            result = await self.channel_manager.send_notification(
                job_data["job_id"],
                rendered
            )
            
            # Update job status
            await self._update_job_status(job_data["job_id"], result)
            
        except Exception as e:
            logger.error(f"Error processing channel job: {e}")
            await self._update_job_status(job_data["job_id"], None, error=str(e))
    
    async def _get_notification(self, notification_id: str) -> Optional[Notification]:
        """Get notification by ID"""
        # TODO: Implement database query
        # For now, return mock notification
        from app.models import Notification
        return Notification(
            id=notification_id,
            user_id="mock-user",
            title="Mock Notification",
            message="Mock message"
        )
    
    async def _get_template(self, template_key: str, channel: str) -> Optional[Template]:
        """Get template by key and channel"""
        # TODO: Implement database query
        # For now, return mock template
        from app.models import Template
        return Template(
            template_key=template_key,
            channel=channel,
            body="Hello {{user_name}}, {{message}}",
            subject="Notification"
        )
    
    async def _update_job_status(self, job_id: str, result, error: str = None):
        """Update channel job status"""
        # TODO: Implement database update
        if result and result.success:
            logger.info(f"Job {job_id} completed successfully")
        else:
            logger.error(f"Job {job_id} failed: {error}")
