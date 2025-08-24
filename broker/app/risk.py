from .models import OrderIn
import math

def within_collars(last_trade: float, price: float, pct: float) -> bool:
    if last_trade <= 0:
        return True
    return abs(price - last_trade) <= last_trade * pct

def pretrade_checks(order: OrderIn, cfg) -> tuple[bool, str | None]:
    # simplistic last trade reference (use SIP in real impl)
    last = 100.0  # placeholder
    max_notional = cfg.get("risk", {}).get("max_notional_per_order", 250000)
    collar_pct = cfg.get("risk", {}).get("collars_pct", 0.10)

    notional = (order.limit_price or last) * order.qty
    if notional > max_notional:
        return False, f"Max notional exceeded: {notional:.2f} > {max_notional:.2f}"

    ref_price = order.limit_price or last
    if not within_collars(last, ref_price, collar_pct):
        return False, f"Outside price collars ±{int(collar_pct*100)}% vs last {last:.2f}"

    return True, None
