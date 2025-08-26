import logging
from typing import Optional, Dict, Any
from jinja2 import Environment, BaseLoader, Template as JinjaTemplate

from app.models import Template, Notification
from app.channels import TemplateOutput

logger = logging.getLogger(__name__)

class TemplateManager:
    """Manages notification templates and rendering"""
    
    def __init__(self):
        self.jinja_env = Environment(loader=BaseLoader())
        self._load_default_templates()
    
    def _load_default_templates(self):
        """Load default templates"""
        self.default_templates = {
            "order.filled": {
                "inapp": {
                    "subject": "Order Filled",
                    "body": "Your order for {{symbol}} has been filled at {{price}} for {{quantity}} shares."
                },
                "email": {
                    "subject": "Order Filled - {{symbol}}",
                    "body": """
                    Hello {{user_name}},
                    
                    Your order has been successfully filled:
                    
                    Symbol: {{symbol}}
                    Quantity: {{quantity}} shares
                    Price: ${{price}}
                    Total: ${{total}}
                    
                    Thank you for trading with us.
                    """
                },
                "sms": {
                    "body": "Order filled: {{symbol}} {{quantity}} shares @ ${{price}}"
                },
                "voice": {
                    "body": "Your order for {{symbol}} has been filled at {{price}} dollars for {{quantity}} shares."
                }
            },
            "risk.margin_call": {
                "inapp": {
                    "subject": "Margin Call Alert",
                    "body": "Your account requires additional funds. Shortfall: ${{shortfall}}. Deadline: {{deadline}}."
                },
                "email": {
                    "subject": "URGENT: Margin Call",
                    "body": """
                    Dear {{user_name}},
                    
                    This is an urgent margin call notification.
                    
                    Your account requires additional funds:
                    Shortfall: ${{shortfall}}
                    Deadline: {{deadline}}
                    
                    Please add funds immediately to avoid forced liquidation.
                    
                    Contact support if you have questions.
                    """
                },
                "sms": {
                    "body": "URGENT: Margin call. Shortfall: ${{shortfall}}. Call immediately."
                },
                "voice": {
                    "body": "This is an urgent margin call. Your account requires {{shortfall}} dollars by {{deadline}}. Please add funds immediately."
                }
            },
            "market.price_alert": {
                "inapp": {
                    "subject": "Price Alert - {{symbol}}",
                    "body": "{{symbol}} has reached your target price of ${{target_price}}. Current price: ${{current_price}}."
                },
                "email": {
                    "subject": "Price Alert: {{symbol}}",
                    "body": """
                    Hello {{user_name}},
                    
                    Your price alert has been triggered:
                    
                    Symbol: {{symbol}}
                    Target Price: ${{target_price}}
                    Current Price: ${{current_price}}
                    
                    Consider reviewing your position.
                    """
                },
                "sms": {
                    "body": "Price alert: {{symbol}} hit ${{target_price}}. Current: ${{current_price}}"
                }
            },
            "risk.breach": {
                "inapp": {
                    "subject": "Risk Limit Breach",
                    "body": "Your portfolio has exceeded risk limits. Current exposure: {{exposure}}% of limit."
                },
                "email": {
                    "subject": "Risk Limit Breach Alert",
                    "body": """
                    Dear {{user_name}},
                    
                    Your portfolio has exceeded risk limits:
                    
                    Current Exposure: {{exposure}}%
                    Risk Limit: {{limit}}%
                    
                    Please review your positions and consider reducing exposure.
                    """
                },
                "sms": {
                    "body": "Risk breach: {{exposure}}% of limit. Review positions immediately."
                }
            }
        }
    
    async def render_template(self, template: Template, notification: Notification, channel: str) -> TemplateOutput:
        """Render a template for a specific channel"""
        try:
            # Get template content
            template_content = await self._get_template_content(template, channel)
            if not template_content:
                # Use default template
                template_content = self._get_default_template_content(template.template_key, channel)
            
            if not template_content:
                # Fallback to basic template
                template_content = {
                    "subject": notification.title,
                    "body": notification.message
                }
            
            # Prepare context data
            context = await self._prepare_context(notification, channel)
            
            # Render template
            rendered_subject = self._render_text(template_content.get("subject", ""), context)
            rendered_body = self._render_text(template_content.get("body", ""), context)
            
            return TemplateOutput(
                subject=rendered_subject,
                body=rendered_body,
                cta_url=template_content.get("cta_url")
            )
            
        except Exception as e:
            logger.error(f"Error rendering template: {e}")
            # Return fallback content
            return TemplateOutput(
                subject=notification.title,
                body=notification.message
            )
    
    async def _get_template_content(self, template: Template, channel: str) -> Optional[Dict[str, str]]:
        """Get template content from database"""
        # TODO: Implement database query to get template content
        # For now, return None to use defaults
        return None
    
    def _get_default_template_content(self, template_key: str, channel: str) -> Optional[Dict[str, str]]:
        """Get default template content"""
        if template_key in self.default_templates:
            return self.default_templates[template_key].get(channel)
        return None
    
    async def _prepare_context(self, notification: Notification, channel: str) -> Dict[str, Any]:
        """Prepare context data for template rendering"""
        context = {
            "user_name": "User",  # TODO: Get from user profile
            "notification": notification,
            "channel": channel
        }
        
        # Add event-specific data
        if hasattr(notification, 'event') and notification.event:
            event_payload = notification.event.payload or {}
            context.update(event_payload)
        
        # Add common trading data
        context.update({
            "symbol": context.get("symbol", "UNKNOWN"),
            "quantity": context.get("quantity", 0),
            "price": context.get("price", 0.0),
            "total": context.get("quantity", 0) * context.get("price", 0.0),
            "shortfall": context.get("shortfall", 0.0),
            "deadline": context.get("deadline", "Unknown"),
            "target_price": context.get("target_price", 0.0),
            "current_price": context.get("current_price", 0.0),
            "exposure": context.get("exposure", 0.0),
            "limit": context.get("limit", 100.0)
        })
        
        return context
    
    def _render_text(self, text: str, context: Dict[str, Any]) -> str:
        """Render text using Jinja2"""
        try:
            template = self.jinja_env.from_string(text)
            return template.render(**context)
        except Exception as e:
            logger.error(f"Error rendering text: {e}")
            return text
    
    async def create_template(self, template_key: str, channel: str, content: Dict[str, str]) -> Template:
        """Create a new template"""
        # TODO: Implement database creation
        template = Template(
            template_key=template_key,
            channel=channel,
            subject=content.get("subject"),
            body=content.get("body", ""),
            cta_url=content.get("cta_url")
        )
        return template
    
    async def update_template(self, template: Template, content: Dict[str, str]) -> Template:
        """Update an existing template"""
        # TODO: Implement database update
        template.subject = content.get("subject", template.subject)
        template.body = content.get("body", template.body)
        template.cta_url = content.get("cta_url", template.cta_url)
        return template
    
    def validate_template(self, template_content: str) -> bool:
        """Validate template syntax"""
        try:
            self.jinja_env.from_string(template_content)
            return True
        except Exception as e:
            logger.error(f"Template validation error: {e}")
            return False
