import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import EnhancedJournal from './components/EnhancedJournal'
import ChartSubsystem from './components/ChartSubsystem'
import AdvancedScanner from './components/AdvancedScanner'
import Notes from './components/Notes'
import Settings from './components/Settings'
import AdvancedTooltip from './components/AdvancedTooltip'
import Notifications from './components/Notifications'
import { getTooltipContent } from './data/tooltipContent'
import { getWikiContent } from './data/wikiContent'
import './App.css'

// Theme context
const ThemeContext = React.createContext()

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved || 'light'
  })

  useEffect(() => {
    localStorage.setItem('theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

function useTheme() {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Theme toggle button component
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  
  return (
    <button
      onClick={toggleTheme}
      style={{
        background: 'none',
        border: 'none',
        fontSize: '20px',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '6px',
        transition: 'background-color 0.2s',
        color: 'var(--text-color)'
      }}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}

const BROKER = (import.meta.env.VITE_BROKER_URL) || 'http://localhost:8000'
const SIP = (import.meta.env.VITE_SIP_URL) || 'http://localhost:8002'

// Custom hooks for data management
function useBrokerWS() {
  const [updates, setUpdates] = useState([])
  const [connected, setConnected] = useState(false)
  
  useEffect(() => {
    const ws = new WebSocket(BROKER.replace('http', 'ws') + '/ws')
    
    ws.onopen = () => {
      setConnected(true)
      ws.send('hello')
    }
    
    ws.onclose = () => setConnected(false)
    
    ws.onmessage = (e) => {
      try {
        const m = JSON.parse(e.data)
        setUpdates(u => [m, ...u].slice(0, 100))
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }
    
    return () => ws.close()
  }, [])
  
  return { updates, connected }
}

function useOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  
  const fetchOrders = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${BROKER}/orders`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])
  
  return { orders, loading, refetch: fetchOrders }
}

function useMarketData(symbols = ['AAPL', 'MSFT', 'SPY', 'GOOGL', 'TSLA', 'NVDA', 'AMZN', 'META', 'JPM', 'JNJ', 'V', 'PG', 'UNH', 'HD', 'MA', 'DIS', 'PYPL', 'NFLX', 'CRM', 'ADBE', 'INTC', 'ORCL', 'CSCO', 'IBM', 'QCOM', 'TXN', 'AVGO', 'ACN', 'WMT', 'KO', 'PEP', 'ABT', 'TMO', 'DHR', 'LLY', 'PFE', 'MRK', 'ABBV', 'BMY', 'UNP', 'RTX', 'LMT', 'BA', 'CAT', 'DE', 'MMM', 'GE', 'XOM', 'CVX', 'COP', 'EOG', 'SLB', 'KMI', 'PSX', 'VLO', 'MPC', 'OXY']) {
  const [marketData, setMarketData] = useState({})
  const [connections, setConnections] = useState({})
  
  // Use real SIP service data now that it's working
  useEffect(() => {
    const fetchMarketData = async () => {
      const newData = {}
      const newConnections = {}
      
      for (const symbol of symbols) {
        try {
          const response = await fetch(`${SIP}/market-data/${symbol}`)
          if (response.ok) {
            const data = await response.json()
            // The SIP service returns data directly, with NBBO nested
            if (data && data.price) {
              const nbbo = data.nbbo || {}
              newData[symbol] = {
                symbol: symbol,
                price: parseFloat(data.price || 0),
                change: parseFloat(data.change || 0),
                change_percent: parseFloat(data.change_percent || 0),
                volume: parseInt(data.volume || 0),
                bid: parseFloat(nbbo.bid || (data.price ? data.price - 0.05 : 0)),
                ask: parseFloat(nbbo.ask || (data.price ? data.price + 0.05 : 0)),
                bid_sz: parseInt(nbbo.bid_sz || 1000),
                ask_sz: parseInt(nbbo.ask_sz || 1000)
              }
              newConnections[symbol] = true
            }
          } else {
            console.warn(`Failed to fetch data for ${symbol}:`, response.status)
            newConnections[symbol] = false
          }
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error)
          newConnections[symbol] = false
        }
      }
      
      setMarketData(newData)
      setConnections(newConnections)
    }
    
    // Initial fetch
    fetchMarketData()
    
    // Update every 5 seconds
    const interval = setInterval(fetchMarketData, 5000)
    
    return () => clearInterval(interval)
  }, [symbols.join(',')])
  
  return { marketData, connections }
}

// Components
function ConnectionStatus({ connected, type }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '12px',
      color: connected ? '#22c55e' : '#ef4444'
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: connected ? '#22c55e' : '#ef4444'
      }} />
      {type}: {connected ? 'Connected' : 'Disconnected'}
    </div>
  )
}

function MarketDataWidget({ symbol, data, connected }) {
  if (!data) {
    return (
      <div style={{
        padding: '8px',
        border: '1px solid var(--border-color)',
        borderRadius: '4px',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)' }}>{symbol}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Loading...</div>
      </div>
    )
  }

  // Check if data has the required properties
  if (!data.bid || !data.ask) {
    return (
      <div style={{
        padding: '8px',
        border: '1px solid var(--border-color)',
        borderRadius: '4px',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)' }}>{symbol}</div>
        <div style={{ fontSize: '12px', color: 'var(--accent-danger)' }}>No data available</div>
      </div>
    )
  }
  
  const spread = data.ask - data.bid
  const spreadPercent = (spread / data.bid) * 100
  
  return (
    <div style={{
      padding: '8px',
      border: '1px solid var(--border-color)',
      borderRadius: '4px',
      backgroundColor: connected ? 'var(--bg-primary)' : 'var(--bg-secondary)'
    }}>
      <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)' }}>{symbol}</div>
      <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
        ${data.bid.toFixed(2)} x ${data.ask.toFixed(2)}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
        Spread: ${spread.toFixed(2)} ({spreadPercent.toFixed(2)}%)
      </div>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
        Bid: {data.bid_sz || 0} | Ask: {data.ask_sz || 0}
      </div>
    </div>
  )
}

function OrderForm({ onSubmit, marketData }) {
  const [symbol, setSymbol] = useState('AAPL')
  const [side, setSide] = useState('BUY')
  const [orderType, setOrderType] = useState('MARKET')
  const [qty, setQty] = useState(100)
  const [limitPrice, setLimitPrice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const currentPrice = marketData[symbol]
  const suggestedLimit = currentPrice ? 
    (side === 'BUY' ? currentPrice.ask : currentPrice.bid) : ''
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const body = { 
        symbol, 
        side, 
        order_type: orderType, 
        qty: Number(qty), 
        tif: 'DAY' 
      }
      
      if (orderType === 'LIMIT') {
        body.limit_price = Number(limitPrice || suggestedLimit)
      }
      
      const response = await fetch(`${BROKER}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (response.ok) {
        const result = await response.json()
        onSubmit(result)
        // Reset form
        setQty(100)
        setLimitPrice('')
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
  
  return (
    <form onSubmit={handleSubmit} style={{
      display: 'grid',
      gap: '12px',
      padding: '16px',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      backgroundColor: 'var(--bg-primary)'
    }}>
      <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Place Order</h3>
      
      <div style={{ display: 'grid', gap: '8px' }}>
        <label style={{ display: 'grid', gap: '4px', color: 'var(--text-primary)' }}>
          Symbol
          <input 
            value={symbol} 
            onChange={e => setSymbol(e.target.value.toUpperCase())}
            style={{ 
              padding: '8px', 
              border: '1px solid var(--border-color)', 
              borderRadius: '4px',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)'
            }}
          />
        </label>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <label style={{ display: 'grid', gap: '4px', color: 'var(--text-primary)' }}>
            Side
            <select 
              value={side} 
              onChange={e => setSide(e.target.value)}
              style={{ 
                padding: '8px', 
                border: '1px solid var(--border-color)', 
                borderRadius: '4px',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </label>
          
          <label style={{ display: 'grid', gap: '4px', color: 'var(--text-primary)' }}>
            Type
            <select 
              value={orderType} 
              onChange={e => setOrderType(e.target.value)}
              style={{ 
                padding: '8px', 
                border: '1px solid var(--border-color)', 
                borderRadius: '4px',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="MARKET">MARKET</option>
              <option value="LIMIT">LIMIT</option>
            </select>
          </label>
        </div>
        
        {orderType === 'LIMIT' && (
          <label style={{ display: 'grid', gap: '4px', color: 'var(--text-primary)' }}>
            Limit Price
            <input 
              type="number" 
              step="0.01" 
              value={limitPrice} 
              onChange={e => setLimitPrice(e.target.value)}
              placeholder={suggestedLimit ? suggestedLimit.toFixed(2) : ''}
              style={{ 
                padding: '8px', 
                border: '1px solid var(--border-color)', 
                borderRadius: '4px',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
            />
          </label>
        )}
        
        <label style={{ display: 'grid', gap: '4px', color: 'var(--text-primary)' }}>
          Quantity
          <input 
            type="number" 
            value={qty} 
            onChange={e => setQty(e.target.value)}
            style={{ 
              padding: '8px', 
              border: '1px solid var(--border-color)', 
              borderRadius: '4px',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)'
            }}
          />
        </label>
      </div>
      
      <button 
        type="submit" 
        disabled={submitting}
        style={{
          padding: '12px',
          backgroundColor: side === 'BUY' ? 'var(--accent-success)' : 'var(--accent-danger)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontWeight: 'bold',
          cursor: submitting ? 'not-allowed' : 'pointer',
          opacity: submitting ? 0.6 : 1
        }}
      >
        {submitting ? 'Submitting...' : `${side} ${symbol}`}
      </button>
    </form>
  )
}

function OrderBlotter({ orders, loading, onCancelOrder }) {
  if (loading) {
    return <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-primary)' }}>Loading orders...</div>
  }
  
  const handleCancel = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        const response = await fetch(`${BROKER}/orders/${orderId}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          onCancelOrder && onCancelOrder(orderId)
        } else {
          const error = await response.json()
          alert(`Failed to cancel order: ${error.detail}`)
        }
      } catch (error) {
        console.error('Cancel order error:', error)
        alert('Failed to cancel order')
      }
    }
  }
  
  return (
    <div style={{ overflow: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '12px'
      }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Time</th>
            <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>ID</th>
            <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Symbol</th>
            <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Side</th>
            <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Qty</th>
            <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Filled</th>
            <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Status</th>
            <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>AvgPx</th>
            <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id} style={{
              backgroundColor: order.status === 'FILLED' ? 'var(--bg-secondary)' : 
                             order.status === 'REJECTED' ? 'var(--bg-secondary)' : 
                             order.status === 'PARTIAL' ? 'var(--bg-secondary)' : 
                             order.status === 'CANCELED' ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
              borderBottom: '1px solid var(--border-light)',
              color: 'var(--text-primary)'
            }}>
              <td style={{ padding: '8px' }}>{new Date(order.created_at * 1000).toLocaleTimeString()}</td>
              <td style={{ padding: '8px', fontFamily: 'monospace' }}>{order.id.slice(0, 8)}</td>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>{order.symbol}</td>
              <td style={{ 
                padding: '8px', 
                color: order.side === 'BUY' ? 'var(--accent-success)' : 'var(--accent-danger)',
                fontWeight: 'bold'
              }}>{order.side}</td>
              <td style={{ padding: '8px', textAlign: 'right' }}>{order.qty.toLocaleString()}</td>
              <td style={{ padding: '8px', textAlign: 'right' }}>{order.filled_qty.toLocaleString()}</td>
              <td style={{ 
                padding: '8px', 
                textAlign: 'center',
                color: order.status === 'FILLED' ? 'var(--accent-success)' : 
                       order.status === 'REJECTED' ? 'var(--accent-danger)' : 
                       order.status === 'PARTIAL' ? 'var(--accent-warning)' : 
                       order.status === 'CANCELED' ? 'var(--text-secondary)' : 'var(--text-secondary)'
              }}>{order.status}</td>
              <td style={{ padding: '8px', textAlign: 'right' }}>
                {order.avg_price ? `$${order.avg_price.toFixed(2)}` : '-'}
              </td>
              <td style={{ padding: '8px', textAlign: 'center' }}>
                {order.status === 'NEW' || order.status === 'PARTIAL' ? (
                  <button
                    onClick={() => handleCancel(order.id)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: 'var(--accent-danger)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                ) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatsWidget({ stats, loading }) {
  if (loading) {
    return (
      <div style={{
        padding: '16px',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        backgroundColor: 'var(--bg-primary)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Trading Statistics</h3>
        <div style={{ textAlign: 'center', color: 'var(--text-primary)' }}>Loading...</div>
      </div>
    )
  }
  
  if (!stats) return null
  
  return (
    <div style={{
      padding: '16px',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      backgroundColor: 'var(--bg-primary)'
    }}>
      <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Trading Statistics</h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px'
      }}>
        <div style={{
          padding: '12px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-success)' }}>
            {stats.total_orders}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Orders</div>
        </div>
        
        <div style={{
          padding: '12px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-success)' }}>
            {stats.filled_orders}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Filled Orders</div>
        </div>
        
        <div style={{
          padding: '12px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-warning)' }}>
            {stats.pending_orders}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Pending Orders</div>
        </div>
        
        <div style={{
          padding: '12px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-danger)' }}>
            {stats.rejected_orders}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Rejected Orders</div>
        </div>
        
        <div style={{
          padding: '12px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '6px',
          textAlign: 'center',
          gridColumn: 'span 2'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
            {stats.total_volume.toLocaleString()} shares
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Total Volume | ${stats.total_value.toLocaleString()} Value
          </div>
        </div>
      </div>
    </div>
  )
}

function LiveEvents({ updates }) {
  return (
    <div style={{ overflow: 'auto', maxHeight: '300px' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '11px'
      }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <th style={{ padding: '6px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Time</th>
            <th style={{ padding: '6px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Type</th>
            <th style={{ padding: '6px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Symbol</th>
            <th style={{ padding: '6px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Side</th>
            <th style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Qty</th>
            <th style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Filled</th>
            <th style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Status</th>
            <th style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>AvgPx</th>
          </tr>
        </thead>
        <tbody>
          {updates.map((m, i) => {
            if (m.type === 'order_update' && m.data) {
              const order = m.data;
              return (
                <tr key={i} style={{
                  backgroundColor: order.status === 'FILLED' ? 'var(--bg-secondary)' : 
                                 order.status === 'REJECTED' ? 'var(--bg-secondary)' : 
                                 order.status === 'PARTIAL' ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                  borderBottom: '1px solid var(--border-light)',
                  color: 'var(--text-primary)'
                }}>
                  <td style={{ padding: '6px' }}>{new Date(order.created_at * 1000).toLocaleTimeString()}</td>
                  <td style={{ padding: '6px' }}>{m.type}</td>
                  <td style={{ padding: '6px', fontWeight: 'bold' }}>{order.symbol}</td>
                  <td style={{ 
                    padding: '6px', 
                    color: order.side === 'BUY' ? 'var(--accent-success)' : 'var(--accent-danger)'
                  }}>{order.side}</td>
                  <td style={{ padding: '6px', textAlign: 'right' }}>{order.qty}</td>
                  <td style={{ padding: '6px', textAlign: 'right' }}>{order.filled_qty}</td>
                  <td style={{ 
                    padding: '6px', 
                    textAlign: 'center',
                    color: order.status === 'FILLED' ? 'var(--accent-success)' : 
                           order.status === 'REJECTED' ? 'var(--accent-danger)' : 
                           order.status === 'PARTIAL' ? 'var(--accent-warning)' : 'var(--text-secondary)'
                  }}>{order.status}</td>
                  <td style={{ padding: '6px', textAlign: 'right' }}>
                    {order.avg_price ? order.avg_price.toFixed(2) : '-'}
                  </td>
                </tr>
              );
            } else {
              return (
                <tr key={i}>
                  <td colSpan="8" style={{ 
                    padding: '6px', 
                    fontSize: '10px', 
                    fontFamily: 'monospace',
                    color: 'var(--text-secondary)'
                  }}>
                    {JSON.stringify(m)}
                  </td>
                </tr>
              );
            }
          })}
        </tbody>
      </table>
    </div>
  )
}

function PortfolioWidget({ portfolio, loading, marketData }) {
  if (loading) {
    return (
      <div style={{
        padding: '16px',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        backgroundColor: 'var(--bg-primary)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Portfolio</h3>
        <div style={{ textAlign: 'center', color: 'var(--text-primary)' }}>Loading...</div>
      </div>
    )
  }
  
  if (!portfolio || !portfolio.portfolio || portfolio.portfolio.length === 0) {
    return (
      <div style={{
        padding: '16px',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        backgroundColor: 'var(--bg-primary)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Portfolio</h3>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No positions</div>
      </div>
    )
  }
  
  return (
    <div style={{
      padding: '16px',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      backgroundColor: 'var(--bg-primary)'
    }}>
      <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Portfolio</h3>
      
      {/* Portfolio Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={{
          padding: '12px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
            ${portfolio.summary?.total_value?.toLocaleString() || '0'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Position Value</div>
        </div>
        
        <div style={{
          padding: '12px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: portfolio.summary?.total_pnl >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)'
          }}>
            ${portfolio.summary?.total_pnl?.toLocaleString() || '0'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total P&L</div>
        </div>
      </div>
      
      {/* Positions Table */}
      <div style={{ overflow: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '12px'
        }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Symbol</th>
              <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Qty</th>
              <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Avg Price</th>
              <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Market Price</th>
              <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>P&L</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.portfolio.map(position => {
              const marketPrice = marketData[position.symbol]
              const currentPrice = marketPrice ? (marketPrice.bid + marketPrice.ask) / 2 : position.current_price
              const unrealizedPnl = (currentPrice - position.avg_price) * position.shares
              const totalPnl = position.unrealized_pnl + unrealizedPnl
              
              return (
                <tr key={position.symbol} style={{
                  borderBottom: '1px solid var(--border-light)',
                  color: 'var(--text-primary)'
                }}>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>{position.symbol}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{position.shares.toLocaleString()}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>${position.avg_price.toFixed(2)}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>
                    {marketPrice ? `$${currentPrice.toFixed(2)}` : '-'}
                  </td>
                  <td style={{ 
                    padding: '8px', 
                    textAlign: 'right',
                    color: totalPnl >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)',
                    fontWeight: 'bold'
                  }}>
                    ${totalPnl.toFixed(2)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TechnicalScanner({ marketData }) {
  const [scannerResults, setScannerResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [helpData, setHelpData] = useState(null)
  const [showHelp, setShowHelp] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSignal, setSelectedSignal] = useState('all')
  const [selectedPriceRange, setSelectedPriceRange] = useState('all')
  const [selectedVolume, setSelectedVolume] = useState('all')

  const runScanner = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${SIP.replace('/ws/nbbo?symbol=', '')}/scanner/technical`)
      if (response.ok) {
        const data = await response.json()
        setScannerResults(data.scanner_results || [])
      }
    } catch (error) {
      console.error('Scanner error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadHelp = async () => {
    if (!helpData) {
      try {
        const response = await fetch(`${SIP.replace('/ws/nbbo?symbol=', '')}/help/technical`)
        if (response.ok) {
          const data = await response.json()
          setHelpData(data)
        }
      } catch (error) {
        console.error('Help loading error:', error)
      }
    }
    setShowHelp(!showHelp)
  }

  // Filter scanner results
  const filteredResults = scannerResults.filter(result => {
    if (searchTerm && !result.symbol.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    if (selectedSignal !== 'all' && result.signals.length === 0) {
      return false
    }
    if (selectedPriceRange !== 'all') {
      const price = result.price
      switch (selectedPriceRange) {
        case 'under_10': return price < 10
        case '10_50': return price >= 10 && price < 50
        case '50_100': return price >= 50 && price < 100
        case 'over_100': return price >= 100
        default: return true
      }
    }
    if (selectedVolume !== 'all') {
      const volume = result.volume || 0
      switch (selectedVolume) {
        case 'low': return volume < 1000000
        case 'medium': return volume >= 1000000 && volume < 10000000
        case 'high': return volume >= 10000000
        default: return true
      }
    }
    return true
  })

  useEffect(() => {
    runScanner()
    const interval = setInterval(runScanner, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      padding: '16px',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      backgroundColor: 'var(--bg-primary)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Technical Scanner</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={loadHelp}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--text-secondary)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showHelp ? 'Hide Help' : 'Show Help'}
          </button>
          <button
            onClick={runScanner}
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
            {loading ? 'Scanning...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div style={{
        padding: '12px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '6px',
        border: '1px solid var(--border-color)',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-primary)' }}>Search Symbols</label>
            <input
              type="text"
              placeholder="Search by symbol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-primary)' }}>Signal Type</label>
            <select
              value={selectedSignal}
              onChange={(e) => setSelectedSignal(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                width: '100%',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="all">All Signals</option>
              <option value="with_signals">With Signals Only</option>
              <option value="no_signals">No Signals</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-primary)' }}>Price Range</label>
            <select
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                width: '100%',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="all">All Prices</option>
              <option value="under_10">Under $10</option>
              <option value="10_50">$10 - $50</option>
              <option value="50_100">$50 - $100</option>
              <option value="over_100">Over $100</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-primary)' }}>Volume</label>
            <select
              value={selectedVolume}
              onChange={(e) => setSelectedVolume(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                width: '100%',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="all">All Volumes</option>
              <option value="low">Low Volume (&lt;1M)</option>
              <option value="medium">Medium Volume (1M-10M)</option>
              <option value="high">High Volume (&gt;10M)</option>
            </select>
          </div>
        </div>
        
        <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          Showing {filteredResults.length} of {scannerResults.length} results
          {filteredResults.length > 0 && (
            <span style={{ marginLeft: '8px' }}>
              (Scrollable list - {Math.min(filteredResults.length, 20)} items visible)
            </span>
          )}
        </div>
      </div>

      {showHelp && helpData && (
        <div style={{
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '6px',
          border: '1px solid var(--border-color)'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Technical Analysis Guide</h4>
          <div style={{ fontSize: '12px', lineHeight: '1.5', color: 'var(--text-primary)' }}>
            {Object.entries(helpData.indicators).map(([indicator, info]) => (
              <div key={indicator} style={{ marginBottom: '12px' }}>
                <strong style={{ color: 'var(--accent-primary)' }}>{indicator}:</strong> {info.description}
                {info.interpretation && (
                  <div style={{ marginTop: '4px', marginLeft: '12px' }}>
                    <strong>Interpretation:</strong>
                    <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                      {Object.entries(info.interpretation).map(([key, value]) => (
                        <li key={key}>{value}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-primary)' }}>Scanning for technical signals...</div>
      ) : (
        <div style={{ 
          overflow: 'auto',
          maxHeight: '500px',
          border: '1px solid var(--border-color)',
          borderRadius: '4px'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px'
          }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Symbol</th>
                <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Price</th>
                <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Change %</th>
                <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>RSI</th>
                <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>MACD</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Signals</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((result, index) => (
                <tr key={index} style={{
                  borderBottom: '1px solid var(--border-light)',
                  backgroundColor: result.signals.length > 0 ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}>
                  <td style={{ padding: '8px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{result.symbol}</td>
                  <td style={{ 
                    padding: '8px', 
                    textAlign: 'right',
                    color: result.change_percent >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)'
                  }}>
                    ${result.price.toFixed(2)}
                  </td>
                  <td style={{ 
                    padding: '8px', 
                    textAlign: 'right',
                    color: result.change_percent >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)'
                  }}>
                    {result.change_percent >= 0 ? '+' : ''}{result.change_percent.toFixed(2)}%
                  </td>
                  <td style={{ 
                    padding: '8px', 
                    textAlign: 'center',
                    color: result.technical.rsi > 70 ? 'var(--accent-danger)' : 
                           result.technical.rsi < 30 ? 'var(--accent-success)' : 'var(--text-secondary)'
                  }}>
                    {result.technical.rsi.toFixed(1)}
                  </td>
                  <td style={{ 
                    padding: '8px', 
                    textAlign: 'center',
                    color: result.technical.macd_histogram > 0 ? 'var(--accent-success)' : 'var(--accent-danger)'
                  }}>
                    {result.technical.macd_histogram > 0 ? '↑' : '↓'}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {result.signals.map((signal, i) => (
                        <span key={i} style={{
                          padding: '2px 6px',
                          backgroundColor: 'var(--accent-primary)',
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
  )
}

function FundamentalScanner({ marketData }) {
  const [scannerResults, setScannerResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [helpData, setHelpData] = useState(null)
  const [showHelp, setShowHelp] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSignal, setSelectedSignal] = useState('all')
  const [selectedMarketCap, setSelectedMarketCap] = useState('all')
  const [selectedPERatio, setSelectedPERatio] = useState('all')

  const runScanner = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${SIP.replace('/ws/nbbo?symbol=', '')}/scanner/fundamental`)
      if (response.ok) {
        const data = await response.json()
        setScannerResults(data.scanner_results || [])
      }
    } catch (error) {
      console.error('Scanner error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadHelp = async () => {
    if (!helpData) {
      try {
        const response = await fetch(`${SIP.replace('/ws/nbbo?symbol=', '')}/help/fundamental`)
        if (response.ok) {
          const data = await response.json()
          setHelpData(data)
        }
      } catch (error) {
        console.error('Help loading error:', error)
      }
    }
    setShowHelp(!showHelp)
  }

  // Filter scanner results
  const filteredResults = scannerResults.filter(result => {
    if (searchTerm && !result.symbol.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    if (selectedSignal !== 'all' && result.signals.length === 0) {
      return false
    }
    if (selectedMarketCap !== 'all') {
      const marketCap = result.market_cap || 0
      switch (selectedMarketCap) {
        case 'small': return marketCap < 1000000000 // < 1B
        case 'mid': return marketCap >= 1000000000 && marketCap < 10000000000 // 1B-10B
        case 'large': return marketCap >= 10000000000 // > 10B
        default: return true
      }
    }
    if (selectedPERatio !== 'all') {
      const peRatio = result.pe_ratio || 0
      switch (selectedPERatio) {
        case 'low': return peRatio > 0 && peRatio < 15
        case 'medium': return peRatio >= 15 && peRatio < 25
        case 'high': return peRatio >= 25
        case 'negative': return peRatio < 0
        default: return true
      }
    }
    return true
  })

  useEffect(() => {
    runScanner()
    const interval = setInterval(runScanner, 15000) // Refresh every 15 seconds
    return () => clearInterval(interval)
  }, [])

  const formatMarketCap = (cap) => {
    if (cap >= 1e12) return `${(cap / 1e12).toFixed(1)}T`
    if (cap >= 1e9) return `${(cap / 1e9).toFixed(1)}B`
    if (cap >= 1e6) return `${(cap / 1e6).toFixed(1)}M`
    return cap.toLocaleString()
  }

  return (
    <div style={{
      padding: '16px',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      backgroundColor: 'var(--bg-primary)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Fundamental Scanner</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={loadHelp}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--text-secondary)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showHelp ? 'Hide Help' : 'Show Help'}
          </button>
          <button
            onClick={runScanner}
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
            {loading ? 'Scanning...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div style={{
        padding: '12px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '6px',
        border: '1px solid var(--border-color)',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-primary)' }}>Search Symbols</label>
            <input
              type="text"
              placeholder="Search by symbol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-primary)' }}>Signal Type</label>
            <select
              value={selectedSignal}
              onChange={(e) => setSelectedSignal(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                width: '100%',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="all">All Signals</option>
              <option value="with_signals">With Signals Only</option>
              <option value="no_signals">No Signals</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-primary)' }}>Market Cap</label>
            <select
              value={selectedMarketCap}
              onChange={(e) => setSelectedMarketCap(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                width: '100%',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="all">All Market Caps</option>
              <option value="small">Small Cap (&lt;$1B)</option>
              <option value="mid">Mid Cap ($1B-$10B)</option>
              <option value="large">Large Cap (&gt;$10B)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-primary)' }}>P/E Ratio</label>
            <select
              value={selectedPERatio}
              onChange={(e) => setSelectedPERatio(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                width: '100%',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="all">All P/E Ratios</option>
              <option value="low">Low P/E (&lt;15)</option>
              <option value="medium">Medium P/E (15-25)</option>
              <option value="high">High P/E (&gt;25)</option>
              <option value="negative">Negative P/E</option>
            </select>
          </div>
        </div>
        
        <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          Showing {filteredResults.length} of {scannerResults.length} results
          {filteredResults.length > 0 && (
            <span style={{ marginLeft: '8px' }}>
              (Scrollable list - {Math.min(filteredResults.length, 20)} items visible)
            </span>
          )}
        </div>
      </div>

      {showHelp && helpData && (
        <div style={{
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
          maxHeight: '300px',
          overflow: 'auto'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Fundamental Analysis Guide</h4>
          <div style={{ fontSize: '12px', lineHeight: '1.5', color: 'var(--text-primary)' }}>
            {Object.entries(helpData.metrics).map(([category, metrics]) => (
              <div key={category} style={{ marginBottom: '16px' }}>
                <strong style={{ color: 'var(--accent-primary)', fontSize: '14px' }}>{category.replace('_', ' ')}:</strong>
                {Object.entries(metrics).map(([metric, info]) => (
                  <div key={metric} style={{ marginTop: '8px', marginLeft: '12px' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{metric.replace('_', ' ')}:</strong> {info.description}
                    {info.interpretation && (
                      <div style={{ marginTop: '4px', marginLeft: '12px' }}>
                        <strong>Interpretation:</strong>
                        <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                          {Object.entries(info.interpretation).map(([key, value]) => (
                            <li key={key}>{value}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-primary)' }}>Scanning for fundamental signals...</div>
      ) : (
        <div style={{ 
          overflow: 'auto',
          maxHeight: '500px',
          border: '1px solid var(--border-color)',
          borderRadius: '4px'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px'
          }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Symbol</th>
                <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Price</th>
                <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Market Cap</th>
                <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>P/E</th>
                <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>P/B</th>
                <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Div Yield</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Signals</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((result, index) => (
                <tr key={index} style={{
                  borderBottom: '1px solid var(--border-light)',
                  backgroundColor: result.signals.length > 0 ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}>
                  <td style={{ padding: '8px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{result.symbol}</td>
                  <td style={{ padding: '8px', textAlign: 'right', color: 'var(--text-primary)' }}>
                    ${result.price.toFixed(2)}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right', color: 'var(--text-primary)' }}>
                    ${formatMarketCap(result.market_cap)}
                  </td>
                  <td style={{ 
                    padding: '8px', 
                    textAlign: 'right',
                    color: result.fundamental.pe_ratio < 15 ? 'var(--accent-success)' : 
                           result.fundamental.pe_ratio > 50 ? 'var(--accent-danger)' : 'var(--text-secondary)'
                  }}>
                    {result.fundamental.pe_ratio.toFixed(1)}
                  </td>
                  <td style={{ 
                    padding: '8px', 
                    textAlign: 'right',
                    color: result.fundamental.pb_ratio < 1 ? 'var(--accent-success)' : 
                           result.fundamental.pb_ratio > 10 ? 'var(--accent-danger)' : 'var(--text-secondary)'
                  }}>
                    {result.fundamental.pb_ratio.toFixed(2)}
                  </td>
                  <td style={{ 
                    padding: '8px', 
                    textAlign: 'right',
                    color: result.fundamental.dividend_yield > 3 ? 'var(--accent-success)' : 'var(--text-secondary)'
                  }}>
                    {result.fundamental.dividend_yield.toFixed(2)}%
                  </td>
                  <td style={{ padding: '8px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {result.signals.map((signal, i) => (
                        <span key={i} style={{
                          padding: '2px 6px',
                          backgroundColor: 'var(--accent-primary)',
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
  )
}

function DetailedAnalysis({ symbol, marketData }) {
  const [analysisData, setAnalysisData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (symbol && marketData[symbol]) {
      loadAnalysis()
    }
  }, [symbol, marketData])

  const loadAnalysis = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${SIP.replace('/ws/nbbo?symbol=', '')}/market-data?symbol=${symbol}`)
      if (response.ok) {
        const data = await response.json()
        setAnalysisData(data)
      }
    } catch (error) {
      console.error('Analysis loading error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!symbol || !analysisData) {
    return (
      <div style={{
        padding: '16px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: '#ffffff'
      }}>
        <h3 style={{ margin: '0 0 16px 0' }}>Detailed Analysis</h3>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          Select a symbol to view detailed analysis
        </div>
      </div>
    )
  }

  return (
    <div style={{
      padding: '16px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      backgroundColor: '#ffffff'
    }}>
      <h3 style={{ margin: '0 0 16px 0' }}>Detailed Analysis - {symbol}</h3>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>Loading analysis...</div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {/* Price Summary */}
          <div style={{
            padding: '12px',
            backgroundColor: '#f8fafc',
            borderRadius: '6px',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Price Summary</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontSize: '12px' }}>
              <div>
                <strong>Current:</strong> ${analysisData.price.toFixed(2)}
              </div>
              <div style={{ color: analysisData.change_percent >= 0 ? '#22c55e' : '#ef4444' }}>
                <strong>Change:</strong> {analysisData.change_percent >= 0 ? '+' : ''}{analysisData.change_percent.toFixed(2)}%
              </div>
              <div>
                <strong>High:</strong> ${analysisData.high.toFixed(2)}
              </div>
              <div>
                <strong>Low:</strong> ${analysisData.low.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Technical Indicators */}
          <div style={{
            padding: '12px',
            backgroundColor: '#f8fafc',
            borderRadius: '6px',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Technical Indicators</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '12px' }}>
              <div>
                <strong>RSI:</strong> 
                <span style={{ 
                  color: analysisData.technical.rsi > 70 ? '#ef4444' : 
                         analysisData.technical.rsi < 30 ? '#22c55e' : '#6b7280'
                }}>
                  {analysisData.technical.rsi.toFixed(1)}
                </span>
              </div>
              <div>
                <strong>MACD:</strong> {analysisData.technical.macd.toFixed(4)}
              </div>
              <div>
                <strong>SMA 20:</strong> ${analysisData.technical.sma_20.toFixed(2)}
              </div>
              <div>
                <strong>SMA 50:</strong> ${analysisData.technical.sma_50.toFixed(2)}
              </div>
              <div>
                <strong>BB Upper:</strong> ${analysisData.technical.bollinger_upper.toFixed(2)}
              </div>
              <div>
                <strong>BB Lower:</strong> ${analysisData.technical.bollinger_lower.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Fundamental Metrics */}
          <div style={{
            padding: '12px',
            backgroundColor: '#f8fafc',
            borderRadius: '6px',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Fundamental Metrics</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '12px' }}>
              <div>
                <strong>P/E Ratio:</strong> {analysisData.fundamental.pe_ratio.toFixed(1)}
              </div>
              <div>
                <strong>P/B Ratio:</strong> {analysisData.fundamental.pb_ratio.toFixed(2)}
              </div>
              <div>
                <strong>Dividend Yield:</strong> {analysisData.fundamental.dividend_yield.toFixed(2)}%
              </div>
              <div>
                <strong>EPS:</strong> ${analysisData.fundamental.eps.toFixed(2)}
              </div>
              <div>
                <strong>Revenue Growth:</strong> {analysisData.fundamental.revenue_growth.toFixed(1)}%
              </div>
              <div>
                <strong>ROE:</strong> {analysisData.fundamental.roe.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  const { updates, connected: brokerConnected } = useBrokerWS()
  const { orders, loading, refetch } = useOrders()
  const { marketData, connections } = useMarketData(['AAPL', 'MSFT', 'SPY', 'GOOGL', 'TSLA', 'NVDA', 'AMZN', 'META', 'JPM', 'JNJ', 'V', 'PG', 'UNH', 'HD', 'MA', 'DIS', 'PYPL', 'NFLX', 'CRM', 'ADBE', 'INTC', 'ORCL', 'CSCO', 'IBM', 'QCOM', 'TXN', 'AVGO', 'ACN', 'WMT', 'KO', 'PEP', 'ABT', 'TMO', 'DHR', 'LLY', 'PFE', 'MRK', 'ABBV', 'BMY', 'UNP', 'RTX', 'LMT', 'BA', 'CAT', 'DE', 'MMM', 'GE', 'XOM', 'CVX', 'COP', 'EOG', 'SLB', 'KMI', 'PSX', 'VLO', 'MPC', 'OXY'])
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [portfolio, setPortfolio] = useState(null)
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL')
  const [activeTab, setActiveTab] = useState('trading')
  const [learningSubTab, setLearningSubTab] = useState('overview')
  const [marketDataPage, setMarketDataPage] = useState(1)
  const marketDataPerPage = 20
  
  // Settings state
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('tradingSystemSettings')
    return saved ? JSON.parse(saved) : {
      tooltips: {
        enabled: true,
        delay: 200,
        maxWidth: 400,
        showArrow: true,
        position: 'top'
      },
      marketData: {
        updateInterval: 5000,
        showVolume: true,
        showBidAsk: true
      },
      trading: {
        defaultOrderSize: 100,
        confirmOrders: true,
        autoRefresh: true
      },
      display: {
        theme: 'light',
        compactMode: false,
        showAnimations: true
      }
    }
  })

  // Markdown rendering function for wiki content
  const renderMarkdown = (text) => {
    if (!text) return ''
    
    return text
      // Headers
      .replace(/^### (.*$)/gim, '<h3 style="margin: 16px 0 8px 0; font-size: 18px; color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 4px;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="margin: 20px 0 12px 0; font-size: 22px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="margin: 24px 0 16px 0; font-size: 28px; color: #0f172a; border-bottom: 3px solid #1e40af; padding-bottom: 8px;">$1</h1>')
      
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 700; color: #1e293b;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em style="font-style: italic; color: #374151;">$1</em>')
      
      // Code blocks
      .replace(/```(.*?)```/g, '<pre style="background: #1e293b; color: #f8fafc; padding: 16px; border-radius: 6px; overflow-x: auto; margin: 12px 0; font-family: monospace; font-size: 13px;">$1</pre>')
      .replace(/`(.*?)`/g, '<code style="background: #f1f5f9; color: #1e293b; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 13px; border: 1px solid #e2e8f0;">$1</code>')
      
      // Lists
      .replace(/^- (.*$)/gim, '<li style="margin: 4px 0; padding-left: 8px; color: #374151;">$1</li>')
      .replace(/(<li.*<\/li>)/g, '<ul style="margin: 8px 0; padding-left: 20px; list-style-type: disc;">$1</ul>')
      
      // Numbered lists
      .replace(/^\d+\. (.*$)/gim, '<li style="margin: 4px 0; padding-left: 8px; color: #374151;">$1</li>')
      .replace(/(<li.*<\/li>)/g, '<ol style="margin: 8px 0; padding-left: 20px;">$1</ol>')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: #3b82f6; text-decoration: underline;">$1</a>')
      
      // Paragraphs and line breaks
      .replace(/\n\n/g, '</p><p style="margin: 12px 0; line-height: 1.6; color: #374151;">')
      .replace(/\n/g, '<br>')
      
      // Wrap in paragraph tags
      .replace(/^(?!<[h|p|u|o|pre|blockquote])(.*)$/gm, '<p style="margin: 12px 0; line-height: 1.6; color: #374151;">$1</p>')
      
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote style="border-left: 4px solid #3b82f6; padding-left: 16px; margin: 16px 0; background: #f8fafc; padding: 12px; border-radius: 4px; font-style: italic; color: #64748b;">$1</blockquote>')
      
      // Tables (basic support)
      .replace(/\|(.+)\|/g, (match) => {
        const cells = match.split('|').filter(cell => cell.trim())
        return `<td style="border: 1px solid #e2e8f0; padding: 8px; text-align: left;">${cells.join('</td><td style="border: 1px solid #e2e8f0; padding: 8px; text-align: left;">')}</td>`
      })
      .replace(/(<td.*<\/td>)/g, '<tr style="border-bottom: 1px solid #e2e8f0;">$1</tr>')
      .replace(/(<tr.*<\/tr>)/g, '<table style="border-collapse: collapse; width: 100%; margin: 16px 0; background: white;">$1</table>')
  }
  
  // Market Data pagination logic
  const marketDataEntries = Object.entries(marketData)
  const totalPages = Math.ceil(marketDataEntries.length / marketDataPerPage)
  const startIndex = (marketDataPage - 1) * marketDataPerPage
  const endIndex = startIndex + marketDataPerPage
  const currentPageData = marketDataEntries.slice(startIndex, endIndex)

  const fetchStats = async () => {
    setStatsLoading(true)
    try {
      const response = await fetch(`${BROKER}/stats`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }
  
  const fetchPortfolio = async () => {
    setPortfolioLoading(true)
    try {
      const response = await fetch(`${BROKER}/portfolio`)
      if (response.ok) {
        const data = await response.json()
        setPortfolio(data)
      }
    } catch (error) {
      console.error('Failed to fetch portfolio:', error)
    } finally {
      setPortfolioLoading(false)
    }
  }
  
  useEffect(() => {
    fetchStats()
    fetchPortfolio()
    const statsInterval = setInterval(fetchStats, 10000) // Refresh every 10 seconds
    const portfolioInterval = setInterval(fetchPortfolio, 5000) // Refresh every 5 seconds
    return () => {
      clearInterval(statsInterval)
      clearInterval(portfolioInterval)
    }
  }, [])
  
  const handleOrderSubmit = (newOrder) => {
    // The order will appear in the updates via WebSocket
    console.log('Order submitted:', newOrder)
  }
  
  const handleOrderCancel = (orderId) => {
    // The cancellation will appear in the updates via WebSocket
    console.log('Order canceled:', orderId)
  }
  
  return (
    <ThemeProvider>
             <div style={{
         fontFamily: 'Inter, system-ui, sans-serif',
         padding: '16px',
         backgroundColor: 'var(--bg-secondary)',
         minHeight: '100vh',
         color: 'var(--text-primary)'
       }}>
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto'
        }}>
          {/* Header */}
                     <div style={{
             display: 'flex',
             justifyContent: 'space-between',
             alignItems: 'center',
             marginBottom: '24px',
             padding: '16px',
             backgroundColor: 'var(--bg-primary)',
             borderRadius: '8px',
             border: '1px solid var(--border-color)'
           }}>
             <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>Market Simulator — Trading Platform</h1>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <ConnectionStatus connected={brokerConnected} type="Broker" />
              <ConnectionStatus connected={Object.values(connections).some(c => c)} type="Market Data" />
              <Notifications />
              <ThemeToggle />
            </div>
          </div>
          
          {/* Stats Widget */}
          <div style={{ marginBottom: '24px' }}>
            <StatsWidget stats={stats} loading={statsLoading} />
          </div>
          
          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            marginBottom: '16px',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            overflow: 'hidden'
          }}>
            {['trading', 'charts', 'portfolio', 'journal', 'advanced', 'notes', 'learning', 'technical', 'fundamental', 'analysis', 'settings'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: activeTab === tab ? 'var(--accent-primary)' : 'transparent',
                  color: activeTab === tab ? 'white' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: activeTab === tab ? 'bold' : 'normal',
                  textTransform: 'capitalize'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          
          {/* Tab Content */}
          {activeTab === 'trading' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '350px 1fr',
              gap: '24px'
            }}>
              {/* Left Panel - Order Entry & Market Data */}
              <div style={{ display: 'grid', gap: '16px' }}>
                <OrderForm onSubmit={handleOrderSubmit} marketData={marketData} />
                
                <PortfolioWidget 
                  portfolio={portfolio} 
                  loading={portfolioLoading} 
                  marketData={marketData}
                />
                
                <div style={{
                  padding: '16px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-primary)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Market Data</h3>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Showing {startIndex + 1}-{Math.min(endIndex, marketDataEntries.length)} of {marketDataEntries.length} symbols
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gap: '8px',
                    maxHeight: '600px',
                    overflowY: 'auto'
                  }}>
                    {currentPageData.map(([symbol, data]) => (
                      <MarketDataWidget 
                        key={symbol}
                        symbol={symbol}
                        data={data}
                        connected={connections[symbol]}
                      />
                    ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: '1px solid var(--border-color)'
                    }}>
                      <button
                        onClick={() => setMarketDataPage(prev => Math.max(1, prev - 1))}
                        disabled={marketDataPage === 1}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: marketDataPage === 1 ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: marketDataPage === 1 ? 'not-allowed' : 'pointer',
                          opacity: marketDataPage === 1 ? 0.6 : 1
                        }}
                      >
                        Previous
                      </button>
                      
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Page {marketDataPage} of {totalPages}
                      </div>
                      
                      <button
                        onClick={() => setMarketDataPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={marketDataPage === totalPages}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: marketDataPage === totalPages ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: marketDataPage === totalPages ? 'not-allowed' : 'pointer',
                          opacity: marketDataPage === totalPages ? 0.6 : 1
                        }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Right Panel - Order Management */}
              <div style={{ display: 'grid', gap: '16px' }}>
                                 <div style={{
                   padding: '16px',
                   border: '1px solid var(--border-color)',
                   borderRadius: '8px',
                   backgroundColor: 'var(--bg-primary)'
                 }}>
                   <div style={{
                     display: 'flex',
                     justifyContent: 'space-between',
                     alignItems: 'center',
                     marginBottom: '16px'
                   }}>
                     <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Order Blotter</h3>
                     <button 
                       onClick={refetch}
                       style={{
                         padding: '8px 12px',
                         backgroundColor: 'var(--accent-primary)',
                         color: 'white',
                         border: 'none',
                         borderRadius: '4px',
                         cursor: 'pointer'
                       }}
                     >
                       Refresh
                     </button>
                   </div>
                  <OrderBlotter 
                    orders={orders} 
                    loading={loading} 
                    onCancelOrder={handleOrderCancel}
                  />
                </div>
                
                                 <div style={{
                   padding: '16px',
                   border: '1px solid var(--border-color)',
                   borderRadius: '8px',
                   backgroundColor: 'var(--bg-primary)'
                 }}>
                   <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Live Events</h3>
                  <LiveEvents updates={updates} />
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'charts' && (
            <ChartSubsystem />
          )}
          
          {activeTab === 'portfolio' && (
            <div style={{ display: 'grid', gap: '24px' }}>
                           <div style={{
               padding: '24px',
               border: '1px solid var(--border-color)',
               borderRadius: '8px',
               backgroundColor: 'var(--bg-primary)'
             }}>
               <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Portfolio Management</h3>
               <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                 Comprehensive portfolio tracking, performance analysis, and risk management.
               </p>
                
                {/* Portfolio Widget */}
                <PortfolioWidget 
                  portfolio={portfolio} 
                  loading={portfolioLoading} 
                  marketData={marketData}
                />
                
                {/* Portfolio Performance Metrics */}
                {portfolio && !portfolioLoading && (
                  <div style={{ marginTop: '24px' }}>
                                       <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Performance Metrics</h4>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                     <div style={{
                       padding: '16px',
                       backgroundColor: 'var(--bg-tertiary)',
                       borderRadius: '8px',
                       border: '1px solid var(--border-color)',
                       textAlign: 'center'
                     }}>
                       <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                         ${portfolio.summary?.total_value?.toLocaleString() || '0'}
                       </div>
                       <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Portfolio Value</div>
                     </div>
                     
                     <div style={{
                       padding: '16px',
                       backgroundColor: 'var(--bg-tertiary)',
                       borderRadius: '8px',
                       border: '1px solid var(--border-color)',
                       textAlign: 'center'
                     }}>
                       <div style={{ 
                         fontSize: '24px', 
                         fontWeight: 'bold',
                         color: portfolio.summary?.total_pnl >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)'
                       }}>
                         ${portfolio.summary?.total_pnl?.toLocaleString() || '0'}
                       </div>
                       <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total P&L</div>
                     </div>
                     
                     <div style={{
                       padding: '16px',
                       backgroundColor: 'var(--bg-tertiary)',
                       borderRadius: '8px',
                       border: '1px solid var(--border-color)',
                       textAlign: 'center'
                     }}>
                       <div style={{ 
                         fontSize: '24px', 
                         fontWeight: 'bold',
                         color: portfolio.summary?.total_pnl_percent >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)'
                       }}>
                         {portfolio.summary?.total_pnl_percent?.toFixed(2) || '0'}%
                       </div>
                       <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Return %</div>
                     </div>
                     
                     <div style={{
                       padding: '16px',
                       backgroundColor: 'var(--bg-tertiary)',
                       borderRadius: '8px',
                       border: '1px solid var(--border-color)',
                       textAlign: 'center'
                     }}>
                       <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                         {portfolio.summary?.positions_count || '0'}
                       </div>
                       <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Active Positions</div>
                     </div>
                   </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'journal' && (
            <EnhancedJournal />
          )}
          
          {activeTab === 'advanced' && (
            <AdvancedScanner marketData={marketData} />
          )}
          
          {activeTab === 'notes' && (
            <Notes />
          )}
          
          {activeTab === 'learning' && (
            <div style={{ display: 'grid', gap: '24px' }}>
              {/* Learning Sub-tabs */}
                             <div style={{
                 display: 'flex',
                 marginBottom: '16px',
                 backgroundColor: 'var(--bg-primary)',
                 borderRadius: '8px',
                 border: '1px solid var(--border-color)',
                 overflow: 'hidden'
               }}>
                {['overview', 'technical-guide', 'fundamental-guide', 'strategy-wiki', 'quiz'].map(subTab => (
                                     <button
                     key={subTab}
                     onClick={() => setLearningSubTab(subTab)}
                     style={{
                       padding: '12px 24px',
                       backgroundColor: learningSubTab === subTab ? 'var(--accent-primary)' : 'transparent',
                       color: learningSubTab === subTab ? 'white' : 'var(--text-secondary)',
                       border: 'none',
                       cursor: 'pointer',
                       fontWeight: learningSubTab === subTab ? 'bold' : 'normal',
                       textTransform: 'capitalize'
                     }}
                   >
                     {subTab.replace('-', ' ')}
                   </button>
                ))}
              </div>
              
              {/* Learning Content */}
              {learningSubTab === 'overview' && (
                                 <div style={{
                   padding: '24px',
                   border: '1px solid var(--border-color)',
                   borderRadius: '8px',
                   backgroundColor: 'var(--bg-primary)'
                 }}>
                   <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Trading Education Center</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f0fdf4',
                      borderRadius: '8px',
                      border: '1px solid #bbf7d0'
                    }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#166534' }}>📊 Technical Analysis</h4>
                      <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#374151' }}>
                        Learn about indicators, chart patterns, and technical trading strategies.
                      </p>
                      <button
                        onClick={() => setLearningSubTab('technical-guide')}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#22c55e',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Start Learning
                      </button>
                    </div>
                    
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#eff6ff',
                      borderRadius: '8px',
                      border: '1px solid #bfdbfe'
                    }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#1e40af' }}>📈 Fundamental Analysis</h4>
                      <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#374151' }}>
                        Understand company financials, ratios, and value investing principles.
                      </p>
                      <button
                        onClick={() => setLearningSubTab('fundamental-guide')}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Start Learning
                      </button>
                    </div>
                    
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#fef3c7',
                      borderRadius: '8px',
                      border: '1px solid #fde68a'
                    }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#92400e' }}>📚 Strategy Wiki</h4>
                      <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#374151' }}>
                        Comprehensive trading strategies and market analysis guides.
                      </p>
                      <button
                        onClick={() => setLearningSubTab('strategy-wiki')}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Explore Wiki
                      </button>
                    </div>
                    
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#fdf2f8',
                      borderRadius: '8px',
                      border: '1px solid #fbcfe8'
                    }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#831843' }}>🧠 Quiz Engine</h4>
                      <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#374151' }}>
                        Test your knowledge with interactive quizzes and spaced repetition.
                      </p>
                      <button
                        onClick={() => setLearningSubTab('quiz')}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#ec4899',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Take Quiz
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {learningSubTab === 'technical-guide' && (
                <div style={{
                  padding: '24px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff'
                }}>
                  <h3 style={{ margin: '0 0 16px 0' }}>Technical Analysis Guide</h3>
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>📊 Key Indicators</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                        {settings.tooltips?.enabled ? (
                          <AdvancedTooltip
                            content={getTooltipContent('technical', 'rsi').content}
                            position={settings.tooltips?.position || 'top'}
                            delay={settings.tooltips?.delay || 200}
                            maxWidth={settings.tooltips?.maxWidth || 400}
                            showArrow={settings.tooltips?.showArrow !== false}
                          >
                            <div style={{ 
                              padding: '12px', 
                              backgroundColor: '#ffffff', 
                              borderRadius: '6px', 
                              border: '1px solid #e2e8f0',
                              position: 'relative',
                              cursor: 'pointer'
                            }}>
                              <div style={{ 
                                position: 'absolute', 
                                top: '8px', 
                                right: '8px', 
                                color: '#3b82f6', 
                                fontSize: '16px',
                                fontWeight: 'bold'
                              }}>
                                ℹ️
                              </div>
                              <strong style={{ color: '#3b82f6' }}>RSI (Relative Strength Index)</strong>
                              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                                Measures momentum on a scale of 0 to 100. Above 70 = overbought, below 30 = oversold.
                              </p>
                            </div>
                          </AdvancedTooltip>
                        ) : (
                          <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <strong style={{ color: '#3b82f6' }}>RSI (Relative Strength Index)</strong>
                            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                              Measures momentum on a scale of 0 to 100. Above 70 = overbought, below 30 = oversold.
                            </p>
                          </div>
                        )}

                        {settings.tooltips?.enabled ? (
                          <AdvancedTooltip
                            content={getTooltipContent('technical', 'macd').content}
                            position={settings.tooltips?.position || 'top'}
                            delay={settings.tooltips?.delay || 200}
                            maxWidth={settings.tooltips?.maxWidth || 400}
                            showArrow={settings.tooltips?.showArrow !== false}
                          >
                            <div style={{ 
                              padding: '12px', 
                              backgroundColor: '#ffffff', 
                              borderRadius: '6px', 
                              border: '1px solid #e2e8f0',
                              position: 'relative',
                              cursor: 'pointer'
                            }}>
                              <div style={{ 
                                position: 'absolute', 
                                top: '8px', 
                                right: '8px', 
                                color: '#3b82f6', 
                                fontSize: '16px',
                                fontWeight: 'bold'
                              }}>
                                ℹ️
                              </div>
                              <strong style={{ color: '#3b82f6' }}>MACD (Moving Average Convergence Divergence)</strong>
                              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                                Shows relationship between two moving averages. Bullish when MACD crosses above signal line.
                              </p>
                            </div>
                          </AdvancedTooltip>
                        ) : (
                          <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <strong style={{ color: '#3b82f6' }}>MACD (Moving Average Convergence Divergence)</strong>
                            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                              Shows relationship between two moving averages. Bullish when MACD crosses above signal line.
                            </p>
                          </div>
                        )}

                        {settings.tooltips?.enabled ? (
                          <AdvancedTooltip
                            content={getTooltipContent('technical', 'bollinger_bands').content}
                            position={settings.tooltips?.position || 'top'}
                            delay={settings.tooltips?.delay || 200}
                            maxWidth={settings.tooltips?.maxWidth || 400}
                            showArrow={settings.tooltips?.showArrow !== false}
                          >
                            <div style={{ 
                              padding: '12px', 
                              backgroundColor: '#ffffff', 
                              borderRadius: '6px', 
                              border: '1px solid #e2e8f0',
                              position: 'relative',
                              cursor: 'pointer'
                            }}>
                              <div style={{ 
                                position: 'absolute', 
                                top: '8px', 
                                right: '8px', 
                                color: '#3b82f6', 
                                fontSize: '16px',
                                fontWeight: 'bold'
                              }}>
                                ℹ️
                              </div>
                              <strong style={{ color: '#3b82f6' }}>Bollinger Bands</strong>
                              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                                Volatility indicator. Price touching upper band = overbought, lower band = oversold.
                              </p>
                            </div>
                          </AdvancedTooltip>
                        ) : (
                          <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <strong style={{ color: '#3b82f6' }}>Bollinger Bands</strong>
                            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                              Volatility indicator. Price touching upper band = overbought, lower band = oversold.
                            </p>
                          </div>
                        )}

                        {settings.tooltips?.enabled ? (
                          <AdvancedTooltip
                            content={getTooltipContent('technical', 'moving_averages').content}
                            position={settings.tooltips?.position || 'top'}
                            delay={settings.tooltips?.delay || 200}
                            maxWidth={settings.tooltips?.maxWidth || 400}
                            showArrow={settings.tooltips?.showArrow !== false}
                          >
                            <div style={{ 
                              padding: '12px', 
                              backgroundColor: '#ffffff', 
                              borderRadius: '6px', 
                              border: '1px solid #e2e8f0',
                              position: 'relative',
                              cursor: 'pointer'
                            }}>
                              <div style={{ 
                                position: 'absolute', 
                                top: '8px', 
                                right: '8px', 
                                color: '#3b82f6', 
                                fontSize: '16px',
                                fontWeight: 'bold'
                              }}>
                                ℹ️
                              </div>
                              <strong style={{ color: '#3b82f6' }}>Moving Averages</strong>
                              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                                Trend indicators. Golden cross (50MA above 200MA) = bullish, death cross = bearish.
                              </p>
                            </div>
                          </AdvancedTooltip>
                        ) : (
                          <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <strong style={{ color: '#3b82f6' }}>Moving Averages</strong>
                            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                              Trend indicators. Golden cross (50MA above 200MA) = bullish, death cross = bearish.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f0fdf4',
                      borderRadius: '8px',
                      border: '1px solid #bbf7d0'
                    }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#166534' }}>📈 Trading Signals</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                        <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                          <strong style={{ color: '#22c55e' }}>Buy Signals</strong>
                          <ul style={{ margin: '8px 0 0 0', paddingLeft: '16px', fontSize: '14px', color: '#374151' }}>
                            <li>RSI below 30</li>
                            <li>MACD bullish crossover</li>
                            <li>Price above moving averages</li>
                            <li>Bollinger Band bounce</li>
                          </ul>
                        </div>
                        <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #fecaca' }}>
                          <strong style={{ color: '#ef4444' }}>Sell Signals</strong>
                          <ul style={{ margin: '8px 0 0 0', paddingLeft: '16px', fontSize: '14px', color: '#374151' }}>
                            <li>RSI above 70</li>
                            <li>MACD bearish crossover</li>
                            <li>Price below moving averages</li>
                            <li>Bollinger Band rejection</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div style={{
                      padding: '16px',
                      backgroundColor: '#eff6ff',
                      borderRadius: '8px',
                      border: '1px solid #bfdbfe'
                    }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#1e40af' }}>📊 Advanced Analysis</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                        {settings.tooltips?.enabled ? (
                          <AdvancedTooltip
                            content={getTooltipContent('technical', 'volume_analysis').content}
                            position={settings.tooltips?.position || 'top'}
                            delay={settings.tooltips?.delay || 200}
                            maxWidth={settings.tooltips?.maxWidth || 400}
                            showArrow={settings.tooltips?.showArrow !== false}
                          >
                            <div style={{ 
                              padding: '12px', 
                              backgroundColor: '#ffffff', 
                              borderRadius: '6px', 
                              border: '1px solid #bfdbfe',
                              position: 'relative',
                              cursor: 'pointer'
                            }}>
                              <div style={{ 
                                position: 'absolute', 
                                top: '8px', 
                                right: '8px', 
                                color: '#1e40af', 
                                fontSize: '16px',
                                fontWeight: 'bold'
                              }}>
                                ℹ️
                              </div>
                              <strong style={{ color: '#1e40af' }}>Volume Analysis</strong>
                              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                                Confirms price movements and identifies potential reversals through trading volume patterns.
                              </p>
                            </div>
                          </AdvancedTooltip>
                        ) : (
                          <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                            <strong style={{ color: '#1e40af' }}>Volume Analysis</strong>
                            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                              Confirms price movements and identifies potential reversals through trading volume patterns.
                            </p>
                          </div>
                        )}

                        {settings.tooltips?.enabled ? (
                          <AdvancedTooltip
                            content={getTooltipContent('technical', 'support_resistance').content}
                            position={settings.tooltips?.position || 'top'}
                            delay={settings.tooltips?.delay || 200}
                            maxWidth={settings.tooltips?.maxWidth || 400}
                            showArrow={settings.tooltips?.showArrow !== false}
                          >
                            <div style={{ 
                              padding: '12px', 
                              backgroundColor: '#ffffff', 
                              borderRadius: '6px', 
                              border: '1px solid #bfdbfe',
                              position: 'relative',
                              cursor: 'pointer'
                            }}>
                              <div style={{ 
                                position: 'absolute', 
                                top: '8px', 
                                right: '8px', 
                                color: '#1e40af', 
                                fontSize: '16px',
                                fontWeight: 'bold'
                              }}>
                                ℹ️
                              </div>
                              <strong style={{ color: '#1e40af' }}>Support & Resistance</strong>
                              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                                Key price levels where buying or selling pressure is expected to emerge.
                              </p>
                            </div>
                          </AdvancedTooltip>
                        ) : (
                          <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                            <strong style={{ color: '#1e40af' }}>Support & Resistance</strong>
                            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                              Key price levels where buying or selling pressure is expected to emerge.
                            </p>
                          </div>
                        )}

                        {settings.tooltips?.enabled ? (
                          <AdvancedTooltip
                            content={getTooltipContent('technical', 'chart_patterns').content}
                            position={settings.tooltips?.position || 'top'}
                            delay={settings.tooltips?.delay || 200}
                            maxWidth={settings.tooltips?.maxWidth || 400}
                            showArrow={settings.tooltips?.showArrow !== false}
                          >
                            <div style={{ 
                              padding: '12px', 
                              backgroundColor: '#ffffff', 
                              borderRadius: '6px', 
                              border: '1px solid #bfdbfe',
                              position: 'relative',
                              cursor: 'pointer'
                            }}>
                              <div style={{ 
                                position: 'absolute', 
                                top: '8px', 
                                right: '8px', 
                                color: '#1e40af', 
                                fontSize: '16px',
                                fontWeight: 'bold'
                              }}>
                                ℹ️
                              </div>
                              <strong style={{ color: '#1e40af' }}>Chart Patterns</strong>
                              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                                Recurring price formations that indicate potential future price movements.
                              </p>
                            </div>
                          </AdvancedTooltip>
                        ) : (
                          <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                            <strong style={{ color: '#1e40af' }}>Chart Patterns</strong>
                            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                              Recurring price formations that indicate potential future price movements.
                            </p>
                          </div>
                        )}

                        {settings.tooltips?.enabled ? (
                          <AdvancedTooltip
                            content={getTooltipContent('technical', 'fibonacci').content}
                            position={settings.tooltips?.position || 'top'}
                            delay={settings.tooltips?.delay || 200}
                            maxWidth={settings.tooltips?.maxWidth || 400}
                            showArrow={settings.tooltips?.showArrow !== false}
                          >
                            <div style={{ 
                              padding: '12px', 
                              backgroundColor: '#ffffff', 
                              borderRadius: '6px', 
                              border: '1px solid #bfdbfe',
                              position: 'relative',
                              cursor: 'pointer'
                            }}>
                              <div style={{ 
                                position: 'absolute', 
                                top: '8px', 
                                right: '8px', 
                                color: '#1e40af', 
                                fontSize: '16px',
                                fontWeight: 'bold'
                              }}>
                                ℹ️
                              </div>
                              <strong style={{ color: '#1e40af' }}>Fibonacci Retracements</strong>
                              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                                Mathematical ratios to identify potential support and resistance levels.
                              </p>
                            </div>
                          </AdvancedTooltip>
                        ) : (
                          <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                            <strong style={{ color: '#1e40af' }}>Fibonacci Retracements</strong>
                            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                              Mathematical ratios to identify potential support and resistance levels.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {learningSubTab === 'fundamental-guide' && (
                <div style={{
                  padding: '24px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff'
                }}>
                  <h3 style={{ margin: '0 0 16px 0' }}>Fundamental Analysis Guide</h3>
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>📈 Key Metrics</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                        {settings.tooltips?.enabled ? (
                          <AdvancedTooltip 
                            content={getTooltipContent('fundamental', 'pe_ratio').content}
                            position={settings.tooltips.position}
                            delay={settings.tooltips.delay}
                            maxWidth={settings.tooltips.maxWidth}
                            showArrow={settings.tooltips.showArrow}
                          >
                            <div style={{ 
                              padding: '12px', 
                              backgroundColor: '#ffffff', 
                              borderRadius: '6px', 
                              border: '1px solid #e2e8f0',
                              cursor: 'pointer',
                              position: 'relative'
                            }}>
                              <div style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                width: '20px',
                                height: '20px',
                                backgroundColor: '#3b82f6',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}>
                                i
                              </div>
                              <strong style={{ color: '#3b82f6' }}>P/E Ratio (Price-to-Earnings)</strong>
                              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                                Compares stock price to earnings. Lower ratios may indicate undervaluation.
                              </p>
                            </div>
                          </AdvancedTooltip>
                        ) : (
                          <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <strong style={{ color: '#3b82f6' }}>P/E Ratio (Price-to-Earnings)</strong>
                            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                              Compares stock price to earnings. Lower ratios may indicate undervaluation.
                            </p>
                          </div>
                        )}
                        
                        {settings.tooltips?.enabled ? (
                          <AdvancedTooltip 
                            content={getTooltipContent('fundamental', 'pb_ratio').content}
                            position={settings.tooltips.position}
                            delay={settings.tooltips.delay}
                            maxWidth={settings.tooltips.maxWidth}
                            showArrow={settings.tooltips.showArrow}
                          >
                            <div style={{ 
                              padding: '12px', 
                              backgroundColor: '#ffffff', 
                              borderRadius: '6px', 
                              border: '1px solid #e2e8f0',
                              cursor: 'pointer',
                              position: 'relative'
                            }}>
                              <div style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                width: '20px',
                                height: '20px',
                                backgroundColor: '#3b82f6',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}>
                                i
                              </div>
                              <strong style={{ color: '#3b82f6' }}>P/B Ratio (Price-to-Book)</strong>
                              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                                Compares market value to book value. Below 1 may indicate undervaluation.
                              </p>
                            </div>
                          </AdvancedTooltip>
                        ) : (
                          <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <strong style={{ color: '#3b82f6' }}>P/B Ratio (Price-to-Book)</strong>
                            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                              Compares market value to book value. Below 1 may indicate undervaluation.
                            </p>
                          </div>
                        )}
                        
                        {settings.tooltips?.enabled ? (
                          <AdvancedTooltip 
                            content={getTooltipContent('fundamental', 'roe').content}
                            position={settings.tooltips.position}
                            delay={settings.tooltips.delay}
                            maxWidth={settings.tooltips.maxWidth}
                            showArrow={settings.tooltips.showArrow}
                          >
                            <div style={{ 
                              padding: '12px', 
                              backgroundColor: '#ffffff', 
                              borderRadius: '6px', 
                              border: '1px solid #e2e8f0',
                              cursor: 'pointer',
                              position: 'relative'
                            }}>
                              <div style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                width: '20px',
                                height: '20px',
                                backgroundColor: '#3b82f6',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}>
                                i
                              </div>
                              <strong style={{ color: '#3b82f6' }}>ROE (Return on Equity)</strong>
                              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                                Measures profitability relative to shareholder equity. Higher is better.
                              </p>
                            </div>
                          </AdvancedTooltip>
                        ) : (
                          <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <strong style={{ color: '#3b82f6' }}>ROE (Return on Equity)</strong>
                            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                              Measures profitability relative to shareholder equity. Higher is better.
                            </p>
                          </div>
                        )}
                        
                        {settings.tooltips?.enabled ? (
                          <AdvancedTooltip 
                            content={getTooltipContent('fundamental', 'debt_to_equity').content}
                            position={settings.tooltips.position}
                            delay={settings.tooltips.delay}
                            maxWidth={settings.tooltips.maxWidth}
                            showArrow={settings.tooltips.showArrow}
                          >
                            <div style={{ 
                              padding: '12px', 
                              backgroundColor: '#ffffff', 
                              borderRadius: '6px', 
                              border: '1px solid #e2e8f0',
                              cursor: 'pointer',
                              position: 'relative'
                            }}>
                              <div style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                width: '20px',
                                height: '20px',
                                backgroundColor: '#3b82f6',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}>
                                i
                              </div>
                              <strong style={{ color: '#3b82f6' }}>Debt-to-Equity</strong>
                              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                                Measures financial leverage. Lower ratios indicate less risk.
                              </p>
                            </div>
                          </AdvancedTooltip>
                        ) : (
                          <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <strong style={{ color: '#3b82f6' }}>Debt-to-Equity</strong>
                            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                              Measures financial leverage. Lower ratios indicate less risk.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#eff6ff',
                      borderRadius: '8px',
                      border: '1px solid #bfdbfe'
                    }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#1e40af' }}>💡 Investment Strategies</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                        {settings.tooltips?.enabled ? (
                          <AdvancedTooltip 
                            content={getTooltipContent('value_investing', 'low_pe').content}
                            position={settings.tooltips.position}
                            delay={settings.tooltips.delay}
                            maxWidth={settings.tooltips.maxWidth}
                            showArrow={settings.tooltips.showArrow}
                          >
                            <div style={{ 
                              padding: '12px', 
                              backgroundColor: '#ffffff', 
                              borderRadius: '6px', 
                              border: '1px solid #bfdbfe',
                              cursor: 'pointer',
                              position: 'relative'
                            }}>
                              <div style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                width: '20px',
                                height: '20px',
                                backgroundColor: '#3b82f6',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}>
                                i
                              </div>
                              <strong style={{ color: '#3b82f6' }}>Value Investing</strong>
                              <ul style={{ margin: '8px 0 0 0', paddingLeft: '16px', fontSize: '14px', color: '#374151' }}>
                                <li>Low P/E ratios</li>
                                <li>High dividend yields</li>
                                <li>Strong balance sheets</li>
                                <li>Undervalued assets</li>
                              </ul>
                            </div>
                          </AdvancedTooltip>
                        ) : (
                          <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                            <strong style={{ color: '#3b82f6' }}>Value Investing</strong>
                            <ul style={{ margin: '8px 0 0 0', paddingLeft: '16px', fontSize: '14px', color: '#374151' }}>
                              <li>Low P/E ratios</li>
                              <li>High dividend yields</li>
                              <li>Strong balance sheets</li>
                              <li>Undervalued assets</li>
                            </ul>
                          </div>
                        )}
                        
                        {settings.tooltips?.enabled ? (
                          <AdvancedTooltip 
                            content={getTooltipContent('growth_investing', 'high_revenue_growth').content}
                            position={settings.tooltips.position}
                            delay={settings.tooltips.delay}
                            maxWidth={settings.tooltips.maxWidth}
                            showArrow={settings.tooltips.showArrow}
                          >
                            <div style={{ 
                              padding: '12px', 
                              backgroundColor: '#ffffff', 
                              borderRadius: '6px', 
                              border: '1px solid #bfdbfe',
                              cursor: 'pointer',
                              position: 'relative'
                            }}>
                              <div style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                width: '20px',
                                height: '20px',
                                backgroundColor: '#3b82f6',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}>
                                i
                              </div>
                              <strong style={{ color: '#3b82f6' }}>Growth Investing</strong>
                              <ul style={{ margin: '8px 0 0 0', paddingLeft: '16px', fontSize: '14px', color: '#374151' }}>
                                <li>High revenue growth</li>
                                <li>Expanding markets</li>
                                <li>Innovation focus</li>
                                <li>Future potential</li>
                              </ul>
                            </div>
                          </AdvancedTooltip>
                        ) : (
                          <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                            <strong style={{ color: '#3b82f6' }}>Growth Investing</strong>
                            <ul style={{ margin: '8px 0 0 0', paddingLeft: '16px', fontSize: '14px', color: '#374151' }}>
                              <li>High revenue growth</li>
                              <li>Expanding markets</li>
                              <li>Innovation focus</li>
                              <li>Future potential</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {learningSubTab === 'strategy-wiki' && (
                <div style={{
                  padding: '24px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff'
                }}>
                  <h3 style={{ margin: '0 0 16px 0' }}>Strategy Wiki</h3>
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {/* Trading Strategies Section */}
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#fef3c7',
                      borderRadius: '8px',
                      border: '1px solid #fde68a'
                    }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#92400e' }}>📚 Trading Strategies</h4>
                      <div 
                        dangerouslySetInnerHTML={{
                          __html: renderMarkdown(getWikiContent('trading_strategies').content)
                        }}
                        style={{
                          fontSize: '14px',
                          lineHeight: '1.6',
                          color: '#374151'
                        }}
                      />
                    </div>
                    
                    {/* Risk Management Section */}
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f0fdf4',
                      borderRadius: '8px',
                      border: '1px solid #bbf7d0'
                    }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#166534' }}>🛡️ Risk Management</h4>
                      <div 
                        dangerouslySetInnerHTML={{
                          __html: renderMarkdown(getWikiContent('risk_management').content)
                        }}
                        style={{
                          fontSize: '14px',
                          lineHeight: '1.6',
                          color: '#374151'
                        }}
                      />
                    </div>

                    {/* Market Analysis Section */}
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#eff6ff',
                      borderRadius: '8px',
                      border: '1px solid #bfdbfe'
                    }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#1e40af' }}>📊 Market Analysis</h4>
                      <div 
                        dangerouslySetInnerHTML={{
                          __html: renderMarkdown(getWikiContent('market_analysis').content)
                        }}
                        style={{
                          fontSize: '14px',
                          lineHeight: '1.6',
                          color: '#374151'
                        }}
                      />
                    </div>

                    {/* Trading Psychology Section */}
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#fdf2f8',
                      borderRadius: '8px',
                      border: '1px solid #fbcfe8'
                    }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#be185d' }}>🧠 Trading Psychology</h4>
                      <div 
                        dangerouslySetInnerHTML={{
                          __html: renderMarkdown(getWikiContent('psychology').content)
                        }}
                        style={{
                          fontSize: '14px',
                          lineHeight: '1.6',
                          color: '#374151'
                        }}
                      />
                    </div>

                    {/* Advanced Techniques Section */}
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#fefce8',
                      borderRadius: '8px',
                      border: '1px solid #fde047'
                    }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#a16207' }}>⚡ Advanced Techniques</h4>
                      <div 
                        dangerouslySetInnerHTML={{
                          __html: renderMarkdown(getWikiContent('advanced_techniques').content)
                        }}
                        style={{
                          fontSize: '14px',
                          lineHeight: '1.6',
                          color: '#374151'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {learningSubTab === 'quiz' && (
                <div style={{
                  padding: '24px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff'
                }}>
                  <h3 style={{ margin: '0 0 16px 0' }}>Trading Knowledge Quiz</h3>
                  <div style={{
                    padding: '40px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '2px dashed #d1d5db',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '18px', color: '#6b7280', marginBottom: '8px' }}>
                      🧠 Interactive Quiz Engine
                    </div>
                    <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '16px' }}>
                      Test your trading knowledge with interactive quizzes
                    </div>
                    <button
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#ec4899',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      Start Quiz
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'technical' && (
            <TechnicalScanner marketData={marketData} />
          )}
          
          {activeTab === 'fundamental' && (
            <FundamentalScanner marketData={marketData} />
          )}
          
          {activeTab === 'analysis' && (
                         <div style={{ display: 'grid', gap: '16px' }}>
               <div style={{
                 padding: '16px',
                 border: '1px solid var(--border-color)',
                 borderRadius: '8px',
                 backgroundColor: 'var(--bg-primary)'
               }}>
                 <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Symbol Selection</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {Object.keys(marketData).map(symbol => (
                                         <button
                       key={symbol}
                       onClick={() => setSelectedSymbol(symbol)}
                       style={{
                         padding: '8px 16px',
                         backgroundColor: selectedSymbol === symbol ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                         color: selectedSymbol === symbol ? 'white' : 'var(--text-primary)',
                         border: 'none',
                         borderRadius: '6px',
                         cursor: 'pointer',
                         fontWeight: selectedSymbol === symbol ? 'bold' : 'normal'
                       }}
                     >
                       {symbol}
                     </button>
                  ))}
                </div>
              </div>
              
              <DetailedAnalysis symbol={selectedSymbol} marketData={marketData} />
            </div>
          )}
          
          {activeTab === 'settings' && (
            <Settings 
              settings={settings} 
              onSettingsChange={setSettings}
            />
          )}
        </div>
      </div>
    </ThemeProvider>
  )
}

export default App
