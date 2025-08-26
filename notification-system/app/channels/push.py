import logging
import json
from typing import Optional, Dict, Any

import firebase_admin
from firebase_admin import credentials, messaging
from . import BaseChannelAdapter, SendResult, TemplateOutput
from app.models import NotificationChannelJob, ChannelEndpoint
from app.config import settings

logger = logging.getLogger(__name__)

class PushAdapter(BaseChannelAdapter):
    """Push notification adapter using Firebase Cloud Messaging (FCM)"""
    
    def __init__(self):
        super().__init__()
        self.fcm_initialized = False
        self._initialize_fcm()
    
    def _initialize_fcm(self):
        """Initialize Firebase Cloud Messaging"""
        try:
            # Initialize Firebase Admin SDK
            if not firebase_admin._apps:
                # Use default credentials or service account key
                cred = credentials.Certificate("path/to/serviceAccountKey.json")  # TODO: Configure path
                firebase_admin.initialize_app(cred)
            
            self.fcm_initialized = True
            logger.info("Firebase Cloud Messaging initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize FCM: {e}")
            self.fcm_initialized = False
    
    async def send(self, job: NotificationChannelJob, rendered: TemplateOutput) -> SendResult:
        """Send push notification"""
        try:
            # Get user's push endpoints
            endpoints = await self._get_user_push_endpoints(job.notification.user_id)
            if not endpoints:
                return SendResult(False, error="No push endpoints found for user")
            
            # Check rate limit
            if not await self.check_rate_limit(job.notification.user_id, "push"):
                return SendResult(False, error="Rate limit exceeded")
            
            # Prepare push notification
            notification_data = self._prepare_push_notification(job, rendered)
            
            # Send to all user's devices
            success_count = 0
            total_count = len(endpoints)
            
            for endpoint in endpoints:
                try:
                    if endpoint.endpoint_data.get("platform") == "ios":
                        result = await self._send_ios_push(endpoint, notification_data)
                    else:
                        result = await self._send_android_push(endpoint, notification_data)
                    
                    if result.success:
                        success_count += 1
                    
                except Exception as e:
                    logger.error(f"Error sending push to device {endpoint.id}: {e}")
            
            if success_count > 0:
                logger.info(f"Push notification sent to {success_count}/{total_count} devices")
                return SendResult(True, provider_msg_id=f"push-{job.id}")
            else:
                return SendResult(False, error="Failed to send to any devices")
                
        except Exception as e:
            logger.error(f"Error sending push notification: {e}")
            return SendResult(False, error=str(e))
    
    def _prepare_push_notification(self, job: NotificationChannelJob, rendered: TemplateOutput) -> Dict[str, Any]:
        """Prepare push notification data"""
        return {
            "title": rendered.subject or "Notification",
            "body": rendered.body,
            "data": {
                "notification_id": str(job.notification.id),
                "priority": job.notification.priority,
                "cta_url": rendered.cta_url,
                "channel": "push"
            }
        }
    
    async def _send_android_push(self, endpoint: ChannelEndpoint, notification_data: Dict[str, Any]) -> SendResult:
        """Send push notification to Android device"""
        try:
            if not self.fcm_initialized:
                # Mock push for development
                logger.info(f"[MOCK] Android push would be sent to {endpoint.endpoint_data.get('fcm_token')}")
                return SendResult(True, provider_msg_id="mock-android-push")
            
            # Create FCM message
            message = messaging.Message(
                notification=messaging.Notification(
                    title=notification_data["title"],
                    body=notification_data["body"]
                ),
                data=notification_data["data"],
                token=endpoint.endpoint_data["fcm_token"]
            )
            
            # Send message
            response = messaging.send(message)
            logger.info(f"Android push sent successfully: {response}")
            return SendResult(True, provider_msg_id=response)
            
        except Exception as e:
            logger.error(f"Error sending Android push: {e}")
            return SendResult(False, error=str(e))
    
    async def _send_ios_push(self, endpoint: ChannelEndpoint, notification_data: Dict[str, Any]) -> SendResult:
        """Send push notification to iOS device"""
        try:
            if not self.fcm_initialized:
                # Mock push for development
                logger.info(f"[MOCK] iOS push would be sent to {endpoint.endpoint_data.get('apns_token')}")
                return SendResult(True, provider_msg_id="mock-ios-push")
            
            # Create FCM message for iOS
            message = messaging.Message(
                notification=messaging.Notification(
                    title=notification_data["title"],
                    body=notification_data["body"]
                ),
                data=notification_data["data"],
                token=endpoint.endpoint_data["apns_token"],
                apns=messaging.APNSConfig(
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(
                            sound="default",
                            badge=1
                        )
                    )
                )
            )
            
            # Send message
            response = messaging.send(message)
            logger.info(f"iOS push sent successfully: {response}")
            return SendResult(True, provider_msg_id=response)
            
        except Exception as e:
            logger.error(f"Error sending iOS push: {e}")
            return SendResult(False, error=str(e))
    
    async def _get_user_push_endpoints(self, user_id: str) -> list:
        """Get user's push notification endpoints"""
        # TODO: Implement database query to get user's push endpoints
        # For now, return mock endpoints
        from app.models import ChannelEndpoint
        
        mock_endpoints = [
            ChannelEndpoint(
                user_id=user_id,
                channel="push",
                endpoint_data={
                    "platform": "android",
                    "fcm_token": "mock-fcm-token-android"
                },
                verified=True
            ),
            ChannelEndpoint(
                user_id=user_id,
                channel="push",
                endpoint_data={
                    "platform": "ios",
                    "apns_token": "mock-apns-token-ios"
                },
                verified=True
            )
        ]
        return mock_endpoints
    
    async def send_topic_notification(self, topic: str, notification_data: Dict[str, Any]) -> SendResult:
        """Send push notification to a topic"""
        try:
            if not self.fcm_initialized:
                logger.info(f"[MOCK] Topic push would be sent to topic: {topic}")
                return SendResult(True, provider_msg_id="mock-topic-push")
            
            # Create FCM message for topic
            message = messaging.Message(
                notification=messaging.Notification(
                    title=notification_data["title"],
                    body=notification_data["body"]
                ),
                data=notification_data["data"],
                topic=topic
            )
            
            # Send message
            response = messaging.send(message)
            logger.info(f"Topic push sent successfully: {response}")
            return SendResult(True, provider_msg_id=response)
            
        except Exception as e:
            logger.error(f"Error sending topic push: {e}")
            return SendResult(False, error=str(e))
    
    async def subscribe_to_topic(self, tokens: list, topic: str) -> bool:
        """Subscribe devices to a topic"""
        try:
            if not self.fcm_initialized:
                logger.info(f"[MOCK] Would subscribe {len(tokens)} devices to topic: {topic}")
                return True
            
            response = messaging.subscribe_to_topic(tokens, topic)
            logger.info(f"Subscribed {response.success_count} devices to topic {topic}")
            return response.success_count > 0
            
        except Exception as e:
            logger.error(f"Error subscribing to topic: {e}")
            return False
    
    async def unsubscribe_from_topic(self, tokens: list, topic: str) -> bool:
        """Unsubscribe devices from a topic"""
        try:
            if not self.fcm_initialized:
                logger.info(f"[MOCK] Would unsubscribe {len(tokens)} devices from topic: {topic}")
                return True
            
            response = messaging.unsubscribe_from_topic(tokens, topic)
            logger.info(f"Unsubscribed {response.success_count} devices from topic {topic}")
            return response.success_count > 0
            
        except Exception as e:
            logger.error(f"Error unsubscribing from topic: {e}")
            return False
    
    def get_rate_limit(self) -> int:
        """Get rate limit for push channel"""
        return settings.RATE_LIMIT_CHANNELS.get("push", 100)
