import React, { useState, useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

const SIP = (import.meta.env.VITE_SIP_URL) || 'http://localhost:8002';

// Predefined stock symbols for quick access
const POPULAR_STOCKS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
  'JPM', 'JNJ', 'V', 'PG', 'UNH', 'HD', 'MA', 'DIS', 'PYPL', 'ADBE'
];

// Technical indicators
const TECHNICAL_INDICATORS = {
  'SMA': { name: 'Simple Moving Average', periods: [20, 50, 200] },
  'EMA': { name: 'Exponential Moving Average', periods: [12, 26, 50] },
  'RSI': { name: 'Relative Strength Index', periods: [14] },
  'MACD': { name: 'MACD', periods: [12, 26, 9] },
  'BB': { name: 'Bollinger Bands', periods: [20, 2] },
  'ATR': { name: 'Average True Range', periods: [14] }
};

function ChartSubsystem() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [searchResults, setSearchResults] = useState([]);
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('1D');
  const [selectedIndicators, setSelectedIndicators] = useState(['SMA', 'RSI']);
  const [chartInstance, setChartInstance] = useState(null);
  const [technicalAnalysis, setTechnicalAnalysis] = useState({});
  const [showVolume, setShowVolume] = useState(true);
  const [showIndicators, setShowIndicators] = useState(true);
  
  const chartRef = useRef(null);

  // Search for stocks
  const searchStocks = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      // Simulate stock search - in real implementation, this would call a stock search API
      const results = POPULAR_STOCKS
        .filter(stock => stock.toLowerCase().includes(query.toLowerCase()))
        .map(stock => ({
          symbol: stock,
          name: `${stock} Corporation`, // Mock company names
          exchange: 'NASDAQ',
          type: 'Stock'
        }))
        .slice(0, 10);

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  // Fetch stock data
  const fetchStockData = async (symbol) => {
    if (!symbol) return;

    setLoading(true);
    try {
      console.log('Fetching data for symbol:', symbol);
      
      // Try to fetch market data from SIP
      let data = null;
      try {
        const response = await fetch(`${SIP}/market-data/${symbol}`);
        if (response.ok) {
          data = await response.json();
          console.log('SIP data received:', data);
        }
      } catch (sipError) {
        console.log('SIP service not available, using mock data');
      }

      // If SIP data is not available, generate mock data
      if (!data) {
        data = generateMockStockData(symbol);
        console.log('Generated mock data:', data);
      }

      // Generate mock historical data for charting
      const historicalData = generateMockHistoricalData(symbol, data);
      console.log('Generated historical data, length:', historicalData.length);
      
      // Set all data at once to prevent multiple re-renders
      const completeData = {
        ...data,
        historical: historicalData
      };
      
      console.log('Setting complete stock data:', completeData);
      setStockData(completeData);
      
      // Perform technical analysis
      performTechnicalAnalysis(historicalData);
    } catch (error) {
      console.error('Fetch stock data error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock stock data
  const generateMockStockData = (symbol) => {
    const basePrice = 100 + Math.random() * 200;
    const change = (Math.random() - 0.5) * 10;
    const changePercent = (change / basePrice) * 100;
    
    return {
      symbol: symbol,
      price: basePrice,
      change: change,
      change_percent: changePercent,
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      market_cap: Math.floor(Math.random() * 1000000000000) + 10000000000,
      pe_ratio: Math.random() * 50 + 10,
      dividend_yield: Math.random() * 5,
      bid: basePrice - 0.01,
      ask: basePrice + 0.01,
      bid_sz: Math.floor(Math.random() * 1000) + 100,
      ask_sz: Math.floor(Math.random() * 1000) + 100
    };
  };

  // Generate mock historical data
  const generateMockHistoricalData = (symbol, currentData) => {
    const data = [];
    const basePrice = currentData.price || 150;
    let currentPrice = basePrice;
    const now = new Date();
    
    // Generate 100 data points
    for (let i = 99; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      
      // Add some randomness to price movement
      const change = (Math.random() - 0.5) * 2;
      currentPrice = Math.max(currentPrice + change, 1);
      
      const volume = Math.floor(Math.random() * 1000000) + 100000;
      
      data.push({
        time: Math.floor(date.getTime() / 1000),
        open: currentPrice - (Math.random() - 0.5) * 1,
        high: currentPrice + Math.random() * 2,
        low: currentPrice - Math.random() * 2,
        close: currentPrice,
        volume: volume
      });
    }
    
    return data;
  };

  // Perform technical analysis
  const performTechnicalAnalysis = (historicalData) => {
    if (!historicalData || historicalData.length === 0) return;

    const closes = historicalData.map(d => d.close);
    const volumes = historicalData.map(d => d.volume);

    // Calculate SMA
    const sma20 = calculateSMA(closes, 20);
    const sma50 = calculateSMA(closes, 50);

    // Calculate RSI
    const rsi = calculateRSI(closes, 14);

    // Calculate MACD
    const macd = calculateMACD(closes);

    // Calculate Bollinger Bands
    const bb = calculateBollingerBands(closes, 20, 2);

    setTechnicalAnalysis({
      sma20: sma20[sma20.length - 1],
      sma50: sma50[sma50.length - 1],
      rsi: rsi[rsi.length - 1],
      macd: macd.macd[macd.macd.length - 1],
      macd_signal: macd.signal[macd.signal.length - 1],
      macd_histogram: macd.histogram[macd.histogram.length - 1],
      bb_upper: bb.upper[bb.upper.length - 1],
      bb_middle: bb.middle[bb.middle.length - 1],
      bb_lower: bb.lower[bb.lower.length - 1],
      volume_avg: calculateSMA(volumes, 20)[volumes.length - 1]
    });
  };

  // Technical indicator calculations
  const calculateSMA = (data, period) => {
    const sma = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  };

  const calculateRSI = (data, period) => {
    const rsi = [];
    for (let i = 1; i < data.length; i++) {
      const gains = [];
      const losses = [];
      
      for (let j = Math.max(0, i - period + 1); j <= i; j++) {
        const change = data[j] - data[j - 1];
        if (change > 0) {
          gains.push(change);
          losses.push(0);
        } else {
          gains.push(0);
          losses.push(-change);
        }
      }
      
      const avgGain = gains.reduce((a, b) => a + b, 0) / gains.length;
      const avgLoss = losses.reduce((a, b) => a + b, 0) / losses.length;
      
      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }
    return rsi;
  };

  const calculateMACD = (data) => {
    const ema12 = calculateEMA(data, 12);
    const ema26 = calculateEMA(data, 26);
    
    const macd = [];
    for (let i = 0; i < Math.min(ema12.length, ema26.length); i++) {
      macd.push(ema12[i] - ema26[i]);
    }
    
    const signal = calculateEMA(macd, 9);
    const histogram = [];
    
    for (let i = 0; i < Math.min(macd.length, signal.length); i++) {
      histogram.push(macd[i] - signal[i]);
    }
    
    return { macd, signal, histogram };
  };

  const calculateEMA = (data, period) => {
    const ema = [];
    const multiplier = 2 / (period + 1);
    
    // First EMA is SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += data[i];
    }
    ema.push(sum / period);
    
    // Calculate EMA
    for (let i = period; i < data.length; i++) {
      ema.push((data[i] * multiplier) + (ema[ema.length - 1] * (1 - multiplier)));
    }
    
    return ema;
  };

  const calculateBollingerBands = (data, period, stdDev) => {
    const sma = calculateSMA(data, period);
    const upper = [];
    const lower = [];
    const middle = [];
    
    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = sma[i - period + 1];
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      upper.push(mean + (standardDeviation * stdDev));
      lower.push(mean - (standardDeviation * stdDev));
      middle.push(mean);
    }
    
    return { upper, lower, middle };
  };

  // Initialize chart
  const initializeChart = () => {
    if (!chartRef.current || !stockData || !stockData.historical) return;

    // Clear existing chart
    if (chartInstance) {
      chartInstance.remove();
    }

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 500,
      layout: {
        backgroundColor: '#ffffff',
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#cccccc',
      },
      timeScale: {
        borderColor: '#cccccc',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Create candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Add volume series
    if (showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
      volumeSeries.setData(stockData.historical.map(d => ({
        time: d.time,
        value: d.volume,
        color: d.close > d.open ? '#26a69a' : '#ef5350'
      })));
    }

    // Add technical indicators
    if (showIndicators && selectedIndicators.includes('SMA')) {
      const closes = stockData.historical.map(d => d.close);
      const sma20 = calculateSMA(closes, 20);
      const sma50 = calculateSMA(closes, 50);

      // SMA 20
      const sma20Series = chart.addLineSeries({
        color: '#2196F3',
        lineWidth: 2,
        title: 'SMA 20',
      });
      sma20Series.setData(stockData.historical.slice(19).map((d, i) => ({
        time: d.time,
        value: sma20[i]
      })));

      // SMA 50
      const sma50Series = chart.addLineSeries({
        color: '#FF9800',
        lineWidth: 2,
        title: 'SMA 50',
      });
      sma50Series.setData(stockData.historical.slice(49).map((d, i) => ({
        time: d.time,
        value: sma50[i]
      })));
    }

    // Set candlestick data
    candlestickSeries.setData(stockData.historical);

    setChartInstance(chart);

    // Handle resize
    const handleResize = () => {
      chart.applyOptions({
        width: chartRef.current.clientWidth,
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  };

  // Event handlers
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    searchStocks(value);
  };

  const handleSymbolSelect = (symbol) => {
    setSelectedSymbol(symbol);
    setSearchResults([]);
    setSearchTerm('');
    fetchStockData(symbol);
  };

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
    fetchStockData(selectedSymbol);
  };

  const handleIndicatorToggle = (indicator) => {
    setSelectedIndicators(prev => 
      prev.includes(indicator) 
        ? prev.filter(i => i !== indicator)
        : [...prev, indicator]
    );
  };

  // Effects
  useEffect(() => {
    fetchStockData(selectedSymbol);
  }, [selectedSymbol]);

  useEffect(() => {
    if (stockData && stockData.historical) {
      initializeChart();
    }
  }, [stockData, showVolume, showIndicators, selectedIndicators]);

  return (
    <div style={{ padding: '16px' }}>
      <div style={{
        display: 'grid',
        gap: '16px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: '#ffffff'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '24px' }}>📊</div>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Chart Analysis</h2>
            </div>
            <div style={{
              padding: '4px 8px',
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              Real-time Data
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div style={{
          padding: '16px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: '#ffffff'
        }}>
          <div style={{ display: 'grid', gap: '16px' }}>
            {/* Search Input */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search for stocks (e.g., AAPL, MSFT)"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
                <button
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  🔍
                </button>
              </div>
              
              <select
                value={timeframe}
                onChange={(e) => handleTimeframeChange(e.target.value)}
                style={{
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px',
                  width: '150px'
                }}
              >
                <option value="1D">1 Day</option>
                <option value="1W">1 Week</option>
                <option value="1M">1 Month</option>
                <option value="3M">3 Months</option>
                <option value="6M">6 Months</option>
                <option value="1Y">1 Year</option>
              </select>
              
              <button
                onClick={() => fetchStockData(selectedSymbol)}
                disabled={loading}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  fontSize: '16px'
                }}
              >
                {loading ? 'Loading...' : '🔄'}
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                backgroundColor: '#f9fafb'
              }}>
                {searchResults.map((stock, index) => (
                  <div
                    key={index}
                    onClick={() => handleSymbolSelect(stock.symbol)}
                    style={{
                      padding: '12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #e5e7eb',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{stock.symbol}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{stock.name}</div>
                    </div>
                    <div style={{
                      padding: '2px 8px',
                      backgroundColor: '#22c55e',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      {stock.exchange}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Popular Stocks */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#6b7280' }}>Popular Stocks</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {POPULAR_STOCKS.slice(0, 8).map(stock => (
                  <button
                    key={stock}
                    onClick={() => handleSymbolSelect(stock)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: selectedSymbol === stock ? '#3b82f6' : '#f3f4f6',
                      color: selectedSymbol === stock ? 'white' : '#374151',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    {stock}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chart Controls */}
        <div style={{
          padding: '16px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: '#ffffff'
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Indicators</h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {Object.entries(TECHNICAL_INDICATORS).map(([key, indicator]) => (
                  <button
                    key={key}
                    onClick={() => handleIndicatorToggle(key)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: selectedIndicators.includes(key) ? '#3b82f6' : '#f3f4f6',
                      color: selectedIndicators.includes(key) ? 'white' : '#374151',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '10px'
                    }}
                  >
                    {indicator.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Display</h4>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowVolume(!showVolume)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: showVolume ? '#3b82f6' : '#f3f4f6',
                    color: showVolume ? 'white' : '#374151',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '10px'
                  }}
                >
                  Volume
                </button>
                <button
                  onClick={() => setShowIndicators(!showIndicators)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: showIndicators ? '#3b82f6' : '#f3f4f6',
                    color: showIndicators ? 'white' : '#374151',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '10px'
                  }}
                >
                  Indicators
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div style={{
          padding: '16px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: '#ffffff'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 8px 0' }}>{selectedSymbol} Chart</h3>
            {stockData && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', fontSize: '12px' }}>
                <div>Price: ${stockData.price?.toFixed(2) || 'N/A'}</div>
                <div style={{ color: stockData.change >= 0 ? '#22c55e' : '#ef4444' }}>
                  Change: {stockData.change >= 0 ? '+' : ''}{stockData.change?.toFixed(2) || 'N/A'} ({stockData.change_percent?.toFixed(2) || 'N/A'}%)
                </div>
                <div>Volume: {stockData.volume?.toLocaleString() || 'N/A'}</div>
                <div>Market Cap: ${stockData.market_cap?.toLocaleString() || 'N/A'}</div>
              </div>
            )}
          </div>
          
          <div 
            ref={chartRef}
            style={{
              width: '100%',
              height: '500px',
              border: '1px solid #e5e7eb',
              borderRadius: '4px'
            }}
          />
        </div>

        {/* Technical Analysis */}
        {Object.keys(technicalAnalysis).length > 0 && (
          <div style={{
            padding: '16px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: '#ffffff'
          }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Technical Analysis</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{
                padding: '12px',
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>SMA 20</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>${technicalAnalysis.sma20?.toFixed(2) || 'N/A'}</div>
              </div>
              
              <div style={{
                padding: '12px',
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>SMA 50</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>${technicalAnalysis.sma50?.toFixed(2) || 'N/A'}</div>
              </div>
              
              <div style={{
                padding: '12px',
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>RSI (14)</div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: technicalAnalysis.rsi > 70 ? '#ef4444' : technicalAnalysis.rsi < 30 ? '#22c55e' : '#374151'
                }}>
                  {technicalAnalysis.rsi?.toFixed(2) || 'N/A'}
                </div>
              </div>
              
              <div style={{
                padding: '12px',
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>MACD</div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: technicalAnalysis.macd_histogram > 0 ? '#22c55e' : '#ef4444'
                }}>
                  {technicalAnalysis.macd?.toFixed(4) || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChartSubsystem;
