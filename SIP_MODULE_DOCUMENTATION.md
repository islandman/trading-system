# SIP (Securities Information Processor) Module Documentation

## Table of Contents
1. [Business Model Overview](#business-model-overview)
2. [Software Architecture](#software-architecture)
3. [Data Models](#data-models)
4. [API Endpoints](#api-endpoints)
5. [Market Data Generation](#market-data-generation)
6. [Technical Indicators](#technical-indicators)
7. [Scanner System](#scanner-system)
8. [Portfolio Management](#portfolio-management)
9. [Deployment & Configuration](#deployment--configuration)
10. [Integration Guide](#integration-guide)

---

## Business Model Overview

### What is SIP?
The **Securities Information Processor (SIP)** is a market data service that simulates real-time financial market data for trading applications. In the real financial world, SIPs are centralized systems that consolidate and disseminate market data from multiple exchanges.

### Business Purpose
1. **Market Data Provision**: Provides real-time price feeds, volume data, and market metrics
2. **Trading Platform Support**: Enables trading applications to function with realistic market data
3. **Educational Tool**: Allows users to practice trading without real money
4. **Development Environment**: Provides consistent data for application development and testing

### Key Business Functions
- **Real-time Data Streaming**: WebSocket-based live market data
- **Historical Data Access**: Time-series data for analysis
- **Technical Analysis**: Pre-calculated indicators and metrics
- **Fundamental Analysis**: Financial ratios and company metrics
- **Market Scanning**: Filtering and screening capabilities
- **Portfolio Tracking**: Position management and performance metrics

### Revenue Model (Real-world SIP)
- **Data Licensing**: Charging fees for market data access
- **Tiered Pricing**: Different levels based on data depth and speed
- **Enterprise Solutions**: Custom feeds for institutional clients
- **API Access**: Per-call or subscription-based pricing

---

## Software Architecture

### Technology Stack
```yaml
Backend Framework: FastAPI (Python)
WebSocket Support: WebSockets
Data Models: Pydantic
Containerization: Docker
Deployment: Docker Compose
Port: 8002
```

### Component Structure
```
SIP Module/
├── app/
│   └── main.py          # Main application logic
├── Dockerfile           # Container configuration
├── requirements.txt     # Python dependencies
└── README.md           # Module documentation
```

### Core Components

#### 1. Connection Manager
```python
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
```
- **Purpose**: Manages WebSocket connections for real-time data
- **Features**: Connection tracking, broadcast messaging, error handling

#### 2. Market Data Engine
```python
def step():
    """Generate market data for all symbols"""
```
- **Purpose**: Core data generation and update logic
- **Features**: Realistic price movements, OHLC data, volume simulation

#### 3. Data Models
- **MarketData**: Complete market information
- **NBBO**: National Best Bid and Offer
- **TechnicalIndicators**: Calculated technical metrics
- **FundamentalMetrics**: Financial ratios and metrics

### Data Flow Architecture
```
Market Data Generation → Data Models → API Endpoints → Client Applications
                    ↓
            WebSocket Broadcasting
                    ↓
            Real-time Updates
```

---

## Data Models

### Market Data Structure
```python
class MarketData(BaseModel):
    symbol: str                    # Stock symbol (e.g., AAPL)
    price: float                   # Current price
    change: float                  # Price change from open
    change_percent: float          # Percentage change
    volume: int                    # Trading volume
    high: float                    # Day's high
    low: float                     # Day's low
    open: float                    # Opening price
    nbbo: NBBO                     # Bid/Ask data
    technical: TechnicalIndicators # Technical analysis
    fundamental: FundamentalMetrics # Financial metrics
```

### NBBO (National Best Bid and Offer)
```python
class NBBO(BaseModel):
    bid: float      # Best bid price
    ask: float      # Best ask price
    bid_sz: int     # Bid size (shares)
    ask_sz: int     # Ask size (shares)
```

### Technical Indicators
```python
class TechnicalIndicators(BaseModel):
    rsi: float              # Relative Strength Index
    macd: float            # MACD line
    macd_signal: float     # MACD signal line
    macd_histogram: float  # MACD histogram
    sma_20: float          # 20-day Simple Moving Average
    sma_50: float          # 50-day Simple Moving Average
    ema_12: float          # 12-day Exponential Moving Average
    ema_26: float          # 26-day Exponential Moving Average
    bollinger_upper: float # Bollinger Bands upper
    bollinger_middle: float # Bollinger Bands middle
    bollinger_lower: float # Bollinger Bands lower
    atr: float             # Average True Range
    volume_sma: float      # Volume Simple Moving Average
```

### Fundamental Metrics
```python
class FundamentalMetrics(BaseModel):
    pe_ratio: float        # Price-to-Earnings ratio
    pb_ratio: float        # Price-to-Book ratio
    dividend_yield: float  # Dividend yield percentage
    market_cap: float      # Market capitalization
    eps: float            # Earnings per share
    revenue_growth: float  # Revenue growth percentage
    profit_margin: float   # Profit margin percentage
    debt_to_equity: float  # Debt-to-equity ratio
    current_ratio: float   # Current ratio
    roe: float            # Return on equity
    roa: float            # Return on assets
```

---

## API Endpoints

### Real-time Data
```http
GET /market-data/{symbol}
WebSocket /ws/nbbo
```

### Historical Data
```http
GET /historical-data/{symbol}?timeframe=1D&limit=100
```

### Technical Analysis
```http
GET /technical-indicators?symbol={symbol}
```

### Fundamental Analysis
```http
GET /fundamental-metrics?symbol={symbol}
```

### Market Scanners
```http
GET /scanner/technical
GET /scanner/fundamental
GET /scanner/advanced
GET /scanner/presets
```

### Portfolio Management
```http
GET /portfolio
GET /portfolio/performance
```

### Help & Documentation
```http
GET /help/technical
GET /help/fundamental
```

---

## Market Data Generation

### Symbol Coverage
The SIP module covers **60 major stocks** including:
- **Technology**: AAPL, MSFT, GOOGL, TSLA, NVDA, AMZN, META
- **Financial**: JPM, V, MA
- **Healthcare**: JNJ, UNH
- **Consumer**: PG, HD, DIS
- **ETF**: SPY

### Realistic Data Generation
```python
def generate_realistic_market_data():
    """Generate realistic market data without external API calls"""
```

#### Price Movement Algorithm
1. **Base Price**: Each symbol has a realistic base price
2. **Volatility**: Symbol-specific volatility parameters
3. **Market Trend**: Slight upward bias with random fluctuations
4. **Volume Simulation**: Realistic trading volume patterns
5. **OHLC Generation**: Open, High, Low, Close calculations

#### Example Price Generation
```python
# For AAPL
base_price = 150.0
volatility = 0.025  # 2.5% volatility
market_trend = random.uniform(-0.001, 0.002)
price_change = random.uniform(-volatility, volatility) + market_trend
current_price = base_price * (1 + price_change)
```

### Data Update Frequency
- **Real-time Updates**: Every 1 second via WebSocket
- **REST API**: On-demand data retrieval
- **Historical Data**: Pre-generated for 365 days

---

## Technical Indicators

### RSI (Relative Strength Index)
```python
def calculate_rsi(prices: List[float], period: int = 14) -> float:
    # Calculates RSI using 14-period default
    # Returns value between 0-100
```

**Business Logic**:
- **Oversold**: RSI < 30 (potential buy signal)
- **Overbought**: RSI > 70 (potential sell signal)
- **Neutral**: RSI 30-70 (no clear signal)

### MACD (Moving Average Convergence Divergence)
```python
def calculate_macd(prices: List[float]) -> tuple:
    # Returns (macd_line, signal_line, histogram)
```

**Business Logic**:
- **Bullish**: MACD line above signal line
- **Bearish**: MACD line below signal line
- **Crossover**: Potential trend change signal

### Bollinger Bands
```python
def calculate_bollinger_bands(prices: List[float], period: int = 20) -> tuple:
    # Returns (upper_band, middle_band, lower_band)
```

**Business Logic**:
- **Squeeze**: Narrowing bands indicate low volatility
- **Expansion**: Widening bands indicate high volatility
- **Bounce**: Price bouncing off bands for support/resistance

### Moving Averages
- **SMA 20**: 20-day Simple Moving Average
- **SMA 50**: 50-day Simple Moving Average
- **EMA 12**: 12-day Exponential Moving Average
- **EMA 26**: 26-day Exponential Moving Average

---

## Scanner System

### Technical Scanner
```http
GET /scanner/technical
```

**Scans for**:
- RSI oversold/overbought conditions
- MACD bullish/bearish signals
- Moving average crossovers (Golden Cross/Death Cross)

### Fundamental Scanner
```http
GET /scanner/fundamental
```

**Scans for**:
- Low/High P/E ratios
- High dividend yields
- High growth stocks

### Advanced Scanner
```http
GET /scanner/advanced?min_price=10&max_price=100&min_volume=1000000
```

**Filtering Options**:
- **Price Range**: Minimum and maximum price
- **Volume**: Minimum trading volume
- **Market Cap**: Market capitalization range
- **P/E Ratio**: Price-to-earnings ratio range
- **Dividend Yield**: Dividend yield range
- **Beta**: Volatility relative to market
- **Sector**: Industry sector filtering
- **Technical**: RSI, MACD, moving average conditions

### Scanner Presets
```http
GET /scanner/presets
```

**Available Presets**:
- **High Volume**: Stocks with high trading volume
- **Value Stocks**: Low P/E ratio stocks
- **Growth Stocks**: High P/E ratio stocks
- **Dividend Stocks**: High dividend yield stocks
- **Oversold**: RSI below 30
- **Overbought**: RSI above 70
- **High Volatility**: High volatility stocks
- **Low Volatility**: Low volatility stocks
- **Sector-specific**: Technology, Financial, Healthcare

---

## Portfolio Management

### Portfolio Data Structure
```python
PORTFOLIO_STOCKS = ['AAPL', 'MSFT', 'SPY', 'JNJ', 'V']
PORTFOLIO_DATA = {
    'AAPL': {
        'shares': 100,
        'avg_price': 145.50,
        'current_price': 153.04
    }
}
```

### Portfolio Endpoints

#### Get Portfolio
```http
GET /portfolio
```

**Returns**:
- Individual position data
- Total portfolio value
- Unrealized P&L
- Cost basis
- Performance metrics

#### Portfolio Performance
```http
GET /portfolio/performance
```

**Returns**:
- Total return and percentage
- Sector allocation
- Top/worst performers
- Risk metrics (Beta, Volatility, Sharpe Ratio)

### Performance Metrics
- **Total Return**: Absolute dollar gain/loss
- **Total Return %**: Percentage gain/loss
- **Sector Allocation**: Portfolio diversification
- **Risk Metrics**: Beta, volatility, Sharpe ratio
- **Drawdown**: Maximum historical loss

---

## Deployment & Configuration

### Docker Configuration
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
ENV PYTHONUNBUFFERED=1
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002", "--reload"]
```

### Dependencies
```txt
fastapi==0.104.1
uvicorn==0.24.0
websockets==12.0
pydantic==2.5.0
```

### Environment Variables
```bash
PYTHONUNBUFFERED=1
PORT=8002
HOST=0.0.0.0
```

### Docker Compose Integration
```yaml
sip:
  build: ./sip
  ports:
    - "8002:8002"
  environment:
    - PYTHONUNBUFFERED=1
  volumes:
    - ./sip:/app
```

---

## Integration Guide

### Frontend Integration

#### WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:8002/ws/nbbo');

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.type === 'market_data') {
        updateMarketData(data.symbol, data.data);
    }
};
```

#### REST API Integration
```javascript
// Get market data
const response = await fetch('/market-data/AAPL');
const marketData = await response.json();

// Get historical data
const historical = await fetch('/historical-data/AAPL?timeframe=1D&limit=100');
const history = await historical.json();

// Use scanner
const scanner = await fetch('/scanner/advanced?min_price=10&max_price=100');
const results = await scanner.json();
```

### Backend Integration

#### Python Client
```python
import requests
import websockets
import json

# REST API
response = requests.get('http://localhost:8002/market-data/AAPL')
market_data = response.json()

# WebSocket
async def connect_websocket():
    async with websockets.connect('ws://localhost:8002/ws/nbbo') as websocket:
        async for message in websocket:
            data = json.loads(message)
            process_market_data(data)
```

#### Node.js Client
```javascript
const WebSocket = require('ws');
const axios = require('axios');

// REST API
const marketData = await axios.get('http://localhost:8002/market-data/AAPL');

// WebSocket
const ws = new WebSocket('ws://localhost:8002/ws/nbbo');
ws.on('message', (data) => {
    const marketData = JSON.parse(data);
    processMarketData(marketData);
});
```

### Error Handling
```python
# Handle missing symbols
if symbol not in symbol_data:
    return {"error": "Symbol not found"}

# Handle WebSocket disconnections
try:
    await websocket.send_text(message)
except:
    manager.disconnect(websocket)
```

---

## Business Use Cases

### 1. Trading Platform Development
- **Real-time Data**: Live price feeds for trading applications
- **Historical Analysis**: Backtesting and strategy development
- **Technical Analysis**: Pre-calculated indicators for decision making

### 2. Educational Trading
- **Paper Trading**: Risk-free trading practice
- **Strategy Testing**: Test trading strategies without real money
- **Market Simulation**: Realistic market conditions for learning

### 3. Financial Research
- **Market Analysis**: Comprehensive market data for research
- **Screening**: Find stocks meeting specific criteria
- **Portfolio Analysis**: Track and analyze portfolio performance

### 4. Application Testing
- **Development**: Consistent data for application development
- **Testing**: Reliable test data for quality assurance
- **Demo**: Showcase applications with realistic market data

---

## Performance Considerations

### Data Generation Optimization
- **Efficient Algorithms**: Optimized price generation algorithms
- **Memory Management**: Efficient data structures for large datasets
- **Caching**: Cache frequently accessed data

### Scalability
- **Horizontal Scaling**: Multiple SIP instances for high load
- **Load Balancing**: Distribute requests across instances
- **Database Integration**: Persistent storage for historical data

### Monitoring
- **Health Checks**: Monitor service availability
- **Performance Metrics**: Track response times and throughput
- **Error Logging**: Comprehensive error tracking and reporting

---

## Future Enhancements

### Planned Features
1. **Real Market Data Integration**: Connect to live market data feeds
2. **Advanced Analytics**: Machine learning-based price predictions
3. **Options Data**: Support for options chains and Greeks
4. **Cryptocurrency**: Add cryptocurrency market data
5. **International Markets**: Support for global markets
6. **News Integration**: Real-time news and sentiment analysis
7. **Social Trading**: Social features and sentiment indicators
8. **Advanced Risk Metrics**: VaR, Sharpe ratio, and other risk measures

### Technical Improvements
1. **Database Integration**: Persistent storage with PostgreSQL/MongoDB
2. **Caching Layer**: Redis for improved performance
3. **Message Queue**: RabbitMQ/Kafka for high-throughput data
4. **Microservices**: Break down into smaller, focused services
5. **API Versioning**: Support for multiple API versions
6. **Rate Limiting**: Implement request rate limiting
7. **Authentication**: Add API key authentication
8. **Documentation**: Interactive API documentation with Swagger

---

*This documentation covers the complete SIP module implementation. For technical support or feature requests, refer to the development team.*
