import asyncio
import json
import math
import random
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

# Market data models
class NBBO(BaseModel):
    bid: float
    ask: float
    bid_sz: int
    ask_sz: int

class TechnicalIndicators(BaseModel):
    rsi: float
    macd: float
    macd_signal: float
    macd_histogram: float
    sma_20: float
    sma_50: float
    ema_12: float
    ema_26: float
    bollinger_upper: float
    bollinger_middle: float
    bollinger_lower: float
    atr: float
    volume_sma: float

class FundamentalMetrics(BaseModel):
    pe_ratio: float
    pb_ratio: float
    dividend_yield: float
    market_cap: float
    eps: float
    revenue_growth: float
    profit_margin: float
    debt_to_equity: float
    current_ratio: float
    roe: float
    roa: float

class MarketData(BaseModel):
    symbol: str
    price: float
    change: float
    change_percent: float
    volume: int
    high: float
    low: float
    open: float
    nbbo: NBBO
    technical: TechnicalIndicators
    fundamental: FundamentalMetrics

class HistoricalData(BaseModel):
    symbol: str
    timeframe: str
    data: List[Dict]

# Market symbols with realistic base data
SYMS = [
    'AAPL', 'MSFT', 'SPY', 'GOOGL', 'TSLA', 'NVDA', 'AMZN', 'META',
    'JPM', 'JNJ', 'V', 'PG', 'UNH', 'HD', 'MA', 'DIS', 'PYPL', 'NFLX',
    'CRM', 'ADBE', 'INTC', 'ORCL', 'CSCO', 'IBM', 'QCOM', 'TXN', 'AVGO',
    'ACN', 'WMT', 'KO', 'PEP', 'ABT', 'TMO', 'DHR', 'LLY', 'PFE', 'MRK',
    'ABBV', 'BMY', 'UNP', 'RTX', 'LMT', 'BA', 'CAT', 'DE', 'MMM', 'GE',
    'XOM', 'CVX', 'COP', 'EOG', 'SLB', 'KMI', 'PSX', 'VLO', 'MPC', 'OXY'
]

# Store historical data for each symbol
historical_data: Dict[str, Dict[str, List]] = {}
real_market_data: Dict[str, Dict] = {}

# Realistic base data for each symbol
SYMBOL_BASE_DATA = {
    'AAPL': {
        'base_price': 150.0,
        'volatility': 0.025,
        'beta': 1.2,
        'sector': 'Technology',
        'pe_ratio': 25.0,
        'pb_ratio': 15.0,
        'dividend_yield': 0.6,
        'market_cap': 2500000000000,
        'volume_base': 50000000
    },
    'MSFT': {
        'base_price': 300.0,
        'volatility': 0.022,
        'beta': 1.1,
        'sector': 'Technology',
        'pe_ratio': 30.0,
        'pb_ratio': 12.0,
        'dividend_yield': 0.8,
        'market_cap': 2200000000000,
        'volume_base': 30000000
    },
    'SPY': {
        'base_price': 450.0,
        'volatility': 0.018,
        'beta': 1.0,
        'sector': 'ETF',
        'pe_ratio': 22.0,
        'pb_ratio': 3.0,
        'dividend_yield': 1.5,
        'market_cap': 400000000000,
        'volume_base': 80000000
    },
    'GOOGL': {
        'base_price': 2800.0,
        'volatility': 0.028,
        'beta': 1.3,
        'sector': 'Technology',
        'pe_ratio': 20.0,
        'pb_ratio': 5.0,
        'dividend_yield': 0.0,
        'market_cap': 1800000000000,
        'volume_base': 20000000
    },
    'TSLA': {
        'base_price': 200.0,
        'volatility': 0.045,
        'beta': 2.0,
        'sector': 'Automotive',
        'pe_ratio': 80.0,
        'pb_ratio': 25.0,
        'dividend_yield': 0.0,
        'market_cap': 800000000000,
        'volume_base': 100000000
    },
    'NVDA': {
        'base_price': 400.0,
        'volatility': 0.035,
        'beta': 1.8,
        'sector': 'Technology',
        'pe_ratio': 60.0,
        'pb_ratio': 35.0,
        'dividend_yield': 0.1,
        'market_cap': 1000000000000,
        'volume_base': 40000000
    },
    'AMZN': {
        'base_price': 3000.0,
        'volatility': 0.030,
        'beta': 1.4,
        'sector': 'Consumer Discretionary',
        'pe_ratio': 40.0,
        'pb_ratio': 8.0,
        'dividend_yield': 0.0,
        'market_cap': 1600000000000,
        'volume_base': 35000000
    },
    'META': {
        'base_price': 200.0,
        'volatility': 0.032,
        'beta': 1.5,
        'sector': 'Technology',
        'pe_ratio': 18.0,
        'pb_ratio': 4.0,
        'dividend_yield': 0.0,
        'market_cap': 900000000000,
        'volume_base': 45000000
    },
    'JPM': {
        'base_price': 140.0,
        'volatility': 0.025,
        'beta': 1.1,
        'sector': 'Financial',
        'pe_ratio': 12.0,
        'pb_ratio': 1.5,
        'dividend_yield': 2.8,
        'market_cap': 400000000000,
        'volume_base': 12000000
    },
    'JNJ': {
        'base_price': 160.0,
        'volatility': 0.020,
        'beta': 0.7,
        'sector': 'Healthcare',
        'pe_ratio': 16.0,
        'pb_ratio': 3.5,
        'dividend_yield': 2.9,
        'market_cap': 380000000000,
        'volume_base': 8000000
    },
    'V': {
        'base_price': 220.0,
        'volatility': 0.022,
        'beta': 0.9,
        'sector': 'Financial',
        'pe_ratio': 28.0,
        'pb_ratio': 12.0,
        'dividend_yield': 0.8,
        'market_cap': 500000000000,
        'volume_base': 10000000
    },
    'PG': {
        'base_price': 150.0,
        'volatility': 0.018,
        'beta': 0.5,
        'sector': 'Consumer Staples',
        'pe_ratio': 24.0,
        'pb_ratio': 4.0,
        'dividend_yield': 2.4,
        'market_cap': 350000000000,
        'volume_base': 8000000
    },
    'UNH': {
        'base_price': 480.0,
        'volatility': 0.025,
        'beta': 0.8,
        'sector': 'Healthcare',
        'pe_ratio': 18.0,
        'pb_ratio': 4.5,
        'dividend_yield': 1.4,
        'market_cap': 450000000000,
        'volume_base': 3000000
    },
    'HD': {
        'base_price': 280.0,
        'volatility': 0.025,
        'beta': 1.0,
        'sector': 'Consumer Discretionary',
        'pe_ratio': 20.0,
        'pb_ratio': 15.0,
        'dividend_yield': 2.6,
        'market_cap': 320000000000,
        'volume_base': 5000000
    },
    'MA': {
        'base_price': 380.0,
        'volatility': 0.025,
        'beta': 1.1,
        'sector': 'Financial',
        'pe_ratio': 35.0,
        'pb_ratio': 20.0,
        'dividend_yield': 0.6,
        'market_cap': 350000000000,
        'volume_base': 6000000
    },
    'DIS': {
        'base_price': 90.0,
        'volatility': 0.035,
        'beta': 1.3,
        'sector': 'Communication Services',
        'pe_ratio': 45.0,
        'pb_ratio': 1.8,
        'dividend_yield': 0.0,
        'market_cap': 160000000000,
        'volume_base': 12000000
    },
    'PYPL': {
        'base_price': 60.0,
        'volatility': 0.040,
        'beta': 1.4,
        'sector': 'Technology',
        'pe_ratio': 15.0,
        'pb_ratio': 3.0,
        'dividend_yield': 0.0,
        'market_cap': 70000000000,
        'volume_base': 15000000
    },
    'NFLX': {
        'base_price': 450.0,
        'volatility': 0.040,
        'beta': 1.6,
        'sector': 'Communication Services',
        'pe_ratio': 35.0,
        'pb_ratio': 8.0,
        'dividend_yield': 0.0,
        'market_cap': 200000000000,
        'volume_base': 5000000
    },
    'CRM': {
        'base_price': 200.0,
        'volatility': 0.030,
        'beta': 1.3,
        'sector': 'Technology',
        'pe_ratio': 45.0,
        'pb_ratio': 3.0,
        'dividend_yield': 0.0,
        'market_cap': 200000000000,
        'volume_base': 8000000
    },
    'ADBE': {
        'base_price': 480.0,
        'volatility': 0.030,
        'beta': 1.2,
        'sector': 'Technology',
        'pe_ratio': 40.0,
        'pb_ratio': 12.0,
        'dividend_yield': 0.0,
        'market_cap': 220000000000,
        'volume_base': 3000000
    }
}

# Portfolio mock data
PORTFOLIO_STOCKS = ['AAPL', 'MSFT', 'SPY', 'JNJ', 'V']
PORTFOLIO_DATA = {
    'AAPL': {'shares': 100, 'avg_price': 145.50, 'current_price': 153.04},
    'MSFT': {'shares': 50, 'avg_price': 295.00, 'current_price': 300.89},
    'SPY': {'shares': 200, 'avg_price': 440.00, 'current_price': 446.80},
    'JNJ': {'shares': 75, 'avg_price': 155.00, 'current_price': 160.00},
    'V': {'shares': 60, 'avg_price': 210.00, 'current_price': 220.00}
}

def generate_realistic_market_data():
    """Generate realistic market data without external API calls"""
    print("🔄 Generating realistic market data...")
    
    for symbol in SYMS:
        base_data = SYMBOL_BASE_DATA.get(symbol, SYMBOL_BASE_DATA['AAPL'])
        
        # Generate realistic price with trend and volatility
        base_price = base_data['base_price']
        volatility = base_data['volatility']
        beta = base_data['beta']
        
        # Add some market trend (slight upward bias)
        market_trend = random.uniform(-0.001, 0.002)
        price_change = random.uniform(-volatility, volatility) + market_trend
        
        current_price = base_price * (1 + price_change)
        prev_price = base_price * (1 + price_change * 0.8)  # Previous price
        change = current_price - prev_price
        change_percent = (change / prev_price) * 100
        
        # Generate realistic volume
        volume = int(base_data['volume_base'] * random.uniform(0.5, 2.0))
        
        # Generate OHLC data
        open_price = prev_price
        high = max(open_price, current_price) * (1 + random.uniform(0, 0.01))
        low = min(open_price, current_price) * (1 - random.uniform(0, 0.01))
        
        # Calculate spread based on price
        spread = current_price * 0.001  # 0.1% spread
        bid = current_price - spread / 2
        ask = current_price + spread / 2
        
        # Store market data
        real_market_data[symbol] = {
            'price': current_price,
            'change': change,
            'change_percent': change_percent,
            'volume': volume,
            'high': high,
            'low': low,
            'open': open_price,
            'bid': bid,
            'ask': ask,
            'market_cap': base_data['market_cap'] * random.uniform(0.95, 1.05),
            'pe_ratio': base_data['pe_ratio'] * random.uniform(0.9, 1.1),
            'pb_ratio': base_data['pb_ratio'] * random.uniform(0.8, 1.2),
            'dividend_yield': base_data['dividend_yield'] * random.uniform(0.8, 1.2),
            'eps': current_price / base_data['pe_ratio'] * random.uniform(0.9, 1.1),
            'beta': beta,
            'volatility': volatility
        }
        
        print(f"✅ Generated data for {symbol}: ${current_price:.2f} ({change_percent:+.2f}%)")

def generate_historical_data_from_real():
    """Generate historical data based on realistic market data"""
    print("📊 Generating historical data...")
    
    for symbol in SYMS:
        if symbol in real_market_data:
            base_price = real_market_data[symbol]['price']
            volatility = real_market_data[symbol]['volatility']
            historical_data[symbol] = {}
            
            # Generate daily data for the last 365 days
            daily_data = []
            current_price = base_price
            current_date = datetime.now() - timedelta(days=365)
            
            for day in range(365):
                # Simulate realistic price movement
                trend = random.uniform(-0.0005, 0.001)  # Slight trend
                daily_volatility = volatility * random.uniform(0.8, 1.2)
                
                open_price = current_price
                high = open_price * (1 + random.uniform(0, daily_volatility))
                low = open_price * (1 - random.uniform(0, daily_volatility))
                close = open_price * (1 + random.uniform(-daily_volatility, daily_volatility) + trend)
                
                high = max(high, open_price, close)
                low = min(low, open_price, close)
                
                volume = int(real_market_data[symbol]['volume'] * random.uniform(0.5, 1.5))
                
                daily_data.append({
                    'time': int(current_date.timestamp()),
                    'open': round(open_price, 2),
                    'high': round(high, 2),
                    'low': round(low, 2),
                    'close': round(close, 2),
                    'volume': volume
                })
                
                current_price = close
                current_date += timedelta(days=1)
            
            historical_data[symbol]['1D'] = daily_data
            
            # Generate hourly data for the last 30 days
            hourly_data = []
            current_date = datetime.now() - timedelta(days=30)
            
            for hour in range(30 * 24):
                open_price = current_price
                hourly_volatility = volatility * 0.1  # Much smaller for hourly
                high = open_price * (1 + random.uniform(0, hourly_volatility))
                low = open_price * (1 - random.uniform(0, hourly_volatility))
                close = open_price * (1 + random.uniform(-hourly_volatility, hourly_volatility))
                
                high = max(high, open_price, close)
                low = min(low, open_price, close)
                
                volume = int(real_market_data[symbol]['volume'] * random.uniform(0.1, 0.3))
                
                hourly_data.append({
                    'time': int(current_date.timestamp()),
                    'open': round(open_price, 2),
                    'high': round(high, 2),
                    'low': round(low, 2),
                    'close': round(close, 2),
                    'volume': volume
                })
                
                current_price = close
                current_date += timedelta(hours=1)
            
            historical_data[symbol]['1H'] = hourly_data

# Current market data
symbol_data: Dict[str, Dict] = {}

def calculate_rsi(prices: List[float], period: int = 14) -> float:
    if len(prices) < period + 1:
        return 50.0
    
    gains = []
    losses = []
    
    for i in range(1, len(prices)):
        change = prices[i] - prices[i-1]
        if change > 0:
            gains.append(change)
            losses.append(0)
        else:
            gains.append(0)
            losses.append(abs(change))
    
    avg_gain = sum(gains[-period:]) / period
    avg_loss = sum(losses[-period:]) / period
    
    if avg_loss == 0:
        return 100.0
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def calculate_macd(prices: List[float]) -> tuple:
    if len(prices) < 26:
        return 0.0, 0.0, 0.0
    
    ema_12 = sum(prices[-12:]) / 12
    ema_26 = sum(prices[-26:]) / 26
    
    macd_line = ema_12 - ema_26
    signal_line = macd_line  # Simplified
    histogram = macd_line - signal_line
    
    return macd_line, signal_line, histogram

def calculate_bollinger_bands(prices: List[float], period: int = 20) -> tuple:
    if len(prices) < period:
        return 0.0, 0.0, 0.0
    
    sma = sum(prices[-period:]) / period
    variance = sum((p - sma) ** 2 for p in prices[-period:]) / period
    std_dev = math.sqrt(variance)
    
    upper = sma + (2 * std_dev)
    lower = sma - (2 * std_dev)
    
    return upper, sma, lower

def calculate_atr(highs: List[float], lows: List[float], closes: List[float], period: int = 14) -> float:
    if len(highs) < period + 1:
        return 1.0
    
    true_ranges = []
    for i in range(1, len(highs)):
        high_low = highs[i] - lows[i]
        high_close = abs(highs[i] - closes[i-1])
        low_close = abs(lows[i] - closes[i-1])
        true_range = max(high_low, high_close, low_close)
        true_ranges.append(true_range)
    
    return sum(true_ranges[-period:]) / period

def generate_fundamental_metrics(symbol: str, price: float) -> FundamentalMetrics:
    if symbol in real_market_data:
        data = real_market_data[symbol]
        return FundamentalMetrics(
            pe_ratio=data.get('pe_ratio', 0),
            pb_ratio=data.get('pb_ratio', 0),
            dividend_yield=data.get('dividend_yield', 0),
            market_cap=data.get('market_cap', 0),
            eps=data.get('eps', 0),
            revenue_growth=random.uniform(-10, 30),
            profit_margin=random.uniform(5, 25),
            debt_to_equity=random.uniform(0.1, 2.0),
            current_ratio=random.uniform(0.5, 3.0),
            roe=random.uniform(5, 25),
            roa=random.uniform(2, 15)
        )
    else:
        # Fallback to generated metrics
        base_pe = random.uniform(15, 30)
        base_pb = random.uniform(1, 5)
        
        return FundamentalMetrics(
            pe_ratio=base_pe + random.uniform(-5, 5),
            pb_ratio=base_pb + random.uniform(-1, 1),
            dividend_yield=random.uniform(0, 4),
            market_cap=price * random.uniform(1e9, 1e12),
            eps=price / base_pe + random.uniform(-2, 2),
            revenue_growth=random.uniform(-10, 30),
            profit_margin=random.uniform(5, 25),
            debt_to_equity=random.uniform(0.1, 2.0),
            current_ratio=random.uniform(0.5, 3.0),
            roe=random.uniform(5, 25),
            roa=random.uniform(2, 15)
        )

def step():
    """Generate market data for all symbols"""
    for symbol in SYMS:
        if symbol not in symbol_data:
            symbol_data[symbol] = {
                'price': real_market_data.get(symbol, {}).get('price', 100.0),
                'volume': 0,
                'high': 0,
                'low': float('inf'),
                'open': 0
            }
        
        data = symbol_data[symbol]
        
        # Update price with realistic movement based on volatility
        if symbol in real_market_data:
            volatility = real_market_data[symbol].get('volatility', 0.02)
            base_volatility = volatility * 0.1  # Smaller for real-time updates
        else:
            base_volatility = 0.005
            
        price_change = random.uniform(-base_volatility, base_volatility)
        new_price = data['price'] * (1 + price_change)
        
        # Update OHLC
        if data['open'] == 0:
            data['open'] = new_price
        data['high'] = max(data['high'], new_price)
        data['low'] = min(data['low'], new_price)
        data['price'] = new_price
        data['volume'] += random.randint(1000, 100000)
        
        # Generate NBBO
        spread = new_price * 0.001  # 0.1% spread
        bid = new_price - spread / 2
        ask = new_price + spread / 2
        
        nbbo = NBBO(
            bid=round(bid, 2),
            ask=round(ask, 2),
            bid_sz=random.randint(100, 10000),
            ask_sz=random.randint(100, 10000)
        )
        
        # Calculate technical indicators
        prices = [data['price']]  # Simplified - in real implementation, use historical prices
        highs = [data['high']]
        lows = [data['low']]
        closes = [data['price']]
        
        technical = TechnicalIndicators(
            rsi=calculate_rsi(prices),
            macd=calculate_macd(prices)[0],
            macd_signal=calculate_macd(prices)[1],
            macd_histogram=calculate_macd(prices)[2],
            sma_20=data['price'] * (1 + random.uniform(-0.05, 0.05)),
            sma_50=data['price'] * (1 + random.uniform(-0.1, 0.1)),
            ema_12=data['price'] * (1 + random.uniform(-0.03, 0.03)),
            ema_26=data['price'] * (1 + random.uniform(-0.05, 0.05)),
            bollinger_upper=calculate_bollinger_bands(prices)[0],
            bollinger_middle=calculate_bollinger_bands(prices)[1],
            bollinger_lower=calculate_bollinger_bands(prices)[2],
            atr=calculate_atr(highs, lows, closes),
            volume_sma=data['volume'] * (1 + random.uniform(-0.2, 0.2))
        )
        
        # Generate fundamental metrics
        fundamental = generate_fundamental_metrics(symbol, data['price'])
        
        # Create market data object
        market_data = MarketData(
            symbol=symbol,
            price=round(data['price'], 2),
            change=round(data['price'] - data['open'], 2),
            change_percent=round(((data['price'] - data['open']) / data['open']) * 100, 2),
            volume=data['volume'],
            high=round(data['high'], 2),
            low=round(data['low'], 2),
            open=round(data['open'], 2),
            nbbo=nbbo,
            technical=technical,
            fundamental=fundamental
        )
        
        symbol_data[symbol] = data
        symbol_data[symbol]['market_data'] = market_data

# Initialize data on startup
print("🚀 Starting Market Data Service...")
generate_realistic_market_data()
generate_historical_data_from_real()
print("✅ Market data initialization complete!")

# WebSocket endpoint for real-time market data
@app.websocket("/ws/nbbo")
async def ws_nbbo(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            step()
            for symbol in SYMS:
                if symbol in symbol_data and 'market_data' in symbol_data[symbol]:
                    await websocket.send_text(json.dumps({
                        "type": "market_data",
                        "symbol": symbol,
                        "data": symbol_data[symbol]['market_data'].model_dump()
                    }))
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# REST API endpoints
@app.get("/market-data/{symbol}")
async def get_market_data(symbol: str):
    if symbol not in symbol_data or 'market_data' not in symbol_data[symbol]:
        return {"error": "Symbol not found"}
    return symbol_data[symbol]['market_data']

@app.get("/technical-indicators")
async def get_technical_indicators(symbol: str):
    if symbol not in symbol_data or 'market_data' not in symbol_data[symbol]:
        return {"error": "Symbol not found"}
    return symbol_data[symbol]['market_data'].technical

@app.get("/fundamental-metrics")
async def get_fundamental_metrics(symbol: str):
    if symbol not in symbol_data or 'market_data' not in symbol_data[symbol]:
        return {"error": "Symbol not found"}
    return symbol_data[symbol]['market_data'].fundamental

@app.get("/historical-data/{symbol}")
async def get_historical_data(symbol: str, timeframe: str = "1D", limit: int = 100):
    """Get historical data for a symbol"""
    if symbol not in historical_data:
        return {"error": "Symbol not found"}
    
    if timeframe not in historical_data[symbol]:
        return {"error": "Timeframe not supported"}
    
    data = historical_data[symbol][timeframe]
    return {
        "symbol": symbol,
        "timeframe": timeframe,
        "data": data[-limit:] if limit > 0 else data
    }

@app.get("/scanner/technical")
async def technical_scanner():
    """Technical analysis scanner"""
    scanner_results = []
    
    for symbol in SYMS:
        if symbol in symbol_data and 'market_data' in symbol_data[symbol]:
            data = symbol_data[symbol]['market_data']
            technical = data.technical
            
            signals = []
            
            # RSI signals
            if technical.rsi < 30:
                signals.append("Oversold")
            elif technical.rsi > 70:
                signals.append("Overbought")
            
            # MACD signals
            if technical.macd_histogram > 0:
                signals.append("MACD Bullish")
            else:
                signals.append("MACD Bearish")
            
            # Moving average signals
            if technical.sma_20 > technical.sma_50:
                signals.append("Golden Cross")
            else:
                signals.append("Death Cross")
            
            scanner_results.append({
                "symbol": symbol,
                "price": data.price,
                "change_percent": data.change_percent,
                "technical": technical.model_dump(),
                "signals": signals
            })
    
    return {"scanner_results": scanner_results}

@app.get("/scanner/fundamental")
async def fundamental_scanner():
    """Fundamental analysis scanner"""
    scanner_results = []
    
    for symbol in SYMS:
        if symbol in symbol_data and 'market_data' in symbol_data[symbol]:
            data = symbol_data[symbol]['market_data']
            fundamental = data.fundamental
            
            signals = []
            
            # P/E ratio signals
            if fundamental.pe_ratio < 15:
                signals.append("Low P/E")
            elif fundamental.pe_ratio > 50:
                signals.append("High P/E")
            
            # Dividend yield signals
            if fundamental.dividend_yield > 3:
                signals.append("High Dividend")
            
            # Growth signals
            if fundamental.revenue_growth > 20:
                signals.append("High Growth")
            
            scanner_results.append({
                "symbol": symbol,
                "price": data.price,
                "market_cap": fundamental.market_cap,
                "fundamental": fundamental.model_dump(),
                "signals": signals
            })
    
    return {"scanner_results": scanner_results}

@app.get("/scanner/advanced")
async def advanced_scanner(
    min_price: float = 0,
    max_price: float = 10000,
    min_volume: int = 0,
    min_market_cap: float = 0,
    max_market_cap: float = float('inf'),
    min_pe: float = 0,
    max_pe: float = float('inf'),
    min_dividend_yield: float = 0,
    max_dividend_yield: float = float('inf'),
    min_beta: float = 0,
    max_beta: float = float('inf'),
    sectors: str = "",
    min_rsi: float = 0,
    max_rsi: float = 100,
    min_macd: float = float('-inf'),
    max_macd: float = float('inf'),
    price_change_min: float = float('-inf'),
    price_change_max: float = float('inf'),
    volatility_min: float = 0,
    volatility_max: float = float('inf')
):
    """Advanced scanner with multiple filtering criteria (ThinkOrSwim style)"""
    scanner_results = []
    sector_list = [s.strip() for s in sectors.split(",")] if sectors else []
    
    for symbol in SYMS:
        if symbol not in symbol_data or 'market_data' not in symbol_data[symbol]:
            continue
            
        data = symbol_data[symbol]['market_data']
        technical = data.technical
        fundamental = data.fundamental
        
        # Get base data for additional filtering
        base_data = SYMBOL_BASE_DATA.get(symbol, {})
        sector = base_data.get('sector', 'Unknown')
        beta = base_data.get('beta', 1.0)
        volatility = base_data.get('volatility', 0.02)
        
        # Apply filters
        if not (min_price <= data.price <= max_price):
            continue
        if not (min_volume <= data.volume):
            continue
        if not (min_market_cap <= fundamental.market_cap <= max_market_cap):
            continue
        if not (min_pe <= fundamental.pe_ratio <= max_pe):
            continue
        if not (min_dividend_yield <= fundamental.dividend_yield <= max_dividend_yield):
            continue
        if not (min_beta <= beta <= max_beta):
            continue
        if sector_list and sector not in sector_list:
            continue
        if not (min_rsi <= technical.rsi <= max_rsi):
            continue
        if not (min_macd <= technical.macd <= max_macd):
            continue
        if not (price_change_min <= data.change_percent <= price_change_max):
            continue
        if not (volatility_min <= volatility <= volatility_max):
            continue
        
        # Generate signals
        signals = []
        
        # Technical signals
        if technical.rsi < 30:
            signals.append("Oversold")
        elif technical.rsi > 70:
            signals.append("Overbought")
        
        if technical.macd_histogram > 0:
            signals.append("MACD Bullish")
        else:
            signals.append("MACD Bearish")
        
        if technical.sma_20 > technical.sma_50:
            signals.append("Golden Cross")
        else:
            signals.append("Death Cross")
        
        # Fundamental signals
        if fundamental.pe_ratio < 15:
            signals.append("Value Stock")
        elif fundamental.pe_ratio > 50:
            signals.append("Growth Stock")
        
        if fundamental.dividend_yield > 3:
            signals.append("High Dividend")
        
        if fundamental.revenue_growth > 20:
            signals.append("High Growth")
        
        # Volatility signals
        if volatility > 0.04:
            signals.append("High Volatility")
        elif volatility < 0.015:
            signals.append("Low Volatility")
        
        scanner_results.append({
            "symbol": symbol,
            "price": data.price,
            "change_percent": data.change_percent,
            "volume": data.volume,
            "market_cap": fundamental.market_cap,
            "sector": sector,
            "pe_ratio": fundamental.pe_ratio,
            "dividend_yield": fundamental.dividend_yield,
            "beta": beta,
            "volatility": volatility,
            "rsi": technical.rsi,
            "macd": technical.macd,
            "sma_20": technical.sma_20,
            "sma_50": technical.sma_50,
            "signals": signals,
            "technical": technical.model_dump(),
            "fundamental": fundamental.model_dump()
        })
    
    # Sort by market cap (largest first)
    scanner_results.sort(key=lambda x: x['market_cap'], reverse=True)
    
    return {
        "scanner_results": scanner_results,
        "total_found": len(scanner_results),
        "filters_applied": {
            "price_range": f"${min_price} - ${max_price}",
            "volume_min": min_volume,
            "market_cap_range": f"${min_market_cap:,.0f} - ${max_market_cap:,.0f}",
            "pe_range": f"{min_pe} - {max_pe}",
            "dividend_range": f"{min_dividend_yield}% - {max_dividend_yield}%",
            "beta_range": f"{min_beta} - {max_beta}",
            "sectors": sector_list,
            "rsi_range": f"{min_rsi} - {max_rsi}",
            "price_change_range": f"{price_change_min}% - {price_change_max}%"
        }
    }

@app.get("/scanner/presets")
async def scanner_presets():
    """Predefined scanner presets similar to ThinkOrSwim"""
    return {
        "presets": {
            "high_volume": {
                "name": "High Volume",
                "description": "Stocks with high trading volume",
                "filters": {
                    "min_volume": 10000000,
                    "min_market_cap": 1000000000
                }
            },
            "value_stocks": {
                "name": "Value Stocks",
                "description": "Stocks with low P/E ratios",
                "filters": {
                    "max_pe": 15,
                    "min_market_cap": 1000000000,
                    "min_volume": 1000000
                }
            },
            "growth_stocks": {
                "name": "Growth Stocks",
                "description": "Stocks with high P/E ratios",
                "filters": {
                    "min_pe": 25,
                    "min_market_cap": 1000000000,
                    "min_volume": 1000000
                }
            },
            "dividend_stocks": {
                "name": "Dividend Stocks",
                "description": "Stocks with high dividend yields",
                "filters": {
                    "min_dividend_yield": 3.0,
                    "min_market_cap": 1000000000,
                    "min_volume": 1000000
                }
            },
            "oversold": {
                "name": "Oversold",
                "description": "Stocks with RSI below 30",
                "filters": {
                    "max_rsi": 30,
                    "min_market_cap": 1000000000,
                    "min_volume": 1000000
                }
            },
            "overbought": {
                "name": "Overbought",
                "description": "Stocks with RSI above 70",
                "filters": {
                    "min_rsi": 70,
                    "min_market_cap": 1000000000,
                    "min_volume": 1000000
                }
            },
            "high_volatility": {
                "name": "High Volatility",
                "description": "Stocks with high volatility",
                "filters": {
                    "volatility_min": 0.03,
                    "min_market_cap": 1000000000,
                    "min_volume": 1000000
                }
            },
            "low_volatility": {
                "name": "Low Volatility",
                "description": "Stocks with low volatility",
                "filters": {
                    "volatility_max": 0.02,
                    "min_market_cap": 1000000000,
                    "min_volume": 1000000
                }
            },
            "technology": {
                "name": "Technology Sector",
                "description": "Technology sector stocks",
                "filters": {
                    "sectors": "Technology",
                    "min_market_cap": 1000000000,
                    "min_volume": 1000000
                }
            },
            "financial": {
                "name": "Financial Sector",
                "description": "Financial sector stocks",
                "filters": {
                    "sectors": "Financial",
                    "min_market_cap": 1000000000,
                    "min_volume": 1000000
                }
            },
            "healthcare": {
                "name": "Healthcare Sector",
                "description": "Healthcare sector stocks",
                "filters": {
                    "sectors": "Healthcare",
                    "min_market_cap": 1000000000,
                    "min_volume": 1000000
                }
            }
        }
    }

@app.get("/portfolio")
async def get_portfolio():
    """Get portfolio data with mock positions"""
    portfolio = []
    total_value = 0
    total_cost = 0
    total_pnl = 0
    
    for symbol in PORTFOLIO_STOCKS:
        if symbol in PORTFOLIO_DATA and symbol in real_market_data:
            position = PORTFOLIO_DATA[symbol]
            current_price = real_market_data[symbol]['price']
            
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
                "sector": SYMBOL_BASE_DATA.get(symbol, {}).get('sector', 'Unknown'),
                "change_today": real_market_data[symbol].get('change_percent', 0)
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

@app.get("/portfolio/performance")
async def get_portfolio_performance():
    """Get portfolio performance metrics"""
    portfolio_data = await get_portfolio()
    portfolio = portfolio_data["portfolio"]
    
    if not portfolio:
        return {"error": "No portfolio data available"}
    
    # Calculate performance metrics
    total_value = portfolio_data["summary"]["total_value"]
    total_cost = portfolio_data["summary"]["total_cost"]
    total_pnl = portfolio_data["summary"]["total_pnl"]
    
    # Sector allocation
    sector_allocation = {}
    for position in portfolio:
        sector = position["sector"]
        if sector not in sector_allocation:
            sector_allocation[sector] = 0
        sector_allocation[sector] += position["market_value"]
    
    # Convert to percentages
    for sector in sector_allocation:
        sector_allocation[sector] = (sector_allocation[sector] / total_value) * 100
    
    # Top performers and losers
    sorted_portfolio = sorted(portfolio, key=lambda x: x["pnl_percent"], reverse=True)
    top_performers = sorted_portfolio[:3]
    worst_performers = sorted_portfolio[-3:]
    
    return {
        "performance_metrics": {
            "total_return": total_pnl,
            "total_return_percent": (total_pnl / total_cost) * 100 if total_cost > 0 else 0,
            "portfolio_value": total_value,
            "cost_basis": total_cost
        },
        "sector_allocation": sector_allocation,
        "top_performers": top_performers,
        "worst_performers": worst_performers,
        "risk_metrics": {
            "beta": 1.1,  # Mock weighted average beta
            "volatility": 0.18,  # Mock portfolio volatility
            "sharpe_ratio": 1.2,  # Mock Sharpe ratio
            "max_drawdown": -0.08  # Mock max drawdown
        }
    }

@app.get("/help/technical")
async def technical_help():
    """Technical analysis help content"""
    return {
        "indicators": {
            "RSI": {
                "description": "Relative Strength Index measures momentum on a scale of 0 to 100.",
                "interpretation": {
                    "oversold": "RSI below 30 indicates oversold conditions, potential buy signal",
                    "overbought": "RSI above 70 indicates overbought conditions, potential sell signal",
                    "neutral": "RSI between 30-70 indicates neutral momentum"
                }
            },
            "MACD": {
                "description": "Moving Average Convergence Divergence shows relationship between two moving averages.",
                "interpretation": {
                    "bullish": "MACD line above signal line indicates bullish momentum",
                    "bearish": "MACD line below signal line indicates bearish momentum",
                    "crossover": "MACD crossing signal line can indicate trend changes"
                }
            },
            "SMA": {
                "description": "Simple Moving Average smooths price data over a specified period.",
                "interpretation": {
                    "trend": "Price above SMA indicates uptrend, below indicates downtrend",
                    "support": "SMA can act as support/resistance levels",
                    "crossover": "Short-term SMA crossing long-term SMA indicates trend changes"
                }
            },
            "Bollinger Bands": {
                "description": "Volatility bands placed above and below a moving average.",
                "interpretation": {
                    "squeeze": "Narrowing bands indicate low volatility, potential breakout",
                    "expansion": "Widening bands indicate high volatility",
                    "bounce": "Price bouncing off bands can indicate support/resistance"
                }
            }
        }
    }

@app.get("/help/fundamental")
async def fundamental_help():
    """Fundamental analysis help content"""
    return {
        "metrics": {
            "valuation": {
                "P/E Ratio": {
                    "description": "Price-to-Earnings ratio compares stock price to earnings per share.",
                    "interpretation": {
                        "low": "P/E below 15 may indicate undervalued stock",
                        "high": "P/E above 50 may indicate overvalued stock",
                        "industry": "Compare to industry average for context"
                    }
                },
                "P/B Ratio": {
                    "description": "Price-to-Book ratio compares stock price to book value per share.",
                    "interpretation": {
                        "value": "P/B below 1 may indicate value stock",
                        "growth": "P/B above 3 may indicate growth stock",
                        "asset": "Useful for asset-heavy companies"
                    }
                }
            },
            "profitability": {
                "ROE": {
                    "description": "Return on Equity measures profitability relative to shareholder equity.",
                    "interpretation": {
                        "good": "ROE above 15% indicates strong profitability",
                        "poor": "ROE below 10% may indicate poor management",
                        "industry": "Compare to industry average"
                    }
                },
                "Profit Margin": {
                    "description": "Net profit margin shows percentage of revenue as profit.",
                    "interpretation": {
                        "high": "Margin above 20% indicates strong profitability",
                        "low": "Margin below 5% may indicate pricing pressure",
                        "trend": "Improving margins indicate operational efficiency"
                    }
                }
            },
            "growth": {
                "Revenue Growth": {
                    "description": "Annual percentage increase in company revenue.",
                    "interpretation": {
                        "strong": "Growth above 20% indicates strong business",
                        "moderate": "Growth 10-20% indicates steady expansion",
                        "declining": "Negative growth may indicate business problems"
                    }
                },
                "EPS Growth": {
                    "description": "Annual percentage increase in earnings per share.",
                    "interpretation": {
                        "consistent": "Consistent EPS growth indicates strong business",
                        "volatile": "Volatile EPS may indicate business uncertainty",
                        "declining": "Declining EPS may indicate operational issues"
                    }
                }
            }
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
