# Session History Export - Market Simulation Trading System

**Export Date:** August 24, 2025 at 10:26:07

## 📁 Files Overview

### 📊 Trading Data
- **`trade_journal.json`** - Complete trade history with entry/exit analysis, P&L, and trade reasoning
- **`trade_analytics.json`** - Aggregated trading statistics and performance metrics
- **`orders.json`** - All orders placed (buy/sell orders with status and execution details)
- **`positions.json`** - Current and historical position data

### 💼 Portfolio & Risk
- **`portfolio.json`** - Current portfolio holdings with P&L calculations
- **`risk_metrics.json`** - Risk analysis and exposure metrics
- **`system_stats.json`** - System performance and usage statistics

### 📈 Market Data
- **`aapl_history.json`** - Historical price data for AAPL (OHLCV)
- **`msft_history.json`** - Historical price data for MSFT (OHLCV)
- **`spy_history.json`** - Historical price data for SPY (OHLCV)
- **`aapl_market_data.json`** - Current market data for AAPL
- **`msft_market_data.json`** - Current market data for MSFT
- **`spy_market_data.json`** - Current market data for SPY

### 📋 Summary
- **`export_summary.json`** - Export metadata and summary statistics

## 🔍 How to Use This Data

### 1. **Import into Excel/Google Sheets**
- Open any JSON file in Excel or Google Sheets
- Use Data > From JSON to import
- Create pivot tables for analysis

### 2. **Custom Analysis Scripts**
```python
import json

# Load trade journal
with open('trade_journal.json', 'r') as f:
    trades = json.load(f)

# Analyze performance
total_trades = len(trades)
profitable_trades = len([t for t in trades if t.get('outcome') == 'Profit'])
win_rate = profitable_trades / total_trades * 100 if total_trades > 0 else 0

print(f"Total Trades: {total_trades}")
print(f"Win Rate: {win_rate:.1f}%")
```

### 3. **Portfolio Analysis**
```python
# Load portfolio data
with open('portfolio.json', 'r') as f:
    portfolio = json.load(f)

# Calculate total portfolio value
total_value = sum(pos['market_value'] for pos in portfolio['portfolio'])
total_pnl = sum(pos['unrealized_pnl'] for pos in portfolio['portfolio'])

print(f"Portfolio Value: ${total_value:,.2f}")
print(f"Total P&L: ${total_pnl:,.2f}")
```

### 4. **Market Data Analysis**
```python
# Load historical data
with open('aapl_history.json', 'r') as f:
    aapl_data = json.load(f)

# Calculate daily returns
prices = [day['close'] for day in aapl_data['data']]
returns = [(prices[i] - prices[i-1]) / prices[i-1] * 100 
           for i in range(1, len(prices))]

avg_return = sum(returns) / len(returns)
print(f"AAPL Average Daily Return: {avg_return:.2f}%")
```

## 📊 Key Metrics Available

### Trading Performance
- Total number of trades
- Win rate percentage
- Average P&L per trade
- Best/worst trades
- Trade duration analysis

### Portfolio Metrics
- Total portfolio value
- Unrealized P&L
- Position sizes and allocations
- Sector diversification
- Cost basis vs market value

### Risk Analysis
- Maximum drawdown
- Sharpe ratio
- Volatility metrics
- Position concentration
- Correlation analysis

## 🚀 Next Steps

1. **Review the data** - Check for any anomalies or interesting patterns
2. **Create visualizations** - Use charts to identify trends
3. **Compare performance** - Analyze different time periods or strategies
4. **Export to other formats** - Convert to CSV for broader compatibility
5. **Set up automated exports** - Schedule regular data exports

## 📞 Support

If you need help analyzing this data or have questions about the export format, refer to the main project documentation or create an issue in the GitHub repository.
