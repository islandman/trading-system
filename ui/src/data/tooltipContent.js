// Comprehensive tooltip content database for the trading system
export const TOOLTIP_CONTENT = {
  // Technical Analysis Tooltips
  technical: {
    rsi: {
      title: "RSI (Relative Strength Index)",
      content: `**RSI** is a momentum oscillator that measures the speed and magnitude of price changes.

**Formula:**
RSI = 100 - (100 / (1 + RS))
Where RS = Average Gain / Average Loss

**What it measures:**
- Momentum and speed of price movements
- Overbought and oversold conditions
- Potential reversal points

**Interpretation:**
- **RSI > 70:** Overbought condition (potential sell signal)
- **RSI < 30:** Oversold condition (potential buy signal)
- **RSI 30-70:** Neutral zone (trend continuation likely)

**Key Signals:**
- **Bullish Divergence:** Price makes lower lows, RSI makes higher lows
- **Bearish Divergence:** Price makes higher highs, RSI makes lower highs
- **Centerline Cross:** RSI crossing above/below 50 indicates momentum shift

**Trading Strategies:**
- Buy when RSI crosses above 30 from oversold
- Sell when RSI crosses below 70 from overbought
- Use divergences for early reversal signals
- Combine with trend analysis for confirmation

**Best Timeframes:**
- 14-period RSI most common
- Shorter periods (7-10) for more signals
- Longer periods (21-30) for fewer, stronger signals`
    },

    macd: {
      title: "MACD (Moving Average Convergence Divergence)",
      content: `**MACD** is a trend-following momentum indicator that shows the relationship between two moving averages.

**Components:**
- **MACD Line:** 12-period EMA - 26-period EMA
- **Signal Line:** 9-period EMA of MACD line
- **Histogram:** MACD line - Signal line

**What it measures:**
- Trend direction and momentum
- Potential reversal points
- Strength of price movements

**Key Signals:**
- **Bullish Crossover:** MACD line crosses above signal line
- **Bearish Crossover:** MACD line crosses below signal line
- **Zero Line Cross:** MACD crossing above/below zero indicates trend change
- **Divergence:** Price and MACD moving in opposite directions

**Trading Strategies:**
- **Trend Following:** Trade in direction of MACD line
- **Crossover Strategy:** Buy on bullish crossover, sell on bearish
- **Histogram Analysis:** Increasing histogram = strengthening trend
- **Divergence Trading:** Look for divergences for reversal signals

**Best Practices:**
- Use on higher timeframes for stronger signals
- Combine with other indicators for confirmation
- Avoid trading in choppy/sideways markets
- Consider volume for signal validation

**Common Settings:**
- 12, 26, 9 (standard)
- 8, 21, 5 (faster signals)
- 21, 55, 13 (slower, fewer signals)`
    },

    bollinger_bands: {
      title: "Bollinger Bands",
      content: `**Bollinger Bands** are volatility indicators that consist of a moving average and two standard deviation bands.

**Components:**
- **Middle Band:** 20-period Simple Moving Average
- **Upper Band:** Middle band + (2 × Standard Deviation)
- **Lower Band:** Middle band - (2 × Standard Deviation)

**What it measures:**
- Price volatility and relative price levels
- Potential support and resistance levels
- Overbought and oversold conditions

**Key Concepts:**
- **Band Width:** Distance between upper and lower bands indicates volatility
- **Squeeze:** Bands contract during low volatility (potential breakout coming)
- **Expansion:** Bands widen during high volatility

**Trading Signals:**
- **Bounce:** Price bounces off lower band (potential buy)
- **Rejection:** Price rejected from upper band (potential sell)
- **Breakout:** Price breaks above upper or below lower band
- **Mean Reversion:** Price returns to middle band after extreme moves

**Advanced Strategies:**
- **Bollinger Band Squeeze:** Prepare for breakout when bands contract
- **Double Bottom/Top:** Two touches of same band level
- **Band Width Divergence:** Price making new highs/lows but bands not expanding

**Best Practices:**
- Use 20-period SMA as default
- 2 standard deviations capture ~95% of price action
- Combine with RSI for overbought/oversold confirmation
- Consider volume on breakouts

**Common Variations:**
- 20, 2 (standard)
- 10, 2 (more sensitive)
- 50, 2.5 (less sensitive, longer-term)`
    },

    moving_averages: {
      title: "Moving Averages",
      content: `**Moving Averages** are trend indicators that smooth out price data to identify direction and momentum.

**Types of Moving Averages:**
- **Simple Moving Average (SMA):** Equal weight to all periods
- **Exponential Moving Average (EMA):** More weight to recent prices
- **Weighted Moving Average (WMA):** Linear weight distribution

**Common Periods:**
- **Short-term:** 5, 10, 20 periods (trend changes)
- **Medium-term:** 50, 100 periods (intermediate trends)
- **Long-term:** 200 periods (major trends)

**Key Signals:**
- **Golden Cross:** 50MA crosses above 200MA (bullish)
- **Death Cross:** 50MA crosses below 200MA (bearish)
- **Price Cross:** Price crossing above/below MA
- **MA Alignment:** Multiple MAs aligned in same direction

**Trading Strategies:**
- **Trend Following:** Trade in direction of MA slope
- **Support/Resistance:** Use MAs as dynamic support/resistance
- **Crossover Strategy:** Buy/sell on MA crossovers
- **Multiple MA System:** Use 3-4 MAs for trend confirmation

**Best Practices:**
- Use longer MAs for major trends
- Shorter MAs for entry/exit timing
- Combine with volume analysis
- Consider market conditions (trending vs ranging)

**Common Combinations:**
- 10, 20, 50 (short-term system)
- 20, 50, 200 (medium-term system)
- 50, 100, 200 (long-term system)`
    },

    volume_analysis: {
      title: "Volume Analysis",
      content: `**Volume Analysis** examines trading volume to confirm price movements and identify potential reversals.

**Key Concepts:**
- **Volume Confirmation:** High volume validates price moves
- **Volume Divergence:** Price and volume moving in opposite directions
- **Volume Climax:** Extremely high volume often signals reversal

**Volume Patterns:**
- **Accumulation:** High volume on price increases
- **Distribution:** High volume on price decreases
- **Churning:** High volume with little price movement

**Key Indicators:**
- **Volume Rate of Change:** Measures volume momentum
- **On-Balance Volume (OBV):** Cumulative volume indicator
- **Volume Weighted Average Price (VWAP):** Volume-adjusted price level

**Trading Signals:**
- **Breakout Confirmation:** High volume validates breakouts
- **Reversal Signal:** Volume spike at support/resistance
- **Trend Continuation:** Consistent volume in trend direction
- **Exhaustion:** Volume spike with price reversal

**Best Practices:**
- Compare current volume to average volume
- Look for volume patterns over multiple periods
- Use volume to confirm other technical signals
- Consider market context and news events

**Volume Analysis Rules:**
- Price up + Volume up = Strong bullish signal
- Price up + Volume down = Weak bullish signal
- Price down + Volume up = Strong bearish signal
- Price down + Volume down = Weak bearish signal`
    },

    support_resistance: {
      title: "Support and Resistance",
      content: `**Support and Resistance** are key price levels where buying or selling pressure is expected to emerge.

**Support Levels:**
- **Price Floor:** Level where buying pressure exceeds selling
- **Historical Lows:** Previous price bottoms
- **Psychological Levels:** Round numbers (50, 100, 1000)
- **Technical Levels:** Moving averages, Fibonacci retracements

**Resistance Levels:**
- **Price Ceiling:** Level where selling pressure exceeds buying
- **Historical Highs:** Previous price tops
- **Psychological Levels:** Round numbers
- **Technical Levels:** Moving averages, Fibonacci extensions

**Key Concepts:**
- **Role Reversal:** Support becomes resistance (and vice versa)
- **Strength:** More touches = stronger level
- **Breakout:** Price moving decisively through level
- **False Breakout:** Price breaks level but quickly reverses

**Trading Strategies:**
- **Bounce Trading:** Buy at support, sell at resistance
- **Breakout Trading:** Enter when price breaks through level
- **Range Trading:** Trade between support and resistance
- **Stop Loss Placement:** Place stops beyond key levels

**Best Practices:**
- Use multiple timeframes for level identification
- Look for confluence of multiple levels
- Consider volume on breakouts
- Don't trade every level - focus on strongest ones

**Level Types:**
- **Static:** Fixed price levels
- **Dynamic:** Moving levels (MAs, trendlines)
- **Psychological:** Round numbers, all-time highs/lows
- **Technical:** Fibonacci, pivot points, chart patterns`
    },

    chart_patterns: {
      title: "Chart Patterns",
      content: `**Chart Patterns** are recurring price formations that indicate potential future price movements.

**Reversal Patterns:**
- **Head and Shoulders:** Three peaks with middle highest (bearish)
- **Inverse Head and Shoulders:** Three troughs with middle lowest (bullish)
- **Double Top:** Two peaks at same level (bearish)
- **Double Bottom:** Two troughs at same level (bullish)
- **Rounding Top/Bottom:** Gradual reversal formation

**Continuation Patterns:**
- **Triangle:** Converging trendlines (ascending, descending, symmetrical)
- **Flag:** Short consolidation after strong move
- **Pennant:** Small symmetrical triangle
- **Rectangle:** Horizontal trading range
- **Cup and Handle:** Rounded bottom with small pullback

**Pattern Trading:**
- **Entry:** Enter on pattern completion/breakout
- **Target:** Measure pattern height for price target
- **Stop Loss:** Place beyond pattern boundary
- **Confirmation:** Wait for volume confirmation

**Best Practices:**
- Look for patterns on multiple timeframes
- Consider market context and trend
- Use volume to confirm breakouts
- Don't force patterns - let them develop naturally

**Pattern Reliability:**
- **High Reliability:** Head and shoulders, double tops/bottoms
- **Medium Reliability:** Triangles, flags, pennants
- **Low Reliability:** Complex patterns, small timeframes

**Risk Management:**
- Always use stop losses
- Don't risk more than 1-2% per trade
- Consider pattern failure scenarios
- Use position sizing based on pattern probability`
    },

    fibonacci: {
      title: "Fibonacci Retracements",
      content: `**Fibonacci Retracements** use mathematical ratios to identify potential support and resistance levels.

**Key Ratios:**
- **23.6%:** Shallow retracement
- **38.2%:** Moderate retracement
- **50.0%:** Halfway retracement (not Fibonacci but commonly used)
- **61.8%:** Deep retracement (Golden Ratio)
- **78.6%:** Very deep retracement

**How to Use:**
- **Swing High to Low:** For uptrend retracements
- **Swing Low to High:** For downtrend retracements
- **Multiple Timeframes:** Apply to different timeframes
- **Confluence:** Look for multiple Fibonacci levels

**Trading Strategies:**
- **Retracement Trading:** Buy/sell at Fibonacci levels
- **Extension Trading:** Use for profit targets
- **Trend Continuation:** Expect bounce from retracement levels
- **Breakout Confirmation:** Price breaking through Fibonacci level

**Best Practices:**
- Use clear swing highs and lows
- Combine with other technical indicators
- Consider market structure and trend
- Don't rely solely on Fibonacci levels

**Common Applications:**
- **Stock Trading:** Retracement levels in trends
- **Forex Trading:** Currency pair movements
- **Crypto Trading:** Volatile price movements
- **Commodity Trading:** Natural resource price cycles

**Advanced Concepts:**
- **Fibonacci Extensions:** Beyond 100% for targets
- **Fibonacci Fans:** Time-based projections
- **Fibonacci Arcs:** Circular projections
- **Fibonacci Time Zones:** Time-based analysis`
    }
  },

  // Fundamental Analysis Tooltips
  fundamental: {
    pe_ratio: {
      title: "P/E Ratio (Price-to-Earnings)",
      content: `**P/E Ratio** is one of the most widely used valuation metrics in fundamental analysis.

**What it measures:**
- Compares a company's stock price to its earnings per share (EPS)
- Formula: P/E = Stock Price ÷ Earnings Per Share

**Interpretation:**
- **Low P/E (< 15):** May indicate undervaluation or poor growth prospects
- **Average P/E (15-25):** Typical for most companies
- **High P/E (> 25):** May indicate overvaluation or high growth expectations

**Example:**
If a stock trades at $50 and has EPS of $2.50:
P/E = $50 ÷ $2.50 = 20x

**Considerations:**
- Compare to industry averages
- Consider growth rates
- Look at historical P/E trends
- Account for economic cycles`
    },

    pb_ratio: {
      title: "P/B Ratio (Price-to-Book)",
      content: `**P/B Ratio** measures a company's market value relative to its book value.

**What it measures:**
- Compares stock price to book value per share
- Formula: P/B = Stock Price ÷ Book Value Per Share

**Book Value:**
- Total assets minus total liabilities
- Represents the accounting value of shareholders' equity

**Interpretation:**
- **P/B < 1:** Stock trades below book value (potential bargain)
- **P/B = 1:** Stock trades at book value
- **P/B > 1:** Stock trades above book value (common for profitable companies)

**Best for:**
- Asset-heavy businesses (banks, real estate)
- Value investing strategies
- Identifying potential bargains

**Limitations:**
- Less relevant for asset-light companies
- Book value may not reflect true asset values
- Intangible assets not fully captured`
    },

    roe: {
      title: "ROE (Return on Equity)",
      content: `**ROE** measures how efficiently a company generates profits from shareholders' equity.

**Formula:**
ROE = Net Income ÷ Shareholders' Equity

**What it tells you:**
- How much profit is generated per dollar of shareholder investment
- Efficiency of capital utilization
- Quality of management

**Interpretation:**
- **Excellent ROE:** 15%+ (indicates strong profitability)
- **Good ROE:** 10-15% (above average performance)
- **Average ROE:** 5-10% (typical for most companies)
- **Poor ROE:** <5% (may indicate problems)

**Example:**
Company with $100M net income and $500M equity:
ROE = $100M ÷ $500M = 20%

**Key Considerations:**
- Compare to industry averages
- Look for consistent ROE over time
- Consider debt levels (high debt can inflate ROE)
- Analyze ROE trends`
    },

    debt_to_equity: {
      title: "Debt-to-Equity Ratio",
      content: `**Debt-to-Equity Ratio** measures a company's financial leverage and risk.

**Formula:**
D/E = Total Debt ÷ Shareholders' Equity

**What it measures:**
- How much debt a company uses relative to equity
- Financial risk and leverage levels
- Capital structure efficiency

**Interpretation:**
- **Low D/E (< 0.5):** Conservative financing, lower risk
- **Moderate D/E (0.5-1.0):** Balanced capital structure
- **High D/E (> 1.0):** Aggressive financing, higher risk
- **Very High D/E (> 2.0):** High financial risk

**Industry Variations:**
- **Banks:** Typically 5-10x (high leverage is normal)
- **Utilities:** 1-2x (stable cash flows support debt)
- **Technology:** 0.1-0.5x (low debt, high equity)

**Risk Factors:**
- Higher debt = higher interest payments
- Reduced financial flexibility
- Increased bankruptcy risk in downturns
- Potential for higher returns (leverage)`
    },

    current_ratio: {
      title: "Current Ratio",
      content: `**Current Ratio** measures a company's ability to pay short-term obligations.

**Formula:**
Current Ratio = Current Assets ÷ Current Liabilities

**What it measures:**
- Short-term liquidity and financial health
- Ability to cover bills due within one year
- Working capital efficiency

**Interpretation:**
- **Excellent (> 2.0):** Strong liquidity position
- **Good (1.5-2.0):** Adequate short-term coverage
- **Acceptable (1.0-1.5):** Sufficient but tight
- **Concerning (< 1.0):** May struggle to pay bills

**Example:**
Company with $200M current assets and $100M current liabilities:
Current Ratio = $200M ÷ $100M = 2.0x

**Key Considerations:**
- Industry standards vary significantly
- Too high may indicate inefficient asset use
- Seasonal businesses may have varying ratios
- Quality of current assets matters (cash vs inventory)`
    },

    revenue_growth: {
      title: "Revenue Growth",
      content: `**Revenue Growth** measures how fast a company's sales are increasing.

**Formula:**
Revenue Growth = (Current Revenue - Previous Revenue) ÷ Previous Revenue × 100%

**What it indicates:**
- Business expansion and market penetration
- Product demand and market share gains
- Overall business momentum

**Interpretation:**
- **High Growth (> 20%):** Rapid expansion, high potential
- **Moderate Growth (10-20%):** Healthy business growth
- **Slow Growth (5-10%):** Mature business, stable
- **Declining (< 0%):** Business challenges or market issues

**Growth Types:**
- **Organic Growth:** From existing operations
- **Acquisition Growth:** From buying other companies
- **Market Expansion:** Entering new markets
- **Product Development:** New product lines

**Important Considerations:**
- Compare to industry averages
- Look for sustainable growth patterns
- Consider economic cycles
- Quality of growth matters (profitable vs unprofitable)`
    },

    eps: {
      title: "EPS (Earnings Per Share)",
      content: `**EPS** represents the portion of a company's profit allocated to each share of common stock.

**Formula:**
EPS = Net Income ÷ Number of Outstanding Shares

**Types of EPS:**
- **Basic EPS:** Simple calculation using outstanding shares
- **Diluted EPS:** Accounts for potential share dilution (options, warrants)

**What it tells you:**
- Profitability on a per-share basis
- Earnings growth over time
- Company's ability to generate profits

**Interpretation:**
- **Growing EPS:** Improving profitability
- **Declining EPS:** Profitability challenges
- **Negative EPS:** Company is losing money

**Example:**
Company with $10M net income and 1M shares:
EPS = $10M ÷ 1M = $10.00 per share

**Key Metrics:**
- **EPS Growth Rate:** Year-over-year change
- **Forward EPS:** Analyst estimates for future periods
- **Trailing EPS:** Past 12 months actual earnings

**Considerations:**
- Compare to industry peers
- Look for consistent growth
- Consider share buybacks (can boost EPS)
- Quality of earnings matters`
    },

    profit_margin: {
      title: "Profit Margin",
      content: `**Profit Margin** shows what percentage of revenue becomes profit.

**Types of Margins:**
- **Gross Margin:** (Revenue - Cost of Goods Sold) ÷ Revenue
- **Operating Margin:** Operating Income ÷ Revenue
- **Net Margin:** Net Income ÷ Revenue

**What it measures:**
- Efficiency of operations
- Pricing power and cost control
- Overall profitability

**Interpretation:**
- **High Margins:** Strong competitive advantages, pricing power
- **Low Margins:** High competition, cost pressures, or operational inefficiencies

**Industry Variations:**
- **Software:** 20-40% net margins (high margins)
- **Retail:** 2-8% net margins (low margins)
- **Manufacturing:** 5-15% net margins (moderate)

**Example:**
Company with $100M revenue and $15M net income:
Net Margin = $15M ÷ $100M = 15%

**Key Considerations:**
- Compare to industry averages
- Look for margin trends over time
- Consider economies of scale
- Quality of revenue matters`
    }
  },

  // Value Investing Tooltips
  value_investing: {
    low_pe: {
      title: "Low P/E Strategy",
      content: `**Low P/E Investing** focuses on stocks trading at below-average price-to-earnings ratios.

**Core Principle:**
Buy undervalued stocks that the market has overlooked or mispriced.

**Key Metrics:**
- P/E ratio below industry average
- P/E ratio below historical average
- P/E ratio below market average

**Screening Criteria:**
- P/E < 15 (or industry average)
- Positive earnings growth
- Strong balance sheet
- Consistent profitability

**Advantages:**
- Lower downside risk
- Potential for multiple expansion
- Contrarian approach
- Focus on fundamentals

**Risks:**
- Value traps (cheap for a reason)
- Extended periods of underperformance
- Requires patience and discipline
- May miss growth opportunities

**Famous Practitioners:**
- Warren Buffett (early career)
- Benjamin Graham
- John Templeton`
    },

    high_dividend: {
      title: "High Dividend Yield",
      content: `**High Dividend Investing** focuses on stocks with above-average dividend yields.

**What to Look For:**
- Dividend yield > 3-4%
- Consistent dividend payments
- Strong dividend coverage ratio
- Dividend growth history

**Dividend Metrics:**
- **Dividend Yield:** Annual Dividend ÷ Stock Price
- **Payout Ratio:** Dividends ÷ Earnings
- **Dividend Coverage:** Earnings ÷ Dividends

**Ideal Characteristics:**
- Payout ratio < 60%
- Dividend coverage > 1.5x
- 5+ years of dividend increases
- Strong cash flow generation

**Sectors to Consider:**
- Utilities
- Consumer staples
- Real estate (REITs)
- Financial services
- Energy

**Risks:**
- Dividend cuts
- High payout ratios
- Interest rate sensitivity
- Sector concentration

**Benefits:**
- Regular income stream
- Lower volatility
- Inflation protection
- Compounding through reinvestment`
    },

    strong_balance_sheet: {
      title: "Strong Balance Sheet",
      content: `**Strong Balance Sheet Analysis** focuses on companies with solid financial foundations.

**Key Metrics to Evaluate:**

**Liquidity Ratios:**
- Current Ratio > 1.5
- Quick Ratio > 1.0
- Cash to Debt Ratio > 0.5

**Solvency Ratios:**
- Debt-to-Equity < 0.5
- Interest Coverage > 3x
- Debt-to-EBITDA < 3x

**Asset Quality:**
- High cash and equivalents
- Low accounts receivable
- Efficient inventory management
- Strong asset turnover

**What to Avoid:**
- High debt levels
- Declining cash positions
- Increasing receivables
- Poor working capital management

**Benefits:**
- Financial flexibility
- Lower bankruptcy risk
- Better access to capital
- Ability to weather downturns

**Red Flags:**
- Rapidly increasing debt
- Declining cash flows
- Poor interest coverage
- Asset quality deterioration`
    },

    undervalued_assets: {
      title: "Undervalued Assets",
      content: `**Undervalued Assets** refers to companies trading below their intrinsic value.

**Asset-Based Valuation Methods:**

**Book Value Analysis:**
- P/B ratio < 1.0
- Tangible book value
- Asset quality assessment

**Net Asset Value (NAV):**
- Sum of all assets minus liabilities
- Real estate holdings
- Intellectual property
- Hidden assets

**Liquidation Value:**
- What assets would sell for in liquidation
- Conservative valuation approach
- Margin of safety principle

**Types of Undervalued Assets:**
- Real estate holdings
- Patents and intellectual property
- Subsidiaries and investments
- Cash and marketable securities
- Inventory (if undervalued)

**Screening Criteria:**
- P/B ratio < 1.0
- High cash to market cap
- Significant real estate holdings
- Hidden subsidiaries

**Risks:**
- Assets may be overvalued
- Liquidation may not be feasible
- Management may not unlock value
- Market may never recognize value`
    }
  },

  // Growth Investing Tooltips
  growth_investing: {
    high_revenue_growth: {
      title: "High Revenue Growth",
      content: `**High Revenue Growth Investing** focuses on companies with rapidly expanding sales.

**Growth Metrics to Track:**
- Revenue growth > 20% annually
- Consistent growth over multiple years
- Growth acceleration trends
- Market share gains

**Types of Growth:**
- **Organic Growth:** From existing operations
- **Acquisition Growth:** From strategic acquisitions
- **Market Expansion:** Entering new markets
- **Product Development:** New product launches

**Growth Drivers:**
- Market expansion
- Product innovation
- Competitive advantages
- Strong management execution

**Valuation Considerations:**
- High P/E ratios are common
- Focus on growth sustainability
- Consider addressable market size
- Evaluate competitive moats

**Risks:**
- Growth may slow or reverse
- High valuations
- Execution risk
- Market saturation

**Success Factors:**
- Strong competitive advantages
- Large addressable markets
- Excellent management
- Sustainable business model`
    },

    expanding_markets: {
      title: "Expanding Markets",
      content: `**Expanding Markets** refers to companies operating in growing market segments.

**Market Analysis:**
- Total Addressable Market (TAM)
- Serviceable Addressable Market (SAM)
- Market growth rates
- Market penetration levels

**Types of Market Expansion:**
- **Geographic:** Entering new countries/regions
- **Demographic:** Targeting new customer segments
- **Product:** Expanding product lines
- **Channel:** New distribution methods

**Market Growth Indicators:**
- Industry growth rates > GDP growth
- Increasing market size
- New customer adoption
- Technology disruption

**Investment Criteria:**
- Large addressable markets
- Early stage market penetration
- Strong competitive position
- Scalable business model

**Examples of Expanding Markets:**
- Cloud computing
- Electric vehicles
- Digital payments
- E-commerce
- Renewable energy

**Risks:**
- Market may not develop as expected
- Increased competition
- Regulatory changes
- Technology shifts`
    },

    innovation_focus: {
      title: "Innovation Focus",
      content: `**Innovation Focus** investing targets companies leading technological or business model innovation.

**Types of Innovation:**
- **Product Innovation:** New products/services
- **Process Innovation:** Improved operations
- **Business Model Innovation:** New ways of doing business
- **Technology Innovation:** Breakthrough technologies

**Innovation Metrics:**
- R&D spending as % of revenue
- Patent portfolio strength
- New product launches
- Technology leadership

**Innovation Indicators:**
- High R&D investment
- Strong intellectual property
- First-mover advantages
- Continuous product development

**Sectors with High Innovation:**
- Technology
- Biotechnology
- Clean energy
- Artificial intelligence
- Robotics

**Investment Criteria:**
- Strong R&D pipeline
- Intellectual property protection
- Market leadership position
- Innovation culture

**Risks:**
- Innovation may fail
- High R&D costs
- Rapid obsolescence
- Regulatory hurdles

**Success Factors:**
- Strong management vision
- Adequate funding
- Market timing
- Execution capability`
    },

    future_potential: {
      title: "Future Potential",
      content: `**Future Potential** analysis evaluates a company's long-term growth opportunities.

**Potential Assessment Factors:**

**Market Opportunity:**
- Total addressable market size
- Market growth trajectory
- Penetration potential
- Competitive landscape

**Competitive Advantages:**
- Network effects
- Switching costs
- Brand strength
- Technology moats

**Scalability:**
- Business model scalability
- Geographic expansion potential
- Product line extensions
- Operational leverage

**Management Quality:**
- Track record of execution
- Strategic vision
- Capital allocation skills
- Innovation focus

**Financial Health:**
- Strong balance sheet
- Cash flow generation
- Access to capital
- Investment in growth

**Risk Factors:**
- Execution risk
- Market timing
- Competition
- Regulatory changes

**Valuation Approach:**
- Discounted cash flow analysis
- Scenario planning
- Comparable company analysis
- Sum-of-parts valuation`
    }
  }
}

// Helper function to get tooltip content
export const getTooltipContent = (category, key) => {
  // Check for custom tooltips first
  const customTooltips = JSON.parse(localStorage.getItem('customTooltips') || '{}')
  if (customTooltips[category]?.[key]) {
    return customTooltips[category][key]
  }
  
  // Fall back to default content
  return TOOLTIP_CONTENT[category]?.[key] || {
    title: "Information",
    content: "Tooltip content not available."
  }
}

// Helper function to get all tooltips for a category
export const getCategoryTooltips = (category) => {
  return TOOLTIP_CONTENT[category] || {}
}

// Helper function to check if tooltip exists
export const hasTooltip = (category, key) => {
  return !!(TOOLTIP_CONTENT[category]?.[key])
}
