from .models import OrderIn
import math
import asyncio

# Import notification client
from .notification_client import NotificationClient

# Initialize notification client
notification_client = NotificationClient(
    base_url="http://notification-api:8003",
    api_key="trading-system-key"
)

async def send_risk_notification(event_type: str, payload: dict, severity: str = "high"):
    """Send risk notification event"""
    try:
        await notification_client.publish_event(
            event_type=event_type,
            producer="trading-system",
            payload=payload,
            severity=severity,
            dedupe_key=f"risk_{event_type}_{payload.get('order_id', 'unknown')}"
        )
        print(f"🚨 Risk notification sent: {event_type}")
    except Exception as e:
        print(f"⚠️ Failed to send risk notification {event_type}: {e}")

def within_collars(last_trade: float, price: float, pct: float) -> bool:
    if last_trade <= 0:
        return True
    return abs(price - last_trade) <= last_trade * pct

async def pretrade_checks(order: OrderIn, cfg) -> tuple[bool, str | None]:
    # simplistic last trade reference (use SIP in real impl)
    last = 100.0  # placeholder
    max_notional = cfg.get("risk", {}).get("max_notional_per_order", 250000)
    collar_pct = cfg.get("risk", {}).get("collars_pct", 0.10)

    notional = (order.limit_price or last) * order.qty
    if notional > max_notional:
        # Send risk notification
        await send_risk_notification(
            event_type="RISK_VIOLATION",
            payload={
                "user_id": "default_user",
                "order_id": getattr(order, 'id', 'unknown'),
                "symbol": order.symbol,
                "side": order.side,
                "quantity": order.qty,
                "notional": notional,
                "max_notional": max_notional,
                "violation_type": "max_notional_exceeded"
            },
            severity="high"
        )
        return False, f"Max notional exceeded: {notional:.2f} > {max_notional:.2f}"

    ref_price = order.limit_price or last
    if not within_collars(last, ref_price, collar_pct):
        # Send risk notification
        await send_risk_notification(
            event_type="RISK_VIOLATION",
            payload={
                "user_id": "default_user",
                "order_id": getattr(order, 'id', 'unknown'),
                "symbol": order.symbol,
                "side": order.side,
                "quantity": order.qty,
                "price": ref_price,
                "last_price": last,
                "collar_pct": collar_pct,
                "violation_type": "price_collar_violation"
            },
            severity="high"
        )
        return False, f"Outside price collars ±{int(collar_pct*100)}% vs last {last:.2f}"

    return True, None
