import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Input,
  Select,
  Button,
  Card,
  CardBody,
  CardHeader,
  Grid,
  GridItem,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useToast,
  Spinner,
  Center,
  Divider,
  IconButton,
  Tooltip,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import {
  FiSearch,
  FiBarChart2,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiActivity,
  FiTarget,
  FiRefreshCw,
  FiSettings,
  FiInfo,
  FiStar,
  FiEye,
  FiEyeOff,
  FiCheck
} from 'react-icons/fi';
import { createChart } from 'lightweight-charts';

const BROKER = (import.meta.env.VITE_BROKER_URL) || 'http://localhost:8000';
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
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('1D');
  const [selectedIndicators, setSelectedIndicators] = useState(['SMA', 'RSI']);
  const [chartContainer, setChartContainer] = useState(null);
  const [chartInstance, setChartInstance] = useState(null);
  const [technicalAnalysis, setTechnicalAnalysis] = useState({});
  const [showVolume, setShowVolume] = useState(true);
  const [showIndicators, setShowIndicators] = useState(true);
  
  const toast = useToast();
  const chartRef = useRef(null);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('#333', '#fff');

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
      toast({
        title: 'Search Error',
        description: 'Failed to search for stocks',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
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
      toast({
        title: 'Error',
        description: 'Failed to fetch stock data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate mock stock data
  const generateMockStockData = (symbol) => {
    // Generate realistic mock data for different symbols
    const mockPrices = {
      'AAPL': { price: 185.50, change: 2.30, changePercent: 1.26 },
      'MSFT': { price: 415.20, change: -1.80, changePercent: -0.43 },
      'GOOGL': { price: 142.80, change: 0.90, changePercent: 0.63 },
      'AMZN': { price: 178.40, change: 3.20, changePercent: 1.82 },
      'TSLA': { price: 245.60, change: -5.40, changePercent: -2.15 },
      'META': { price: 485.30, change: 8.70, changePercent: 1.82 },
      'NVDA': { price: 875.20, change: 15.80, changePercent: 1.84 },
      'NFLX': { price: 612.40, change: -2.10, changePercent: -0.34 },
      'JPM': { price: 198.50, change: 1.20, changePercent: 0.61 },
      'JNJ': { price: 165.80, change: -0.80, changePercent: -0.48 },
      'V': { price: 275.90, change: 2.40, changePercent: 0.88 },
      'PG': { price: 162.30, change: 0.60, changePercent: 0.37 },
      'UNH': { price: 485.70, change: -3.20, changePercent: -0.65 },
      'HD': { price: 385.40, change: 4.10, changePercent: 1.08 },
      'MA': { price: 425.60, change: 6.80, changePercent: 1.62 },
      'DIS': { price: 95.20, change: -1.40, changePercent: -1.45 },
      'PYPL': { price: 68.90, change: 1.20, changePercent: 1.77 },
      'ADBE': { price: 485.30, change: 12.40, changePercent: 2.62 }
    };

    const defaultData = { price: 100.00, change: 0.00, changePercent: 0.00 };
    const stockData = mockPrices[symbol] || defaultData;

    return {
      symbol: symbol,
      name: `${symbol} Corporation`,
      price: stockData.price,
      change: stockData.change,
      changePercent: stockData.changePercent,
      volume: Math.floor(Math.random() * 50000000) + 10000000,
      high: stockData.price * (1 + Math.random() * 0.05),
      low: stockData.price * (1 - Math.random() * 0.05),
      open: stockData.price * (1 + (Math.random() - 0.5) * 0.02)
    };
  };

  // Generate mock historical data
  const generateMockHistoricalData = (symbol, currentData) => {
    console.log('generateMockHistoricalData called with symbol:', symbol, 'currentData:', currentData);
    
    const data = [];
    const basePrice = currentData?.price || 100;
    const now = new Date();
    
    console.log('Base price for historical data:', basePrice);
    
    // Generate 100 days of historical data
    for (let i = 99; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Simulate realistic price movements
      const volatility = 0.02; // 2% daily volatility
      const randomChange = (Math.random() - 0.5) * volatility;
      const price = basePrice * Math.pow(1 + randomChange, 99 - i);
      
      const high = price * (1 + Math.random() * 0.03);
      const low = price * (1 - Math.random() * 0.03);
      const open = price * (1 + (Math.random() - 0.5) * 0.02);
      const volume = Math.floor(Math.random() * 1000000) + 100000;
      
      data.push({
        time: Math.floor(date.getTime() / 1000),
        open: open,
        high: high,
        low: low,
        close: price,
        volume: volume
      });
    }
    
    console.log('Generated historical data sample:', data.slice(0, 3));
    return data;
  };

  // Initialize chart
  const initializeChart = (data) => {
    console.log('Initializing chart with data length:', data?.length);
    
    if (!chartRef.current) {
      console.log('Chart ref not available');
      return;
    }

    if (!data || data.length === 0) {
      console.log('No data available for chart');
      return;
    }

    // Clear existing chart
    if (chartInstance) {
      chartInstance.remove();
    }

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 400,
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
    });

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    candlestickSeries.setData(data);

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

      const volumeData = data.map(d => ({
        time: d.time,
        value: d.volume,
        color: d.close > d.open ? '#26a69a' : '#ef5350',
      }));

      volumeSeries.setData(volumeData);
    }

    // Add technical indicators
    if (showIndicators) {
      addTechnicalIndicators(chart, data);
    }

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
      chart.remove();
    };
  };

  // Add technical indicators to chart
  const addTechnicalIndicators = (chart, data) => {
    selectedIndicators.forEach(indicator => {
      if (indicator === 'SMA') {
        const smaData = calculateSMA(data, 20);
        const smaSeries = chart.addLineSeries({
          color: '#2196F3',
          lineWidth: 1,
          title: 'SMA 20',
        });
        smaSeries.setData(smaData);
      } else if (indicator === 'EMA') {
        const emaData = calculateEMA(data, 12);
        const emaSeries = chart.addLineSeries({
          color: '#FF9800',
          lineWidth: 1,
          title: 'EMA 12',
        });
        emaSeries.setData(emaData);
      } else if (indicator === 'RSI') {
        const rsiData = calculateRSI(data, 14);
        const rsiSeries = chart.addLineSeries({
          color: '#9C27B0',
          lineWidth: 1,
          title: 'RSI',
          priceScaleId: 'right',
        });
        rsiSeries.setData(rsiData);
      }
    });
  };

  // Calculate Simple Moving Average
  const calculateSMA = (data, period) => {
    const smaData = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, d) => acc + d.close, 0);
      const sma = sum / period;
      smaData.push({
        time: data[i].time,
        value: sma,
      });
    }
    return smaData;
  };

  // Calculate Exponential Moving Average
  const calculateEMA = (data, period) => {
    const emaData = [];
    const multiplier = 2 / (period + 1);
    
    // First EMA is SMA
    let ema = data.slice(0, period).reduce((acc, d) => acc + d.close, 0) / period;
    emaData.push({
      time: data[period - 1].time,
      value: ema,
    });

    // Calculate subsequent EMAs
    for (let i = period; i < data.length; i++) {
      ema = (data[i].close * multiplier) + (ema * (1 - multiplier));
      emaData.push({
        time: data[i].time,
        value: ema,
      });
    }
    return emaData;
  };

  // Calculate RSI
  const calculateRSI = (data, period) => {
    const rsiData = [];
    const gains = [];
    const losses = [];

    // Calculate gains and losses
    for (let i = 1; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    // Calculate RSI
    for (let i = period; i < data.length; i++) {
      const avgGain = gains.slice(i - period, i).reduce((acc, g) => acc + g, 0) / period;
      const avgLoss = losses.slice(i - period, i).reduce((acc, l) => acc + l, 0) / period;
      
      const rs = avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      
      rsiData.push({
        time: data[i].time,
        value: rsi,
      });
    }
    return rsiData;
  };

  // Perform technical analysis
  const performTechnicalAnalysis = (data) => {
    if (!data || data.length === 0) return;

    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    
    // Calculate indicators
    const sma20 = calculateSMA(data, 20);
    const sma50 = calculateSMA(data, 50);
    const rsi = calculateRSI(data, 14);
    
    const currentSMA20 = sma20[sma20.length - 1]?.value || 0;
    const currentSMA50 = sma50[sma50.length - 1]?.value || 0;
    const currentRSI = rsi[rsi.length - 1]?.value || 0;
    
    // Generate signals
    const signals = {
      trend: latest.close > currentSMA20 && currentSMA20 > currentSMA50 ? 'Bullish' : 'Bearish',
      momentum: currentRSI > 70 ? 'Overbought' : currentRSI < 30 ? 'Oversold' : 'Neutral',
      support: Math.min(...data.slice(-20).map(d => d.low)),
      resistance: Math.max(...data.slice(-20).map(d => d.high)),
      volatility: calculateVolatility(data.slice(-20)),
      volume: calculateVolumeAnalysis(data.slice(-20)),
    };

    setTechnicalAnalysis(signals);
  };

  // Calculate volatility
  const calculateVolatility = (data) => {
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      returns.push((data[i].close - data[i - 1].close) / data[i - 1].close);
    }
    const mean = returns.reduce((acc, r) => acc + r, 0) / returns.length;
    const variance = returns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility
  };

  // Calculate volume analysis
  const calculateVolumeAnalysis = (data) => {
    const avgVolume = data.reduce((acc, d) => acc + d.volume, 0) / data.length;
    const currentVolume = data[data.length - 1].volume;
    return {
      average: avgVolume,
      current: currentVolume,
      ratio: currentVolume / avgVolume,
      trend: currentVolume > avgVolume * 1.5 ? 'High' : currentVolume < avgVolume * 0.5 ? 'Low' : 'Normal'
    };
  };

  // Handle search input
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    searchStocks(value);
  };

  // Handle symbol selection
  const handleSymbolSelect = (symbol) => {
    setSelectedSymbol(symbol);
    setSearchTerm(symbol);
    setSearchResults([]);
    fetchStockData(symbol);
  };

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
    // In a real implementation, this would fetch data for the new timeframe
    if (selectedSymbol) {
      fetchStockData(selectedSymbol);
    }
  };

  // Handle indicator toggle
  const handleIndicatorToggle = (indicator) => {
    setSelectedIndicators(prev => 
      prev.includes(indicator) 
        ? prev.filter(i => i !== indicator)
        : [...prev, indicator]
    );
  };

  // Manual chart initialization
  const forceChartInit = () => {
    console.log('Force chart init called');
    console.log('chartRef.current:', chartRef.current);
    console.log('stockData:', stockData);
    
    if (stockData?.historical && chartRef.current) {
      console.log('Force initializing chart');
      initializeChart(stockData.historical);
    } else {
      console.log('Cannot force init - missing data or ref');
    }
  };

  // Component mount effect
  useEffect(() => {
    console.log('ChartSubsystem component mounted');
  }, []);

  // Only initialize chart when stockData changes
  useEffect(() => {
    console.log('useEffect triggered - stockData:', stockData);
    console.log('chartRef.current:', chartRef.current);
    
    if (stockData?.historical && chartRef.current) {
      console.log('Initializing chart with data length:', stockData.historical.length);
      initializeChart(stockData.historical);
    } else {
      console.log('Chart initialization skipped - missing data or ref');
    }
  }, [stockData]); // Only depend on stockData

  // Handle indicator changes separately
  useEffect(() => {
    if (chartInstance && stockData?.historical) {
      console.log('Updating indicators...');
      // Re-add indicators with new selection
      addTechnicalIndicators(chartInstance, stockData.historical);
    }
  }, [selectedIndicators, showVolume, showIndicators]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (chartInstance) {
        chartInstance.remove();
      }
    };
  }, [chartInstance]);

  return (
    <Box p={4} bg={bgColor} minH="100vh">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Card>
          <CardHeader>
            <HStack justify="space-between">
              <HStack>
                <FiBarChart2 size={24} />
                <Text fontSize="xl" fontWeight="bold">Chart Analysis</Text>
              </HStack>
              <Badge colorScheme="blue" fontSize="sm">
                Real-time Data
              </Badge>
            </HStack>
          </CardHeader>
        </Card>

        {/* Search Section */}
        <Card>
          <CardBody>
            <VStack spacing={4}>
              {/* Search Input */}
              <HStack w="full" spacing={4}>
                <Box flex={1} position="relative">
                  <Input
                    placeholder="Search for stocks (e.g., AAPL, MSFT)"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    size="lg"
                    pr="4.5rem"
                  />
                  <IconButton
                    position="absolute"
                    right="0.5rem"
                    top="0.5rem"
                    icon={<FiSearch />}
                    size="sm"
                    variant="ghost"
                  />
                </Box>
                <Select
                  value={timeframe}
                  onChange={(e) => handleTimeframeChange(e.target.value)}
                  size="lg"
                  w="150px"
                >
                  <option value="1D">1 Day</option>
                  <option value="1W">1 Week</option>
                  <option value="1M">1 Month</option>
                  <option value="3M">3 Months</option>
                  <option value="6M">6 Months</option>
                  <option value="1Y">1 Year</option>
                </Select>
                                 <Button
                   colorScheme="blue"
                   size="lg"
                   onClick={() => fetchStockData(selectedSymbol)}
                   isLoading={loading}
                 >
                   <FiRefreshCw />
                 </Button>
                                   <Button
                    colorScheme="green"
                    size="lg"
                    onClick={() => {
                      console.log('Manual test - current state:', {
                        selectedSymbol,
                        stockData,
                        loading,
                        chartRef: chartRef.current
                      });
                    }}
                  >
                    Debug
                  </Button>
                  <Button
                    colorScheme="orange"
                    size="lg"
                    onClick={forceChartInit}
                  >
                    Force Chart
                  </Button>
              </HStack>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <Box w="full" maxH="200px" overflowY="auto" border="1px solid" borderColor={borderColor} borderRadius="md">
                  {searchResults.map((stock, index) => (
                    <HStack
                      key={index}
                      p={3}
                      cursor="pointer"
                      _hover={{ bg: 'gray.50' }}
                      onClick={() => handleSymbolSelect(stock.symbol)}
                      justify="space-between"
                    >
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold">{stock.symbol}</Text>
                        <Text fontSize="sm" color="gray.500">{stock.name}</Text>
                      </VStack>
                      <Badge colorScheme="green">{stock.exchange}</Badge>
                    </HStack>
                  ))}
                </Box>
              )}

              {/* Popular Stocks */}
              <Box w="full">
                <Text fontSize="sm" fontWeight="semibold" mb={2}>Popular Stocks:</Text>
                <Flex wrap="wrap" gap={2}>
                  {POPULAR_STOCKS.slice(0, 8).map((symbol) => (
                    <Button
                      key={symbol}
                      size="sm"
                      variant={selectedSymbol === symbol ? "solid" : "outline"}
                      colorScheme="blue"
                      onClick={() => handleSymbolSelect(symbol)}
                    >
                      {symbol}
                    </Button>
                  ))}
                </Flex>
              </Box>
            </VStack>
          </CardBody>
        </Card>

                 {/* Main Content */}
         <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
           {/* Chart Section */}
           <Card>
             <CardHeader>
               <HStack justify="space-between">
                 <VStack align="start" spacing={0}>
                   <Text fontSize="xl" fontWeight="bold">
                     {selectedSymbol || 'Chart Analysis'}
                   </Text>
                   <Text fontSize="sm" color="gray.500">
                     {stockData?.name || 'Select a stock to view chart'}
                   </Text>
                 </VStack>
                 <HStack spacing={2}>
                   <IconButton
                     size="sm"
                     icon={showVolume ? <FiEye /> : <FiEyeOff />}
                     onClick={() => setShowVolume(!showVolume)}
                     variant="outline"
                   />
                   <IconButton
                     size="sm"
                     icon={showIndicators ? <FiEye /> : <FiEyeOff />}
                     onClick={() => setShowIndicators(!showIndicators)}
                     variant="outline"
                   />
                   <IconButton
                     size="sm"
                     icon={<FiSettings />}
                     variant="outline"
                   />
                 </HStack>
               </HStack>
             </CardHeader>
             <CardBody>
               {loading ? (
                 <Center h="400px">
                   <Spinner size="xl" />
                 </Center>
               ) : (
                 <Box 
                   ref={chartRef} 
                   h="400px" 
                   border="2px solid" 
                   borderColor="red.500" 
                   bg="blue.100" 
                   position="relative"
                   onClick={() => {
                     console.log('Chart container clicked!');
                     console.log('Container dimensions:', {
                       width: chartRef.current?.clientWidth,
                       height: chartRef.current?.clientHeight,
                       offsetWidth: chartRef.current?.offsetWidth,
                       offsetHeight: chartRef.current?.offsetHeight
                     });
                   }}
                 >
                   <Text position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" color="red.500" fontWeight="bold">
                     {selectedSymbol ? 'Chart Container - Click to debug' : 'Select a stock to view chart'}
                   </Text>
                 </Box>
               )}
             </CardBody>
           </Card>

                         {/* Analysis Panel */}
             <VStack spacing={4} align="stretch">
               {/* Current Price */}
               {stockData ? (
                 <Card>
                   <CardBody>
                     <VStack spacing={3}>
                       <Text fontSize="2xl" fontWeight="bold">
                         ${stockData.price?.toFixed(2) || '0.00'}
                       </Text>
                       <HStack>
                         <Badge colorScheme={stockData.change >= 0 ? 'green' : 'red'}>
                           {stockData.change >= 0 ? '+' : ''}{stockData.change?.toFixed(2) || '0.00'}
                         </Badge>
                         <Badge colorScheme={stockData.change >= 0 ? 'green' : 'red'}>
                           {stockData.change >= 0 ? '+' : ''}{stockData.changePercent?.toFixed(2) || '0.00'}%
                         </Badge>
                       </HStack>
                       <Text fontSize="sm" color="gray.500">
                         Volume: {stockData.volume?.toLocaleString() || '0'}
                       </Text>
                     </VStack>
                   </CardBody>
                 </Card>
               ) : (
                 <Card>
                   <CardBody>
                     <Center py={8}>
                       <VStack spacing={3}>
                         <FiBarChart2 size={48} color="gray.400" />
                         <Text fontSize="lg" fontWeight="bold" color="gray.500">
                           No Stock Selected
                         </Text>
                         <Text fontSize="sm" color="gray.400" textAlign="center">
                           Select a stock from the search above to view analysis
                         </Text>
                       </VStack>
                     </Center>
                   </CardBody>
                 </Card>
               )}

                             {/* Technical Analysis */}
               {Object.keys(technicalAnalysis).length > 0 ? (
                 <Card>
                   <CardHeader>
                     <Text fontWeight="bold">Technical Analysis</Text>
                   </CardHeader>
                   <CardBody>
                     <VStack spacing={3} align="stretch">
                       <HStack justify="space-between">
                         <Text fontSize="sm">Trend:</Text>
                         <Badge colorScheme={technicalAnalysis.trend === 'Bullish' ? 'green' : 'red'}>
                           {technicalAnalysis.trend}
                         </Badge>
                       </HStack>
                       <HStack justify="space-between">
                         <Text fontSize="sm">Momentum:</Text>
                         <Badge colorScheme={
                           technicalAnalysis.momentum === 'Overbought' ? 'red' : 
                           technicalAnalysis.momentum === 'Oversold' ? 'green' : 'gray'
                         }>
                           {technicalAnalysis.momentum}
                         </Badge>
                       </HStack>
                       <HStack justify="space-between">
                         <Text fontSize="sm">Support:</Text>
                         <Text fontSize="sm" fontWeight="bold">
                           ${technicalAnalysis.support?.toFixed(2) || '0.00'}
                         </Text>
                       </HStack>
                       <HStack justify="space-between">
                         <Text fontSize="sm">Resistance:</Text>
                         <Text fontSize="sm" fontWeight="bold">
                           ${technicalAnalysis.resistance?.toFixed(2) || '0.00'}
                         </Text>
                       </HStack>
                       <HStack justify="space-between">
                         <Text fontSize="sm">Volatility:</Text>
                         <Text fontSize="sm" fontWeight="bold">
                           {technicalAnalysis.volatility?.toFixed(1) || '0'}%
                         </Text>
                       </HStack>
                       <HStack justify="space-between">
                         <Text fontSize="sm">Volume:</Text>
                         <Badge colorScheme={
                           technicalAnalysis.volume?.trend === 'High' ? 'green' : 
                           technicalAnalysis.volume?.trend === 'Low' ? 'red' : 'gray'
                         }>
                           {technicalAnalysis.volume?.trend || 'Normal'}
                         </Badge>
                       </HStack>
                     </VStack>
                   </CardBody>
                 </Card>
               ) : (
                 <Card>
                   <CardHeader>
                     <Text fontWeight="bold">Technical Analysis</Text>
                   </CardHeader>
                   <CardBody>
                     <Center py={6}>
                       <Text fontSize="sm" color="gray.500">
                         Select a stock to view technical analysis
                       </Text>
                     </Center>
                   </CardBody>
                 </Card>
               )}

              {/* Indicators */}
              <Card>
                <CardHeader>
                  <Text fontWeight="bold">Indicators</Text>
                </CardHeader>
                <CardBody>
                  <VStack spacing={2} align="stretch">
                    {Object.entries(TECHNICAL_INDICATORS).map(([key, indicator]) => (
                      <Button
                        key={key}
                        size="sm"
                        variant={selectedIndicators.includes(key) ? "solid" : "outline"}
                        colorScheme="blue"
                        onClick={() => handleIndicatorToggle(key)}
                        justify="space-between"
                      >
                        <Text>{indicator.name}</Text>
                        {selectedIndicators.includes(key) && <FiCheck />}
                      </Button>
                    ))}
                  </VStack>
                </CardBody>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <Text fontWeight="bold">Quick Actions</Text>
                </CardHeader>
                <CardBody>
                  <VStack spacing={2} align="stretch">
                    <Button size="sm" colorScheme="green" leftIcon={<FiTrendingUp />}>
                      Add to Watchlist
                    </Button>
                    <Button size="sm" colorScheme="blue" leftIcon={<FiTarget />}>
                      Set Price Alert
                    </Button>
                    <Button size="sm" colorScheme="purple" leftIcon={<FiActivity />}>
                      View News
                    </Button>
                    <Button size="sm" colorScheme="orange" leftIcon={<FiInfo />}>
                      Company Info
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
                         </VStack>
           </Grid>
      </VStack>
    </Box>
  );
}

export default ChartSubsystem;
