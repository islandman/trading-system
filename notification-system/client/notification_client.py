import asyncio
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

import httpx
import websockets

logger = logging.getLogger(__name__)

class NotificationClient:
    """Client for interacting with the notification system"""
    
    def __init__(self, base_url: str = "http://localhost:8003", api_key: str = None):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.headers = {}
        
        if api_key:
            self.headers["X-API-Key"] = api_key
    
    async def publish_event(self, event_type: str, producer: str, payload: Dict[str, Any], 
                          severity: str = "medium", dedupe_key: str = None) -> Dict[str, Any]:
        """Publish an event to the notification system"""
        async with httpx.AsyncClient() as client:
            event_data = {
                "type": event_type,
                "producer": producer,
                "payload": payload,
                "severity": severity
            }
            
            if dedupe_key:
                event_data["dedupe_key"] = dedupe_key
            
            response = await client.post(
                f"{self.base_url}/v1/events",
                json=event_data,
                headers=self.headers
            )
            
            response.raise_for_status()
            return response.json()
    
    async def get_notifications(self, user_id: str, cursor: str = None, 
                              limit: int = 20) -> Dict[str, Any]:
        """Get user's notifications"""
        async with httpx.AsyncClient() as client:
            params = {"limit": limit}
            if cursor:
                params["cursor"] = cursor
            
            response = await client.get(
                f"{self.base_url}/v1/notifications",
                params=params,
                headers=self.headers
            )
            
            response.raise_for_status()
            return response.json()
    
    async def acknowledge_notification(self, notification_id: str) -> Dict[str, Any]:
        """Mark a notification as read"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/v1/notifications/ack",
                json={"notification_id": notification_id},
                headers=self.headers
            )
            
            response.raise_for_status()
            return response.json()
    
    async def get_user_preferences(self, user_id: str) -> Dict[str, Any]:
        """Get user's notification preferences"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/v1/prefs",
                headers=self.headers
            )
            
            response.raise_for_status()
            return response.json()
    
    async def update_user_preferences(self, preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Update user's notification preferences"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/v1/prefs",
                json=preferences,
                headers=self.headers
            )
            
            response.raise_for_status()
            return response.json()
    
    async def test_notification(self) -> Dict[str, Any]:
        """Send a test notification"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/v1/test/notify",
                headers=self.headers
            )
            
            response.raise_for_status()
            return response.json()
    
    async def health_check(self) -> Dict[str, Any]:
        """Check system health"""
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/health")
            response.raise_for_status()
            return response.json()
    
    async def get_metrics(self) -> Dict[str, Any]:
        """Get system metrics"""
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/metrics")
            response.raise_for_status()
            return response.json()

class NotificationWebSocketClient:
    """WebSocket client for real-time notifications"""
    
    def __init__(self, base_url: str = "ws://localhost:8003", token: str = None):
        self.base_url = base_url.replace("http://", "ws://").replace("https://", "wss://")
        self.token = token
        self.websocket = None
        self.callbacks = []
        self.running = False
    
    def on_notification(self, callback):
        """Register a callback for notifications"""
        self.callbacks.append(callback)
    
    async def connect(self):
        """Connect to WebSocket"""
        try:
            url = f"{self.base_url}/v1/ws"
            if self.token:
                url += f"?token={self.token}"
            
            self.websocket = await websockets.connect(url)
            self.running = True
            
            logger.info("Connected to notification WebSocket")
            
            # Start listening for messages
            await self._listen()
            
        except Exception as e:
            logger.error(f"WebSocket connection error: {e}")
            raise
    
    async def disconnect(self):
        """Disconnect from WebSocket"""
        self.running = False
        if self.websocket:
            await self.websocket.close()
            logger.info("Disconnected from notification WebSocket")
    
    async def _listen(self):
        """Listen for WebSocket messages"""
        try:
            while self.running:
                message = await self.websocket.recv()
                data = json.loads(message)
                
                # Handle different message types
                if data.get("type") == "notification":
                    # Call all registered callbacks
                    for callback in self.callbacks:
                        try:
                            await callback(data)
                        except Exception as e:
                            logger.error(f"Error in notification callback: {e}")
                
                elif data.get("type") == "heartbeat":
                    # Send heartbeat response
                    await self.websocket.send(json.dumps({
                        "type": "heartbeat",
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }))
                
        except websockets.exceptions.ConnectionClosed:
            logger.info("WebSocket connection closed")
        except Exception as e:
            logger.error(f"WebSocket listen error: {e}")
        finally:
            self.running = False

# Convenience functions for common trading events
class TradingNotificationClient(NotificationClient):
    """Specialized client for trading notifications"""
    
    async def order_filled(self, user_id: str, order_id: str, symbol: str, 
                          quantity: int, price: float) -> Dict[str, Any]:
        """Notify when an order is filled"""
        return await self.publish_event(
            event_type="ORDER_FILLED",
            producer="trading-system",
            payload={
                "user_id": user_id,
                "order_id": order_id,
                "symbol": symbol,
                "quantity": quantity,
                "price": price
            },
            severity="medium",
            dedupe_key=f"order_filled_{order_id}"
        )
    
    async def margin_call(self, user_id: str, account_id: str, shortfall: float, 
                         deadline: str) -> Dict[str, Any]:
        """Notify about margin call"""
        return await self.publish_event(
            event_type="MARGIN_CALL",
            producer="risk-system",
            payload={
                "user_id": user_id,
                "account_id": account_id,
                "shortfall": shortfall,
                "deadline": deadline
            },
            severity="critical",
            dedupe_key=f"margin_call_{user_id}_{account_id}"
        )
    
    async def price_alert(self, user_id: str, symbol: str, target_price: float, 
                         current_price: float) -> Dict[str, Any]:
        """Notify about price alert"""
        return await self.publish_event(
            event_type="PRICE_ALERT",
            producer="market-data-system",
            payload={
                "user_id": user_id,
                "symbol": symbol,
                "target_price": target_price,
                "current_price": current_price
            },
            severity="medium",
            dedupe_key=f"price_alert_{user_id}_{symbol}_{target_price}"
        )
    
    async def risk_breach(self, user_id: str, exposure: float, limit: float) -> Dict[str, Any]:
        """Notify about risk limit breach"""
        return await self.publish_event(
            event_type="RISK_BREACH",
            producer="risk-system",
            payload={
                "user_id": user_id,
                "exposure": exposure,
                "limit": limit
            },
            severity="high",
            dedupe_key=f"risk_breach_{user_id}"
        )

# Example usage
async def example_usage():
    """Example of how to use the notification client"""
    
    # Create client
    client = TradingNotificationClient(
        base_url="http://localhost:8003",
        api_key="your-api-key"
    )
    
    # Publish trading events
    await client.order_filled(
        user_id="user123",
        order_id="order456",
        symbol="AAPL",
        quantity=100,
        price=150.25
    )
    
    await client.margin_call(
        user_id="user123",
        account_id="acc789",
        shortfall=5000.00,
        deadline="2024-01-15T10:00:00Z"
    )
    
    # WebSocket client for real-time notifications
    ws_client = NotificationWebSocketClient(
        base_url="ws://localhost:8003",
        token="your-jwt-token"
    )
    
    # Register notification callback
    async def handle_notification(notification):
        print(f"Received notification: {notification['title']}")
    
    ws_client.on_notification(handle_notification)
    
    # Connect and listen
    await ws_client.connect()

if __name__ == "__main__":
    # Run example
    asyncio.run(example_usage())
