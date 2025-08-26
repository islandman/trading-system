import aiohttp
import asyncio
import json
from typing import Dict, Any, Optional

class NotificationClient:
    def __init__(self, base_url: str = "http://localhost:8003", api_key: str = "trading-system-api-key"):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.session = None
    
    async def _get_session(self):
        if self.session is None:
            self.session = aiohttp.ClientSession()
        return self.session
    
    async def publish_event(self, event_type: str, producer: str, payload: Dict[str, Any], 
                          severity: str = "medium", dedupe_key: Optional[str] = None):
        """Publish an event to the notification system"""
        try:
            session = await self._get_session()
            
            event_data = {
                "event_type": event_type,
                "producer": producer,
                "payload": payload,
                "severity": severity,
                "timestamp": asyncio.get_event_loop().time()
            }
            
            if dedupe_key:
                event_data["dedupe_key"] = dedupe_key
            
            headers = {
                "Content-Type": "application/json",
                "X-API-Key": self.api_key
            }
            
            async with session.post(
                f"{self.base_url}/v1/events",
                json=event_data,
                headers=headers
            ) as response:
                if response.status == 200:
                    print(f"📢 Notification sent: {event_type}")
                    return True
                else:
                    print(f"⚠️ Failed to send notification {event_type}: {response.status}")
                    return False
                    
        except Exception as e:
            print(f"⚠️ Error sending notification {event_type}: {e}")
            return False
    
    async def close(self):
        """Close the HTTP session"""
        if self.session:
            await self.session.close()
            self.session = None
