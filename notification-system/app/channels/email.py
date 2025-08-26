import logging
from typing import Optional

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content, HtmlContent

from . import BaseChannelAdapter, SendResult, TemplateOutput
from app.models import NotificationChannelJob, ChannelEndpoint
from app.config import settings

logger = logging.getLogger(__name__)

class EmailAdapter(BaseChannelAdapter):
    """Email channel adapter using SendGrid"""
    
    def __init__(self):
        super().__init__()
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize SendGrid client"""
        if settings.SENDGRID_API_KEY:
            try:
                self.client = SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
                logger.info("SendGrid client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize SendGrid client: {e}")
                self.client = None
        else:
            logger.warning("SendGrid API key not configured")
    
    async def send(self, job: NotificationChannelJob, rendered: TemplateOutput) -> SendResult:
        """Send email notification"""
        try:
            # Get user's email endpoint
            endpoint = await self._get_user_email_endpoint(job.notification.user_id)
            if not endpoint:
                return SendResult(False, error="No email endpoint found for user")
            
            # Check rate limit
            if not await self.check_rate_limit(job.notification.user_id, "email"):
                return SendResult(False, error="Rate limit exceeded")
            
            # Create email
            email = self._create_email(endpoint.endpoint_data["email"], rendered)
            
            # Send email
            if self.client:
                response = self.client.send(email)
                if response.status_code in [200, 201, 202]:
                    logger.info(f"Email sent successfully to {endpoint.endpoint_data['email']}")
                    return SendResult(True, provider_msg_id=str(response.headers.get('X-Message-Id')))
                else:
                    error_msg = f"SendGrid error: {response.status_code} - {response.body}"
                    logger.error(error_msg)
                    return SendResult(False, error=error_msg)
            else:
                # Mock email sending for development
                logger.info(f"[MOCK] Email would be sent to {endpoint.endpoint_data['email']}: {rendered.subject}")
                return SendResult(True, provider_msg_id="mock-email-id")
                
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            return SendResult(False, error=str(e))
    
    def _create_email(self, to_email: str, rendered: TemplateOutput) -> Mail:
        """Create SendGrid Mail object"""
        from_email = Email(settings.SENDGRID_FROM_EMAIL, settings.SENDGRID_FROM_NAME)
        to_email_obj = To(to_email)
        
        # Create HTML content
        html_content = self._create_html_content(rendered)
        content = HtmlContent(html_content)
        
        # Create plain text content
        text_content = Content("text/plain", rendered.body)
        
        # Create email
        email = Mail(from_email, to_email_obj, rendered.subject, text_content)
        email.add_content(content)
        
        return email
    
    def _create_html_content(self, rendered: TemplateOutput) -> str:
        """Create HTML email content"""
        html_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{subject}</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #f8f9fa; padding: 20px; border-radius: 5px; }}
                .content {{ padding: 20px; }}
                .footer {{ background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-top: 20px; }}
                .cta-button {{ display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }}
                .cta-button:hover {{ background-color: #0056b3; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>{subject}</h1>
                </div>
                <div class="content">
                    {body}
                    {cta_button}
                </div>
                <div class="footer">
                    <p>This is an automated notification from {app_name}.</p>
                    <p>If you have any questions, please contact support.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        cta_button = ""
        if rendered.cta_url:
            cta_button = f'<p><a href="{rendered.cta_url}" class="cta-button">Take Action</a></p>'
        
        return html_template.format(
            subject=rendered.subject or "Notification",
            body=rendered.body.replace('\n', '<br>'),
            cta_button=cta_button,
            app_name=settings.APP_NAME
        )
    
    async def _get_user_email_endpoint(self, user_id: str) -> Optional[ChannelEndpoint]:
        """Get user's email endpoint"""
        # TODO: Implement database query to get user's email endpoint
        # For now, return a mock endpoint
        from app.models import ChannelEndpoint
        mock_endpoint = ChannelEndpoint(
            user_id=user_id,
            channel="email",
            endpoint_data={"email": f"{user_id}@example.com"},
            verified=True
        )
        return mock_endpoint
    
    async def verify_endpoint(self, email: str) -> bool:
        """Verify email endpoint (placeholder)"""
        # In production, you would implement email verification
        # For now, just check if it looks like a valid email
        return '@' in email and '.' in email.split('@')[1]
    
    def get_rate_limit(self) -> int:
        """Get rate limit for email channel"""
        return settings.RATE_LIMIT_CHANNELS.get("email", 60)
