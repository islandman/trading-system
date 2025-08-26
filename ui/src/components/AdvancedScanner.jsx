import React, { useState, useEffect } from 'react'

const BROKER = (import.meta.env.VITE_BROKER_URL) || 'http://localhost:8000'
const SIP = (import.meta.env.VITE_SIP_URL) || 'http://localhost:8002'

function AdvancedScanner({ marketData }) {
  const [scannerResults, setScannerResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [presets, setPresets] = useState({})
  const [selectedPreset, setSelectedPreset] = useState('')
  const [activeTab, setActiveTab] = useState('orders') // 'orders' or 'scanner'
  const [filters, setFilters] = useState({
    min_price: 0,
    max_price: 10000,
    min_volume: 0,
    min_market_cap: 0,
    max_market_cap: 1000000000000,
    min_pe: 0,
    max_pe: 100,
    min_dividend_yield: 0,
    max_dividend_yield: 20,
    min_beta: 0,
    max_beta: 5,
    sectors: '',
    min_rsi: 0,
    max_rsi: 100,
    min_macd: -10,
    max_macd: 10,
    price_change_min: -50,
    price_change_max: 50,
    volatility_min: 0,
    volatility_max: 1
  })

  // Advanced Order Form State
  const [orderForm, setOrderForm] = useState({
    symbol: 'AAPL',
    side: 'BUY',
    order_type: 'MARKET',
    qty: 100,
    limit_price: '',
    stop_price: '',
    trailing_percent: '',
    profit_target: '',
    stop_loss: '',
    tif: 'DAY',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const loadPresets = async () => {
    try {
      const response = await fetch(`${SIP}/scanner/presets`)
      if (response.ok) {
        const data = await response.json()
        setPresets(data.presets || {})
      }
    } catch (error) {
      console.error('Failed to load presets:', error)
    }
  }

  const runAdvancedScanner = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          params.append(key, value)
        }
      })
      
      const response = await fetch(`${SIP}/scanner/advanced?${params}`)
      if (response.ok) {
        const data = await response.json()
        setScannerResults(data.scanner_results || [])
      }
    } catch (error) {
      console.error('Advanced scanner error:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyPreset = (presetName) => {
    if (presets[presetName]) {
      setFilters(prev => ({ ...prev, ...presets[presetName].filters }))
      setSelectedPreset(presetName)
    }
  }

  const handleOrderSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const body = { 
        symbol: orderForm.symbol.toUpperCase(), 
        side: orderForm.side, 
        order_type: orderForm.order_type, 
        qty: Number(orderForm.qty), 
        tif: orderForm.tif,
        notes: orderForm.notes
      }
      
      // Add conditional fields based on order type
      if (orderForm.limit_price) {
        body.limit_price = Number(orderForm.limit_price)
      }
      if (orderForm.stop_price) {
        body.stop_price = Number(orderForm.stop_price)
      }
      if (orderForm.trailing_percent) {
        body.trailing_percent = Number(orderForm.trailing_percent)
      }
      if (orderForm.profit_target) {
        body.profit_target = Number(orderForm.profit_target)
      }
      if (orderForm.stop_loss) {
        body.stop_loss = Number(orderForm.stop_loss)
      }
      
      const response = await fetch(`${BROKER}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`Order submitted successfully! Order ID: ${result.id}`)
        // Reset form
        setOrderForm({
          symbol: 'AAPL',
          side: 'BUY',
          order_type: 'MARKET',
          qty: 100,
          limit_price: '',
          stop_price: '',
          trailing_percent: '',
          profit_target: '',
          stop_loss: '',
          tif: 'DAY',
          notes: ''
        })
      } else {
        const error = await response.json()
        alert(`Order failed: ${error.detail}`)
      }
    } catch (error) {
      console.error('Order submission error:', error)
      alert('Failed to submit order')
    } finally {
      setSubmitting(false)
    }
  }

  const formatMarketCap = (cap) => {
    if (cap >= 1e12) return `${(cap / 1e12).toFixed(1)}T`
    if (cap >= 1e9) return `${(cap / 1e9).toFixed(1)}B`
    if (cap >= 1e6) return `${(cap / 1e6).toFixed(1)}M`
    return cap.toLocaleString()
  }

  useEffect(() => {
    loadPresets()
    runAdvancedScanner()
  }, [])

  return (
    <div style={{
      padding: '16px',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      backgroundColor: 'var(--bg-primary)'
    }}>
      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        marginBottom: '16px',
        backgroundColor: 'var(--bg-tertiary)',
        borderRadius: '6px',
        overflow: 'hidden'
      }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'orders' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'orders' ? 'white' : 'var(--text-secondary)',
            border: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'orders' ? 'bold' : 'normal'
          }}
        >
          Advanced Orders
        </button>
        <button
          onClick={() => setActiveTab('scanner')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'scanner' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'scanner' ? 'white' : 'var(--text-secondary)',
            border: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'scanner' ? 'bold' : 'normal'
          }}
        >
          Stock Scanner
        </button>
      </div>

      {/* Advanced Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Advanced Order Processing</h3>
          
          <form onSubmit={handleOrderSubmit} style={{
            display: 'grid',
            gap: '16px',
            padding: '16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            {/* Basic Order Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-primary)' }}>Symbol</label>
                <input 
                  type="text"
                  value={orderForm.symbol}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, symbol: e.target.value }))}
                  style={{ 
                    padding: '8px', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '4px', 
                    width: '100%',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-primary)' }}>Side</label>
                <select 
                  value={orderForm.side}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, side: e.target.value }))}
                  style={{ 
                    padding: '8px', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '4px', 
                    width: '100%',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-primary)' }}>Order Type</label>
                <select 
                  value={orderForm.order_type}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, order_type: e.target.value }))}
                  style={{ 
                    padding: '8px', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '4px', 
                    width: '100%',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="MARKET">MARKET</option>
                  <option value="LIMIT">LIMIT</option>
                  <option value="STOP">STOP</option>
                  <option value="STOP_LIMIT">STOP LIMIT</option>
                  <option value="TRAILING_STOP">TRAILING STOP</option>
                  <option value="TRAILING_STOP_LIMIT">TRAILING STOP LIMIT</option>
                  <option value="OCO">OCO (One-Cancels-Other)</option>
                  <option value="BRACKET">BRACKET</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-primary)' }}>Quantity</label>
                <input 
                  type="number"
                  value={orderForm.qty}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, qty: e.target.value }))}
                  style={{ 
                    padding: '8px', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '4px', 
                    width: '100%',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>

            {/* Conditional Fields Based on Order Type */}
            {(orderForm.order_type === 'LIMIT' || orderForm.order_type === 'STOP_LIMIT' || orderForm.order_type === 'TRAILING_STOP_LIMIT') && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Limit Price</label>
                <input 
                  type="number"
                  step="0.01"
                  value={orderForm.limit_price}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, limit_price: e.target.value }))}
                  style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '200px' }}
                />
              </div>
            )}

            {(orderForm.order_type === 'STOP' || orderForm.order_type === 'STOP_LIMIT') && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Stop Price</label>
                <input 
                  type="number"
                  step="0.01"
                  value={orderForm.stop_price}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, stop_price: e.target.value }))}
                  style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '200px' }}
                />
              </div>
            )}

            {(orderForm.order_type === 'TRAILING_STOP' || orderForm.order_type === 'TRAILING_STOP_LIMIT') && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Trailing Percent</label>
                <input 
                  type="number"
                  step="0.1"
                  value={orderForm.trailing_percent}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, trailing_percent: e.target.value }))}
                  style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '200px' }}
                />
              </div>
            )}

            {orderForm.order_type === 'OCO' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Limit Price</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={orderForm.limit_price}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, limit_price: e.target.value }))}
                    style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Stop Price</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={orderForm.stop_price}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, stop_price: e.target.value }))}
                    style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '100%' }}
                  />
                </div>
              </div>
            )}

            {orderForm.order_type === 'BRACKET' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Profit Target</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={orderForm.profit_target}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, profit_target: e.target.value }))}
                    style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Stop Loss</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={orderForm.stop_loss}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, stop_loss: e.target.value }))}
                    style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '100%' }}
                  />
                </div>
              </div>
            )}

            {/* Time in Force */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Time in Force</label>
              <select 
                value={orderForm.tif}
                onChange={(e) => setOrderForm(prev => ({ ...prev, tif: e.target.value }))}
                style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '200px' }}
              >
                <option value="DAY">DAY</option>
                <option value="GTC">GTC (Good Till Canceled)</option>
                <option value="IOC">IOC (Immediate or Cancel)</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Notes</label>
              <textarea 
                value={orderForm.notes}
                onChange={(e) => setOrderForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional trading notes..."
                style={{ 
                  padding: '8px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '4px', 
                  width: '100%',
                  minHeight: '60px',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={submitting}
              style={{
                padding: '12px 24px',
                backgroundColor: orderForm.side === 'BUY' ? 'var(--accent-success)' : 'var(--accent-danger)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.6 : 1
              }}
            >
              {submitting ? 'Submitting...' : `Submit ${orderForm.order_type} Order`}
            </button>
          </form>
        </div>
      )}

      {/* Stock Scanner Tab */}
      {activeTab === 'scanner' && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Advanced Stock Scanner</h3>
            <button
              onClick={runAdvancedScanner}
              disabled={loading}
              style={{
                padding: '8px 12px',
                backgroundColor: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Scanning...' : 'Run Scanner'}
            </button>
          </div>

          {/* Presets */}
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '6px',
            border: '1px solid var(--border-color)'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-primary)' }}>Quick Presets</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {Object.entries(presets).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: selectedPreset === key ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                    color: selectedPreset === key ? 'white' : 'var(--text-primary)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Filters */}
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '6px',
            border: '1px solid var(--border-color)'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-primary)' }}>Advanced Filters</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-primary)' }}>Price Range</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.min_price}
                    onChange={(e) => setFilters(prev => ({ ...prev, min_price: parseFloat(e.target.value) || 0 }))}
                    style={{ 
                      padding: '4px 8px', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '4px', 
                      width: '80px',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <span style={{ alignSelf: 'center', color: 'var(--text-primary)' }}>-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.max_price}
                    onChange={(e) => setFilters(prev => ({ ...prev, max_price: parseFloat(e.target.value) || 10000 }))}
                    style={{ 
                      padding: '4px 8px', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '4px', 
                      width: '80px',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Market Cap Range</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.min_market_cap}
                    onChange={(e) => setFilters(prev => ({ ...prev, min_market_cap: parseFloat(e.target.value) || 0 }))}
                    style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '80px' }}
                  />
                  <span style={{ alignSelf: 'center' }}>-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.max_market_cap}
                    onChange={(e) => setFilters(prev => ({ ...prev, max_market_cap: parseFloat(e.target.value) || 1000000000000 }))}
                    style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '80px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>P/E Ratio Range</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.min_pe}
                    onChange={(e) => setFilters(prev => ({ ...prev, min_pe: parseFloat(e.target.value) || 0 }))}
                    style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '80px' }}
                  />
                  <span style={{ alignSelf: 'center' }}>-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.max_pe}
                    onChange={(e) => setFilters(prev => ({ ...prev, max_pe: parseFloat(e.target.value) || 100 }))}
                    style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '80px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>RSI Range</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.min_rsi}
                    onChange={(e) => setFilters(prev => ({ ...prev, min_rsi: parseFloat(e.target.value) || 0 }))}
                    style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '80px' }}
                  />
                  <span style={{ alignSelf: 'center' }}>-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.max_rsi}
                    onChange={(e) => setFilters(prev => ({ ...prev, max_rsi: parseFloat(e.target.value) || 100 }))}
                    style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '80px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Min Volume</label>
                <input
                  type="number"
                  placeholder="Min Volume"
                  value={filters.min_volume}
                  onChange={(e) => setFilters(prev => ({ ...prev, min_volume: parseInt(e.target.value) || 0 }))}
                  style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Sectors (comma-separated)</label>
                <input
                  type="text"
                  placeholder="Technology, Healthcare, Financial"
                  value={filters.sectors}
                  onChange={(e) => setFilters(prev => ({ ...prev, sectors: e.target.value }))}
                  style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>Scanning for stocks...</div>
          ) : (
            <div style={{ overflow: 'auto' }}>
              <div style={{ marginBottom: '12px', fontSize: '14px', color: '#6b7280' }}>
                Found {scannerResults.length} stocks matching criteria
              </div>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '12px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Symbol</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Price</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Market Cap</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>P/E</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>RSI</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Volume</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Signals</th>
                  </tr>
                </thead>
                <tbody>
                  {scannerResults.map((result, index) => (
                    <tr key={index} style={{
                      borderBottom: '1px solid #f3f4f6',
                      backgroundColor: result.signals.length > 0 ? '#f0fdf4' : '#ffffff'
                    }}>
                      <td style={{ padding: '8px', fontWeight: 'bold' }}>{result.symbol}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        ${result.price.toFixed(2)}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        ${formatMarketCap(result.market_cap)}
                      </td>
                      <td style={{ 
                        padding: '8px', 
                        textAlign: 'right',
                        color: result.fundamental.pe_ratio < 15 ? '#22c55e' : 
                               result.fundamental.pe_ratio > 50 ? '#ef4444' : '#6b7280'
                      }}>
                        {result.fundamental.pe_ratio.toFixed(1)}
                      </td>
                      <td style={{ 
                        padding: '8px', 
                        textAlign: 'right',
                        color: result.technical.rsi > 70 ? '#ef4444' : 
                               result.technical.rsi < 30 ? '#22c55e' : '#6b7280'
                      }}>
                        {result.technical.rsi.toFixed(1)}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        {result.volume ? result.volume.toLocaleString() : '-'}
                      </td>
                      <td style={{ padding: '8px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {result.signals.map((signal, i) => (
                            <span key={i} style={{
                              padding: '2px 6px',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              borderRadius: '12px',
                              fontSize: '10px'
                            }}>
                              {signal}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdvancedScanner
