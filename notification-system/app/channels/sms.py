import logging
from typing import Optional

from twilio.rest import Client
from twilio.base.exceptions import TwilioException

from . import BaseChannelAdapter, SendResult, TemplateOutput
from app.models import NotificationChannelJob, ChannelEndpoint
from app.config import settings

logger = logging.getLogger(__name__)

class SMSAdapter(BaseChannelAdapter):
    """SMS channel adapter using Twilio"""
    
    def __init__(self):
        super().__init__()
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Twilio client"""
        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
            try:
                self.client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                logger.info("Twilio SMS client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Twilio SMS client: {e}")
                self.client = None
        else:
            logger.warning("Twilio credentials not configured")
    
    async def send(self, job: NotificationChannelJob, rendered: TemplateOutput) -> SendResult:
        """Send SMS notification"""
        try:
            # Get user's phone endpoint
            endpoint = await self._get_user_phone_endpoint(job.notification.user_id)
            if not endpoint:
                return SendResult(False, error="No phone endpoint found for user")
            
            # Check rate limit
            if not await self.check_rate_limit(job.notification.user_id, "sms"):
                return SendResult(False, error="Rate limit exceeded")
            
            # Validate phone number
            phone_number = endpoint.endpoint_data["phone"]
            if not self._validate_phone_number(phone_number):
                return SendResult(False, error="Invalid phone number format")
            
            # Prepare SMS content
            sms_content = self._prepare_sms_content(rendered)
            
            # Send SMS
            if self.client:
                message = self.client.messages.create(
                    body=sms_content,
                    from_=settings.TWILIO_PHONE_NUMBER,
                    to=phone_number
                )
                
                if message.sid:
                    logger.info(f"SMS sent successfully to {phone_number}")
                    return SendResult(True, provider_msg_id=message.sid)
                else:
                    return SendResult(False, error="Failed to get message SID")
            else:
                # Mock SMS sending for development
                logger.info(f"[MOCK] SMS would be sent to {phone_number}: {sms_content}")
                return SendResult(True, provider_msg_id="mock-sms-id")
                
        except TwilioException as e:
            logger.error(f"Twilio SMS error: {e}")
            return SendResult(False, error=f"Twilio error: {str(e)}")
        except Exception as e:
            logger.error(f"Error sending SMS: {e}")
            return SendResult(False, error=str(e))
    
    def _prepare_sms_content(self, rendered: TemplateOutput) -> str:
        """Prepare SMS content (limit to 160 characters)"""
        content = rendered.body
        
        # Truncate if too long
        if len(content) > 160:
            content = content[:157] + "..."
        
        # Add CTA URL if available and space permits
        if rendered.cta_url and len(content) + len(rendered.cta_url) + 10 <= 160:
            content += f"\n\n{rendered.cta_url}"
        
        return content
    
    def _validate_phone_number(self, phone_number: str) -> bool:
        """Validate phone number format"""
        # Basic validation - should start with + and contain only digits
        if not phone_number.startswith('+'):
            return False
        
        # Remove + and check if rest are digits
        digits = phone_number[1:]
        return digits.isdigit() and len(digits) >= 10
    
    async def _get_user_phone_endpoint(self, user_id: str) -> Optional[ChannelEndpoint]:
        """Get user's phone endpoint"""
        # TODO: Implement database query to get user's phone endpoint
        # For now, return a mock endpoint
        from app.models import ChannelEndpoint
        mock_endpoint = ChannelEndpoint(
            user_id=user_id,
            channel="sms",
            endpoint_data={"phone": "+1234567890"},
            verified=True
        )
        return mock_endpoint
    
    async def verify_endpoint(self, phone_number: str) -> bool:
        """Verify phone endpoint (placeholder)"""
        # In production, you would implement phone verification via SMS code
        return self._validate_phone_number(phone_number)
    
    def get_rate_limit(self) -> int:
        """Get rate limit for SMS channel"""
        return settings.RATE_LIMIT_CHANNELS.get("sms", 10)
    
    async def handle_opt_out(self, phone_number: str) -> bool:
        """Handle SMS opt-out"""
        try:
            # In production, you would update user preferences to disable SMS
            logger.info(f"User opted out of SMS: {phone_number}")
            return True
        except Exception as e:
            logger.error(f"Error handling SMS opt-out: {e}")
            return False
    
    async def handle_opt_in(self, phone_number: str) -> bool:
        """Handle SMS opt-in"""
        try:
            # In production, you would update user preferences to enable SMS
            logger.info(f"User opted in to SMS: {phone_number}")
            return True
        except Exception as e:
            logger.error(f"Error handling SMS opt-in: {e}")
            return False
