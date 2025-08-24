import React, { useState } from 'react';

// Strategy database
const STRATEGIES = {
  'Trend Following': {
    description: 'Strategies that capitalize on market trends by buying during uptrends and selling during downtrends.',
    difficulty: 'Intermediate',
    risk: 'Medium',
    timeHorizon: 'Medium to Long-term',
    strategies: [
      {
        name: 'Moving Average Crossover',
        description: 'Buy when fast MA crosses above slow MA, sell when it crosses below.',
        setup: [
          'Use 20-period and 50-period moving averages',
          'Buy when 20 MA crosses above 50 MA',
          'Sell when 20 MA crosses below 50 MA',
          'Use stop loss below recent swing low'
        ],
        pros: ['Simple to implement', 'Works well in trending markets', 'Clear entry/exit signals'],
        cons: ['Lags in choppy markets', 'Can generate false signals', 'Requires trend confirmation'],
        riskManagement: 'Use 2% risk per trade, trailing stops'
      }
    ]
  },
  'Mean Reversion': {
    description: 'Strategies that bet on price returning to its average or fair value after extreme moves.',
    difficulty: 'Advanced',
    risk: 'High',
    timeHorizon: 'Short to Medium-term',
    strategies: [
      {
        name: 'RSI Oversold/Overbought',
        description: 'Buy when RSI indicates oversold conditions, sell when overbought.',
        setup: [
          'Use 14-period RSI',
          'Buy when RSI crosses above 30 from oversold',
          'Sell when RSI crosses below 70 from overbought',
          'Use additional confirmation from price action'
        ],
        pros: ['Good for range-bound markets', 'Clear entry/exit levels', 'Can catch reversals'],
        cons: ['Can stay oversold/overbought', 'Requires trend context', 'False signals in strong trends'],
        riskManagement: 'Use tight stops, confirm with price action'
      }
    ]
  }
};

// Risk Management Guide
const RISK_MANAGEMENT = {
  'Position Sizing': {
    description: 'Determine how much capital to risk on each trade.',
    rules: [
      'Never risk more than 1-2% of your account per trade',
      'Calculate position size based on stop loss distance',
      'Consider correlation between positions',
      'Adjust size based on volatility (ATR)'
    ],
    formula: 'Position Size = (Account Risk %) × Account Size / Stop Loss Distance'
  },
  'Stop Losses': {
    description: 'Automatically exit losing trades to limit downside.',
    types: [
      'Fixed Stop: Set at predetermined price level',
      'Trailing Stop: Moves with profitable trades',
      'Time Stop: Exit if trade doesn\'t work within timeframe',
      'Volatility Stop: Based on ATR or other volatility measures'
    ]
  },
  'Risk/Reward Ratio': {
    description: 'Ensure potential profit outweighs potential loss.',
    guidelines: [
      'Aim for minimum 1:2 risk/reward ratio',
      'Consider win rate when calculating expected value',
      'Account for slippage and commissions',
      'Adjust based on market conditions'
    ]
  }
};

function StrategyWiki() {
  const [selectedCategory, setSelectedCategory] = useState('Trend Following');

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return '#22c55e';
      case 'Intermediate': return '#f59e0b';
      case 'Advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Low': return '#22c55e';
      case 'Medium': return '#f59e0b';
      case 'High': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{
      padding: '24px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    }}>
      <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: 'bold' }}>
        Strategy Wiki
      </h2>

      {/* Category Tabs */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '20px'
        }}>
          {Object.keys(STRATEGIES).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: '12px 24px',
                backgroundColor: selectedCategory === category ? '#3b82f6' : 'transparent',
                color: selectedCategory === category ? 'white' : '#6b7280',
                border: 'none',
                cursor: 'pointer',
                fontWeight: selectedCategory === category ? 'bold' : 'normal',
                borderBottom: selectedCategory === category ? '2px solid #3b82f6' : 'none'
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Category Content */}
        {STRATEGIES[selectedCategory] && (
          <div>
            <div style={{
              padding: '20px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                  {selectedCategory}
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{
                    padding: '4px 8px',
                    backgroundColor: getDifficultyColor(STRATEGIES[selectedCategory].difficulty),
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {STRATEGIES[selectedCategory].difficulty}
                  </span>
                  <span style={{
                    padding: '4px 8px',
                    backgroundColor: getRiskColor(STRATEGIES[selectedCategory].risk),
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {STRATEGIES[selectedCategory].risk} Risk
                  </span>
                </div>
              </div>
              <p style={{ margin: '0 0 8px 0', color: '#374151' }}>
                {STRATEGIES[selectedCategory].description}
              </p>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                Time Horizon: {STRATEGIES[selectedCategory].timeHorizon}
              </p>
            </div>

            {/* Strategies */}
            {STRATEGIES[selectedCategory].strategies.map((strategy, index) => (
              <div key={index} style={{
                padding: '20px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 'bold' }}>
                  {strategy.name}
                </h4>
                <p style={{ margin: '0 0 16px 0', color: '#374151' }}>
                  {strategy.description}
                </p>

                <div style={{ marginBottom: '16px' }}>
                  <h5 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
                    Setup Steps:
                  </h5>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {strategy.setup.map((step, stepIndex) => (
                      <li key={stepIndex} style={{ marginBottom: '4px', color: '#374151' }}>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold', color: '#15803d' }}>
                      Pros:
                    </h5>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {strategy.pros.map((pro, proIndex) => (
                        <li key={proIndex} style={{ marginBottom: '4px', color: '#374151' }}>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold', color: '#dc2626' }}>
                      Cons:
                    </h5>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {strategy.cons.map((con, conIndex) => (
                        <li key={conIndex} style={{ marginBottom: '4px', color: '#374151' }}>
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div style={{
                  padding: '12px',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #3b82f6',
                  borderRadius: '6px'
                }}>
                  <strong style={{ color: '#1e40af' }}>Risk Management:</strong>
                  <span style={{ marginLeft: '8px', color: '#374151' }}>
                    {strategy.riskManagement}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Risk Management Section */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold' }}>
          Risk Management Guide
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {Object.entries(RISK_MANAGEMENT).map(([topic, data]) => (
            <div key={topic} style={{
              padding: '20px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 'bold' }}>
                {topic}
              </h4>
              <p style={{ margin: '0 0 16px 0', color: '#374151' }}>
                {data.description}
              </p>
              
              {data.rules && (
                <div style={{ marginBottom: '16px' }}>
                  <h5 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
                    Rules:
                  </h5>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {data.rules.map((rule, index) => (
                      <li key={index} style={{ marginBottom: '4px', color: '#374151' }}>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {data.types && (
                <div style={{ marginBottom: '16px' }}>
                  <h5 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
                    Types:
                  </h5>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {data.types.map((type, index) => (
                      <li key={index} style={{ marginBottom: '4px', color: '#374151' }}>
                        {type}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {data.guidelines && (
                <div style={{ marginBottom: '16px' }}>
                  <h5 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
                    Guidelines:
                  </h5>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {data.guidelines.map((guideline, index) => (
                      <li key={index} style={{ marginBottom: '4px', color: '#374151' }}>
                        {guideline}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {data.formula && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontFamily: 'monospace'
                }}>
                  <strong>Formula:</strong> {data.formula}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StrategyWiki;
