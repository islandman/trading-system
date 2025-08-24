import os, time, uuid
from typing import List, Dict
import httpx
import asyncio
from datetime import datetime, timedelta
import random

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    OrderIn, OrderOut, ExecIn, Status, OrderType, TimeInForce,
    OrderBook, OrderBookEntry, TradeJournal, Position, RiskMetrics
)
from .state import store
from .ws import ws_manager
from .risk import pretrade_checks

EXCHANGE_URL = os.getenv("EXCHANGE_URL", "http://exchange:8081")
CONFIG_PATH = os.getenv("CONFIG_PATH", "/app/app/../config/sim.yaml")

app = FastAPI(title="Broker (FastAPI)")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state for order book and advanced features
order_books: Dict[str, OrderBook] = {}
pending_conditional_orders: Dict[str, OrderOut] = {}
trade_journal: List[TradeJournal] = []
positions: Dict[str, Position] = {}

# Portfolio mock data
PORTFOLIO_STOCKS = ['AAPL', 'MSFT', 'SPY', 'JNJ', 'V']
PORTFOLIO_DATA = {
    'AAPL': {'shares': 100, 'avg_price': 145.50, 'current_price': 153.04},
    'MSFT': {'shares': 50, 'avg_price': 295.00, 'current_price': 300.89},
    'SPY': {'shares': 200, 'avg_price': 440.00, 'current_price': 446.80},
    'JNJ': {'shares': 75, 'avg_price': 155.00, 'current_price': 160.00},
    'V': {'shares': 60, 'avg_price': 210.00, 'current_price': 220.00}
}

# Market data cache
market_data_cache = {}

# Background task to fetch market data from SIP
async def fetch_market_data():
    """Fetch market data from SIP service and update cache"""
    while True:
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                # Fetch market data for portfolio symbols
                for symbol in PORTFOLIO_STOCKS:
                    try:
                        response = await client.get(f"http://sip:8002/market-data/{symbol}")
                        if response.status_code == 200:
                            data = response.json()
                            market_data_cache[symbol] = {
                                'price': data.get('price', 0),
                                'change_percent': data.get('change_percent', 0),
                                'volume': data.get('volume', 0)
                            }
                    except Exception as e:
                        print(f"Error fetching market data for {symbol}: {e}")
                        continue
        except Exception as e:
            print(f"Error in market data fetch: {e}")
        
        await asyncio.sleep(5)  # Update every 5 seconds

# Load config at startup
@app.on_event("startup")
async def startup():
    print("🚀 Starting broker service...")
    cfg_path = os.getenv("CONFIG_PATH", "/app/config/sim.yaml")
    # fallback to repo /config
    if not os.path.exists(cfg_path):
        cfg_path = "/app/config/sim.yaml"
    if os.path.exists(cfg_path):
        store.load_cfg(cfg_path)
        print(f"✅ Loaded config from {cfg_path}")
    else:
        print(f"⚠️ Config file not found at {cfg_path}")
    
    # Start order book monitoring
    asyncio.create_task(monitor_conditional_orders())
    print("✅ Started conditional order monitoring")
    
    # Start market data fetching
    asyncio.create_task(fetch_market_data())
    print("✅ Started market data fetching")
    
    print("🎯 Broker service startup complete!")

def create_order_book_snapshot(symbol: str) -> OrderBook:
    """Create a realistic order book snapshot"""
    if symbol not in order_books:
        # Initialize with realistic data
        base_price = 100.0 + hash(symbol) % 200
        bids = []
        asks = []
        
        # Create bid ladder
        for i in range(10):
            bid_price = base_price - (i * 0.01) - (i * 0.001)
            bid_size = max(100, 1000 - (i * 50))
            bids.append(OrderBookEntry(
                price=round(bid_price, 2),
                size=bid_size,
                venue="SIMX",
                timestamp=time.time()
            ))
        
        # Create ask ladder
        for i in range(10):
            ask_price = base_price + (i * 0.01) + (i * 0.001)
            ask_size = max(100, 1000 - (i * 50))
            asks.append(OrderBookEntry(
                price=round(ask_price, 2),
                size=ask_size,
                venue="SIMX",
                timestamp=time.time()
            ))
        
        order_books[symbol] = OrderBook(
            symbol=symbol,
            timestamp=time.time(),
            bids=bids,
            asks=asks,
            last_price=base_price,
            volume=random.randint(10000, 100000)
        )
    
    return order_books[symbol]

def update_order_book(symbol: str, side: str, price: float, size: int, action: str):
    """Update order book when orders are placed/filled"""
    if symbol not in order_books:
        create_order_book_snapshot(symbol)
    
    book = order_books[symbol]
    
    if side == "BUY":
        if action == "ADD":
            # Add to bids
            book.bids.append(OrderBookEntry(
                price=price, size=size, venue="SIMX", timestamp=time.time()
            ))
            book.bids.sort(key=lambda x: x.price, reverse=True)
        elif action == "REMOVE":
            # Remove from bids
            book.bids = [b for b in book.bids if not (b.price == price and b.size == size)]
    else:
        if action == "ADD":
            # Add to asks
            book.asks.append(OrderBookEntry(
                price=price, size=size, venue="SIMX", timestamp=time.time()
            ))
            book.asks.sort(key=lambda x: x.price)
        elif action == "REMOVE":
            # Remove from asks
            book.asks = [a for a in book.asks if not (a.price == price and a.size == size)]
    
    book.timestamp = time.time()

def check_conditional_orders(symbol: str, current_price: float):
    """Check if any conditional orders should be triggered"""
    orders_to_trigger = []
    
    for order_id, order in pending_conditional_orders.items():
        if order.symbol != symbol:
            continue
            
        triggered = False
        
        if order.order_type == OrderType.STOP:
            if order.side == "BUY" and current_price >= order.stop_price:
                triggered = True
            elif order.side == "SELL" and current_price <= order.stop_price:
                triggered = True
                
        elif order.order_type == OrderType.STOP_LIMIT:
            if order.side == "BUY" and current_price >= order.stop_price:
                triggered = True
            elif order.side == "SELL" and current_price <= order.stop_price:
                triggered = True
                
        elif order.order_type == OrderType.TRAILING_STOP:
            # Calculate trailing stop logic
            if order.trailing_percent:
                trailing_amount = current_price * (order.trailing_percent / 100)
                if order.side == "BUY" and current_price <= (order.stop_price - trailing_amount):
                    triggered = True
                elif order.side == "SELL" and current_price >= (order.stop_price + trailing_amount):
                    triggered = True
        
        if triggered:
            order.status = Status.TRIGGERED
            order.triggered_at = time.time()
            orders_to_trigger.append(order)
            del pending_conditional_orders[order_id]
    
    return orders_to_trigger

def add_to_trade_journal(execution: ExecIn, order: OrderOut, order_book_snapshot: dict):
    """Add execution to trade journal with enhanced trade analysis"""
    
    # Calculate execution quality and slippage
    execution_quality = "Good"
    slippage = None
    
    if order.order_type == "LIMIT":
        if order.limit_price:
            slippage = abs(execution.price - order.limit_price)
            if slippage <= 0.01:  # Within 1 cent
                execution_quality = "Excellent"
            elif slippage <= 0.05:  # Within 5 cents
                execution_quality = "Good"
            elif slippage <= 0.10:  # Within 10 cents
                execution_quality = "Fair"
            else:
                execution_quality = "Poor"
    elif order.order_type == "MARKET":
        # For market orders, calculate slippage from order book
        if order_book_snapshot and order_book_snapshot.get('asks') and order_book_snapshot.get('bids'):
            asks = order_book_snapshot.get('asks', [])
            bids = order_book_snapshot.get('bids', [])
            if asks and bids and len(asks) > 0 and len(bids) > 0:
                if order.side == "BUY":
                    expected_price = asks[0].get('price', execution.price)
                else:
                    expected_price = bids[0].get('price', execution.price)
                slippage = abs(execution.price - expected_price)
                if slippage <= 0.02:
                    execution_quality = "Good"
                elif slippage <= 0.05:
                    execution_quality = "Fair"
                else:
                    execution_quality = "Poor"
    
    # Generate trade notes
    notes = []
    if order.order_type == "STOP":
        notes.append("Stop triggered")
    elif order.order_type == "STOP_LIMIT":
        notes.append("Stop limit triggered")
    elif order.order_type == "TRAILING_STOP":
        notes.append("Trailing stop triggered")
    
    if slippage and slippage > 0.05:
        notes.append(f"High slippage: ${slippage:.2f}")
    
    if execution.venue:
        notes.append(f"Venue: {execution.venue}")
    
    # Add order book context
    if order_book_snapshot and order_book_snapshot.get('asks') and order_book_snapshot.get('bids'):
        asks = order_book_snapshot.get('asks', [])
        bids = order_book_snapshot.get('bids', [])
        if asks and bids and len(asks) > 0 and len(bids) > 0:
            ask_price = asks[0].get('price', 0)
            bid_price = bids[0].get('price', 0)
            if ask_price and bid_price:
                spread = ask_price - bid_price
                if spread > 0.10:
                    notes.append(f"Wide spread: ${spread:.2f}")
    
    # Determine outcome based on order side and market conditions
    outcome = None
    gain_loss = None
    
    # For now, we'll set a placeholder outcome - in a real system, this would be calculated
    # when the position is closed or when we have more context
    if order.side == "BUY":
        # This is an entry - outcome will be determined when position is closed
        outcome = "Open"
    else:
        # This is an exit - calculate P&L based on position history
        # For now, we'll use a placeholder
        outcome = "Closed"
        gain_loss = 0.0  # Would be calculated from position history
    
    # Generate automatic tags based on order characteristics
    tags = []
    if order.order_type == "MARKET":
        tags.append("market-order")
    elif order.order_type == "LIMIT":
        tags.append("limit-order")
    elif order.order_type == "STOP":
        tags.append("stop-order")
    elif order.order_type == "STOP_LIMIT":
        tags.append("stop-limit")
    elif order.order_type == "TRAILING_STOP":
        tags.append("trailing-stop")
    
    # Add strategy tags based on order notes
    if order.notes:
        if "breakout" in order.notes.lower():
            tags.append("breakout")
        if "earnings" in order.notes.lower():
            tags.append("earnings")
        if "rsi" in order.notes.lower():
            tags.append("RSI")
        if "macd" in order.notes.lower():
            tags.append("MACD")
        if "support" in order.notes.lower():
            tags.append("support")
        if "resistance" in order.notes.lower():
            tags.append("resistance")
    
    # Add market condition tags
    if slippage and slippage > 0.05:
        tags.append("high-slippage")
    if execution_quality == "Excellent":
        tags.append("excellent-execution")
    elif execution_quality == "Poor":
        tags.append("poor-execution")
    
    # Generate automatic reasoning based on order characteristics
    reason_for_entry = None
    reason_for_exit = None
    
    if order.side == "BUY":
        reason_for_entry = f"Market order to establish position in {order.symbol}"
        if order.order_type == "LIMIT":
            reason_for_entry = f"Limit order at ${order.limit_price:.2f} for {order.symbol}"
        elif order.order_type == "STOP":
            reason_for_entry = f"Stop order triggered at ${order.stop_price:.2f} for {order.symbol}"
        elif order.order_type == "STOP_LIMIT":
            reason_for_entry = f"Stop limit order triggered at ${order.stop_price:.2f} with limit ${order.limit_price:.2f} for {order.symbol}"
        elif order.order_type == "TRAILING_STOP":
            reason_for_entry = f"Trailing stop order triggered for {order.symbol}"
    else:
        reason_for_exit = f"Market order to close position in {order.symbol}"
        if order.order_type == "LIMIT":
            reason_for_exit = f"Limit order at ${order.limit_price:.2f} to close {order.symbol}"
        elif order.order_type == "STOP":
            reason_for_exit = f"Stop order triggered at ${order.stop_price:.2f} to close {order.symbol}"
        elif order.order_type == "STOP_LIMIT":
            reason_for_exit = f"Stop limit order triggered at ${order.stop_price:.2f} with limit ${order.limit_price:.2f} to close {order.symbol}"
        elif order.order_type == "TRAILING_STOP":
            reason_for_exit = f"Trailing stop order triggered to close {order.symbol}"
    
    # Add user notes if available
    if order.notes:
        if order.side == "BUY":
            reason_for_entry = f"{reason_for_entry} - {order.notes}"
        else:
            reason_for_exit = f"{reason_for_exit} - {order.notes}"
    
    # Analyze market conditions based on order book
    market_conditions = "Normal market conditions"
    if order_book_snapshot and order_book_snapshot.get('asks') and order_book_snapshot.get('bids'):
        asks = order_book_snapshot.get('asks', [])
        bids = order_book_snapshot.get('bids', [])
        if asks and bids and len(asks) > 0 and len(bids) > 0:
            ask_price = asks[0].get('price', 0)
            bid_price = bids[0].get('price', 0)
            if ask_price and bid_price:
                spread = ask_price - bid_price
                spread_percent = (spread / bid_price) * 100
                if spread_percent > 0.5:
                    market_conditions = f"Wide spread market ({spread_percent:.2f}%)"
                elif spread_percent < 0.1:
                    market_conditions = f"Tight spread market ({spread_percent:.2f}%)"
                else:
                    market_conditions = f"Normal spread market ({spread_percent:.2f}%)"
    
    # Generate reflection placeholder
    reflection = "Trade executed automatically. Review and add manual reflection."
    
    # Determine entry/exit timing based on execution quality
    entry_timing = None
    exit_timing = None
    
    if execution_quality == "Excellent":
        entry_timing = "Good" if order.side == "BUY" else None
        exit_timing = "Good" if order.side == "SELL" else None
    elif execution_quality == "Good":
        entry_timing = "Good" if order.side == "BUY" else None
        exit_timing = "Good" if order.side == "SELL" else None
    elif execution_quality == "Fair":
        entry_timing = "Fair" if order.side == "BUY" else None
        exit_timing = "Fair" if order.side == "SELL" else None
    elif execution_quality == "Poor":
        entry_timing = "Poor" if order.side == "BUY" else None
        exit_timing = "Poor" if order.side == "SELL" else None
    
    # Generate mistakes based on execution quality
    mistakes = []
    if execution_quality == "Poor":
        mistakes.append("poor execution")
    if slippage and slippage > 0.10:
        mistakes.append("high slippage")
    if order.order_type == "MARKET" and slippage and slippage > 0.05:
        mistakes.append("market impact")
    
    journal_entry = TradeJournal(
        id=str(uuid.uuid4()),
        order_id=execution.order_id,
        symbol=order.symbol,
        side=order.side,
        qty=execution.qty,
        price=execution.price,
        timestamp=execution.execution_time,
        venue=execution.venue,
        
        # Enhanced journaling fields
        entry_date=datetime.fromtimestamp(execution.execution_time).strftime('%Y-%m-%d'),
        entry_price=execution.price if order.side == "BUY" else None,
        exit_date=datetime.fromtimestamp(execution.execution_time).strftime('%Y-%m-%d') if order.side == "SELL" else None,
        exit_price=execution.price if order.side == "SELL" else None,
        quantity=execution.qty,
        
        # Reasoning and analysis
        reason_for_entry=reason_for_entry,
        reason_for_exit=reason_for_exit,
        outcome=outcome,
        gain_loss=gain_loss,
        reflection=reflection,
        tags=tags,
        
        # Entry analysis
        entry_setup_valid=True,  # Default to True, user can adjust
        followed_plan=True,  # Default to True, user can adjust
        entry_timing=entry_timing,
        entry_volume_aligned=True,  # Default to True, user can adjust
        entry_volatility_aligned=True,  # Default to True, user can adjust
        
        # Exit analysis
        exit_timing=exit_timing,
        respected_stop_loss=True,  # Default to True, user can adjust
        respected_target=True,  # Default to True, user can adjust
        missed_reversal=False,  # Default to False, user can adjust
        
        # Outcome classification
        outcome_reason="Good timing" if execution_quality in ["Excellent", "Good"] else "Execution issues",
        
        # Common mistakes tracking
        mistakes=mistakes,
        
        # Market context
        market_conditions=market_conditions,
        strategy=order.order_type.lower().replace("_", "-"),
        execution_quality=execution_quality,
        slippage=slippage,
        notes=" | ".join(notes) if notes else "Standard execution",
        
        # Technical analysis context
        technical_indicators={},  # Would be populated from market data
        support_resistance={},  # Would be populated from market data
        volume_analysis="Standard volume",
        
        # Risk management
        position_size_appropriate=True,  # Default to True, user can adjust
        risk_reward_ratio=1.5,  # Default ratio, user can adjust
        max_adverse_excursion=None,  # Would be calculated from position history
        max_favorable_excursion=None  # Would be calculated from position history
    )
    
    trade_journal.append(journal_entry)
    
    # Keep only last 1000 entries
    if len(trade_journal) > 1000:
        trade_journal.pop(0)

def update_position(symbol: str, side: str, qty: int, price: float):
    """Update position tracking"""
    if symbol not in positions:
        positions[symbol] = Position(
            symbol=symbol,
            quantity=0,
            avg_price=0,
            market_value=0,
            unrealized_pnl=0,
            realized_pnl=0,
            total_pnl=0,
            cost_basis=0,
            last_updated=time.time()
        )
    
    pos = positions[symbol]
    
    if side == "BUY":
        # Adding to position
        new_quantity = pos.quantity + qty
        new_cost = pos.cost_basis + (qty * price)
        pos.quantity = new_quantity
        pos.cost_basis = new_cost
        pos.avg_price = new_cost / new_quantity if new_quantity > 0 else 0
    else:
        # Reducing position
        if pos.quantity > 0:
            # Calculate realized P&L
            sold_cost = (qty / pos.quantity) * pos.cost_basis
            sold_value = qty * price
            realized_pnl = sold_value - sold_cost
            pos.realized_pnl += realized_pnl
            
            # Update position
            new_quantity = pos.quantity - qty
            new_cost = pos.cost_basis - sold_cost
            pos.quantity = max(0, new_quantity)
            pos.cost_basis = max(0, new_cost)
            pos.avg_price = new_cost / new_quantity if new_quantity > 0 else 0
    
    pos.last_updated = time.time()
    
    # Add to position history
    pos.position_history.append({
        "timestamp": time.time(),
        "action": side,
        "qty": qty,
        "price": price,
        "quantity": pos.quantity,
        "avg_price": pos.avg_price
    })

async def monitor_conditional_orders():
    """Background task to monitor conditional orders"""
    while True:
        try:
            # Check all pending conditional orders
            for order_id, order in list(pending_conditional_orders.items()):
                # Get current market price (simplified)
                current_price = 100.0  # This should come from market data
                
                triggered_orders = check_conditional_orders(order.symbol, current_price)
                
                for triggered_order in triggered_orders:
                    # Route triggered order to exchange
                    await route_order_to_exchange(triggered_order)
                    
                    # Broadcast update
                    await ws_manager.broadcast({
                        "type": "order_triggered",
                        "data": triggered_order.model_dump()
                    })
            
            await asyncio.sleep(1)  # Check every second
            
        except Exception as e:
            print(f"Error in conditional order monitoring: {e}")
            await asyncio.sleep(5)

def check_stop_order_conditions(order: OrderOut, current_price: float) -> bool:
    """Check if stop order conditions are met"""
    if order.order_type == OrderType.STOP:
        if order.side == "BUY" and current_price >= order.stop_price:
            return True
        elif order.side == "SELL" and current_price <= order.stop_price:
            return True
    elif order.order_type == OrderType.STOP_LIMIT:
        if order.side == "BUY" and current_price >= order.stop_price:
            return True
        elif order.side == "SELL" and current_price <= order.stop_price:
            return True
    elif order.order_type == OrderType.TRAILING_STOP:
        if order.trailing_percent:
            trailing_amount = current_price * (order.trailing_percent / 100)
            if order.side == "BUY" and current_price <= (order.stop_price - trailing_amount):
                return True
            elif order.side == "SELL" and current_price >= (order.stop_price + trailing_amount):
                return True
    elif order.order_type == OrderType.TRAILING_STOP_LIMIT:
        if order.trailing_percent:
            trailing_amount = current_price * (order.trailing_percent / 100)
            if order.side == "BUY" and current_price <= (order.stop_price - trailing_amount):
                return True
            elif order.side == "SELL" and current_price >= (order.stop_price + trailing_amount):
                return True
    
    return False

async def route_order_to_exchange(order: OrderOut):
    """Route order to exchange with enhanced logging"""
    print(f"🔄 Routing order to exchange: {order.symbol} {order.side} {order.qty} {order.order_type}")
    
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            # Create order book snapshot
            order_book_snapshot = create_order_book_snapshot(order.symbol)
            
            # Update order book
            if order.order_type in [OrderType.LIMIT, OrderType.STOP_LIMIT]:
                update_order_book(order.symbol, order.side, order.limit_price, order.qty, "ADD")
            
            print(f"📤 Sending to exchange: {EXCHANGE_URL}/orders")
            
            response = await client.post(f"{EXCHANGE_URL}/orders", json={
                "order_id": order.id,
                "symbol": order.symbol,
                "side": order.side,
                "order_type": order.order_type,
                "qty": order.qty,
                "limit_price": order.limit_price,
                "stop_price": order.stop_price,
                "trailing_percent": order.trailing_percent,
                "tif": order.tif,
                "callback_url": os.getenv("BROKER_CALLBACK_URL", "http://broker:8000/exec")
            })
            
            if response.status_code != 202:
                order.status = Status.REJECTED
                order.message = f"Exchange error: {response.status_code}"
                await ws_manager.broadcast({"type": "order_update", "data": order.model_dump()})
                
        except Exception as e:
            order.status = Status.REJECTED
            order.message = f"Route error: {str(e)}"
            await ws_manager.broadcast({"type": "order_update", "data": order.model_dump()})

@app.post("/orders", response_model=OrderOut, status_code=201)
async def place_order(order_in: OrderIn):
    try:
        print(f"🔵 Received order: {order_in.symbol} {order_in.side} {order_in.qty} {order_in.order_type}")
        
        ok, reason = pretrade_checks(order_in, store.cfg)
        if not ok:
            raise HTTPException(status_code=400, detail=reason)

        oid = str(uuid.uuid4())
        order = OrderOut(id=oid, **order_in.model_dump())
        order.leaves_qty = order.qty
        
        with store.lock:
            store.orders[oid] = order

        # Handle different order types
        if order.order_type in [OrderType.STOP, OrderType.STOP_LIMIT, OrderType.TRAILING_STOP]:
            # Conditional order - add to pending
            order.status = Status.STOP_PENDING
            pending_conditional_orders[oid] = order
            
            # Broadcast STOP_PENDING status
            await ws_manager.broadcast({"type": "order_update", "data": order.model_dump()})
            
        elif order.order_type == OrderType.TRAILING_STOP_LIMIT:
            # Conditional order - add to pending
            order.status = Status.STOP_PENDING
            pending_conditional_orders[oid] = order
            
            # Broadcast STOP_PENDING status
            await ws_manager.broadcast({"type": "order_update", "data": order.model_dump()})
            
        elif order.order_type == OrderType.OCO:
            # One-Cancels-Other order
            await handle_oco_order(order)
            
        elif order.order_type == OrderType.BRACKET:
            # Bracket order
            await handle_bracket_order(order)
            
        else:
            # Regular order - route immediately
            await route_order_to_exchange(order)
            
            # Broadcast NEW status
            await ws_manager.broadcast({"type": "order_update", "data": order.model_dump()})
                
        return order
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

async def handle_oco_order(order: OrderOut):
    """Handle One-Cancels-Other orders"""
    # Create two linked orders
    order1 = OrderOut(
        id=str(uuid.uuid4()),
        symbol=order.symbol,
        side=order.side,
        order_type=OrderType.LIMIT,
        qty=order.qty,
        limit_price=order.limit_price,
        tif=order.tif,
        linked_order_id=order.id
    )
    
    order2 = OrderOut(
        id=str(uuid.uuid4()),
        symbol=order.symbol,
        side=order.side,
        order_type=OrderType.STOP,
        qty=order.qty,
        stop_price=order.stop_price,
        tif=order.tif,
        linked_order_id=order.id
    )
    
    # Store both orders
    with store.lock:
        store.orders[order1.id] = order1
        store.orders[order2.id] = order2
    
    # Route both orders
    await route_order_to_exchange(order1)
    await route_order_to_exchange(order2)
    
    await ws_manager.broadcast({"type": "order_update", "data": order.model_dump()})

async def handle_bracket_order(order: OrderOut):
    """Handle bracket orders with profit target and stop loss"""
    # Main order
    main_order = OrderOut(
        id=str(uuid.uuid4()),
        symbol=order.symbol,
        side=order.side,
        order_type=OrderType.MARKET,
        qty=order.qty,
        tif=order.tif,
        parent_order_id=order.id
    )
    
    # Profit target order
    profit_order = OrderOut(
        id=str(uuid.uuid4()),
        symbol=order.symbol,
        side="SELL" if order.side == "BUY" else "BUY",
        order_type=OrderType.LIMIT,
        qty=order.qty,
        limit_price=order.profit_target,
        tif=TimeInForce.GTC,
        parent_order_id=order.id
    )
    
    # Stop loss order
    stop_order = OrderOut(
        id=str(uuid.uuid4()),
        symbol=order.symbol,
        side="SELL" if order.side == "BUY" else "BUY",
        order_type=OrderType.STOP,
        qty=order.qty,
        stop_price=order.stop_loss,
        tif=TimeInForce.GTC,
        parent_order_id=order.id
    )
    
    # Store all orders
    with store.lock:
        store.orders[main_order.id] = main_order
        store.orders[profit_order.id] = profit_order
        store.orders[stop_order.id] = stop_order
    
    # Route main order first
    await route_order_to_exchange(main_order)
    
    await ws_manager.broadcast({"type": "order_update", "data": order.model_dump()})

@app.delete("/orders/{order_id}")
async def cancel_order(order_id: str):
    try:
        with store.lock:
            order = store.orders.get(order_id)
            if not order:
                raise HTTPException(status_code=404, detail="Order not found")
            
            if order.status in [Status.FILLED, Status.CANCELED, Status.REJECTED]:
                raise HTTPException(status_code=400, detail=f"Order cannot be canceled in {order.status} status")
            
            # Cancel order
            order.status = Status.CANCELED
            order.message = "Canceled by user"
            order.last_modified = time.time()
            
            # Remove from pending conditional orders if present
            if order_id in pending_conditional_orders:
                del pending_conditional_orders[order_id]
            
            # Cancel linked orders for OCO
            if order.linked_order_id:
                linked_order = store.orders.get(order.linked_order_id)
                if linked_order and linked_order.status not in [Status.FILLED, Status.CANCELED, Status.REJECTED]:
                    linked_order.status = Status.CANCELED
                    linked_order.message = "Canceled due to OCO"
                    linked_order.last_modified = time.time()
            
        # Broadcast cancellation
        await ws_manager.broadcast({"type": "order_update", "data": order.model_dump()})
        
        return {"message": "Order canceled successfully", "order_id": order_id}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/orders/{order_id}", response_model=OrderOut)
async def get_order(order_id: str):
    try:
        with store.lock:
            o = store.orders.get(order_id)
        if not o:
            raise HTTPException(status_code=404, detail="Order not found")
        return o
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/orders", response_model=List[OrderOut])
async def list_orders():
    try:
        with store.lock:
            return list(store.orders.values())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/order-book/{symbol}")
async def get_order_book(symbol: str):
    """Get current order book for a symbol"""
    try:
        order_book = create_order_book_snapshot(symbol)
        return order_book
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/trade-journal")
async def get_trade_journal(limit: int = 100):
    """Get trade journal entries"""
    try:
        return trade_journal[-limit:] if trade_journal else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.put("/trade-journal/{entry_id}")
async def update_trade_journal(entry_id: str, updated_entry: dict):
    """Update a trade journal entry with enhanced data"""
    try:
        # Find the entry to update
        entry_index = None
        for i, entry in enumerate(trade_journal):
            if entry.id == entry_id:
                entry_index = i
                break
        
        if entry_index is None:
            raise HTTPException(status_code=404, detail="Journal entry not found")
        
        # Update the entry with new data
        current_entry = trade_journal[entry_index]
        
        # Update fields that are provided
        for field, value in updated_entry.items():
            if hasattr(current_entry, field):
                setattr(current_entry, field, value)
        
        # Update the entry in the list
        trade_journal[entry_index] = current_entry
        
        return {"message": "Journal entry updated successfully", "entry": current_entry}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/trade-journal/analytics")
async def get_journal_analytics():
    """Get analytics data from trade journal"""
    try:
        if not trade_journal:
            return {
                "total_trades": 0,
                "win_rate": 0,
                "total_pnl": 0,
                "avg_pnl": 0,
                "tag_analysis": {},
                "mistake_analysis": {},
                "symbol_performance": {}
            }
        
        # Calculate basic statistics
        total_trades = len(trade_journal)
        profitable_trades = len([entry for entry in trade_journal if entry.outcome == "Profit"])
        win_rate = (profitable_trades / total_trades * 100) if total_trades > 0 else 0
        
        total_pnl = sum(entry.gain_loss or 0 for entry in trade_journal)
        avg_pnl = total_pnl / total_trades if total_trades > 0 else 0
        
        # Tag analysis
        tag_analysis = {}
        for entry in trade_journal:
            for tag in entry.tags or []:
                if tag not in tag_analysis:
                    tag_analysis[tag] = {"count": 0, "wins": 0, "total_pnl": 0}
                tag_analysis[tag]["count"] += 1
                if entry.outcome == "Profit":
                    tag_analysis[tag]["wins"] += 1
                tag_analysis[tag]["total_pnl"] += entry.gain_loss or 0
        
        # Mistake analysis
        mistake_analysis = {}
        for entry in trade_journal:
            for mistake in entry.mistakes or []:
                if mistake not in mistake_analysis:
                    mistake_analysis[mistake] = {"count": 0, "total_pnl": 0}
                mistake_analysis[mistake]["count"] += 1
                mistake_analysis[mistake]["total_pnl"] += entry.gain_loss or 0
        
        # Symbol performance
        symbol_performance = {}
        for entry in trade_journal:
            if entry.symbol not in symbol_performance:
                symbol_performance[entry.symbol] = {"trades": 0, "wins": 0, "total_pnl": 0}
            symbol_performance[entry.symbol]["trades"] += 1
            if entry.outcome == "Profit":
                symbol_performance[entry.symbol]["wins"] += 1
            symbol_performance[entry.symbol]["total_pnl"] += entry.gain_loss or 0
        
        return {
            "total_trades": total_trades,
            "win_rate": round(win_rate, 2),
            "total_pnl": round(total_pnl, 2),
            "avg_pnl": round(avg_pnl, 2),
            "tag_analysis": tag_analysis,
            "mistake_analysis": mistake_analysis,
            "symbol_performance": symbol_performance
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/positions")
async def get_positions():
    """Get current positions"""
    try:
        return list(positions.values())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/risk-metrics")
async def get_risk_metrics():
    """Get portfolio risk metrics"""
    try:
        total_exposure = sum(pos.market_value for pos in positions.values())
        sector_exposure = {"Technology": 0.4, "Finance": 0.3, "Healthcare": 0.2, "Other": 0.1}
        
        max_position = max([pos.market_value for pos in positions.values()] + [0])
        position_concentration = (max_position / total_exposure * 100) if total_exposure > 0 else 0
        
        daily_pnl = sum(pos.total_pnl for pos in positions.values())
        
        return RiskMetrics(
            total_exposure=total_exposure,
            sector_exposure=sector_exposure,
            position_concentration=position_concentration,
            daily_pnl=daily_pnl,
            max_drawdown=0.05,  # Simplified
            sharpe_ratio=1.2,  # Simplified
            var_95=total_exposure * 0.02,  # 2% VaR
            beta=1.0
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/exec")
async def exec_report(request: Request):
    try:
        # Get raw request body for debugging
        body = await request.body()
        print(f"📥 Raw execution data: {body.decode()}")
        
        # Parse the execution data
        er = ExecIn(**await request.json())
        print(f"✅ Received execution: {er.order_id} {er.qty} @ {er.price}")
        print(f"📊 Execution details: venue={er.venue}, status={er.status}, final={er.final}")
        
        with store.lock:
            o = store.orders.get(er.order_id)
            if not o:
                raise HTTPException(status_code=404, detail="Unknown order for exec")
            
            # Update order
            o.filled_qty += er.qty
            o.leaves_qty = max(0, o.qty - o.filled_qty)
            
            # Calculate average price
            if o.avg_price is None:
                o.avg_price = er.price
            else:
                o.avg_price = round((o.avg_price * (o.filled_qty - er.qty) + er.price * er.qty) / o.filled_qty, 6)
            
            o.status = er.status
            o.message = er.message
            o.last_modified = time.time()
            
            # Add to execution log
            o.execution_log.append({
                "timestamp": er.execution_time,
                "price": er.price,
                "qty": er.qty,
                "venue": er.venue
            })
            
            # Add order book snapshot
            if er.order_book_snapshot:
                o.order_book_snapshots.append(er.order_book_snapshot)

        # Update position
        print(f"🔄 Updating position for {o.symbol}")
        update_position(o.symbol, o.side, er.qty, er.price)
        
        # Add to trade journal
        print(f"📝 Adding to trade journal for {o.symbol}")
        add_to_trade_journal(er, o, er.order_book_snapshot)
        
        # Update order book
        print(f"📊 Updating order book for {o.symbol}")
        update_order_book(o.symbol, o.side, er.price, er.qty, "REMOVE")

        await ws_manager.broadcast({"type": "order_update", "data": o.model_dump()})
        return {"ok": True}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.websocket("/ws")
async def ws(ws: WebSocket):
    await ws_manager.connect(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        await ws_manager.disconnect(ws)

@app.get("/health")
async def health():
    return {"ok": True, "ts": time.time()}

@app.get("/stats")
async def get_stats():
    try:
        with store.lock:
            total_orders = len(store.orders)
            filled_orders = len([o for o in store.orders.values() if o.status == Status.FILLED])
            pending_orders = len([o for o in store.orders.values() if o.status in [Status.NEW, Status.PARTIAL]])
            rejected_orders = len([o for o in store.orders.values() if o.status == Status.REJECTED])
            conditional_orders = len(pending_conditional_orders)
            
            total_volume = sum(o.filled_qty for o in store.orders.values() if o.status == Status.FILLED)
            total_value = sum(o.filled_qty * (o.avg_price or 0) for o in store.orders.values() if o.status == Status.FILLED)
            
        return {
            "total_orders": total_orders,
            "filled_orders": filled_orders,
            "pending_orders": pending_orders,
            "rejected_orders": rejected_orders,
            "conditional_orders": conditional_orders,
            "total_volume": total_volume,
            "total_value": round(total_value, 2),
            "trade_journal_entries": len(trade_journal),
            "active_positions": len(positions),
            "ts": time.time()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/portfolio")
async def get_portfolio():
    """Get portfolio data with mock positions"""
    try:
        portfolio = []
        total_value = 0
        total_cost = 0
        total_pnl = 0
        
        for symbol in PORTFOLIO_STOCKS:
            if symbol in PORTFOLIO_DATA:
                position = PORTFOLIO_DATA[symbol]
                
                # Get current price from market data cache or use default
                current_price = position['current_price']
                if symbol in market_data_cache:
                    current_price = market_data_cache[symbol].get('price', position['current_price'])
                
                market_value = position['shares'] * current_price
                cost_basis = position['shares'] * position['avg_price']
                unrealized_pnl = market_value - cost_basis
                pnl_percent = (unrealized_pnl / cost_basis) * 100
                
                portfolio.append({
                    "symbol": symbol,
                    "shares": position['shares'],
                    "avg_price": position['avg_price'],
                    "current_price": current_price,
                    "market_value": market_value,
                    "cost_basis": cost_basis,
                    "unrealized_pnl": unrealized_pnl,
                    "pnl_percent": pnl_percent,
                    "sector": get_sector_for_symbol(symbol),
                    "change_today": get_change_for_symbol(symbol)
                })
                
                total_value += market_value
                total_cost += cost_basis
                total_pnl += unrealized_pnl
        
        return {
            "portfolio": portfolio,
            "summary": {
                "total_value": total_value,
                "total_cost": total_cost,
                "total_pnl": total_pnl,
                "total_pnl_percent": (total_pnl / total_cost) * 100 if total_cost > 0 else 0,
                "positions_count": len(portfolio)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

def get_sector_for_symbol(symbol: str) -> str:
    """Get sector for a symbol"""
    sectors = {
        'AAPL': 'Technology',
        'MSFT': 'Technology',
        'SPY': 'ETF',
        'JNJ': 'Healthcare',
        'V': 'Financial',
        'GOOGL': 'Technology',
        'TSLA': 'Automotive',
        'NVDA': 'Technology',
        'AMZN': 'Consumer Discretionary',
        'META': 'Technology'
    }
    return sectors.get(symbol, 'Unknown')

def get_change_for_symbol(symbol: str) -> float:
    """Get today's change for a symbol"""
    if symbol in market_data_cache:
        return market_data_cache[symbol].get('change_percent', 0.0)
    return 0.0
