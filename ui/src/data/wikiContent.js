// Wiki content database for the trading system
export const WIKI_CONTENT = {
  trading_strategies: {
    title: "Trading Strategies",
    content: `# Trading Strategies Guide

## Swing Trading

**Overview:**
Swing trading involves holding positions for days to weeks, using technical analysis to identify entry and exit points.

**Key Characteristics:**
- **Timeframe:** 2-10 days typically
- **Analysis:** Technical indicators and chart patterns
- **Risk:** Moderate
- **Capital:** Medium to high

**Strategy Implementation:**
1. **Entry Criteria:**
   - Strong trend identification
   - Support/resistance breakouts
   - Volume confirmation
   - Multiple timeframe analysis

2. **Exit Criteria:**
   - Target profit levels
   - Stop loss placement
   - Trend reversal signals
   - Time-based exits

**Risk Management:**
- Position size: 1-3% of capital per trade
- Stop loss: 2-5% from entry
- Risk/reward ratio: Minimum 1:2

---

## Day Trading

**Overview:**
Day trading involves opening and closing positions within the same day, capitalizing on intraday price movements.

**Key Characteristics:**
- **Timeframe:** Same day (no overnight positions)
- **Analysis:** Intraday charts and real-time data
- **Risk:** High
- **Capital:** High (due to leverage requirements)

**Strategy Implementation:**
1. **Pre-Market Preparation:**
   - Review overnight news
   - Identify key levels
   - Plan entry/exit points
   - Set risk parameters

2. **Intraday Execution:**
   - Monitor real-time data
   - Execute planned trades
   - Manage positions actively
   - Close all positions by end of day

**Risk Management:**
- Position size: 0.5-1% of capital per trade
- Stop loss: 1-2% from entry
- Maximum daily loss: 2-3% of capital

---

## Position Trading

**Overview:**
Position trading involves long-term positions based on fundamental analysis and major market trends.

**Key Characteristics:**
- **Timeframe:** Weeks to months
- **Analysis:** Fundamental and technical
- **Risk:** Low to moderate
- **Capital:** Medium to high

**Strategy Implementation:**
1. **Fundamental Analysis:**
   - Company financials
   - Industry trends
   - Economic factors
   - Market sentiment

2. **Technical Confirmation:**
   - Long-term trend analysis
   - Support/resistance levels
   - Volume analysis
   - Momentum indicators

**Risk Management:**
- Position size: 2-5% of capital per trade
- Stop loss: 5-10% from entry
- Risk/reward ratio: Minimum 1:3

---

## Scalping

**Overview:**
Scalping involves making many small trades to capture tiny price movements throughout the day.

**Key Characteristics:**
- **Timeframe:** Seconds to minutes
- **Analysis:** Level 2 data and order flow
- **Risk:** Very high
- **Capital:** Very high

**Strategy Implementation:**
1. **Market Selection:**
   - High liquidity stocks
   - Tight bid-ask spreads
   - High volume
   - Low volatility

2. **Execution:**
   - Fast execution platform
   - Direct market access
   - Real-time data feeds
   - Automated order management

**Risk Management:**
- Position size: 0.1-0.5% of capital per trade
- Stop loss: 0.5-1% from entry
- Maximum holding time: 5 minutes
- Maximum daily loss: 1-2% of capital

---

## Options Trading

**Overview:**
Options trading involves trading derivative contracts that give the right to buy or sell underlying assets.

**Key Characteristics:**
- **Timeframe:** Days to months
- **Analysis:** Options Greeks and volatility
- **Risk:** Variable (can be limited or unlimited)
- **Capital:** Medium to high

**Strategy Implementation:**
1. **Strategy Selection:**
   - Covered calls
   - Protective puts
   - Straddles/strangles
   - Iron condors
   - Butterfly spreads

2. **Risk Management:**
   - Understand options Greeks
   - Monitor implied volatility
   - Set position size limits
   - Use stop losses appropriately

**Risk Considerations:**
- Time decay (theta)
- Volatility changes (vega)
- Directional risk (delta)
- Assignment risk
- Liquidity concerns`
  },

  risk_management: {
    title: "Risk Management",
    content: `# Risk Management Framework

## Position Sizing

**Core Principle:**
Never risk more than 1-2% of your capital on any single trade.

**Calculation Methods:**

### Fixed Risk Method
\`\`\`
Position Size = (Account Size × Risk Percentage) ÷ (Entry Price - Stop Loss Price)
\`\`\`

**Example:**
- Account: $100,000
- Risk: 1% = $1,000
- Entry: $50
- Stop: $45
- Position Size = $1,000 ÷ ($50 - $45) = 200 shares

### Kelly Criterion
\`\`\`
Position Size = (Win Rate × Average Win) - (Loss Rate × Average Loss) ÷ Average Win
\`\`\`

**Risk Percentage Guidelines:**
- **Conservative:** 0.5-1% per trade
- **Moderate:** 1-2% per trade
- **Aggressive:** 2-3% per trade
- **Maximum:** Never exceed 5% per trade

---

## Stop Loss Strategy

**Types of Stop Losses:**

### Fixed Percentage Stops
- **Conservative:** 2-3% from entry
- **Moderate:** 3-5% from entry
- **Aggressive:** 5-8% from entry

### Technical Stops
- **Support/Resistance:** Below key support levels
- **Moving Averages:** Below key moving averages
- **Chart Patterns:** Below pattern boundaries
- **Volatility:** Based on ATR (Average True Range)

### Trailing Stops
- **Fixed Trailing:** Maintain fixed percentage below highest price
- **ATR Trailing:** Based on volatility (2-3 × ATR)
- **Parabolic SAR:** Using parabolic stop and reverse indicator

**Stop Loss Best Practices:**
1. **Set stops before entering trades**
2. **Use logical levels (not arbitrary percentages)**
3. **Consider market volatility**
4. **Don't move stops in the wrong direction**
5. **Use mental stops for experienced traders only**

---

## Portfolio Risk Management

**Diversification Rules:**

### Sector Diversification
- **Maximum per sector:** 20-25%
- **Target sectors:** 5-8 different sectors
- **Avoid concentration:** Don't put all money in one sector

### Position Diversification
- **Maximum per position:** 5-10%
- **Minimum positions:** 10-20 different stocks
- **Correlation consideration:** Avoid highly correlated positions

### Asset Class Diversification
- **Stocks:** 60-80%
- **Bonds:** 10-30%
- **Cash:** 5-15%
- **Alternative investments:** 5-10%

**Correlation Management:**
- **Low correlation:** < 0.3 (ideal)
- **Medium correlation:** 0.3-0.7 (acceptable)
- **High correlation:** > 0.7 (avoid)

---

## Risk Metrics

**Key Risk Measurements:**

### Maximum Drawdown
\`\`\`
Maximum Drawdown = (Peak Value - Trough Value) ÷ Peak Value × 100%
\`\`\`

**Acceptable Levels:**
- **Conservative:** < 10%
- **Moderate:** < 20%
- **Aggressive:** < 30%

### Sharpe Ratio
\`\`\`
Sharpe Ratio = (Return - Risk-Free Rate) ÷ Standard Deviation
\`\`\`

**Target Levels:**
- **Good:** > 1.0
- **Excellent:** > 1.5
- **Outstanding:** > 2.0

### Value at Risk (VaR)
\`\`\`
VaR = Portfolio Value × Z-Score × Standard Deviation
\`\`\`

**Common Confidence Levels:**
- **95% confidence:** 1.645 standard deviations
- **99% confidence:** 2.326 standard deviations

---

## Psychological Risk Management

**Emotional Control:**

### Fear Management
- **Pre-trade planning:** Reduce uncertainty
- **Position sizing:** Limit potential losses
- **Stop losses:** Remove emotional decisions
- **Journaling:** Track emotional patterns

### Greed Management
- **Profit targets:** Set realistic goals
- **Trailing stops:** Lock in profits
- **Position scaling:** Take partial profits
- **Risk/reward ratios:** Maintain discipline

### Overconfidence Management
- **Performance tracking:** Monitor actual vs. expected results
- **Risk limits:** Enforce maximum position sizes
- **Regular reviews:** Assess strategy effectiveness
- **Continuous learning:** Stay humble

**Mental Framework:**
1. **Accept losses as part of trading**
2. **Focus on process over outcomes**
3. **Maintain trading journal**
4. **Regular performance reviews**
5. **Continuous education and improvement**

---

## Emergency Risk Management

**Market Crash Protection:**

### Hedging Strategies
- **Put options:** Buy protective puts
- **Inverse ETFs:** Short market exposure
- **Gold/precious metals:** Safe haven assets
- **Cash reserves:** Maintain liquidity

### Portfolio Insurance
- **Stop losses:** Tighten during volatility
- **Position reduction:** Reduce exposure
- **Correlation monitoring:** Avoid crowded trades
- **Liquidity management:** Ensure ability to exit

**Black Swan Event Preparation:**
1. **Maintain cash reserves (10-20%)**
2. **Diversify across asset classes**
3. **Use stop losses religiously**
4. **Monitor market conditions**
5. **Have exit strategies prepared`

  },

  market_analysis: {
    title: "Market Analysis Framework",
    content: `# Market Analysis Framework

## Technical Analysis

**Chart Analysis:**

### Price Action
- **Candlestick patterns:** Doji, hammer, shooting star
- **Support/resistance:** Key price levels
- **Trend lines:** Connecting highs and lows
- **Chart patterns:** Head and shoulders, triangles, flags

### Technical Indicators

#### Trend Indicators
- **Moving Averages:** SMA, EMA, WMA
- **MACD:** Moving Average Convergence Divergence
- **ADX:** Average Directional Index
- **Parabolic SAR:** Stop and reverse

#### Momentum Indicators
- **RSI:** Relative Strength Index
- **Stochastic:** %K and %D lines
- **Williams %R:** Overbought/oversold
- **CCI:** Commodity Channel Index

#### Volume Indicators
- **OBV:** On-Balance Volume
- **VWAP:** Volume Weighted Average Price
- **Volume Rate of Change**
- **Money Flow Index**

#### Volatility Indicators
- **Bollinger Bands:** Standard deviation bands
- **ATR:** Average True Range
- **Keltner Channels:** ATR-based bands
- **Donchian Channels:** High/low bands

**Multi-Timeframe Analysis:**
1. **Long-term trend:** Daily/weekly charts
2. **Medium-term setup:** 4-hour/daily charts
3. **Short-term entry:** 1-hour/4-hour charts
4. **Execution timing:** 15-minute/1-hour charts

---

## Fundamental Analysis

**Financial Statement Analysis:**

### Income Statement
- **Revenue growth:** Year-over-year changes
- **Profit margins:** Gross, operating, net
- **Earnings per share:** EPS growth
- **Revenue quality:** Recurring vs. one-time

### Balance Sheet
- **Assets:** Current and non-current
- **Liabilities:** Short-term and long-term debt
- **Equity:** Shareholders' equity
- **Working capital:** Current assets - current liabilities

### Cash Flow Statement
- **Operating cash flow:** Core business cash generation
- **Investing cash flow:** Capital expenditures
- **Financing cash flow:** Debt and equity changes
- **Free cash flow:** Operating cash flow - CapEx

**Key Financial Ratios:**

### Valuation Ratios
- **P/E Ratio:** Price to earnings
- **P/B Ratio:** Price to book value
- **P/S Ratio:** Price to sales
- **EV/EBITDA:** Enterprise value to EBITDA

### Profitability Ratios
- **ROE:** Return on equity
- **ROA:** Return on assets
- **ROIC:** Return on invested capital
- **Gross margin:** Gross profit margin

### Financial Health Ratios
- **Current ratio:** Current assets ÷ current liabilities
- **Debt-to-equity:** Total debt ÷ shareholders' equity
- **Interest coverage:** EBIT ÷ interest expense
- **Quick ratio:** (Current assets - inventory) ÷ current liabilities

---

## Sentiment Analysis

**Market Sentiment Indicators:**

### Technical Sentiment
- **Put/Call ratio:** Options sentiment
- **VIX:** Volatility index (fear gauge)
- **Advance/Decline line:** Market breadth
- **New highs/new lows:** Market strength

### Fundamental Sentiment
- **Analyst ratings:** Buy/sell/hold recommendations
- **Earnings estimates:** Forward-looking projections
- **Insider trading:** Company insider activity
- **Institutional ownership:** Large investor positions

### News and Social Sentiment
- **News sentiment:** Positive/negative news flow
- **Social media:** Twitter, Reddit sentiment
- **Google Trends:** Search volume analysis
- **News volume:** Frequency of mentions

**Sentiment Analysis Tools:**
1. **Fear & Greed Index:** Market mood indicator
2. **AAII Sentiment Survey:** Individual investor sentiment
3. **Investors Intelligence:** Newsletter sentiment
4. **CNN Money Fear & Greed:** Multi-factor sentiment

---

## Economic Analysis

**Macroeconomic Factors:**

### Economic Indicators
- **GDP:** Gross Domestic Product growth
- **Inflation:** CPI, PPI, PCE
- **Employment:** Unemployment rate, job growth
- **Interest rates:** Fed funds rate, Treasury yields

### Market Cycles
- **Business cycles:** Expansion, peak, contraction, trough
- **Market cycles:** Bull markets, bear markets
- **Sector rotation:** Defensive vs. cyclical sectors
- **Seasonal patterns:** Calendar effects

### Global Factors
- **Currency movements:** Dollar strength/weakness
- **Commodity prices:** Oil, gold, copper
- **Geopolitical events:** Trade wars, conflicts
- **Central bank policies:** Monetary policy changes

**Economic Analysis Framework:**
1. **Top-down approach:** Macro → Sector → Stock
2. **Bottom-up approach:** Stock → Sector → Macro
3. **Cross-asset analysis:** Stocks, bonds, commodities
4. **International perspective:** Global market analysis

---

## Sector Analysis

**Industry Analysis:**

### Sector Classification
- **Cyclical sectors:** Consumer discretionary, industrials
- **Defensive sectors:** Consumer staples, utilities
- **Growth sectors:** Technology, healthcare
- **Value sectors:** Financials, energy

### Sector Rotation
- **Early cycle:** Financials, consumer discretionary
- **Mid cycle:** Technology, industrials
- **Late cycle:** Energy, materials
- **Recession:** Utilities, consumer staples

### Sector Analysis Tools
- **Relative strength:** Sector vs. market performance
- **Correlation analysis:** Sector relationships
- **Valuation comparison:** P/E ratios across sectors
- **Earnings growth:** Sector earnings trends

**Sector-Specific Factors:**
1. **Regulatory environment:** Industry regulations
2. **Technological disruption:** Innovation impact
3. **Demographic trends:** Population changes
4. **Global competition:** International factors

---

## Market Timing

**Entry and Exit Timing:**

### Market Conditions
- **Trending markets:** Follow the trend
- **Ranging markets:** Buy support, sell resistance
- **Volatile markets:** Reduce position sizes
- **Low volatility:** Increase position sizes

### Seasonal Patterns
- **January effect:** Small-cap outperformance
- **Sell in May:** Summer market weakness
- **September effect:** Historical weakness
- **Year-end rally:** Holiday season strength

### Technical Timing
- **Breakouts:** Volume confirmation
- **Pullbacks:** Retracement levels
- **Divergences:** Price vs. indicator
- **Confluence:** Multiple factors aligning

**Timing Best Practices:**
1. **Don't try to catch exact tops/bottoms**
2. **Use multiple confirmation signals**
3. **Consider market context**
4. **Maintain trading discipline**
5. **Accept that timing is never perfect"`

  },

  psychology: {
    title: "Trading Psychology",
    content: `# Trading Psychology Mastery

## Emotional Control

**Understanding Trading Emotions:**

### Fear
**Symptoms:**
- Hesitation to enter trades
- Premature exits
- Overly tight stops
- Analysis paralysis

**Management Strategies:**
1. **Pre-trade planning:** Reduce uncertainty
2. **Position sizing:** Limit potential losses
3. **Stop losses:** Remove emotional decisions
4. **Journaling:** Track fear patterns
5. **Gradual exposure:** Start with small positions

### Greed
**Symptoms:**
- Overtrading
- Ignoring risk management
- Chasing losses
- Refusing to take profits

**Management Strategies:**
1. **Profit targets:** Set realistic goals
2. **Trailing stops:** Lock in profits
3. **Position scaling:** Take partial profits
4. **Risk/reward ratios:** Maintain discipline
5. **Performance tracking:** Monitor actual results

### Overconfidence
**Symptoms:**
- Ignoring warning signs
- Increasing position sizes
- Reducing risk management
- Believing in infallibility

**Management Strategies:**
1. **Performance tracking:** Monitor actual vs. expected results
2. **Risk limits:** Enforce maximum position sizes
3. **Regular reviews:** Assess strategy effectiveness
4. **Continuous learning:** Stay humble
5. **Accountability:** Share results with others

---

## Mental Framework

**Trading Mindset:**

### Process Over Outcome
**Focus on:**
- Following your trading plan
- Executing trades properly
- Managing risk correctly
- Continuous improvement

**Avoid:**
- Obsessing over profits/losses
- Judging success by money alone
- Ignoring process for results
- Emotional decision making

### Probability Thinking
**Understand:**
- No trade is guaranteed
- Losses are part of trading
- Focus on expected value
- Long-term perspective

**Implementation:**
1. **Risk/reward analysis:** Calculate expected value
2. **Sample size:** Don't judge on few trades
3. **Statistical thinking:** Understand probabilities
4. **Edge identification:** Find your advantage

### Detachment
**Practice:**
- Emotional distance from trades
- Objective analysis
- Systematic approach
- Acceptance of outcomes

**Benefits:**
- Clearer thinking
- Better decisions
- Reduced stress
- Improved performance

---

## Discipline and Consistency

**Trading Discipline:**

### Rule Following
**Essential Rules:**
1. **Never risk more than planned**
2. **Always use stop losses**
3. **Follow your trading plan**
4. **Keep detailed records**
5. **Review performance regularly**

**Rule Violation Prevention:**
- **Pre-trade checklist:** Ensure all rules are followed
- **Accountability partner:** Share trades with someone
- **Performance tracking:** Monitor rule adherence
- **Regular reviews:** Assess discipline

### Consistency
**Maintain:**
- **Trading hours:** Regular schedule
- **Analysis routine:** Consistent approach
- **Risk management:** Same rules always
- **Performance tracking:** Regular monitoring

**Benefits:**
- **Better results:** Consistent approach improves outcomes
- **Easier analysis:** Comparable data points
- **Reduced stress:** Predictable routine
- **Faster learning:** Clear feedback loops

---

## Stress Management

**Trading Stress:**

### Stress Sources
1. **Financial pressure:** Money at risk
2. **Performance pressure:** Need to succeed
3. **Time pressure:** Market deadlines
4. **Information overload:** Too much data
5. **Uncertainty:** Unknown outcomes

### Stress Management Techniques

#### Physical Techniques
- **Exercise:** Regular physical activity
- **Breathing:** Deep breathing exercises
- **Sleep:** Adequate rest and recovery
- **Nutrition:** Healthy eating habits
- **Hydration:** Proper water intake

#### Mental Techniques
- **Meditation:** Mindfulness practice
- **Visualization:** Mental rehearsal
- **Journaling:** Emotional processing
- **Time management:** Structured schedule
- **Boundaries:** Work-life balance

#### Trading-Specific Techniques
- **Position sizing:** Reduce financial stress
- **Stop losses:** Remove uncertainty
- **Trading plan:** Reduce decision stress
- **Regular breaks:** Prevent burnout
- **Performance tracking:** Reduce anxiety

---

## Confidence Building

**Trading Confidence:**

### Confidence Sources
1. **Knowledge:** Understanding markets
2. **Experience:** Successful trades
3. **Preparation:** Thorough analysis
4. **Practice:** Paper trading
5. **Mentorship:** Learning from others

### Confidence Building Activities
- **Education:** Continuous learning
- **Practice:** Simulated trading
- **Small wins:** Start with small positions
- **Performance tracking:** Document successes
- **Skill development:** Master one strategy

### False Confidence Avoidance
**Warning Signs:**
- **Overconfidence:** Believing in infallibility
- **Recency bias:** Judging by recent results
- **Confirmation bias:** Only seeing confirming evidence
- **Anchoring:** Fixating on specific prices

**Prevention:**
- **Performance tracking:** Monitor actual results
- **Regular reviews:** Assess strategy effectiveness
- **Risk management:** Maintain discipline
- **Continuous learning:** Stay humble

---

## Performance Psychology

**Mental Performance:**

### Peak Performance States
**Characteristics:**
- **Flow state:** Complete immersion
- **Focus:** Single-minded attention
- **Confidence:** Appropriate self-belief
- **Calmness:** Emotional stability

**Achievement Methods:**
1. **Preparation:** Thorough pre-trade analysis
2. **Routine:** Consistent trading ritual
3. **Environment:** Optimal trading setup
4. **Mindset:** Positive mental state

### Performance Tracking
**Mental Metrics:**
- **Emotional state:** Track feelings during trades
- **Decision quality:** Assess decision-making process
- **Rule adherence:** Monitor discipline
- **Stress levels:** Track stress impact

**Improvement Process:**
1. **Identify patterns:** Find recurring issues
2. **Develop strategies:** Create solutions
3. **Implement changes:** Apply new approaches
4. **Monitor results:** Track effectiveness
5. **Adjust as needed:** Refine strategies

### Recovery from Losses
**Loss Recovery Process:**
1. **Acceptance:** Acknowledge the loss
2. **Analysis:** Understand what happened
3. **Learning:** Extract lessons
4. **Adjustment:** Modify approach if needed
5. **Action:** Return to trading with improvements

**Mental Recovery Techniques:**
- **Perspective:** Remember it's just one trade
- **Learning focus:** Extract valuable lessons
- **Process review:** Assess decision-making
- **Future focus:** Plan next trades
- **Support:** Talk to trading partners

---

## Long-term Success

**Sustainable Trading Psychology:**

### Mindset Development
**Growth Mindset:**
- **Embrace challenges:** See difficulties as opportunities
- **Learn from failures:** Extract lessons from losses
- **Continuous improvement:** Always seek to get better
- **Resilience:** Bounce back from setbacks

**Fixed Mindset Avoidance:**
- **Don't avoid challenges:** Face difficulties head-on
- **Don't ignore feedback:** Accept constructive criticism
- **Don't feel threatened:** Welcome others' success
- **Don't give up easily:** Persist through difficulties

### Life Balance
**Trading Integration:**
- **Family time:** Maintain relationships
- **Health:** Physical and mental well-being
- **Hobbies:** Non-trading activities
- **Social connections:** Maintain friendships
- **Personal growth:** Continuous development

**Benefits:**
- **Reduced stress:** Balanced life reduces pressure
- **Better perspective:** Life outside trading
- **Improved performance:** Mental clarity
- **Sustainable success:** Long-term approach

### Continuous Learning
**Learning Mindset:**
- **Stay curious:** Always ask questions
- **Read widely:** Books, articles, research
- **Learn from others:** Mentors, peers, experts
- **Practice regularly:** Simulated and real trading
- **Review performance:** Regular self-assessment

**Learning Sources:**
- **Books:** Trading psychology literature
- **Courses:** Formal education programs
- **Mentorship:** Learning from experienced traders
- **Communities:** Trading groups and forums
- **Experience:** Personal trading journey`
  },

  advanced_techniques: {
    title: "Advanced Trading Techniques",
    content: `# Advanced Trading Techniques

## Options Strategies

**Basic Options Concepts:**

### Options Greeks
- **Delta:** Price sensitivity to underlying
- **Gamma:** Delta sensitivity to underlying
- **Theta:** Time decay
- **Vega:** Volatility sensitivity
- **Rho:** Interest rate sensitivity

### Advanced Options Strategies

#### Income Strategies
**Covered Calls:**
- **Setup:** Own stock + sell call options
- **Risk:** Limited upside, unlimited downside
- **Reward:** Premium income + stock appreciation
- **Best for:** Neutral to slightly bullish outlook

**Cash-Secured Puts:**
- **Setup:** Sell put options with cash backing
- **Risk:** Obligation to buy stock at strike price
- **Reward:** Premium income
- **Best for:** Bullish outlook, willing to own stock

#### Directional Strategies
**Long Calls/Puts:**
- **Setup:** Buy call or put options
- **Risk:** Limited to premium paid
- **Reward:** Unlimited (calls) or limited (puts)
- **Best for:** Strong directional conviction

**Bull/Bear Spreads:**
- **Setup:** Buy one option, sell another at different strike
- **Risk:** Limited to net premium paid
- **Reward:** Limited to difference between strikes
- **Best for:** Moderate directional conviction

#### Volatility Strategies
**Straddles:**
- **Setup:** Buy call and put at same strike
- **Risk:** Limited to premium paid
- **Reward:** Unlimited if large move occurs
- **Best for:** High volatility expectations

**Strangles:**
- **Setup:** Buy call and put at different strikes
- **Risk:** Limited to premium paid
- **Reward:** Unlimited if large move occurs
- **Best for:** High volatility expectations, lower cost

---

## Algorithmic Trading

**Algorithm Development:**

### Strategy Components
1. **Signal Generation:** Entry/exit criteria
2. **Risk Management:** Position sizing and stops
3. **Execution Logic:** Order placement rules
4. **Performance Monitoring:** Results tracking

### Common Algorithm Types

#### Trend Following
**Moving Average Crossover:**
\`\`\`python
def ma_crossover_strategy(prices, short_ma=10, long_ma=20):
    short_ma = calculate_sma(prices, short_ma)
    long_ma = calculate_sma(prices, long_ma)
    
    if short_ma > long_ma:
        return "BUY"
    elif short_ma < long_ma:
        return "SELL"
    else:
        return "HOLD"
\`\`\`

#### Mean Reversion
**Bollinger Band Strategy:**
\`\`\`python
def bollinger_band_strategy(prices, period=20, std_dev=2):
    bb_upper, bb_middle, bb_lower = calculate_bollinger_bands(prices, period, std_dev)
    current_price = prices[-1]
    
    if current_price < bb_lower:
        return "BUY"
    elif current_price > bb_upper:
        return "SELL"
    else:
        return "HOLD"
\`\`\`

#### Momentum
**RSI Strategy:**
\`\`\`python
def rsi_strategy(prices, period=14, oversold=30, overbought=70):
    rsi = calculate_rsi(prices, period)
    current_rsi = rsi[-1]
    
    if current_rsi < oversold:
        return "BUY"
    elif current_rsi > overbought:
        return "SELL"
    else:
        return "HOLD"
\`\`\`

### Backtesting Framework
**Components:**
1. **Historical Data:** Price, volume, fundamental data
2. **Strategy Logic:** Entry/exit rules
3. **Risk Management:** Position sizing, stops
4. **Performance Metrics:** Returns, drawdown, Sharpe ratio

**Backtesting Process:**
1. **Data Preparation:** Clean and format historical data
2. **Strategy Implementation:** Code trading logic
3. **Simulation:** Run strategy on historical data
4. **Analysis:** Calculate performance metrics
5. **Optimization:** Adjust parameters for better results

---

## Quantitative Analysis

**Statistical Methods:**

### Technical Indicators
**Advanced Indicators:**
- **Ichimoku Cloud:** Multiple timeframe analysis
- **Williams Alligator:** Trend identification
- **SuperTrend:** Trend following with volatility
- **Pivot Points:** Support/resistance levels

### Statistical Analysis
**Correlation Analysis:**
\`\`\`python
import numpy as np
import pandas as pd

def correlation_analysis(asset1, asset2, window=30):
    correlation = asset1.rolling(window).corr(asset2)
    return correlation
\`\`\`

**Cointegration Testing:**
\`\`\`python
from statsmodels.tsa.stattools import coint

def cointegration_test(asset1, asset2):
    score, pvalue, _ = coint(asset1, asset2)
    return score, pvalue
\`\`\`

### Machine Learning Applications
**Feature Engineering:**
- **Technical features:** Moving averages, RSI, MACD
- **Fundamental features:** P/E ratios, earnings growth
- **Sentiment features:** News sentiment, social media
- **Market features:** Volatility, volume, correlation

**Model Types:**
- **Classification:** Buy/sell/hold predictions
- **Regression:** Price prediction
- **Clustering:** Market regime identification
- **Time Series:** Sequence prediction

---

## Market Microstructure

**Order Flow Analysis:**

### Level 2 Data
**Components:**
- **Bid/Ask Spreads:** Market liquidity
- **Order Book Depth:** Available liquidity
- **Order Flow:** Buy/sell pressure
- **Time and Sales:** Individual trades

### Order Types
**Market Orders:**
- **Market Buy:** Immediate execution at ask
- **Market Sell:** Immediate execution at bid
- **Risk:** Slippage and poor fills

**Limit Orders:**
- **Limit Buy:** Execute at or below specified price
- **Limit Sell:** Execute at or above specified price
- **Risk:** May not execute

**Stop Orders:**
- **Stop Loss:** Market order when price hits level
- **Stop Limit:** Limit order when price hits level
- **Trailing Stop:** Dynamic stop level

### Execution Strategies
**Slicing Orders:**
- **Purpose:** Minimize market impact
- **Method:** Break large orders into smaller pieces
- **Timing:** Execute over time periods
- **Monitoring:** Track execution quality

**Smart Order Routing:**
- **Purpose:** Find best execution venues
- **Factors:** Price, speed, liquidity, cost
- **Venues:** Exchanges, dark pools, market makers
- **Optimization:** Route to best venue

---

## Risk Arbitrage

**Merger Arbitrage:**

### Strategy Overview
**Process:**
1. **Identify Merger:** Company A buying Company B
2. **Analyze Terms:** Stock, cash, or mixed consideration
3. **Calculate Spread:** Difference between current price and deal value
4. **Assess Risk:** Probability of deal completion
5. **Position Size:** Based on risk/reward ratio

### Risk Factors
**Deal Risk:**
- **Regulatory approval:** Antitrust concerns
- **Shareholder approval:** Vote requirements
- **Financing risk:** Ability to secure funding
- **Market conditions:** Economic environment

**Timing Risk:**
- **Deal timeline:** Expected completion date
- **Extension risk:** Delays in closing
- **Opportunity cost:** Alternative investments
- **Carry cost:** Financing positions

### Implementation
**Position Sizing:**
\`\`\`
Position Size = (Deal Value - Current Price) × Probability of Completion × Risk Tolerance
\`\`\`

**Monitoring:**
- **Deal progress:** Regulatory filings, approvals
- **Market conditions:** Sector performance, volatility
- **Position performance:** P&L tracking
- **Risk management:** Stop losses, position limits

---

## Pairs Trading

**Statistical Arbitrage:**

### Strategy Concept
**Process:**
1. **Identify Pairs:** Highly correlated stocks
2. **Calculate Spread:** Price difference between pairs
3. **Mean Reversion:** Spread returns to historical average
4. **Entry Signal:** When spread deviates significantly
5. **Exit Signal:** When spread returns to mean

### Implementation
**Pair Selection:**
- **Correlation:** High historical correlation (>0.8)
- **Cointegration:** Long-term relationship
- **Liquidity:** Sufficient trading volume
- **Sector:** Same industry or related sectors

**Signal Generation:**
\`\`\`python
def pairs_trading_signal(stock1, stock2, window=30, std_dev=2):
    # Calculate spread
    spread = stock1 - stock2
    
    # Calculate z-score
    mean_spread = spread.rolling(window).mean()
    std_spread = spread.rolling(window).std()
    z_score = (spread - mean_spread) / std_spread
    
    # Generate signals
    if z_score > std_dev:
        return "SHORT_STOCK1_LONG_STOCK2"
    elif z_score < -std_dev:
        return "LONG_STOCK1_SHORT_STOCK2"
    else:
        return "NEUTRAL"
\`\`\`

**Risk Management:**
- **Position sizing:** Equal dollar amounts
- **Stop losses:** Maximum spread deviation
- **Correlation monitoring:** Watch for breakdown
- **Sector risk:** Avoid sector-wide moves

---

## High-Frequency Trading

**Ultra-Short Term Trading:**

### Technology Requirements
**Infrastructure:**
- **Low latency:** Sub-millisecond execution
- **Direct market access:** Co-location with exchanges
- **High-speed data:** Real-time market data
- **Algorithmic execution:** Automated order placement

### Strategy Types
**Market Making:**
- **Bid-ask spreads:** Profit from spreads
- **Inventory management:** Balance long/short positions
- **Risk management:** Position limits, stop losses
- **Competition:** Compete with other market makers

**Statistical Arbitrage:**
- **Mean reversion:** Exploit temporary price deviations
- **Momentum:** Follow short-term trends
- **Cross-asset:** Trade related instruments
- **Event-driven:** React to news and events

### Risk Considerations
**Operational Risk:**
- **Technology failures:** System outages
- **Latency issues:** Execution delays
- **Data quality:** Bad market data
- **Regulatory changes:** New rules and requirements

**Market Risk:**
- **Liquidity risk:** Inability to exit positions
- **Volatility risk:** Sudden price movements
- **Correlation risk:** Breakdown of relationships
- **Regime changes:** Market structure shifts

**Risk Management:**
- **Position limits:** Maximum exposure
- **Stop losses:** Automatic risk controls
- **Circuit breakers:** Emergency shutdowns
- **Monitoring:** Real-time risk tracking`
  }
}

// Helper function to get wiki content
export const getWikiContent = (key) => {
  // Check for custom wiki content first
  const customWiki = JSON.parse(localStorage.getItem('customWiki') || '{}')
  if (customWiki[key]) {
    return customWiki[key]
  }
  
  // Fall back to default content
  return WIKI_CONTENT[key] || {
    title: "Wiki Page",
    content: "Wiki content not available."
  }
}

// Helper function to get all wiki keys
export const getAllWikiKeys = () => {
  const defaultKeys = Object.keys(WIKI_CONTENT)
  const customWiki = JSON.parse(localStorage.getItem('customWiki') || '{}')
  const customKeys = Object.keys(customWiki)
  return [...new Set([...defaultKeys, ...customKeys])]
}

// Helper function to check if wiki exists
export const hasWiki = (key) => {
  return !!(WIKI_CONTENT[key])
}
