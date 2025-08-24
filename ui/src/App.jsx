import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Button,
  Flex,
  Text,
  VStack,
  HStack,
  Badge,
  Icon,
  useColorModeValue,
  Grid,
  GridItem,
  Divider,
  Spinner,
  Center,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Tooltip,
  useToast
} from '@chakra-ui/react'
import { 
  FiBarChart2, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiDollarSign,
  FiRefreshCw,
  FiEye,
  FiEyeOff,
  FiClock,
  FiCalendar,
  FiActivity,
  FiPieChart,
  FiBookOpen,
  FiSettings,
  FiX,
  FiCheck,
  FiAlertCircle
} from 'react-icons/fi'
import Chart from './components/Chart'
import EnhancedJournal from './components/EnhancedJournal'
import ChartSubsystem from './components/ChartSubsystem'

const BROKER = (import.meta.env.VITE_BROKER_URL) || 'http://localhost:8000'
const SIP = (import.meta.env.VITE_SIP_URL) || 'ws://localhost:8002/ws/nbbo?symbol='

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
  
  useEffect(() => {
    const newConnections = {}
    
    symbols.forEach(symbol => {
      const ws = new WebSocket(`${SIP}${symbol}`)
      
      ws.onopen = () => {
        ws.send('k')
        setConnections(prev => ({ ...prev, [symbol]: true }))
      }
      
      ws.onclose = () => {
        setConnections(prev => ({ ...prev, [symbol]: false }))
      }
      
      ws.onmessage = (e) => {
        try {
          const message = JSON.parse(e.data)
          // Handle both direct data and wrapped data from WebSocket
          const data = message.data || message
          setMarketData(prev => ({ ...prev, [symbol]: data }))
        } catch (error) {
          console.error(`Failed to parse market data for ${symbol}:`, error)
        }
      }
      
      newConnections[symbol] = ws
    })
    
    return () => {
      Object.values(newConnections).forEach(ws => ws.close())
    }
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

function MarketDataWidget({ symbol, data, connected, onChartClick }) {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')

  if (!data) {
    return (
      <Card
        bg="gray.50"
        border="1px"
        borderColor={borderColor}
        cursor="not-allowed"
        opacity={0.7}
      >
        <CardBody p={3}>
          <HStack justify="space-between" mb={2}>
            <Text fontWeight="bold" fontSize="sm">
              {symbol}
            </Text>
            <Spinner size="xs" color="gray.400" />
          </HStack>
          <Text fontSize="xs" color="gray.500">
            Loading...
          </Text>
        </CardBody>
      </Card>
    )
  }
  
  // Handle both old and new data structures
  const nbbo = data.nbbo || data
  const price = data.price || nbbo.bid
  const change = data.change || 0
  const changePercent = data.change_percent || 0
  
  if (!nbbo || !nbbo.bid || !nbbo.ask) {
    return (
      <Card
        bg="red.50"
        border="1px"
        borderColor="red.200"
        cursor="not-allowed"
        opacity={0.7}
      >
        <CardBody p={3}>
          <HStack justify="space-between" mb={2}>
            <Text fontWeight="bold" fontSize="sm">
              {symbol}
            </Text>
            <Icon as={FiAlertCircle} color="red.400" />
          </HStack>
          <Text fontSize="xs" color="red.500">
            No data available
          </Text>
        </CardBody>
      </Card>
    )
  }
  
  const spread = nbbo.ask - nbbo.bid
  const spreadPercent = (spread / nbbo.bid) * 100
  
  return (
    <Card
      bg={connected ? bgColor : 'red.50'}
      border="1px"
      borderColor={connected ? borderColor : 'red.200'}
      cursor="pointer"
      transition="all 0.2s"
      _hover={{
        bg: hoverBg,
        borderColor: 'brand.500',
        transform: 'translateY(-2px)',
        boxShadow: 'lg'
      }}
      onClick={() => onChartClick(symbol, data)}
    >
      <CardBody p={3}>
        <HStack justify="space-between" mb={2}>
          <Text fontWeight="bold" fontSize="sm">
            {symbol}
          </Text>
          <Tooltip label="View Chart" placement="top">
                          <IconButton
                size="xs"
                colorScheme="brand"
                variant="outline"
                icon={<Icon as={FiBarChart2} />}
                onClick={(e) => {
                  e.stopPropagation()
                  onChartClick(symbol, data)
                }}
                _hover={{
                  bg: 'brand.500',
                  color: 'white'
                }}
              />
          </Tooltip>
        </HStack>
        
        <HStack justify="space-between" align="baseline">
          <Text fontSize="lg" fontWeight="bold">
            ${price.toFixed(2)}
          </Text>
          <HStack spacing={1}>
            <Icon 
              as={changePercent >= 0 ? FiTrendingUp : FiTrendingDown} 
              color={changePercent >= 0 ? 'success.500' : 'danger.500'}
              boxSize={3}
            />
            <Text 
              fontSize="xs" 
              color={changePercent >= 0 ? 'success.500' : 'danger.500'}
              fontWeight="medium"
            >
              {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
            </Text>
          </HStack>
        </HStack>
        
        <VStack spacing={1} align="stretch" mt={2}>
          <Text fontSize="sm" color="gray.600">
            ${nbbo.bid.toFixed(2)} x ${nbbo.ask.toFixed(2)}
          </Text>
          <Text fontSize="xs" color="gray.500">
            Spread: ${spread.toFixed(2)} ({spreadPercent.toFixed(2)}%)
          </Text>
          <Text fontSize="xs" color="gray.400">
            Bid: {nbbo.bid_sz} | Ask: {nbbo.ask_sz}
          </Text>
          {data.volume && (
            <Text fontSize="xs" color="gray.400">
              Vol: {(data.volume / 1000000).toFixed(1)}M
            </Text>
          )}
          {data.technical && (
            <HStack spacing={2} mt={1}>
              <Badge size="sm" colorScheme="blue" variant="subtle">
                RSI: {data.technical.rsi?.toFixed(1) || 'N/A'}
              </Badge>
              <Badge size="sm" colorScheme="purple" variant="subtle">
                MACD: {data.technical.macd?.toFixed(3) || 'N/A'}
              </Badge>
            </HStack>
          )}
        </VStack>
      </CardBody>
    </Card>
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
    (side === 'BUY' ? (currentPrice.nbbo?.ask || currentPrice.ask) : (currentPrice.nbbo?.bid || currentPrice.bid)) : ''
  
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

function AdvancedOrderForm({ onSubmit, marketData }) {
  const [symbol, setSymbol] = useState('AAPL')
  const [side, setSide] = useState('BUY')
  const [orderType, setOrderType] = useState('MARKET')
  const [qty, setQty] = useState(100)
  const [limitPrice, setLimitPrice] = useState('')
  const [stopPrice, setStopPrice] = useState('')
  const [trailingPercent, setTrailingPercent] = useState('')
  const [profitTarget, setProfitTarget] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [tif, setTif] = useState('DAY')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const currentPrice = marketData[symbol]
  const suggestedLimit = currentPrice ? 
    (side === 'BUY' ? (currentPrice.nbbo?.ask || currentPrice.ask) : (currentPrice.nbbo?.bid || currentPrice.bid)) : ''
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const body = { 
        symbol, 
        side, 
        order_type: orderType, 
        qty: Number(qty), 
        tif: tif,
        notes: notes || undefined
      }
      
      // Add order-specific fields
      if (orderType === 'LIMIT' || orderType === 'STOP_LIMIT') {
        body.limit_price = Number(limitPrice || suggestedLimit)
      }
      
      if (orderType === 'STOP' || orderType === 'STOP_LIMIT') {
        body.stop_price = Number(stopPrice)
      }
      
      if (orderType === 'TRAILING_STOP' || orderType === 'TRAILING_STOP_LIMIT') {
        body.trailing_percent = Number(trailingPercent)
        body.stop_price = Number(stopPrice)
        if (orderType === 'TRAILING_STOP_LIMIT') {
          body.limit_price = Number(limitPrice)
        }
      }
      
      if (orderType === 'OCO') {
        body.limit_price = Number(limitPrice)
        body.stop_price = Number(stopPrice)
      }
      
      if (orderType === 'BRACKET') {
        body.profit_target = Number(profitTarget)
        body.stop_loss = Number(stopLoss)
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
        setStopPrice('')
        setTrailingPercent('')
        setProfitTarget('')
        setStopLoss('')
        setNotes('')
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
      <h3 style={{ margin: '0 0 16px 0' }}>Advanced Order Entry</h3>
      
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
            Order Type
            <select 
              value={orderType} 
              onChange={e => setOrderType(e.target.value)}
              style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
            >
              <option value="MARKET">MARKET</option>
              <option value="LIMIT">LIMIT</option>
              <option value="STOP">STOP</option>
              <option value="STOP_LIMIT">STOP LIMIT</option>
              <option value="TRAILING_STOP">TRAILING STOP</option>
              <option value="TRAILING_STOP_LIMIT">TRAILING STOP LIMIT</option>
              <option value="OCO">OCO</option>
              <option value="BRACKET">BRACKET</option>
            </select>
          </label>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <label style={{ display: 'grid', gap: '4px' }}>
            Quantity
            <input 
              type="number" 
              value={qty} 
              onChange={e => setQty(e.target.value)}
              style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
            />
          </label>
          
          <label style={{ display: 'grid', gap: '4px' }}>
            Time in Force
            <select 
              value={tif} 
              onChange={e => setTif(e.target.value)}
              style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
            >
              <option value="DAY">DAY</option>
              <option value="GTC">GTC</option>
              <option value="IOC">IOC</option>
              <option value="FOK">FOK</option>
            </select>
          </label>
        </div>
        
        {/* Conditional fields based on order type */}
        {(orderType === 'LIMIT' || orderType === 'STOP_LIMIT' || orderType === 'TRAILING_STOP_LIMIT' || orderType === 'OCO') && (
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
        
        {(orderType === 'STOP' || orderType === 'STOP_LIMIT' || orderType === 'TRAILING_STOP' || orderType === 'TRAILING_STOP_LIMIT' || orderType === 'OCO') && (
          <label style={{ display: 'grid', gap: '4px' }}>
            Stop Price
            <input 
              type="number" 
              step="0.01" 
              value={stopPrice} 
              onChange={e => setStopPrice(e.target.value)}
              style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
            />
          </label>
        )}
        
        {(orderType === 'TRAILING_STOP' || orderType === 'TRAILING_STOP_LIMIT') && (
          <label style={{ display: 'grid', gap: '4px' }}>
            Trailing Percent
            <input 
              type="number" 
              step="0.1" 
              value={trailingPercent} 
              onChange={e => setTrailingPercent(e.target.value)}
              placeholder="e.g., 2.0 for 2%"
              style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
            />
          </label>
        )}
        
        {orderType === 'BRACKET' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <label style={{ display: 'grid', gap: '4px' }}>
              Profit Target
              <input 
                type="number" 
                step="0.01" 
                value={profitTarget} 
                onChange={e => setProfitTarget(e.target.value)}
                style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
              />
            </label>
            <label style={{ display: 'grid', gap: '4px' }}>
              Stop Loss
              <input 
                type="number" 
                step="0.01" 
                value={stopLoss} 
                onChange={e => setStopLoss(e.target.value)}
                style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
              />
            </label>
          </div>
        )}
        
        <label style={{ display: 'grid', gap: '4px' }}>
          Notes
          <textarea 
            value={notes} 
            onChange={e => setNotes(e.target.value)}
            placeholder="Trading notes, strategy, etc."
            rows="2"
            style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', resize: 'vertical' }}
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
        {submitting ? 'Submitting...' : `${side} ${symbol} (${orderType})`}
      </button>
    </form>
  )
}

function OrderBookWidget({ symbol }) {
  const [orderBook, setOrderBook] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchOrderBook = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${BROKER}/order-book/${symbol}`)
      if (response.ok) {
        const data = await response.json()
        setOrderBook(data)
      }
    } catch (error) {
      console.error('Order book error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (symbol) {
      fetchOrderBook()
      const interval = setInterval(fetchOrderBook, 2000) // Refresh every 2 seconds
      return () => clearInterval(interval)
    }
  }, [symbol])

  if (!symbol) {
    return (
      <div style={{
        padding: '16px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: '#ffffff'
      }}>
        <h3 style={{ margin: '0 0 16px 0' }}>Order Book</h3>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          Select a symbol to view order book
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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{ margin: 0 }}>Order Book - {symbol}</h3>
        <button
          onClick={fetchOrderBook}
          disabled={loading}
          style={{
            padding: '4px 8px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '12px'
          }}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>Loading order book...</div>
      ) : orderBook ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Asks (Sell Orders) */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', color: '#ef4444', fontSize: '14px' }}>Asks (Sell)</h4>
            <div style={{ fontSize: '12px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '4px',
                padding: '4px',
                backgroundColor: '#f3f4f6',
                fontWeight: 'bold'
              }}>
                <div>Price</div>
                <div>Size</div>
                <div>Total</div>
              </div>
              {orderBook.asks.slice(0, 10).map((ask, index) => (
                <div key={index} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '4px',
                  padding: '4px',
                  borderBottom: '1px solid #f3f4f6',
                  color: '#ef4444'
                }}>
                  <div>${ask.price.toFixed(2)}</div>
                  <div>{ask.size.toLocaleString()}</div>
                  <div>{(ask.price * ask.size).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bids (Buy Orders) */}
          <div>
            <h4 style={{ margin: '0 0 8px 0', color: '#22c55e', fontSize: '14px' }}>Bids (Buy)</h4>
            <div style={{ fontSize: '12px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '4px',
                padding: '4px',
                backgroundColor: '#f3f4f6',
                fontWeight: 'bold'
              }}>
                <div>Price</div>
                <div>Size</div>
                <div>Total</div>
              </div>
              {orderBook.bids.slice(0, 10).map((bid, index) => (
                <div key={index} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '4px',
                  padding: '4px',
                  borderBottom: '1px solid #f3f4f6',
                  color: '#22c55e'
                }}>
                  <div>${bid.price.toFixed(2)}</div>
                  <div>{bid.size.toLocaleString()}</div>
                  <div>{(bid.price * bid.size).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: '#6b7280' }}>No order book data available</div>
      )}
    </div>
  )
}

function TradeJournalWidget() {
  const [journal, setJournal] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all') // all, buys, sells
  const [selectedSymbol, setSelectedSymbol] = useState('all')

  const fetchJournal = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${BROKER}/trade-journal?limit=100`)
      if (response.ok) {
        const data = await response.json()
        setJournal(data)
      }
    } catch (error) {
      console.error('Trade journal error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJournal()
    const interval = setInterval(fetchJournal, 3000) // Refresh every 3 seconds for real-time updates
    return () => clearInterval(interval)
  }, [])

  // Calculate dynamic height based on number of rows
  const rowHeight = 35; // Approximate height per row including padding
  const headerHeight = 80; // Header height including filters
  const minHeight = 300; // Minimum height
  const maxHeight = 600; // Maximum height
  
  const filteredJournal = journal.filter(entry => {
    if (filter === 'buys' && entry.side !== 'BUY') return false;
    if (filter === 'sells' && entry.side !== 'SELL') return false;
    if (selectedSymbol !== 'all' && entry.symbol !== selectedSymbol) return false;
    return true;
  });
  
  const dataRows = filteredJournal.length;
  const calculatedHeight = Math.min(Math.max(minHeight, headerHeight + (dataRows * rowHeight)), maxHeight);

  // Get unique symbols for filter
  const symbols = [...new Set(journal.map(entry => entry.symbol))].sort();

  // Calculate summary statistics
  const totalTrades = filteredJournal.length;
  const totalVolume = filteredJournal.reduce((sum, entry) => sum + entry.qty, 0);
  const totalValue = filteredJournal.reduce((sum, entry) => sum + (entry.qty * entry.price), 0);
  const avgPrice = totalVolume > 0 ? totalValue / totalVolume : 0;

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
        <h3 style={{ margin: 0 }}>Trade Journal</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Symbol Filter */}
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            style={{
              padding: '4px 8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            <option value="all">All Symbols</option>
            {symbols.map(symbol => (
              <option key={symbol} value={symbol}>{symbol}</option>
            ))}
          </select>
          
          {/* Side Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '4px 8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            <option value="all">All Trades</option>
            <option value="buys">Buys Only</option>
            <option value="sells">Sells Only</option>
          </select>
          
          <button
            onClick={fetchJournal}
            disabled={loading}
            style={{
              padding: '4px 8px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '12px'
            }}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '16px',
        padding: '12px',
        backgroundColor: '#f9fafb',
        borderRadius: '6px',
        fontSize: '12px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', color: '#374151' }}>Total Trades</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#3b82f6' }}>{totalTrades}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', color: '#374151' }}>Total Volume</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>{totalVolume.toLocaleString()}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', color: '#374151' }}>Total Value</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f59e0b' }}>${totalValue.toLocaleString()}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', color: '#374151' }}>Avg Price</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#8b5cf6' }}>${avgPrice.toFixed(2)}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>Loading trade journal...</div>
      ) : (
        <div style={{ 
          overflow: 'auto', 
          height: `${calculatedHeight}px`,
          minHeight: `${minHeight}px`,
          maxHeight: `${maxHeight}px`
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '11px'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ padding: '6px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Time</th>
                <th style={{ padding: '6px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Symbol</th>
                <th style={{ padding: '6px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Side</th>
                <th style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Qty</th>
                <th style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Price</th>
                <th style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Quality</th>
                <th style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Slippage</th>
                <th style={{ padding: '6px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Notes</th>
              </tr>
              <tr style={{ backgroundColor: '#f9fafb', fontSize: '10px' }}>
                <td colSpan="8" style={{ padding: '4px 6px', textAlign: 'center', color: '#6b7280' }}>
                  {dataRows} trade{dataRows !== 1 ? 's' : ''} • Height: {calculatedHeight}px • Filter: {filter} {selectedSymbol !== 'all' ? `• Symbol: ${selectedSymbol}` : ''}
                </td>
              </tr>
            </thead>
            <tbody>
              {filteredJournal.map((entry, index) => (
                <tr key={index} style={{
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <td style={{ padding: '6px' }}>
                    {new Date(entry.timestamp * 1000).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: '6px', fontWeight: 'bold' }}>{entry.symbol}</td>
                  <td style={{ 
                    padding: '6px', 
                    color: entry.side === 'BUY' ? '#22c55e' : '#ef4444'
                  }}>{entry.side}</td>
                  <td style={{ padding: '6px', textAlign: 'right' }}>{entry.qty.toLocaleString()}</td>
                  <td style={{ padding: '6px', textAlign: 'right' }}>${entry.price.toFixed(2)}</td>
                  <td style={{ 
                    padding: '6px', 
                    textAlign: 'center',
                    color: entry.execution_quality === 'Good' ? '#22c55e' : 
                           entry.execution_quality === 'Fair' ? '#f59e0b' : '#ef4444'
                  }}>{entry.execution_quality}</td>
                  <td style={{ padding: '6px', textAlign: 'right' }}>
                    {entry.slippage ? `$${entry.slippage.toFixed(2)}` : '-'}
                  </td>
                  <td style={{ padding: '6px', fontSize: '10px' }}>
                    {entry.notes || '-'}
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

function TradingFlowVisualizer() {
  const [flowData, setFlowData] = useState([])

  useEffect(() => {
    // Simulate trading flow data
    const flows = [
      { step: 1, component: 'Trader', action: 'Submit Order', status: 'success', timestamp: Date.now() - 4000 },
      { step: 2, component: 'Broker', action: 'Validate Order', status: 'success', timestamp: Date.now() - 3000 },
      { step: 3, component: 'Risk Engine', action: 'Check Limits', status: 'success', timestamp: Date.now() - 2000 },
      { step: 4, component: 'Exchange', action: 'Match Order', status: 'pending', timestamp: Date.now() - 1000 },
      { step: 5, component: 'Exchange', action: 'Execute Trade', status: 'pending', timestamp: Date.now() },
      { step: 6, component: 'Broker', action: 'Update Position', status: 'pending', timestamp: Date.now() + 1000 },
      { step: 7, component: 'Trader', action: 'Receive Confirmation', status: 'pending', timestamp: Date.now() + 2000 }
    ]
    setFlowData(flows)
  }, [])

  return (
    <div style={{
      padding: '16px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      backgroundColor: '#ffffff'
    }}>
      <h3 style={{ margin: '0 0 16px 0' }}>Trading Flow</h3>
      <div style={{ display: 'grid', gap: '8px' }}>
        {flowData.map((flow, index) => (
          <div key={index} style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            gap: '12px',
            alignItems: 'center',
            padding: '8px',
            backgroundColor: flow.status === 'success' ? '#f0fdf4' : 
                           flow.status === 'pending' ? '#fffbeb' : '#fef2f2',
            borderRadius: '4px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: flow.status === 'success' ? '#22c55e' : 
                             flow.status === 'pending' ? '#f59e0b' : '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {flow.step}
            </div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{flow.component}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>{flow.action}</div>
            </div>
            <div style={{
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              backgroundColor: flow.status === 'success' ? '#dcfce7' : 
                             flow.status === 'pending' ? '#fef3c7' : '#fee2e2',
              color: flow.status === 'success' ? '#166534' : 
                    flow.status === 'pending' ? '#92400e' : '#991b1b'
            }}>
              {flow.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function OrderBlotter({ orders, loading, onCancelOrder }) {
  const handleCancel = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      await onCancelOrder(orderId)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'FILLED': return '#22c55e'
      case 'PARTIAL': return '#f59e0b'
      case 'REJECTED': return '#ef4444'
      case 'CANCELED': return '#6b7280'
      case 'STOP_PENDING': return '#8b5cf6' // Purple for stop orders
      case 'TRIGGERED': return '#f97316' // Orange for triggered orders
      case 'PENDING': return '#3b82f6'
      default: return '#6b7280'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'STOP_PENDING': return '⏸️'
      case 'TRIGGERED': return '⚡'
      case 'FILLED': return '✅'
      case 'PARTIAL': return '🔄'
      case 'REJECTED': return '❌'
      case 'CANCELED': return '🚫'
      default: return '📋'
    }
  }

  // Calculate dynamic height based on number of rows
  const rowHeight = 40; // Approximate height per row including padding
  const headerHeight = 45; // Header height
  const minHeight = 200; // Minimum height
  const maxHeight = 500; // Maximum height
  
  const dataRows = orders.length;
  const calculatedHeight = Math.min(Math.max(minHeight, headerHeight + (dataRows * rowHeight)), maxHeight);
  
  return (
    <div style={{ 
      overflow: 'auto',
      height: `${calculatedHeight}px`,
      minHeight: `${minHeight}px`,
      maxHeight: `${maxHeight}px`
    }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '12px'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Time</th>
            <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Symbol</th>
            <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Side</th>
            <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Type</th>
            <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Qty</th>
            <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Filled</th>
            <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Limit</th>
            <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Stop</th>
            <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Status</th>
            <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Avg Px</th>
            <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
          </tr>
          <tr style={{ backgroundColor: '#f9fafb', fontSize: '10px' }}>
            <td colSpan="11" style={{ padding: '4px 8px', textAlign: 'center', color: '#6b7280' }}>
              {dataRows} order{dataRows !== 1 ? 's' : ''} • Height: {calculatedHeight}px
            </td>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id} style={{
              borderBottom: '1px solid #f3f4f6',
              backgroundColor: order.status === 'STOP_PENDING' ? '#faf5ff' : 
                              order.status === 'TRIGGERED' ? '#fff7ed' : 'transparent'
            }}>
              <td style={{ padding: '8px' }}>
                {new Date(order.created_at * 1000).toLocaleTimeString()}
              </td>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>{order.symbol}</td>
              <td style={{ 
                padding: '8px', 
                color: order.side === 'BUY' ? '#22c55e' : '#ef4444',
                fontWeight: 'bold'
              }}>{order.side}</td>
              <td style={{ padding: '8px' }}>{order.order_type}</td>
              <td style={{ padding: '8px', textAlign: 'right' }}>{order.qty.toLocaleString()}</td>
              <td style={{ padding: '8px', textAlign: 'right' }}>{order.filled_qty.toLocaleString()}</td>
              <td style={{ padding: '8px', textAlign: 'right' }}>
                {order.limit_price ? `$${order.limit_price.toFixed(2)}` : '-'}
              </td>
              <td style={{ padding: '8px', textAlign: 'right' }}>
                {order.stop_price ? `$${order.stop_price.toFixed(2)}` : '-'}
              </td>
              <td style={{ 
                padding: '8px', 
                textAlign: 'center',
                color: getStatusColor(order.status),
                fontWeight: 'bold'
              }}>
                {getStatusIcon(order.status)} {order.status}
              </td>
              <td style={{ padding: '8px', textAlign: 'right' }}>
                {order.avg_price ? `$${order.avg_price.toFixed(2)}` : '-'}
              </td>
              <td style={{ padding: '8px', textAlign: 'center' }}>
                {(order.status === 'NEW' || order.status === 'PARTIAL' || order.status === 'STOP_PENDING') ? (
                  <button
                    onClick={() => handleCancel(order.id)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px'
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
  // Calculate dynamic height based on number of rows
  const rowHeight = 32; // Approximate height per row including padding
  const headerHeight = 40; // Header height
  const minHeight = 200; // Minimum height
  const maxHeight = 400; // Maximum height
  
  const dataRows = updates.length;
  const calculatedHeight = Math.min(Math.max(minHeight, headerHeight + (dataRows * rowHeight)), maxHeight);
  
  return (
    <div style={{ 
      overflow: 'auto', 
      height: `${calculatedHeight}px`,
      minHeight: `${minHeight}px`,
      maxHeight: `${maxHeight}px`
    }}>
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
          <tr style={{ backgroundColor: '#f9fafb', fontSize: '10px' }}>
            <td colSpan="8" style={{ padding: '4px 6px', textAlign: 'center', color: '#6b7280' }}>
              {dataRows} event{dataRows !== 1 ? 's' : ''} • Height: {calculatedHeight}px
            </td>
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

function getSectorAllocation(positions) {
  const sectors = {
    'AAPL': 'Technology',
    'MSFT': 'Technology',
    'SPY': 'ETF',
    'JNJ': 'Healthcare',
    'V': 'Financial',
    'GOOGL': 'Technology',
    'TSLA': 'Automotive',
    'NVDA': 'Technology',
    'AMZN': 'Consumer Discretionary',
    'META': 'Technology'
  }
  
  const sectorValues = {}
  let totalValue = 0
  
  positions.forEach(position => {
    const sector = sectors[position.symbol] || 'Other'
    const value = position.quantity * position.avg_price
    sectorValues[sector] = (sectorValues[sector] || 0) + value
    totalValue += value
  })
  
  const allocation = {}
  Object.entries(sectorValues).forEach(([sector, value]) => {
    allocation[sector] = (value / totalValue) * 100
  })
  
  return allocation
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
  
  if (!portfolio || !portfolio.positions || portfolio.positions.length === 0) {
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
        gridTemplateColumns: 'repeat(3, 1fr)',
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
            ${portfolio.total_position_value.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Position Value</div>
        </div>
        
        <div style={{
          padding: '12px',
          backgroundColor: portfolio.total_realized_pnl >= 0 ? '#f0fdf4' : '#fef2f2',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: portfolio.total_realized_pnl >= 0 ? '#22c55e' : '#ef4444'
          }}>
            ${portfolio.total_realized_pnl.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Realized P&L</div>
        </div>
        
        <div style={{
          padding: '12px',
          backgroundColor: '#fef3c7',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b' }}>
            {portfolio.positions.length}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Positions</div>
        </div>
      </div>
      
      {/* Sector Allocation */}
      {portfolio.positions && portfolio.positions.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151' }}>Sector Allocation</h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {Object.entries(getSectorAllocation(portfolio.positions)).map(([sector, percentage]) => (
              <div key={sector} style={{
                padding: '6px 12px',
                backgroundColor: '#f3f4f6',
                borderRadius: '16px',
                fontSize: '12px',
                color: '#374151'
              }}>
                {sector}: {percentage.toFixed(1)}%
              </div>
            ))}
          </div>
        </div>
      )}
      
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
              <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Market Value</th>
              <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>P&L</th>
              <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>P&L %</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.positions.map(position => {
              const marketPrice = marketData[position.symbol]
              const currentPrice = marketPrice ? 
                (marketPrice.nbbo ? (marketPrice.nbbo.bid + marketPrice.nbbo.ask) / 2 : 
                 (marketPrice.bid + marketPrice.ask) / 2) : position.current_price || position.avg_price
              const quantity = position.shares || position.quantity || 0
              const marketValue = currentPrice * quantity
              const unrealizedPnl = (currentPrice - position.avg_price) * quantity
              const totalPnl = (position.realized_pnl || 0) + unrealizedPnl
              const pnlPercent = ((currentPrice - position.avg_price) / position.avg_price) * 100
              
              return (
                <tr key={position.symbol} style={{
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>{position.symbol}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{quantity.toLocaleString()}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>${position.avg_price.toFixed(2)}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>
                    {marketPrice ? `$${currentPrice.toFixed(2)}` : '-'}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>
                    ${marketValue.toLocaleString()}
                  </td>
                  <td style={{ 
                    padding: '8px', 
                    textAlign: 'right',
                    color: totalPnl >= 0 ? '#22c55e' : '#ef4444',
                    fontWeight: 'bold'
                  }}>
                    ${totalPnl.toFixed(2)}
                  </td>
                  <td style={{ 
                    padding: '8px', 
                    textAlign: 'right',
                    color: pnlPercent >= 0 ? '#22c55e' : '#ef4444',
                    fontWeight: 'bold'
                  }}>
                    {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
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
                 <strong>Current:</strong> ${(analysisData.price || analysisData.nbbo?.bid || 0).toFixed(2)}
               </div>
               <div style={{ color: (analysisData.change_percent || 0) >= 0 ? '#22c55e' : '#ef4444' }}>
                 <strong>Change:</strong> {(analysisData.change_percent || 0) >= 0 ? '+' : ''}{(analysisData.change_percent || 0).toFixed(2)}%
               </div>
               <div>
                 <strong>High:</strong> ${(analysisData.high || 0).toFixed(2)}
               </div>
               <div>
                 <strong>Low:</strong> ${(analysisData.low || 0).toFixed(2)}
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
                   color: (analysisData.technical?.rsi || 50) > 70 ? '#ef4444' : 
                          (analysisData.technical?.rsi || 50) < 30 ? '#22c55e' : '#6b7280'
                 }}>
                   {(analysisData.technical?.rsi || 50).toFixed(1)}
                 </span>
               </div>
               <div>
                 <strong>MACD:</strong> {(analysisData.technical?.macd || 0).toFixed(4)}
               </div>
               <div>
                 <strong>SMA 20:</strong> ${(analysisData.technical?.sma_20 || 0).toFixed(2)}
               </div>
               <div>
                 <strong>SMA 50:</strong> ${(analysisData.technical?.sma_50 || 0).toFixed(2)}
               </div>
               <div>
                 <strong>BB Upper:</strong> ${(analysisData.technical?.bollinger_upper || 0).toFixed(2)}
               </div>
               <div>
                 <strong>BB Lower:</strong> ${(analysisData.technical?.bollinger_lower || 0).toFixed(2)}
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
                 <strong>P/E Ratio:</strong> {(analysisData.fundamental?.pe_ratio || 0).toFixed(1)}
               </div>
               <div>
                 <strong>P/B Ratio:</strong> {(analysisData.fundamental?.pb_ratio || 0).toFixed(2)}
               </div>
               <div>
                 <strong>Dividend Yield:</strong> {(analysisData.fundamental?.dividend_yield || 0).toFixed(2)}%
               </div>
               <div>
                 <strong>EPS:</strong> ${(analysisData.fundamental?.eps || 0).toFixed(2)}
               </div>
               <div>
                 <strong>Revenue Growth:</strong> {(analysisData.fundamental?.revenue_growth || 0).toFixed(1)}%
               </div>
               <div>
                 <strong>ROE:</strong> {(analysisData.fundamental?.roe || 0).toFixed(1)}%
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StopOrderHelp() {
  return (
    <div style={{
      padding: '16px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      backgroundColor: '#f9fafb',
      marginBottom: '16px'
    }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>Stop Order Types</h4>
      <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
        <div>
          <strong style={{ color: '#8b5cf6' }}>STOP Order:</strong>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280' }}>
            Triggers when price reaches stop level, then executes as MARKET order.
          </p>
        </div>
        <div>
          <strong style={{ color: '#8b5cf6' }}>STOP LIMIT Order:</strong>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280' }}>
            Triggers when price reaches stop level, then executes as LIMIT order at specified price.
          </p>
        </div>
        <div>
          <strong style={{ color: '#8b5cf6' }}>TRAILING STOP Order:</strong>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280' }}>
            Stop price follows market price at specified percentage distance.
          </p>
        </div>
        <div>
          <strong style={{ color: '#8b5cf6' }}>TRAILING STOP LIMIT Order:</strong>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280' }}>
            Trailing stop that executes as LIMIT order when triggered.
          </p>
        </div>
        <div style={{ 
          padding: '8px', 
          backgroundColor: '#fef3c7', 
          borderRadius: '4px',
          border: '1px solid #f59e0b'
        }}>
          <strong style={{ color: '#92400e' }}>Status Indicators:</strong>
          <div style={{ marginTop: '4px', fontSize: '12px', color: '#92400e' }}>
            ⏸️ STOP_PENDING: Waiting for price to reach stop level<br/>
            ⚡ TRIGGERED: Stop condition met, executing order<br/>
            ✅ FILLED: Order completely executed<br/>
            🔄 PARTIAL: Order partially filled
          </div>
        </div>
      </div>
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
  
  // Chart state
  const [showChart, setShowChart] = useState(false)
  const [chartSymbol, setChartSymbol] = useState(null)
  const [chartData, setChartData] = useState(null)
  const [technicalData, setTechnicalData] = useState(null)
  const [scannerResults, setScannerResults] = useState([])
  const [scannerLoading, setScannerLoading] = useState(false)
  const [scannerFilters, setScannerFilters] = useState({
    min_price: 0,
    max_price: 1000,
    min_volume: 1000000,
    min_market_cap: 1000000000,
    sectors: '',
    min_pe: 0,
    max_pe: 100,
    min_dividend_yield: 0,
    max_dividend_yield: 10,
    min_rsi: 0,
    max_rsi: 100
  })
  const [sipPortfolioData, setSipPortfolioData] = useState(null)
  const [sipPortfolioLoading, setSipPortfolioLoading] = useState(false)
  
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
        // Transform the data to match PortfolioWidget expectations
        const transformedPortfolio = {
          positions: data.portfolio || [],
          total_position_value: data.summary?.total_value || 0,
          total_realized_pnl: data.summary?.total_pnl || 0,
          total_cost: data.summary?.total_cost || 0,
          total_pnl_percent: data.summary?.total_pnl_percent || 0,
          positions_count: data.summary?.positions_count || 0
        }
        setPortfolio(transformedPortfolio)
      }
    } catch (error) {
      console.error('Failed to fetch portfolio:', error)
    } finally {
      setPortfolioLoading(false)
    }
  }

  const fetchSipPortfolio = async () => {
    setSipPortfolioLoading(true)
    try {
      const response = await fetch(`${BROKER.replace('8000', '8002')}/portfolio`)
      if (response.ok) {
        const data = await response.json()
        setSipPortfolioData(data)
      }
    } catch (error) {
      console.error('Failed to fetch SIP portfolio:', error)
    } finally {
      setSipPortfolioLoading(false)
    }
  }

  const runScanner = async (filters = scannerFilters) => {
    setScannerLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          params.append(key, value)
        }
      })
      
      const response = await fetch(`${BROKER.replace('8000', '8002')}/scanner/advanced?${params}`)
      if (response.ok) {
        const data = await response.json()
        setScannerResults(data.scanner_results || [])
      }
    } catch (error) {
      console.error('Failed to run scanner:', error)
    } finally {
      setScannerLoading(false)
    }
  }
  
  useEffect(() => {
    fetchStats()
    fetchPortfolio()
    fetchSipPortfolio()
    const statsInterval = setInterval(fetchStats, 10000) // Refresh every 10 seconds
    const portfolioInterval = setInterval(fetchPortfolio, 5000) // Refresh every 5 seconds
    const sipPortfolioInterval = setInterval(fetchSipPortfolio, 5000) // Refresh every 5 seconds
    return () => {
      clearInterval(statsInterval)
      clearInterval(portfolioInterval)
      clearInterval(sipPortfolioInterval)
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

  const handleChartClick = async (symbol, data) => {
    setChartSymbol(symbol)
    setChartData(data)
    
    // Fetch technical data for the symbol
    try {
      const response = await fetch(`${BROKER.replace('8000', '8002')}/technical-indicators?symbol=${symbol}`)
      if (response.ok) {
        const techData = await response.json()
        setTechnicalData(techData)
      }
    } catch (error) {
      console.error('Error fetching technical data:', error)
    }
    
    setShowChart(true)
  }

  const handleCloseChart = () => {
    setShowChart(false)
    setChartSymbol(null)
    setChartData(null)
    setTechnicalData(null)
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
          <h1 style={{ margin: 0, color: '#1f2937' }}>Professional Trading Platform</h1>
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
          {['trading', 'advanced', 'orderbook', 'journal', 'flow', 'technical', 'fundamental', 'analysis', 'scanner', 'charts', 'portfolio'].map(tab => (
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
            gridTemplateColumns: '350px 400px 1fr',
            gap: '24px'
          }}>
            {/* Left Panel - Order Entry & Portfolio */}
            <div style={{ display: 'grid', gap: '16px' }}>
              <OrderForm onSubmit={handleOrderSubmit} marketData={marketData} />
              
              <PortfolioWidget 
                portfolio={portfolio} 
                loading={portfolioLoading} 
                marketData={marketData}
              />
            </div>
            
            {/* Middle Panel - Market Data */}
            <div style={{ display: 'grid', gap: '16px' }}>
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
                      onChartClick={handleChartClick}
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
        
        {activeTab === 'advanced' && (
          <div style={{
            display: 'grid',
            gap: '24px'
          }}>
            <StopOrderHelp />
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px'
            }}>
              <AdvancedOrderForm onSubmit={handleOrderSubmit} marketData={marketData} />
              <TradingFlowVisualizer />
            </div>
          </div>
        )}
        
        {activeTab === 'orderbook' && (
          <OrderBookWidget symbol={selectedSymbol} />
        )}
        
        {activeTab === 'journal' && (
          <EnhancedJournal />
        )}
        
        {activeTab === 'flow' && (
          <TradingFlowVisualizer />
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
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
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
                
                {/* Chart Button */}
                <button
                  onClick={() => handleChartClick(selectedSymbol, marketData[selectedSymbol])}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    marginLeft: 'auto'
                  }}
                >
                  📊 View Chart
                </button>
              </div>
            </div>
            
            <DetailedAnalysis symbol={selectedSymbol} marketData={marketData} />
          </div>
        )}
        
        {activeTab === 'scanner' && (
          <div style={{ display: 'grid', gap: '24px' }}>
            <div style={{
              padding: '16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#ffffff'
            }}>
              <h3 style={{ margin: '0 0 16px 0' }}>Stock Scanner</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Price Range</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      placeholder="Min"
                      value={scannerFilters.min_price}
                      onChange={(e) => setScannerFilters({...scannerFilters, min_price: parseFloat(e.target.value) || 0})}
                      style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '100px' }}
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={scannerFilters.max_price}
                      onChange={(e) => setScannerFilters({...scannerFilters, max_price: parseFloat(e.target.value) || 1000})}
                      style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '100px' }}
                    />
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Volume (Min)</label>
                  <input
                    type="number"
                    value={scannerFilters.min_volume}
                    onChange={(e) => setScannerFilters({...scannerFilters, min_volume: parseInt(e.target.value) || 0})}
                    style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '100%' }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Market Cap (Min)</label>
                  <input
                    type="number"
                    value={scannerFilters.min_market_cap}
                    onChange={(e) => setScannerFilters({...scannerFilters, min_market_cap: parseInt(e.target.value) || 0})}
                    style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '100%' }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>P/E Ratio</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      placeholder="Min"
                      value={scannerFilters.min_pe}
                      onChange={(e) => setScannerFilters({...scannerFilters, min_pe: parseFloat(e.target.value) || 0})}
                      style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '100px' }}
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={scannerFilters.max_pe}
                      onChange={(e) => setScannerFilters({...scannerFilters, max_pe: parseFloat(e.target.value) || 100})}
                      style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '100px' }}
                    />
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Dividend Yield (%)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      placeholder="Min"
                      value={scannerFilters.min_dividend_yield}
                      onChange={(e) => setScannerFilters({...scannerFilters, min_dividend_yield: parseFloat(e.target.value) || 0})}
                      style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '100px' }}
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={scannerFilters.max_dividend_yield}
                      onChange={(e) => setScannerFilters({...scannerFilters, max_dividend_yield: parseFloat(e.target.value) || 10})}
                      style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '100px' }}
                    />
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>RSI</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      placeholder="Min"
                      value={scannerFilters.min_rsi}
                      onChange={(e) => setScannerFilters({...scannerFilters, min_rsi: parseFloat(e.target.value) || 0})}
                      style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '100px' }}
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={scannerFilters.max_rsi}
                      onChange={(e) => setScannerFilters({...scannerFilters, max_rsi: parseFloat(e.target.value) || 100})}
                      style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', width: '100px' }}
                    />
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <button
                  onClick={() => runScanner()}
                  disabled={scannerLoading}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: scannerLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {scannerLoading ? 'Scanning...' : 'Run Scanner'}
                </button>
                
                <button
                  onClick={() => runScanner({
                    min_price: 0,
                    max_price: 100,
                    min_volume: 1000000,
                    min_market_cap: 1000000000,
                    max_pe: 15,
                    min_dividend_yield: 3
                  })}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Value Stocks
                </button>
                
                <button
                  onClick={() => runScanner({
                    min_price: 0,
                    max_price: 1000,
                    min_volume: 1000000,
                    min_market_cap: 1000000000,
                    min_pe: 25,
                    max_rsi: 30
                  })}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Oversold Growth
                </button>
              </div>
            </div>
            
            <div style={{
              padding: '16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#ffffff'
            }}>
              <h3 style={{ margin: '0 0 16px 0' }}>Scanner Results ({scannerResults.length})</h3>
              {scannerLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ fontSize: '18px', color: '#6b7280' }}>Scanning stocks...</div>
                </div>
              ) : scannerResults.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f9fafb' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Symbol</th>
                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Price</th>
                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Change %</th>
                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Volume</th>
                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Market Cap</th>
                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>P/E</th>
                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Div Yield</th>
                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>RSI</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Signals</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scannerResults.map((stock, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '12px', fontWeight: 'bold' }}>{stock.symbol}</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>${stock.price.toFixed(2)}</td>
                          <td style={{ 
                            padding: '12px', 
                            textAlign: 'right',
                            color: stock.change_percent >= 0 ? '#10b981' : '#ef4444',
                            fontWeight: 'bold'
                          }}>
                            {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>{(stock.volume / 1000000).toFixed(1)}M</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>${(stock.market_cap / 1000000000).toFixed(1)}B</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>{stock.pe_ratio.toFixed(1)}</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>{stock.dividend_yield.toFixed(2)}%</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>{stock.rsi.toFixed(1)}</td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {stock.signals.slice(0, 3).map((signal, i) => (
                                <span key={i} style={{
                                  padding: '2px 6px',
                                  backgroundColor: '#e5e7eb',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  color: '#374151'
                                }}>
                                  {signal}
                                </span>
                              ))}
                              {stock.signals.length > 3 && (
                                <span style={{
                                  padding: '2px 6px',
                                  backgroundColor: '#6b7280',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  color: 'white'
                                }}>
                                  +{stock.signals.length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  No stocks found matching your criteria. Try adjusting your filters.
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'charts' && (
          <div style={{ display: 'grid', gap: '24px' }}>
            <ChartSubsystem />
          </div>
        )}
        
        {activeTab === 'portfolio' && (
          <div style={{ display: 'grid', gap: '24px' }}>
            <div style={{
              padding: '16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#ffffff'
            }}>
              <h3 style={{ margin: '0 0 16px 0' }}>Portfolio Overview</h3>
              {sipPortfolioLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ fontSize: '18px', color: '#6b7280' }}>Loading portfolio...</div>
                </div>
              ) : sipPortfolioData ? (
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f0f9ff',
                      borderRadius: '8px',
                      border: '1px solid #0ea5e9'
                    }}>
                      <div style={{ fontSize: '14px', color: '#0369a1', fontWeight: 'bold' }}>Total Value</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0c4a6e' }}>
                        ${sipPortfolioData.summary.total_value.toLocaleString()}
                      </div>
                    </div>
                    
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#f0fdf4',
                      borderRadius: '8px',
                      border: '1px solid #22c55e'
                    }}>
                      <div style={{ fontSize: '14px', color: '#15803d', fontWeight: 'bold' }}>Total P&L</div>
                      <div style={{ 
                        fontSize: '24px', 
                        fontWeight: 'bold',
                        color: sipPortfolioData.summary.total_pnl >= 0 ? '#15803d' : '#dc2626'
                      }}>
                        {sipPortfolioData.summary.total_pnl >= 0 ? '+' : ''}${sipPortfolioData.summary.total_pnl.toLocaleString()}
                      </div>
                      <div style={{ 
                        fontSize: '14px',
                        color: sipPortfolioData.summary.total_pnl_percent >= 0 ? '#15803d' : '#dc2626'
                      }}>
                        {sipPortfolioData.summary.total_pnl_percent >= 0 ? '+' : ''}{sipPortfolioData.summary.total_pnl_percent.toFixed(2)}%
                      </div>
                    </div>
                    
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#fef3c7',
                      borderRadius: '8px',
                      border: '1px solid #f59e0b'
                    }}>
                      <div style={{ fontSize: '14px', color: '#92400e', fontWeight: 'bold' }}>Positions</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#92400e' }}>
                        {sipPortfolioData.summary.positions_count}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f9fafb' }}>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Symbol</th>
                          <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Shares</th>
                          <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Avg Price</th>
                          <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Current Price</th>
                          <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Market Value</th>
                          <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>P&L</th>
                          <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>P&L %</th>
                          <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Today</th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Sector</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sipPortfolioData.portfolio.map((position, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>{position.symbol}</td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>{position.shares.toLocaleString()}</td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>${position.avg_price.toFixed(2)}</td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>${position.current_price.toFixed(2)}</td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>${position.market_value.toLocaleString()}</td>
                            <td style={{ 
                              padding: '12px', 
                              textAlign: 'right',
                              color: position.unrealized_pnl >= 0 ? '#10b981' : '#ef4444',
                              fontWeight: 'bold'
                            }}>
                              {position.unrealized_pnl >= 0 ? '+' : ''}${position.unrealized_pnl.toLocaleString()}
                            </td>
                            <td style={{ 
                              padding: '12px', 
                              textAlign: 'right',
                              color: position.pnl_percent >= 0 ? '#10b981' : '#ef4444',
                              fontWeight: 'bold'
                            }}>
                              {position.pnl_percent >= 0 ? '+' : ''}{position.pnl_percent.toFixed(2)}%
                            </td>
                            <td style={{ 
                              padding: '12px', 
                              textAlign: 'right',
                              color: position.change_today >= 0 ? '#10b981' : '#ef4444'
                            }}>
                              {position.change_today >= 0 ? '+' : ''}{position.change_today.toFixed(2)}%
                            </td>
                            <td style={{ padding: '12px' }}>{position.sector}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  No portfolio data available.
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Chart Modal */}
        {showChart && chartSymbol && (
          <Chart
            symbol={chartSymbol}
            marketData={chartData}
            technicalData={technicalData}
            onClose={handleCloseChart}
          />
        )}
      </div>
    </div>
  )
}

export default App
