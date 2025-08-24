# Technical Documentation: Enhanced Stock Market Simulator

## 🎯 **Project Overview**

### **Purpose**
Create a comprehensive stock market simulator with technical and fundamental analysis capabilities to serve as an educational platform for learning stock investing, trading, and market analysis.

### **Target Users**
- Beginner to intermediate stock market learners
- Individuals wanting to practice trading without financial risk
- Students studying financial markets and technical analysis
- Traders looking to test strategies in a simulated environment

---

## 🏗️ **System Architecture**

### **Microservices Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Frontend   │    │   Broker API    │    │   Exchange      │
│   (React/Vite)  │◄──►│   (FastAPI)     │◄──►│   (Go)          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Market Data   │    │   WebSocket     │    │   Order         │
│   (SIP)         │    │   Manager       │    │   Processing    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Technology Stack**
- **Frontend**: React 18, Vite, CSS-in-JS
- **Backend**: FastAPI (Python), Go
- **Real-time**: WebSocket connections
- **Data**: In-memory simulation with realistic market data
- **Deployment**: Docker containers with docker-compose

---

## 📊 **Data Models & Structures**

### **Market Data Model**
```python
class MarketData(BaseModel):
    symbol: str
    price: float
    change: float
    change_percent: float
    volume: int
    avg_volume: int
    high: float
    low: float
    open: float
    previous_close: float
    nbbo: NBBO
    technical: TechnicalIndicators
    fundamental: FundamentalMetrics
    ts: float
```

### **Technical Indicators Model**
```python
class TechnicalIndicators(BaseModel):
    rsi: float                    # Relative Strength Index
    macd: float                   # MACD line
    macd_signal: float            # MACD signal line
    macd_histogram: float         # MACD histogram
    sma_20: float                 # 20-period Simple Moving Average
    sma_50: float                 # 50-period Simple Moving Average
    ema_12: float                 # 12-period Exponential Moving Average
    ema_26: float                 # 26-period Exponential Moving Average
    bollinger_upper: float        # Upper Bollinger Band
    bollinger_middle: float       # Middle Bollinger Band (SMA)
    bollinger_lower: float        # Lower Bollinger Band
    volume_sma: float             # Volume Simple Moving Average
    atr: float                    # Average True Range
```

### **Fundamental Metrics Model**
```python
class FundamentalMetrics(BaseModel):
    pe_ratio: float               # Price-to-Earnings Ratio
    pb_ratio: float               # Price-to-Book Ratio
    dividend_yield: float         # Dividend Yield Percentage
    market_cap: float             # Market Capitalization
    eps: float                    # Earnings Per Share
    revenue_growth: float         # Revenue Growth Percentage
    profit_margin: float          # Profit Margin Percentage
    debt_to_equity: float         # Debt-to-Equity Ratio
    current_ratio: float          # Current Ratio
    roe: float                    # Return on Equity
    roa: float                    # Return on Assets
```

### **Order Management Model**
```python
class OrderOut(BaseModel):
    id: str
    symbol: str
    side: Side                    # BUY/SELL
    order_type: OrderType         # MARKET/LIMIT
    qty: int
    limit_price: Optional[float]
    status: Status                # NEW/PARTIAL/FILLED/REJECTED/CANCELED
    filled_qty: int
    leaves_qty: int
    avg_price: Optional[float]
    message: Optional[str]
    created_at: float
```

---

## 🔧 **Core Components**

### **1. Market Data Simulator (SIP)**
**File**: `sip/app/main.py`

#### **Features**
- Real-time price generation using random walk algorithm
- Technical indicator calculations (RSI, MACD, Bollinger Bands, etc.)
- Fundamental metrics generation with sector-specific characteristics
- WebSocket streaming for real-time updates
- Scanner endpoints for technical and fundamental analysis

#### **Key Functions**
```python
def calculate_rsi(prices: List[float], period: int = 14) -> float
def calculate_macd(prices: List[float]) -> tuple
def calculate_bollinger_bands(prices: List[float], period: int = 20) -> tuple
def calculate_atr(prices: List[float], period: int = 14) -> float
def generate_fundamental_metrics(symbol: str) -> FundamentalMetrics
def step(sym: str) -> MarketData
```

#### **API Endpoints**
- `GET /nbbo?symbol={symbol}` - Basic NBBO data
- `GET /market-data?symbol={symbol}` - Complete market data
- `GET /technical-indicators?symbol={symbol}` - Technical indicators only
- `GET /fundamental-metrics?symbol={symbol}` - Fundamental metrics only
- `GET /scanner/technical` - Technical analysis scanner
- `GET /scanner/fundamental` - Fundamental analysis scanner
- `GET /help/technical` - Technical analysis educational content
- `GET /help/fundamental` - Fundamental analysis educational content
- `WS /ws/nbbo?symbol={symbol}` - Real-time market data stream

### **2. Broker API**
**File**: `broker/app/main.py`

#### **Features**
- Order placement and management
- Real-time order status updates via WebSocket
- Portfolio tracking and P&L calculation
- Risk management and validation
- Order cancellation functionality
- Trading statistics and analytics

#### **API Endpoints**
- `POST /orders` - Place new order
- `DELETE /orders/{order_id}` - Cancel order
- `GET /orders/{order_id}` - Get specific order
- `GET /orders` - List all orders
- `GET /portfolio` - Get portfolio positions and P&L
- `GET /stats` - Get trading statistics
- `WS /ws` - Real-time order updates

### **3. Exchange Simulator**
**File**: `exchange/cmd/exchange/main.go`

#### **Features**
- Order matching and execution simulation
- Realistic fill patterns (partial fills, market impact)
- Price discovery and market making
- Execution reporting back to broker

### **4. Frontend Application**
**File**: `ui/src/App.jsx`

#### **Components**
- **OrderForm**: Order entry with market data integration
- **OrderBlotter**: Order management with cancellation
- **PortfolioWidget**: Position tracking and P&L display
- **MarketDataWidget**: Real-time price and volume display
- **TechnicalScanner**: Technical analysis scanner with signals
- **FundamentalScanner**: Fundamental analysis scanner
- **DetailedAnalysis**: Single-stock comprehensive analysis
- **StatsWidget**: Trading statistics dashboard
- **LiveEvents**: Real-time order and market updates

#### **Custom Hooks**
```javascript
function useBrokerWS() // WebSocket connection to broker
function useOrders() // Order management and fetching
function useMarketData(symbols) // Real-time market data
```

---

## 📈 **Technical Analysis Implementation**

### **RSI (Relative Strength Index)**
```python
def calculate_rsi(prices: List[float], period: int = 14) -> float:
    """
    Calculate RSI based on average gains vs average losses
    RSI = 100 - (100 / (1 + RS))
    where RS = Average Gain / Average Loss
    """
```

**Educational Value**: Learn momentum analysis and overbought/oversold conditions

### **MACD (Moving Average Convergence Divergence)**
```python
def calculate_macd(prices: List[float]) -> tuple:
    """
    MACD = 12-period EMA - 26-period EMA
    Signal Line = 9-period EMA of MACD
    Histogram = MACD - Signal Line
    """
```

**Educational Value**: Understand trend following and momentum confirmation

### **Bollinger Bands**
```python
def calculate_bollinger_bands(prices: List[float], period: int = 20) -> tuple:
    """
    Middle Band = 20-period SMA
    Upper Band = Middle + (2 × Standard Deviation)
    Lower Band = Middle - (2 × Standard Deviation)
    """
```

**Educational Value**: Learn volatility analysis and mean reversion

### **Moving Averages**
- **SMA (Simple Moving Average)**: Equal weight to all prices
- **EMA (Exponential Moving Average)**: More weight to recent prices
- **Golden Cross**: Short-term MA crosses above long-term MA (bullish)
- **Death Cross**: Short-term MA crosses below long-term MA (bearish)

---

## 📊 **Fundamental Analysis Implementation**

### **Valuation Metrics**
- **P/E Ratio**: Price-to-Earnings ratio for valuation assessment
- **P/B Ratio**: Price-to-Book ratio for asset-based valuation
- **Market Cap**: Total market value of company

### **Financial Health Metrics**
- **Debt-to-Equity**: Leverage and financial risk assessment
- **Current Ratio**: Short-term liquidity measurement
- **ROE/ROA**: Profitability and efficiency metrics

### **Growth Metrics**
- **Revenue Growth**: Year-over-year revenue expansion
- **EPS**: Earnings per share for profitability analysis
- **Profit Margin**: Operational efficiency measurement

---

## 🎯 **Scanner Implementation**

### **Technical Scanner**
**Scanning Criteria**:
- RSI < 30 (Oversold) or RSI > 70 (Overbought)
- MACD bullish/bearish crossovers
- Golden Cross/Death Cross patterns
- Bollinger Band breakouts
- High volume signals

### **Fundamental Scanner**
**Scanning Criteria**:
- P/E Ratio < 15 (Value) or > 50 (Growth)
- P/B Ratio < 1 (Value) or > 10 (Growth)
- Dividend Yield > 3% (Income)
- Revenue Growth > 15% (Growth)
- ROE > 20% (Quality)
- Debt-to-Equity < 0.5 (Conservative)

---

## 📚 **Educational Content System**

### **Technical Analysis Guide**
- **Indicator Descriptions**: What each indicator measures
- **Interpretation Guidelines**: How to read and use indicators
- **Calculation Methods**: Understanding the math behind indicators
- **Trading Signals**: When to buy/sell based on indicators

### **Fundamental Analysis Guide**
- **Metric Definitions**: What each ratio means
- **Industry Benchmarks**: Normal ranges for different sectors
- **Interpretation Guidelines**: How to evaluate companies
- **Investment Strategies**: Value, growth, and income approaches

---

## 🔄 **Real-time Data Flow**

### **Market Data Flow**
```
SIP Simulator → WebSocket → UI Components → Real-time Updates
     ↓
Technical Indicators → Scanner → Signal Detection → UI Display
     ↓
Fundamental Metrics → Scanner → Opportunity Detection → UI Display
```

### **Order Flow**
```
UI Order Form → Broker API → Exchange → Execution Reports → Portfolio Updates
     ↓
WebSocket Broadcast → Real-time UI Updates → Order Blotter → Live Events
```

---

## 🎨 **User Interface Design**

### **Tabbed Navigation**
1. **Trading Tab**: Order entry, portfolio, market data, order management
2. **Technical Tab**: Technical scanner with educational help
3. **Fundamental Tab**: Fundamental scanner with metrics guide
4. **Analysis Tab**: Detailed single-stock analysis

### **Responsive Design**
- **Grid Layout**: Flexible grid system for different screen sizes
- **Color Coding**: Intuitive color schemes for different data types
- **Loading States**: Proper loading indicators for all async operations
- **Error Handling**: User-friendly error messages and recovery

---

## 🚀 **Deployment & Infrastructure**

### **Docker Configuration**
```yaml
# docker-compose.yml
services:
  ui:
    build: ./ui
    ports: ["5173:5173"]
  
  broker:
    build: ./broker
    ports: ["8000:8000"]
  
  sip:
    build: ./sip
    ports: ["8002:8002"]
  
  exchange:
    build: ./exchange
    ports: ["8081:8081"]
```

### **Environment Variables**
```bash
# SIP Configuration
SIP_SYMBOLS=AAPL,MSFT,SPY,GOOGL,TSLA,NVDA,AMZN,META

# Broker Configuration
EXCHANGE_URL=http://exchange:8081
BROKER_CALLBACK_URL=http://broker:8000/exec

# UI Configuration
VITE_BROKER_URL=http://localhost:8000
VITE_SIP_URL=ws://localhost:8002/ws/nbbo?symbol=
```

---

## 📈 **Learning Objectives & Outcomes**

### **Technical Analysis Skills**
- Understanding momentum indicators (RSI, MACD)
- Trend identification with moving averages
- Volatility analysis with Bollinger Bands
- Volume confirmation and market timing

### **Fundamental Analysis Skills**
- Company valuation using P/E and P/B ratios
- Financial health assessment
- Growth and profitability analysis
- Dividend and income investing

### **Trading Skills**
- Order types and execution
- Portfolio management and position sizing
- Risk management and stop losses
- Real-time decision making

### **Market Understanding**
- Price discovery and market mechanics
- Liquidity and bid/ask spreads
- Market impact and order flow
- Sector analysis and diversification

---

## 🔮 **Future Enhancements**

### **Phase 2 Features**
- **Charting Library**: Interactive price charts with indicators
- **Backtesting Engine**: Historical strategy testing
- **News Integration**: Real-time news impact on prices
- **Options Trading**: Options chain and strategies
- **Multi-User Support**: Competitive trading environment

### **Phase 3 Features**
- **AI Trading Bots**: Automated trading strategies
- **Social Trading**: Copy successful traders
- **Advanced Analytics**: Machine learning predictions
- **Mobile App**: iOS/Android applications
- **API Access**: Third-party integrations

---

## 📋 **Testing & Quality Assurance**

### **Unit Testing**
- Technical indicator calculations
- Order processing logic
- Portfolio calculations
- API endpoint validation

### **Integration Testing**
- End-to-end order flow
- WebSocket connectivity
- Real-time data synchronization
- Cross-browser compatibility

### **Performance Testing**
- WebSocket connection limits
- Real-time data throughput
- UI responsiveness
- Memory usage optimization

---

## 🛠️ **Development Setup**

### **Prerequisites**
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.8+ (for local development)
- Go 1.19+ (for local development)

### **Quick Start**
```bash
# Clone the repository
git clone <repository-url>
cd market-sim-starter

# Start all services
docker-compose up -d

# Access the application
# UI: http://localhost:5173
# Broker API: http://localhost:8000
# SIP API: http://localhost:8002
# Exchange API: http://localhost:8081
```

### **Local Development**
```bash
# Start individual services for development
cd ui && npm install && npm run dev
cd broker && pip install -r requirements.txt && uvicorn app.main:app --reload
cd sip && pip install -r requirements.txt && uvicorn app.main:app --reload
cd exchange && go run cmd/exchange/main.go
```

---

## 📊 **API Reference**

### **Broker API Endpoints**

#### **Orders**
- `POST /orders` - Place new order
- `GET /orders` - List all orders
- `GET /orders/{order_id}` - Get specific order
- `DELETE /orders/{order_id}` - Cancel order

#### **Portfolio & Analytics**
- `GET /portfolio` - Get portfolio positions and P&L
- `GET /stats` - Get trading statistics
- `GET /health` - Health check

#### **WebSocket**
- `WS /ws` - Real-time order updates

### **SIP API Endpoints**

#### **Market Data**
- `GET /nbbo?symbol={symbol}` - Basic NBBO data
- `GET /market-data?symbol={symbol}` - Complete market data
- `GET /technical-indicators?symbol={symbol}` - Technical indicators
- `GET /fundamental-metrics?symbol={symbol}` - Fundamental metrics

#### **Scanners**
- `GET /scanner/technical` - Technical analysis scanner
- `GET /scanner/fundamental` - Fundamental analysis scanner

#### **Educational Content**
- `GET /help/technical` - Technical analysis guide
- `GET /help/fundamental` - Fundamental analysis guide

#### **WebSocket**
- `WS /ws/nbbo?symbol={symbol}` - Real-time market data

---

## 🔒 **Security Considerations**

### **Input Validation**
- Order quantity and price validation
- Symbol validation and sanitization
- Rate limiting on API endpoints

### **Data Protection**
- No real financial data stored
- Simulated market data only
- No personal information collection

### **Network Security**
- CORS configuration for development
- WebSocket connection validation
- API endpoint authentication (future)

---

## 📈 **Performance Metrics**

### **Real-time Performance**
- WebSocket message latency: < 100ms
- UI update frequency: 500ms for market data
- Scanner refresh rate: 10-15 seconds
- Order processing time: < 50ms

### **Scalability**
- Support for 100+ concurrent users
- 1000+ orders per minute
- Real-time data for 10+ symbols
- Memory usage: < 512MB per service

---

## 🐛 **Troubleshooting**

### **Common Issues**

#### **WebSocket Connection Issues**
- Check if all services are running
- Verify port configurations
- Check browser console for errors

#### **Order Processing Issues**
- Verify broker and exchange connectivity
- Check order validation rules
- Review risk management settings

#### **Market Data Issues**
- Ensure SIP service is running
- Check symbol configuration
- Verify WebSocket connections

### **Logs and Debugging**
```bash
# View service logs
docker-compose logs ui
docker-compose logs broker
docker-compose logs sip
docker-compose logs exchange

# Debug specific service
docker-compose logs -f broker
```

---

## 📞 **Support & Contributing**

### **Getting Help**
- Check the troubleshooting section
- Review API documentation
- Examine service logs
- Create an issue for bugs

### **Contributing**
- Fork the repository
- Create a feature branch
- Add tests for new features
- Submit a pull request

### **Code Standards**
- Follow PEP 8 for Python code
- Use ESLint for JavaScript
- Add type hints to Python functions
- Write comprehensive docstrings

---

This technical documentation provides a comprehensive blueprint for building an educational stock market simulator that combines real-time trading simulation with extensive learning resources for technical and fundamental analysis.
