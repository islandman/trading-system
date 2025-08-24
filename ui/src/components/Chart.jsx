import React, { useEffect, useRef, useState } from 'react'
import { createChart } from 'lightweight-charts'
import { format } from 'date-fns'
import {
  Box,
  Button,
  Flex,
  Text,
  Select,
  VStack,
  HStack,
  Badge,
  Icon,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Grid,
  GridItem,
  Divider,
  Spinner,
  Center
} from '@chakra-ui/react'
import { 
  FiBarChart2, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiX,
  FiEye,
  FiEyeOff,
  FiClock,
  FiCalendar
} from 'react-icons/fi'

const Chart = ({ symbol, marketData, technicalData, onClose }) => {
  const chartContainerRef = useRef()
  const chartRef = useRef()
  const [timeframe, setTimeframe] = useState('1D')
  const [showIndicators, setShowIndicators] = useState(true)
  const [historicalData, setHistoricalData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [customPeriod, setCustomPeriod] = useState('30')

  // Convert Chakra UI colors to CSS color values for lightweight-charts
  const bgColor = useColorModeValue('#ffffff', '#1a202c')
  const borderColor = useColorModeValue('#e2e8f0', '#4a5568')
  const textColor = useColorModeValue('#2d3748', '#ffffff')

  // Fetch historical data when symbol or timeframe changes
  useEffect(() => {
    const fetchHistoricalData = async () => {
      setLoading(true)
      try {
        let url = `http://localhost:8002/historical-data/${symbol}?timeframe=${timeframe}`
        
        // Add limit for custom periods
        if (timeframe === 'custom') {
          url += `&limit=${customPeriod}`
        } else {
          // Set appropriate limits for different timeframes
          const limits = {
            '1H': 168, // 1 week of hourly data
            '4H': 168, // 4 weeks of 4-hour data
            '1D': 365, // 1 year of daily data
            '1W': 52,  // 1 year of weekly data
            '1M': 60   // 5 years of monthly data
          }
          url += `&limit=${limits[timeframe] || 100}`
        }
        
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setHistoricalData(data)
        } else {
          console.error('Failed to fetch historical data')
        }
      } catch (error) {
        console.error('Error fetching historical data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (symbol) {
      fetchHistoricalData()
    }
  }, [symbol, timeframe, customPeriod])

  useEffect(() => {
    if (!chartContainerRef.current || !historicalData) return

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { color: bgColor },
        textColor: textColor,
      },
      grid: {
        vertLines: { color: borderColor },
        horzLines: { color: borderColor },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: borderColor,
      },
      timeScale: {
        borderColor: borderColor,
        timeVisible: true,
        secondsVisible: false,
      },
    })

    chartRef.current = chart

    // Create candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    })

    // Create volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#22c55e',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    })

    // Add technical indicators if available
    if (showIndicators && technicalData) {
      // SMA 20
      const sma20Series = chart.addLineSeries({
        color: '#3b82f6',
        lineWidth: 2,
        title: 'SMA 20',
      })

      // SMA 50
      const sma50Series = chart.addLineSeries({
        color: '#f59e0b',
        lineWidth: 2,
        title: 'SMA 50',
      })

      // Bollinger Bands
      const bbUpperSeries = chart.addLineSeries({
        color: '#8b5cf6',
        lineWidth: 1,
        lineStyle: 2, // Dashed
        title: 'BB Upper',
      })

      const bbMiddleSeries = chart.addLineSeries({
        color: '#6b7280',
        lineWidth: 1,
        title: 'BB Middle',
      })

      const bbLowerSeries = chart.addLineSeries({
        color: '#8b5cf6',
        lineWidth: 1,
        lineStyle: 2, // Dashed
        title: 'BB Lower',
      })

      // Add indicator data
      if (technicalData.sma_20 && technicalData.sma_50) {
        sma20Series.setData([{ time: Date.now() / 1000, value: technicalData.sma_20 }])
        sma50Series.setData([{ time: Date.now() / 1000, value: technicalData.sma_50 }])
      }

      if (technicalData.bollinger_upper && technicalData.bollinger_middle && technicalData.bollinger_lower) {
        bbUpperSeries.setData([{ time: Date.now() / 1000, value: technicalData.bollinger_upper }])
        bbMiddleSeries.setData([{ time: Date.now() / 1000, value: technicalData.bollinger_middle }])
        bbLowerSeries.setData([{ time: Date.now() / 1000, value: technicalData.bollinger_lower }])
      }
    }

    // Set historical data
    if (historicalData && historicalData.data) {
      const candlestickData = historicalData.data.map(item => ({
        time: item.time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }))

      const volumeData = historicalData.data.map(item => ({
        time: item.time,
        value: item.volume,
        color: item.close >= item.open ? '#22c55e' : '#ef4444',
      }))

      candlestickSeries.setData(candlestickData)
      volumeSeries.setData(volumeData)
    }

    // Handle window resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [symbol, historicalData, technicalData, showIndicators, bgColor, textColor, borderColor])

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe)
  }

  const handleCustomPeriodChange = (period) => {
    setCustomPeriod(period)
    setTimeframe('custom')
  }

  const getChangeColor = (change) => {
    return change >= 0 ? 'success.500' : 'danger.500'
  }

  const getRSIColor = (rsi) => {
    if (rsi > 70) return 'danger.500'
    if (rsi < 30) return 'success.500'
    return 'gray.500'
  }

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="blackAlpha.800"
      zIndex={1000}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={5}
    >
      <Box
        bg={bgColor}
        borderRadius="xl"
        p={6}
        w="90%"
        maxW="1200px"
        h="80%"
        maxH="800px"
        display="flex"
        flexDirection="column"
        boxShadow="2xl"
      >
        {/* Header */}
        <Flex justify="space-between" align="center" mb={5} pb={4} borderBottom="1px" borderColor={borderColor}>
          <Box>
            <HStack spacing={2} mb={1}>
              <Icon as={FiBarChart2} color="brand.500" boxSize={6} />
              <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                {symbol} Chart
              </Text>
            </HStack>
            <HStack spacing={2}>
              <Text fontSize="sm" color="gray.500">
                {marketData?.price ? `$${marketData.price.toFixed(2)}` : 'Loading...'}
              </Text>
              {marketData?.change_percent && (
                <Badge
                  colorScheme={marketData.change_percent >= 0 ? 'success' : 'danger'}
                  variant="subtle"
                >
                  {marketData.change_percent >= 0 ? '+' : ''}{marketData.change_percent.toFixed(2)}%
                </Badge>
              )}
            </HStack>
          </Box>

          {/* Controls */}
          <HStack spacing={3}>
            {/* Timeframe Selector */}
            <HStack spacing={1}>
              {['1H', '4H', '1D', '1W', '1M'].map(tf => (
                <Button
                  key={tf}
                  size="sm"
                  variant={timeframe === tf ? 'solid' : 'outline'}
                  colorScheme="brand"
                  onClick={() => handleTimeframeChange(tf)}
                >
                  {tf}
                </Button>
              ))}
            </HStack>

            {/* Custom Period Selector */}
            <HStack spacing={2}>
              <Select
                size="sm"
                value={customPeriod}
                onChange={(e) => handleCustomPeriodChange(e.target.value)}
                w="120px"
              >
                <option value="7">7 Days</option>
                <option value="14">14 Days</option>
                <option value="30">30 Days</option>
                <option value="60">60 Days</option>
                <option value="90">90 Days</option>
                <option value="180">180 Days</option>
                <option value="365">1 Year</option>
              </Select>
              <Button
                size="sm"
                variant={timeframe === 'custom' ? 'solid' : 'outline'}
                colorScheme="purple"
                onClick={() => handleTimeframeChange('custom')}
                leftIcon={<Icon as={FiCalendar} />}
              >
                Custom
              </Button>
            </HStack>

            {/* Indicators Toggle */}
            <Button
              size="sm"
              colorScheme={showIndicators ? 'success' : 'gray'}
              onClick={() => setShowIndicators(!showIndicators)}
              leftIcon={<Icon as={showIndicators ? FiEye : FiEyeOff} />}
            >
              {showIndicators ? 'Hide' : 'Show'} Indicators
            </Button>

            {/* Close Button */}
            <Button
              size="sm"
              colorScheme="danger"
              onClick={onClose}
              leftIcon={<Icon as={FiX} />}
            >
              Close
            </Button>
          </HStack>
        </Flex>

        {/* Chart Container */}
        <Box flex={1} position="relative" minH={0}>
          <Box ref={chartContainerRef} h="100%" />
          {loading && (
            <Center
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              bg="whiteAlpha.900"
              p={5}
              borderRadius="md"
              zIndex={10}
            >
              <VStack spacing={3}>
                <Spinner size="lg" color="brand.500" />
                <Text>Loading historical data...</Text>
              </VStack>
            </Center>
          )}
        </Box>

        {/* Technical Indicators Panel */}
        {showIndicators && technicalData && (
          <Box mt={5} p={4} bg="gray.50" borderRadius="lg" border="1px" borderColor={borderColor}>
            <Text fontSize="lg" fontWeight="bold" mb={3} color={textColor}>
              Technical Indicators
            </Text>
            <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={3}>
              <GridItem>
                <HStack justify="space-between">
                  <Text fontWeight="medium">RSI:</Text>
                  <Badge colorScheme={getRSIColor(technicalData.rsi) === 'success.500' ? 'success' : 
                                     getRSIColor(technicalData.rsi) === 'danger.500' ? 'danger' : 'gray'}>
                    {technicalData.rsi?.toFixed(1) || 'N/A'}
                  </Badge>
                </HStack>
              </GridItem>
              <GridItem>
                <HStack justify="space-between">
                  <Text fontWeight="medium">MACD:</Text>
                  <Text>{technicalData.macd?.toFixed(4) || 'N/A'}</Text>
                </HStack>
              </GridItem>
              <GridItem>
                <HStack justify="space-between">
                  <Text fontWeight="medium">SMA 20:</Text>
                  <Text>${technicalData.sma_20?.toFixed(2) || 'N/A'}</Text>
                </HStack>
              </GridItem>
              <GridItem>
                <HStack justify="space-between">
                  <Text fontWeight="medium">SMA 50:</Text>
                  <Text>${technicalData.sma_50?.toFixed(2) || 'N/A'}</Text>
                </HStack>
              </GridItem>
              <GridItem>
                <HStack justify="space-between">
                  <Text fontWeight="medium">Volume:</Text>
                  <Text>{marketData?.volume?.toLocaleString() || 'N/A'}</Text>
                </HStack>
              </GridItem>
              <GridItem>
                <HStack justify="space-between">
                  <Text fontWeight="medium">ATR:</Text>
                  <Text>${technicalData.atr?.toFixed(2) || 'N/A'}</Text>
                </HStack>
              </GridItem>
            </Grid>
          </Box>
        )}

        {/* Data Info */}
        {historicalData && (
          <Box mt={3} p={3} bg="gray.100" borderRadius="md" textAlign="center">
            <HStack justify="center" spacing={4} fontSize="sm" color="gray.600">
              <HStack spacing={1}>
                <Icon as={FiBarChart2} />
                <Text>Showing {historicalData.data?.length || 0} data points</Text>
              </HStack>
              <HStack spacing={1}>
                <Icon as={FiClock} />
                <Text>Timeframe: {timeframe === 'custom' ? `${customPeriod} days` : timeframe}</Text>
              </HStack>
              <HStack spacing={1}>
                <Icon as={FiCalendar} />
                <Text>Last updated: {historicalData.data && historicalData.data.length > 0 ? 
                  new Date(historicalData.data[historicalData.data.length - 1].time * 1000).toLocaleDateString() : 'N/A'}</Text>
              </HStack>
            </HStack>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default Chart
