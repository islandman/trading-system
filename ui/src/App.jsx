import React, { useEffect, useMemo, useRef, useState } from 'react'
import EnhancedJournal from './components/EnhancedJournal'
import ChartSubsystem from './components/ChartSubsystem'
import AdvancedScanner from './components/AdvancedScanner'
import Notes from './components/Notes'
import Settings from './components/Settings'
import AdvancedTooltip from './components/AdvancedTooltip'
import { getTooltipContent } from './data/tooltipContent'
import { getWikiContent } from './data/wikiContent'

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

function useMarketData(symbols = ['AAPL', 'MSFT', 'SPY']) {
  const [marketData, setMarketData] = useState({})
  const [connections, setConnections] = useState({})
  
  // Use mock data for now while we fix the SIP service
  useEffect(() => {
    const mockData = {}
    const mockConnections = {}
    
    // Initialize with stable base prices
    symbols.forEach(symbol => {
      const basePrice = symbol === 'AAPL' ? 150.0 : symbol === 'MSFT' ? 300.0 : 450.0
      const initialChange = (Math.random() - 0.5) * 2 // Smaller initial change
      const price = basePrice + initialChange
      
      mockData[symbol] = {
        symbol: symbol,
        price: parseFloat(price.toFixed(2)),
        change: parseFloat(initialChange.toFixed(2)),
        change_percent: parseFloat(((initialChange / basePrice) * 100).toFixed(2)),
        volume: Math.floor(Math.random() * 50000000) + 10000000,
        bid: parseFloat((price - 0.05).toFixed(2)),
        ask: parseFloat((price + 0.05).toFixed(2)),
        bid_sz: Math.floor(Math.random() * 10000) + 1000,
        ask_sz: Math.floor(Math.random() * 10000) + 1000
      }
      mockConnections[symbol] = true
    })
    
    setMarketData(mockData)
    setConnections(mockConnections)
    
    // Update mock data with smaller, more realistic changes every 5 seconds
    const interval = setInterval(() => {
      setMarketData(prevData => {
        const updatedData = {}
        symbols.forEach(symbol => {
          const currentData = prevData[symbol]
          if (!currentData) return
          
          const basePrice = symbol === 'AAPL' ? 150.0 : symbol === 'MSFT' ? 300.0 : 450.0
          const currentPrice = currentData.price
          
          // Small random walk (more realistic price movement)
          const priceChange = (Math.random() - 0.5) * 0.5 // Max $0.50 change
          const newPrice = Math.max(basePrice * 0.9, Math.min(basePrice * 1.1, currentPrice + priceChange))
          
          const change = newPrice - basePrice
          
          updatedData[symbol] = {
            symbol: symbol,
            price: parseFloat(newPrice.toFixed(2)),
            change: parseFloat(change.toFixed(2)),
            change_percent: parseFloat(((change / basePrice) * 100).toFixed(2)),
            volume: Math.floor(Math.random() * 50000000) + 10000000,
            bid: parseFloat((newPrice - 0.05).toFixed(2)),
            ask: parseFloat((newPrice + 0.05).toFixed(2)),
            bid_sz: Math.floor(Math.random() * 10000) + 1000,
            ask_sz: Math.floor(Math.random() * 10000) + 1000
          }
        })
        return updatedData
      })
    }, 5000) // Changed from 2 seconds to 5 seconds
    
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
        border: '1px solid #e5e7eb',
        borderRadius: '4px',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{symbol}</div>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>Loading...</div>
      </div>
    )
  }

  // Check if data has the required properties
  if (!data.bid || !data.ask) {
    return (
      <div style={{
        padding: '8px',
        border: '1px solid #e5e7eb',
        borderRadius: '4px',
        backgroundColor: '#fef2f2'
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{symbol}</div>
        <div style={{ fontSize: '12px', color: '#ef4444' }}>No data available</div>
      </div>
    )
  }
  
  const spread = data.ask - data.bid
  const spreadPercent = (spread / data.bid) * 100
  
  return (
    <div style={{
      padding: '8px',
      border: '1px solid #e5e7eb',
      borderRadius: '4px',
      backgroundColor: connected ? '#ffffff' : '#fef2f2'
    }}>
      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{symbol}</div>
      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
        ${data.bid.toFixed(2)} x ${data.ask.toFixed(2)}
      </div>
      <div style={{ fontSize: '12px', color: '#6b7280' }}>
        Spread: ${spread.toFixed(2)} ({spreadPercent.toFixed(2)}%)
      </div>
      <div style={{ fontSize: '10px', color: '#9ca3af' }}>
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
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      backgroundColor: '#ffffff'
    }}>
      <h3 style={{ margin: '0 0 16px 0' }}>Place Order</h3>
      
      <div style={{ display: 'grid', gap: '8px' }}>
        <label style={{ display: 'grid', gap: '4px' }}>
          Symbol
          <input 
            value={symbol} 
            onChange={e => setSymbol(e.target.value.toUpperCase())}
            style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
          />
        </label>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <label style={{ display: 'grid', gap: '4px' }}>
            Side
            <select 
              value={side} 
              onChange={e => setSide(e.target.value)}
              style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
            >
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </label>
          
          <label style={{ display: 'grid', gap: '4px' }}>
            Type
            <select 
              value={orderType} 
              onChange={e => setOrderType(e.target.value)}
              style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
            >
              <option value="MARKET">MARKET</option>
              <option value="LIMIT">LIMIT</option>
            </select>
          </label>
        </div>
        
        {orderType === 'LIMIT' && (
          <label style={{ display: 'grid', gap: '4px' }}>
            Limit Price
            <input 
              type="number" 
              step="0.01" 
              value={limitPrice} 
              onChange={e => setLimitPrice(e.target.value)}
              placeholder={suggestedLimit ? suggestedLimit.toFixed(2) : ''}
              style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
            />
          </label>
        )}
        
        <label style={{ display: 'grid', gap: '4px' }}>
          Quantity
          <input 
            type="number" 
            value={qty} 
            onChange={e => setQty(e.target.value)}
            style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
          />
        </label>
      </div>
      
      <button 
        type="submit" 
        disabled={submitting}
        style={{
          padding: '12px',
          backgroundColor: side === 'BUY' ? '#22c55e' : '#ef4444',
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
    return <div style={{ padding: '16px', textAlign: 'center' }}>Loading orders...</div>
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
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Time</th>
            <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>ID</th>
            <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Symbol</th>
            <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Side</th>
            <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Qty</th>
            <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Filled</th>
            <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Status</th>
            <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>AvgPx</th>
            <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id} style={{
              backgroundColor: order.status === 'FILLED' ? '#f0fdf4' : 
                             order.status === 'REJECTED' ? '#fef2f2' : 
                             order.status === 'PARTIAL' ? '#fffbeb' : 
                             order.status === 'CANCELED' ? '#f3f4f6' : '#ffffff',
              borderBottom: '1px solid #f3f4f6'
            }}>
              <td style={{ padding: '8px' }}>{new Date(order.created_at * 1000).toLocaleTimeString()}</td>
              <td style={{ padding: '8px', fontFamily: 'monospace' }}>{order.id.slice(0, 8)}</td>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>{order.symbol}</td>
              <td style={{ 
                padding: '8px', 
                color: order.side === 'BUY' ? '#22c55e' : '#ef4444',
                fontWeight: 'bold'
              }}>{order.side}</td>
              <td style={{ padding: '8px', textAlign: 'right' }}>{order.qty.toLocaleString()}</td>
              <td style={{ padding: '8px', textAlign: 'right' }}>{order.filled_qty.toLocaleString()}</td>
              <td style={{ 
                padding: '8px', 
                textAlign: 'center',
                color: order.status === 'FILLED' ? '#22c55e' : 
                       order.status === 'REJECTED' ? '#ef4444' : 
                       order.status === 'PARTIAL' ? '#f59e0b' : 
                       order.status === 'CANCELED' ? '#6b7280' : '#6b7280'
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
                      backgroundColor: '#ef4444',
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
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: '#ffffff'
      }}>
        <h3 style={{ margin: '0 0 16px 0' }}>Trading Statistics</h3>
        <div style={{ textAlign: 'center' }}>Loading...</div>
      </div>
    )
  }
  
  if (!stats) return null
  
  return (
    <div style={{
      padding: '16px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      backgroundColor: '#ffffff'
    }}>
      <h3 style={{ margin: '0 0 16px 0' }}>Trading Statistics</h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px'
      }}>
        <div style={{
          padding: '12px',
          backgroundColor: '#f0fdf4',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
            {stats.total_orders}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Orders</div>
        </div>
        
        <div style={{
          padding: '12px',
          backgroundColor: '#f0fdf4',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
            {stats.filled_orders}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Filled Orders</div>
        </div>
        
        <div style={{
          padding: '12px',
          backgroundColor: '#fffbeb',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
            {stats.pending_orders}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Pending Orders</div>
        </div>
        
        <div style={{
          padding: '12px',
          backgroundColor: '#fef2f2',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
            {stats.rejected_orders}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Rejected Orders</div>
        </div>
        
        <div style={{
          padding: '12px',
          backgroundColor: '#eff6ff',
          borderRadius: '6px',
          textAlign: 'center',
          gridColumn: 'span 2'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>
            {stats.total_volume.toLocaleString()} shares
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
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
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            <th style={{ padding: '6px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Time</th>
            <th style={{ padding: '6px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Type</th>
            <th style={{ padding: '6px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Symbol</th>
            <th style={{ padding: '6px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Side</th>
            <th style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Qty</th>
            <th style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Filled</th>
            <th style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Status</th>
            <th style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>AvgPx</th>
          </tr>
        </thead>
        <tbody>
          {updates.map((m, i) => {
            if (m.type === 'order_update' && m.data) {
              const order = m.data;
              return (
                <tr key={i} style={{
                  backgroundColor: order.status === 'FILLED' ? '#f0fdf4' : 
                                 order.status === 'REJECTED' ? '#fef2f2' : 
                                 order.status === 'PARTIAL' ? '#fffbeb' : '#ffffff',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <td style={{ padding: '6px' }}>{new Date(order.created_at * 1000).toLocaleTimeString()}</td>
                  <td style={{ padding: '6px' }}>{m.type}</td>
                  <td style={{ padding: '6px', fontWeight: 'bold' }}>{order.symbol}</td>
                  <td style={{ 
                    padding: '6px', 
                    color: order.side === 'BUY' ? '#22c55e' : '#ef4444'
                  }}>{order.side}</td>
                  <td style={{ padding: '6px', textAlign: 'right' }}>{order.qty}</td>
                  <td style={{ padding: '6px', textAlign: 'right' }}>{order.filled_qty}</td>
                  <td style={{ 
                    padding: '6px', 
                    textAlign: 'center',
                    color: order.status === 'FILLED' ? '#22c55e' : 
                           order.status === 'REJECTED' ? '#ef4444' : 
                           order.status === 'PARTIAL' ? '#f59e0b' : '#6b7280'
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
                    color: '#6b7280'
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
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: '#ffffff'
      }}>
        <h3 style={{ margin: '0 0 16px 0' }}>Portfolio</h3>
        <div style={{ textAlign: 'center' }}>Loading...</div>
      </div>
    )
  }
  
  if (!portfolio || !portfolio.portfolio || portfolio.portfolio.length === 0) {
    return (
      <div style={{
        padding: '16px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: '#ffffff'
      }}>
        <h3 style={{ margin: '0 0 16px 0' }}>Portfolio</h3>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>No positions</div>
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
      <h3 style={{ margin: '0 0 16px 0' }}>Portfolio</h3>
      
      {/* Portfolio Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={{
          padding: '12px',
          backgroundColor: '#eff6ff',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>
            ${portfolio.summary?.total_value?.toLocaleString() || '0'}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Position Value</div>
        </div>
        
        <div style={{
          padding: '12px',
          backgroundColor: portfolio.summary?.total_pnl >= 0 ? '#f0fdf4' : '#fef2f2',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: portfolio.summary?.total_pnl >= 0 ? '#22c55e' : '#ef4444'
          }}>
            ${portfolio.summary?.total_pnl?.toLocaleString() || '0'}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Total P&L</div>
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
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Symbol</th>
              <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Qty</th>
              <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Avg Price</th>
              <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Market Price</th>
              <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>P&L</th>
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
                  borderBottom: '1px solid #f3f4f6'
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
                    color: totalPnl >= 0 ? '#22c55e' : '#ef4444',
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

  useEffect(() => {
    runScanner()
    const interval = setInterval(runScanner, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  return (
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
        <h3 style={{ margin: 0 }}>Technical Scanner</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={loadHelp}
            style={{
              padding: '8px 12px',
              backgroundColor: '#6b7280',
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
              backgroundColor: '#3b82f6',
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

      {showHelp && helpData && (
        <div style={{
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: '#f8fafc',
          borderRadius: '6px',
          border: '1px solid #e2e8f0'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Technical Analysis Guide</h4>
          <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
            {Object.entries(helpData.indicators).map(([indicator, info]) => (
              <div key={indicator} style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#3b82f6' }}>{indicator}:</strong> {info.description}
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
        <div style={{ textAlign: 'center', padding: '20px' }}>Scanning for technical signals...</div>
      ) : (
        <div style={{ overflow: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Symbol</th>
                <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Price</th>
                <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Change %</th>
                <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>RSI</th>
                <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>MACD</th>
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
                  <td style={{ 
                    padding: '8px', 
                    textAlign: 'right',
                    color: result.change_percent >= 0 ? '#22c55e' : '#ef4444'
                  }}>
                    ${result.price.toFixed(2)}
                  </td>
                  <td style={{ 
                    padding: '8px', 
                    textAlign: 'right',
                    color: result.change_percent >= 0 ? '#22c55e' : '#ef4444'
                  }}>
                    {result.change_percent >= 0 ? '+' : ''}{result.change_percent.toFixed(2)}%
                  </td>
                  <td style={{ 
                    padding: '8px', 
                    textAlign: 'center',
                    color: result.technical.rsi > 70 ? '#ef4444' : 
                           result.technical.rsi < 30 ? '#22c55e' : '#6b7280'
                  }}>
                    {result.technical.rsi.toFixed(1)}
                  </td>
                  <td style={{ 
                    padding: '8px', 
                    textAlign: 'center',
                    color: result.technical.macd_histogram > 0 ? '#22c55e' : '#ef4444'
                  }}>
                    {result.technical.macd_histogram > 0 ? '↑' : '↓'}
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
  )
}

function FundamentalScanner({ marketData }) {
  const [scannerResults, setScannerResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [helpData, setHelpData] = useState(null)
  const [showHelp, setShowHelp] = useState(false)

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
        <h3 style={{ margin: 0 }}>Fundamental Scanner</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={loadHelp}
            style={{
              padding: '8px 12px',
              backgroundColor: '#6b7280',
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
              backgroundColor: '#3b82f6',
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

      {showHelp && helpData && (
        <div style={{
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: '#f8fafc',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          maxHeight: '300px',
          overflow: 'auto'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Fundamental Analysis Guide</h4>
          <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
            {Object.entries(helpData.metrics).map(([category, metrics]) => (
              <div key={category} style={{ marginBottom: '16px' }}>
                <strong style={{ color: '#3b82f6', fontSize: '14px' }}>{category.replace('_', ' ')}:</strong>
                {Object.entries(metrics).map(([metric, info]) => (
                  <div key={metric} style={{ marginTop: '8px', marginLeft: '12px' }}>
                    <strong style={{ color: '#374151' }}>{metric.replace('_', ' ')}:</strong> {info.description}
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
        <div style={{ textAlign: 'center', padding: '20px' }}>Scanning for fundamental signals...</div>
      ) : (
        <div style={{ overflow: 'auto' }}>
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
                <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>P/B</th>
                <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Div Yield</th>
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
                    color: result.fundamental.pb_ratio < 1 ? '#22c55e' : 
                           result.fundamental.pb_ratio > 10 ? '#ef4444' : '#6b7280'
                  }}>
                    {result.fundamental.pb_ratio.toFixed(2)}
                  </td>
                  <td style={{ 
                    padding: '8px', 
                    textAlign: 'right',
                    color: result.fundamental.dividend_yield > 3 ? '#22c55e' : '#6b7280'
                  }}>
                    {result.fundamental.dividend_yield.toFixed(2)}%
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
  const { marketData, connections } = useMarketData(['AAPL', 'MSFT', 'SPY', 'GOOGL', 'TSLA', 'NVDA', 'AMZN', 'META'])
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [portfolio, setPortfolio] = useState(null)
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL')
  const [activeTab, setActiveTab] = useState('trading')
  const [learningSubTab, setLearningSubTab] = useState('overview')
  
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
    <div style={{
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '16px',
      backgroundColor: '#f9fafb',
      minHeight: '100vh'
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
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h1 style={{ margin: 0, color: '#1f2937' }}>Market Simulator — Trading Platform</h1>
          <div style={{ display: 'flex', gap: '16px' }}>
            <ConnectionStatus connected={brokerConnected} type="Broker" />
            <ConnectionStatus connected={Object.values(connections).some(c => c)} type="Market Data" />
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
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          {['trading', 'charts', 'portfolio', 'journal', 'advanced', 'notes', 'learning', 'technical', 'fundamental', 'analysis', 'settings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 24px',
                backgroundColor: activeTab === tab ? '#3b82f6' : 'transparent',
                color: activeTab === tab ? 'white' : '#6b7280',
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
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#ffffff'
              }}>
                <h3 style={{ margin: '0 0 16px 0' }}>Market Data</h3>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {Object.entries(marketData).map(([symbol, data]) => (
                    <MarketDataWidget 
                      key={symbol}
                      symbol={symbol}
                      data={data}
                      connected={connections[symbol]}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Right Panel - Order Management */}
            <div style={{ display: 'grid', gap: '16px' }}>
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
                  <h3 style={{ margin: 0 }}>Order Blotter</h3>
                  <button 
                    onClick={refetch}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#3b82f6',
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
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#ffffff'
              }}>
                <h3 style={{ margin: '0 0 16px 0' }}>Live Events</h3>
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
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#ffffff'
            }}>
              <h3 style={{ margin: '0 0 16px 0' }}>Portfolio Management</h3>
              <p style={{ color: '#6b7280', marginBottom: '24px' }}>
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
                  <h4 style={{ margin: '0 0 16px 0' }}>Performance Metrics</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                        ${portfolio.summary?.total_value?.toLocaleString() || '0'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Portfolio Value</div>
                    </div>
                    
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      textAlign: 'center'
                    }}>
                      <div style={{ 
                        fontSize: '24px', 
                        fontWeight: 'bold',
                        color: portfolio.summary?.total_pnl >= 0 ? '#22c55e' : '#ef4444'
                      }}>
                        ${portfolio.summary?.total_pnl?.toLocaleString() || '0'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Total P&L</div>
                    </div>
                    
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      textAlign: 'center'
                    }}>
                      <div style={{ 
                        fontSize: '24px', 
                        fontWeight: 'bold',
                        color: portfolio.summary?.total_pnl_percent >= 0 ? '#22c55e' : '#ef4444'
                      }}>
                        {portfolio.summary?.total_pnl_percent?.toFixed(2) || '0'}%
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Return %</div>
                    </div>
                    
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                        {portfolio.summary?.positions_count || '0'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Active Positions</div>
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
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              overflow: 'hidden'
            }}>
              {['overview', 'technical-guide', 'fundamental-guide', 'strategy-wiki', 'quiz'].map(subTab => (
                <button
                  key={subTab}
                  onClick={() => setLearningSubTab(subTab)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: learningSubTab === subTab ? '#3b82f6' : 'transparent',
                    color: learningSubTab === subTab ? 'white' : '#6b7280',
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
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#ffffff'
              }}>
                <h3 style={{ margin: '0 0 16px 0' }}>Trading Education Center</h3>
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
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#ffffff'
            }}>
              <h3 style={{ margin: '0 0 16px 0' }}>Symbol Selection</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {Object.keys(marketData).map(symbol => (
                  <button
                    key={symbol}
                    onClick={() => setSelectedSymbol(symbol)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: selectedSymbol === symbol ? '#3b82f6' : '#f3f4f6',
                      color: selectedSymbol === symbol ? 'white' : '#374151',
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
  )
}

export default App
