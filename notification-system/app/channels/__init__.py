import asyncio
import logging
from typing import Dict, List, Optional, Protocol
from abc import ABC, abstractmethod

from app.config import settings
from app.models import NotificationChannelJob, ChannelEndpoint

logger = logging.getLogger(__name__)

class SendResult:
    """Result of a channel send operation"""
    def __init__(self, success: bool, provider_msg_id: Optional[str] = None, error: Optional[str] = None):
        self.success = success
        self.provider_msg_id = provider_msg_id
        self.error = error

class TemplateOutput:
    """Rendered template output"""
    def __init__(self, subject: Optional[str] = None, body: str = "", cta_url: Optional[str] = None):
        self.subject = subject
        self.body = body
        self.cta_url = cta_url

class ChannelAdapter(Protocol):
    """Protocol for channel adapters"""
    async def send(self, job: NotificationChannelJob, rendered: TemplateOutput) -> SendResult:
        """Send notification via this channel"""
        ...

class ChannelManager:
    """Manages different notification channels"""
    
    def __init__(self):
        self.adapters: Dict[str, ChannelAdapter] = {}
        self._register_default_adapters()
    
    def _register_default_adapters(self):
        """Register default channel adapters"""
        try:
            from .email import EmailAdapter
            self.adapters["email"] = EmailAdapter()
        except ImportError:
            logger.warning("Email adapter not available")
        
        try:
            from .sms import SMSAdapter
            self.adapters["sms"] = SMSAdapter()
        except ImportError:
            logger.warning("SMS adapter not available")
        
        try:
            from .voice import VoiceAdapter
            self.adapters["voice"] = VoiceAdapter()
        except ImportError:
            logger.warning("Voice adapter not available")
        
        try:
            from .push import PushAdapter
            self.adapters["push"] = PushAdapter()
        except ImportError:
            logger.warning("Push adapter not available")
        
        try:
            from .inapp import InAppAdapter
            self.adapters["inapp"] = InAppAdapter()
        except ImportError:
            logger.warning("In-app adapter not available")
    
    def register_adapter(self, channel: str, adapter: ChannelAdapter):
        """Register a custom channel adapter"""
        self.adapters[channel] = adapter
        logger.info(f"Registered adapter for channel: {channel}")
    
    def get_adapter(self, channel: str) -> Optional[ChannelAdapter]:
        """Get adapter for a specific channel"""
        return self.adapters.get(channel)
    
    async def send_notification(self, job: NotificationChannelJob, rendered: TemplateOutput) -> SendResult:
        """Send notification via the specified channel"""
        adapter = self.get_adapter(job.channel)
        if not adapter:
            return SendResult(False, error=f"No adapter found for channel: {job.channel}")
        
        try:
            result = await adapter.send(job, rendered)
            return result
        except Exception as e:
            logger.error(f"Error sending notification via {job.channel}: {e}")
            return SendResult(False, error=str(e))
    
    def get_available_channels(self) -> List[str]:
        """Get list of available channels"""
        return list(self.adapters.keys())
    
    def is_channel_available(self, channel: str) -> bool:
        """Check if a channel is available"""
        return channel in self.adapters

# Base channel adapter class
class BaseChannelAdapter(ABC):
    """Base class for channel adapters"""
    
    def __init__(self):
        self.rate_limit_enabled = settings.RATE_LIMIT_ENABLED
        self.max_retries = settings.MAX_RETRY_ATTEMPTS
    
    @abstractmethod
    async def send(self, job: NotificationChannelJob, rendered: TemplateOutput) -> SendResult:
        """Send notification via this channel"""
        pass
    
    async def check_rate_limit(self, user_id: str, channel: str) -> bool:
        """Check if rate limit allows sending"""
        if not self.rate_limit_enabled:
            return True
        
        # TODO: Implement rate limiting logic
        return True
    
    async def validate_endpoint(self, endpoint: ChannelEndpoint) -> bool:
        """Validate channel endpoint"""
        if not endpoint.verified:
            return False
        return True
    
    def get_retry_delay(self, attempt: int) -> int:
        """Calculate retry delay with exponential backoff"""
        delay = min(
            settings.RETRY_DELAY_BASE * (2 ** attempt),
            settings.RETRY_DELAY_MAX
        )
        return delay
