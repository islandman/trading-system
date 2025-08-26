import logging
from typing import Optional

from twilio.rest import Client
from twilio.base.exceptions import TwilioException

from . import BaseChannelAdapter, SendResult, TemplateOutput
from app.models import NotificationChannelJob, ChannelEndpoint
from app.config import settings

logger = logging.getLogger(__name__)

class VoiceAdapter(BaseChannelAdapter):
    """Voice channel adapter using Twilio"""
    
    def __init__(self):
        super().__init__()
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Twilio client"""
        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
            try:
                self.client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                logger.info("Twilio Voice client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Twilio Voice client: {e}")
                self.client = None
        else:
            logger.warning("Twilio credentials not configured")
    
    async def send(self, job: NotificationChannelJob, rendered: TemplateOutput) -> SendResult:
        """Make voice call notification"""
        try:
            # Get user's phone endpoint
            endpoint = await self._get_user_phone_endpoint(job.notification.user_id)
            if not endpoint:
                return SendResult(False, error="No phone endpoint found for user")
            
            # Check rate limit
            if not await self.check_rate_limit(job.notification.user_id, "voice"):
                return SendResult(False, error="Rate limit exceeded")
            
            # Validate phone number
            phone_number = endpoint.endpoint_data["phone"]
            if not self._validate_phone_number(phone_number):
                return SendResult(False, error="Invalid phone number format")
            
            # Prepare voice content
            voice_content = self._prepare_voice_content(rendered)
            
            # Make voice call
            if self.client:
                call = self.client.calls.create(
                    twiml=f'<Response><Say voice="alice">{voice_content}</Say></Response>',
                    from_=settings.TWILIO_VOICE_PHONE_NUMBER,
                    to=phone_number
                )
                
                if call.sid:
                    logger.info(f"Voice call initiated to {phone_number}")
                    return SendResult(True, provider_msg_id=call.sid)
                else:
                    return SendResult(False, error="Failed to get call SID")
            else:
                # Mock voice call for development
                logger.info(f"[MOCK] Voice call would be made to {phone_number}: {voice_content}")
                return SendResult(True, provider_msg_id="mock-voice-id")
                
        except TwilioException as e:
            logger.error(f"Twilio Voice error: {e}")
            return SendResult(False, error=f"Twilio error: {str(e)}")
        except Exception as e:
            logger.error(f"Error making voice call: {e}")
            return SendResult(False, error=str(e))
    
    def _prepare_voice_content(self, rendered: TemplateOutput) -> str:
        """Prepare voice content for TTS"""
        content = rendered.body
        
        # Clean up content for voice
        content = content.replace('\n', ' ')
        content = content.replace('  ', ' ')
        
        # Truncate if too long (Twilio has limits)
        if len(content) > 1000:
            content = content[:997] + "..."
        
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
            channel="voice",
            endpoint_data={"phone": "+1234567890"},
            verified=True
        )
        return mock_endpoint
    
    def get_rate_limit(self) -> int:
        """Get rate limit for voice channel"""
        return settings.RATE_LIMIT_CHANNELS.get("voice", 5)
    
    async def create_interactive_call(self, phone_number: str, message: str, options: dict) -> SendResult:
        """Create interactive voice call with DTMF options"""
        try:
            if not self.client:
                return SendResult(False, error="Twilio client not initialized")
            
            # Create TwiML with gather for DTMF input
            twiml = self._create_interactive_twiml(message, options)
            
            call = self.client.calls.create(
                twiml=twiml,
                from_=settings.TWILIO_VOICE_PHONE_NUMBER,
                to=phone_number
            )
            
            if call.sid:
                logger.info(f"Interactive voice call initiated to {phone_number}")
                return SendResult(True, provider_msg_id=call.sid)
            else:
                return SendResult(False, error="Failed to get call SID")
                
        except Exception as e:
            logger.error(f"Error creating interactive call: {e}")
            return SendResult(False, error=str(e))
    
    def _create_interactive_twiml(self, message: str, options: dict) -> str:
        """Create TwiML for interactive voice call"""
        twiml = f'<Response><Gather numDigits="1" action="/voice/callback" method="POST">'
        twiml += f'<Say voice="alice">{message}</Say>'
        
        for key, option in options.items():
            twiml += f'<Say voice="alice">Press {key} for {option}</Say>'
        
        twiml += '</Gather></Response>'
        return twiml
    
    async def handle_dtmf_response(self, call_sid: str, digits: str) -> bool:
        """Handle DTMF response from voice call"""
        try:
            # TODO: Implement DTMF response handling
            logger.info(f"DTMF response received for call {call_sid}: {digits}")
            return True
        except Exception as e:
            logger.error(f"Error handling DTMF response: {e}")
            return False
