from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, conint, confloat, constr

class Side(str, Enum):
    BUY = "BUY"
    SELL = "SELL"

class OrderType(str, Enum):
    MARKET = "MARKET"
    LIMIT = "LIMIT"
    STOP = "STOP"
    STOP_LIMIT = "STOP_LIMIT"
    TRAILING_STOP = "TRAILING_STOP"
    TRAILING_STOP_LIMIT = "TRAILING_STOP_LIMIT"
    OCO = "OCO"  # One-Cancels-Other
    BRACKET = "BRACKET"  # Bracket order with profit target and stop loss

class TimeInForce(str, Enum):
    DAY = "DAY"
    IOC = "IOC"  # Immediate or Cancel
    FOK = "FOK"  # Fill or Kill
    GTC = "GTC"  # Good Till Canceled
    GTD = "GTD"  # Good Till Date

class Status(str, Enum):
    NEW = "NEW"
    PARTIAL = "PARTIAL"
    FILLED = "FILLED"
    REJECTED = "REJECTED"
    CANCELED = "CANCELED"
    PENDING = "PENDING"  # For conditional orders
    TRIGGERED = "TRIGGERED"  # For stop orders that were triggered
    STOP_PENDING = "STOP_PENDING"  # For stop orders waiting to be triggered

class OrderIn(BaseModel):
    symbol: constr(strip_whitespace=True, to_upper=True, min_length=1, max_length=10)
    side: Side
    order_type: OrderType
    qty: conint(gt=0)
    limit_price: Optional[confloat(gt=0)] = None
    stop_price: Optional[confloat(gt=0)] = None
    trailing_percent: Optional[confloat(gt=0, le=100)] = None
    trailing_amount: Optional[confloat(gt=0)] = None
    tif: TimeInForce = TimeInForce.DAY
    gtd_date: Optional[str] = None  # Good Till Date
    profit_target: Optional[confloat(gt=0)] = None  # For bracket orders
    stop_loss: Optional[confloat(gt=0)] = None  # For bracket orders
    parent_order_id: Optional[str] = None  # For OCO and bracket orders
    linked_order_id: Optional[str] = None  # For OCO orders
    notes: Optional[str] = None  # Trader notes

class OrderOut(OrderIn):
    id: str
    status: Status = Status.NEW
    filled_qty: int = 0
    leaves_qty: int = 0
    avg_price: Optional[float] = None
    message: Optional[str] = None
    created_at: float = Field(default_factory=lambda: __import__("time").time())
    triggered_at: Optional[float] = None
    last_modified: float = Field(default_factory=lambda: __import__("time").time())
    execution_log: list = Field(default_factory=list)  # Track all executions
    order_book_snapshots: list = Field(default_factory=list)  # Order book at execution time

class ExecIn(BaseModel):
    order_id: str
    venue: str
    price: float
    qty: int
    final: bool = False
    status: Status
    message: Optional[str] = None
    execution_time: float = Field(default_factory=lambda: __import__("time").time())
    order_book_snapshot: Optional[dict] = None  # Order book at execution

class OrderBookEntry(BaseModel):
    price: float
    size: int
    venue: str
    timestamp: float

class OrderBook(BaseModel):
    symbol: str
    timestamp: float
    bids: list[OrderBookEntry] = Field(default_factory=list)
    asks: list[OrderBookEntry] = Field(default_factory=list)
    last_price: Optional[float] = None
    last_size: Optional[int] = None
    volume: int = 0

class TradeJournal(BaseModel):
    id: str
    order_id: str
    symbol: str
    side: Side
    qty: int
    price: float
    timestamp: float
    venue: str
    
    # Enhanced journaling fields
    entry_date: Optional[str] = None  # Date of entry
    entry_price: Optional[float] = None  # Entry price for completed trades
    exit_date: Optional[str] = None  # Date of exit
    exit_price: Optional[float] = None  # Exit price for completed trades
    quantity: Optional[int] = None  # Final quantity (may differ from qty for partial fills)
    
    # Reasoning and analysis
    reason_for_entry: Optional[str] = None  # Why you entered the trade
    reason_for_exit: Optional[str] = None  # Why you exited the trade
    outcome: Optional[str] = None  # Profit, Loss, Break-even
    gain_loss: Optional[float] = None  # Actual P&L
    reflection: Optional[str] = None  # What went well/wrong, lessons learned
    tags: list[str] = Field(default_factory=list)  # Tags for categorization
    
    # Entry analysis
    entry_setup_valid: Optional[bool] = None  # Was the setup valid?
    followed_plan: Optional[bool] = None  # Did you follow your plan?
    entry_timing: Optional[str] = None  # Good, Fair, Poor timing
    entry_volume_aligned: Optional[bool] = None  # Was timing aligned with volume?
    entry_volatility_aligned: Optional[bool] = None  # Was timing aligned with volatility?
    
    # Exit analysis
    exit_timing: Optional[str] = None  # Too early, Good, Too late
    respected_stop_loss: Optional[bool] = None  # Did you respect stop-loss?
    respected_target: Optional[bool] = None  # Did you respect profit target?
    missed_reversal: Optional[bool] = None  # Did you miss reversal signals?
    
    # Outcome classification
    outcome_reason: Optional[str] = None  # Good timing, Strong setup, Luck, Poor analysis, Bad timing, External factors
    
    # Common mistakes tracking
    mistakes: list[str] = Field(default_factory=list)  # List of mistakes made
    
    # Market context
    market_conditions: Optional[str] = None  # Market conditions at entry/exit
    strategy: Optional[str] = None  # Trading strategy used
    execution_quality: Optional[str] = None  # Excellent, Good, Fair, Poor
    slippage: Optional[float] = None  # Difference from expected price
    notes: Optional[str] = None  # Additional notes
    
    # Technical analysis context
    technical_indicators: Optional[dict] = None  # RSI, MACD, etc. at entry/exit
    support_resistance: Optional[dict] = None  # Key levels
    volume_analysis: Optional[str] = None  # Volume context
    
    # Risk management
    position_size_appropriate: Optional[bool] = None  # Was position size appropriate?
    risk_reward_ratio: Optional[float] = None  # Risk/reward ratio
    max_adverse_excursion: Optional[float] = None  # Worst point during trade
    max_favorable_excursion: Optional[float] = None  # Best point during trade

class Position(BaseModel):
    symbol: str
    quantity: int
    avg_price: float
    market_value: float
    unrealized_pnl: float
    realized_pnl: float
    total_pnl: float
    cost_basis: float
    last_updated: float
    position_history: list = Field(default_factory=list)  # Track position changes

class RiskMetrics(BaseModel):
    total_exposure: float
    sector_exposure: dict[str, float]
    position_concentration: float  # Largest position as % of portfolio
    daily_pnl: float
    max_drawdown: float
    sharpe_ratio: Optional[float] = None
    var_95: Optional[float] = None  # Value at Risk 95%
    beta: Optional[float] = None
