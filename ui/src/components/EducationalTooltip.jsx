import React, { useState } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Icon,
  Link,
  Badge,
  Divider,
  useColorModeValue,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  List,
  ListItem,
  ListIcon,
  Code,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  SimpleGrid
} from '@chakra-ui/react';
import {
  FiInfo,
  FiExternalLink,
  FiBookOpen,
  FiTarget,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiHelpCircle,
  FiBarChart2
} from 'react-icons/fi';

// Educational content database based on your technical documentation
const EDUCATIONAL_CONTENT = {
  // Technical Analysis Indicators
  'SMA': {
    title: 'Simple Moving Average (SMA)',
    description: 'A technical indicator that calculates the average price of a security over a specific number of periods.',
    calculation: 'SMA = (P1 + P2 + ... + Pn) / n',
    interpretation: {
      'Trend Direction': 'Price above SMA indicates uptrend, below indicates downtrend',
      'Support/Resistance': 'SMA often acts as dynamic support or resistance levels',
      'Crossovers': 'Price crossing above/below SMA can signal trend changes'
    },
    trading_signals: [
      'Buy when price crosses above SMA',
      'Sell when price crosses below SMA',
      'Use multiple SMAs for trend confirmation'
    ],
    external_links: [
      { name: 'Investopedia', url: 'https://www.investopedia.com/terms/s/sma.asp' },
      { name: 'TradingView', url: 'https://www.tradingview.com/ideas/sma/' }
    ],
    difficulty: 'Beginner',
    category: 'Trend'
  },
  'EMA': {
    title: 'Exponential Moving Average (EMA)',
    description: 'A type of moving average that gives more weight to recent prices, making it more responsive to price changes.',
    calculation: 'EMA = (Price × Multiplier) + (Previous EMA × (1 - Multiplier))',
    interpretation: {
      'Responsiveness': 'EMA reacts faster to price changes than SMA',
      'Trend Strength': 'Steeper EMA slope indicates stronger trend',
      'Crossover Signals': 'EMA crossovers provide earlier signals than SMA'
    },
    trading_signals: [
      'Buy when fast EMA crosses above slow EMA',
      'Sell when fast EMA crosses below slow EMA',
      'Use EMA slope to gauge trend strength'
    ],
    external_links: [
      { name: 'Investopedia', url: 'https://www.investopedia.com/terms/e/ema.asp' },
      { name: 'TradingView', url: 'https://www.tradingview.com/ideas/ema/' }
    ],
    difficulty: 'Intermediate',
    category: 'Trend'
  },
  'RSI': {
    title: 'Relative Strength Index (RSI)',
    description: 'A momentum oscillator that measures the speed and magnitude of price changes to identify overbought or oversold conditions.',
    calculation: 'RSI = 100 - (100 / (1 + RS)) where RS = Average Gain / Average Loss',
    interpretation: {
      'Overbought': 'RSI above 70 indicates potential reversal or pullback',
      'Oversold': 'RSI below 30 indicates potential bounce or reversal',
      'Divergence': 'Price making new highs while RSI doesn\'t can signal weakness'
    },
    trading_signals: [
      'Buy when RSI crosses above 30 from oversold territory',
      'Sell when RSI crosses below 70 from overbought territory',
      'Look for bullish/bearish divergences for reversal signals'
    ],
    external_links: [
      { name: 'Investopedia', url: 'https://www.investopedia.com/terms/r/rsi.asp' },
      { name: 'TradingView', url: 'https://www.tradingview.com/ideas/rsi/' }
    ],
    difficulty: 'Intermediate',
    category: 'Momentum'
  },
  'MACD': {
    title: 'Moving Average Convergence Divergence (MACD)',
    description: 'A trend-following momentum indicator that shows the relationship between two moving averages of a security\'s price.',
    calculation: 'MACD = 12-period EMA - 26-period EMA\nSignal Line = 9-period EMA of MACD',
    interpretation: {
      'Bullish Signal': 'MACD line crosses above signal line',
      'Bearish Signal': 'MACD line crosses below signal line',
      'Histogram': 'Distance between MACD and signal line shows momentum strength'
    },
    trading_signals: [
      'Buy when MACD line crosses above signal line',
      'Sell when MACD line crosses below signal line',
      'Watch for divergences between price and MACD'
    ],
    external_links: [
      { name: 'Investopedia', url: 'https://www.investopedia.com/terms/m/macd.asp' },
      { name: 'TradingView', url: 'https://www.tradingview.com/ideas/macd/' }
    ],
    difficulty: 'Intermediate',
    category: 'Momentum'
  },
  'BB': {
    title: 'Bollinger Bands',
    description: 'A volatility indicator consisting of a middle band (SMA) and upper/lower bands that represent standard deviations.',
    calculation: 'Middle Band = 20-period SMA\nUpper Band = Middle + (2 × Standard Deviation)\nLower Band = Middle - (2 × Standard Deviation)',
    interpretation: {
      'Volatility': 'Band width indicates market volatility',
      'Mean Reversion': 'Price tends to revert to the middle band',
      'Breakouts': 'Price breaking bands can signal trend continuation'
    },
    trading_signals: [
      'Buy when price touches lower band in uptrend',
      'Sell when price touches upper band in downtrend',
      'Watch for band squeeze before breakouts'
    ],
    external_links: [
      { name: 'Investopedia', url: 'https://www.investopedia.com/terms/b/bollingerbands.asp' },
      { name: 'TradingView', url: 'https://www.tradingview.com/ideas/bollinger-bands/' }
    ],
    difficulty: 'Intermediate',
    category: 'Volatility'
  },
  'ATR': {
    title: 'Average True Range (ATR)',
    description: 'A volatility indicator that measures market volatility by decomposing the entire range of an asset price.',
    calculation: 'True Range = max(High-Low, |High-PrevClose|, |Low-PrevClose|)\nATR = 14-period average of True Range',
    interpretation: {
      'Volatility': 'Higher ATR indicates higher volatility',
      'Stop Loss': 'ATR helps determine appropriate stop loss distances',
      'Position Sizing': 'ATR can help determine position size based on risk'
    },
    trading_signals: [
      'Use ATR to set dynamic stop losses',
      'Higher ATR may require wider stops',
      'ATR can help with position sizing decisions'
    ],
    external_links: [
      { name: 'Investopedia', url: 'https://www.investopedia.com/terms/a/atr.asp' },
      { name: 'TradingView', url: 'https://www.tradingview.com/ideas/atr/' }
    ],
    difficulty: 'Advanced',
    category: 'Volatility'
  }
};

// Fundamental Analysis Metrics
const FUNDAMENTAL_CONTENT = {
  'P/E_Ratio': {
    title: 'Price-to-Earnings (P/E) Ratio',
    description: 'Measures a company\'s current share price relative to its per-share earnings.',
    calculation: 'P/E Ratio = Market Price per Share / Earnings per Share',
    interpretation: {
      'Valuation': 'Lower P/E may indicate undervaluation, higher P/E may indicate overvaluation',
      'Growth Expectations': 'High P/E often reflects high growth expectations',
      'Industry Comparison': 'Compare P/E ratios within the same industry'
    },
    benchmarks: {
      'Technology': '15-30',
      'Healthcare': '15-25',
      'Financial': '10-15',
      'Consumer Goods': '15-20'
    },
    external_links: [
      { name: 'Investopedia', url: 'https://www.investopedia.com/terms/p/price-earningsratio.asp' }
    ],
    difficulty: 'Beginner',
    category: 'Valuation'
  },
  'P/B_Ratio': {
    title: 'Price-to-Book (P/B) Ratio',
    description: 'Compares a company\'s market value to its book value.',
    calculation: 'P/B Ratio = Market Price per Share / Book Value per Share',
    interpretation: {
      'Asset Value': 'P/B < 1 may indicate undervaluation relative to assets',
      'Growth vs Value': 'Value stocks typically have lower P/B ratios',
      'Financial Health': 'High P/B may indicate strong growth prospects'
    },
    benchmarks: {
      'Technology': '3-8',
      'Financial': '1-2',
      'Manufacturing': '1-3',
      'Utilities': '1-2'
    },
    external_links: [
      { name: 'Investopedia', url: 'https://www.investopedia.com/terms/p/price-to-bookratio.asp' }
    ],
    difficulty: 'Beginner',
    category: 'Valuation'
  }
};

const EducationalTooltip = ({ 
  term, 
  type = 'technical', 
  children, 
  showModal = false,
  position = 'top',
  size = 'md'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  
  const content = type === 'technical' ? EDUCATIONAL_CONTENT[term] : FUNDAMENTAL_CONTENT[term];
  
  if (!content) {
    return children;
  }

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');

  const tooltipContent = (
    <Box
      p={4}
      bg={bgColor}
      border="1px"
      borderColor={borderColor}
      borderRadius="md"
      boxShadow="lg"
      maxW="400px"
      color={textColor}
    >
      <VStack align="stretch" spacing={3}>
        {/* Header */}
        <HStack justify="space-between">
          <Text fontWeight="bold" fontSize="sm" color="blue.500">
            {content.title}
          </Text>
          <Badge size="sm" colorScheme={content.difficulty === 'Beginner' ? 'green' : content.difficulty === 'Intermediate' ? 'yellow' : 'red'}>
            {content.difficulty}
          </Badge>
        </HStack>

        {/* Description */}
        <Text fontSize="xs" lineHeight="1.4">
          {content.description}
        </Text>

        {/* Quick Interpretation */}
        {content.interpretation && (
          <Box>
            <Text fontSize="xs" fontWeight="semibold" mb={1}>Quick Guide:</Text>
            {Object.entries(content.interpretation).slice(0, 2).map(([key, value]) => (
              <Text key={key} fontSize="xs" color="gray.600">
                <strong>{key}:</strong> {value}
              </Text>
            ))}
          </Box>
        )}

        {/* Action Buttons */}
        <HStack spacing={2}>
          <Button
            size="xs"
            colorScheme="blue"
            variant="outline"
            leftIcon={<Icon as={FiBookOpen} />}
            onClick={(e) => {
              e.stopPropagation();
              onModalOpen();
            }}
          >
            Learn More
          </Button>
          {content.external_links && content.external_links.length > 0 && (
            <Button
              size="xs"
              colorScheme="green"
              variant="outline"
              leftIcon={<Icon as={FiExternalLink} />}
              onClick={(e) => {
                e.stopPropagation();
                window.open(content.external_links[0].url, '_blank');
              }}
            >
              {content.external_links[0].name}
            </Button>
          )}
        </HStack>
      </VStack>
    </Box>
  );

  const modalContent = (
    <Modal isOpen={isModalOpen} onClose={onModalClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <Icon as={FiBookOpen} color="blue.500" />
            <Text>{content.title}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="stretch" spacing={4}>
            {/* Description */}
            <Box>
              <Text fontWeight="semibold" mb={2}>Description</Text>
              <Text>{content.description}</Text>
            </Box>

            {/* Calculation */}
            {content.calculation && (
              <Box>
                <Text fontWeight="semibold" mb={2}>Calculation</Text>
                <Code p={3} borderRadius="md" display="block" whiteSpace="pre-wrap">
                  {content.calculation}
                </Code>
              </Box>
            )}

            {/* Interpretation */}
            {content.interpretation && (
              <Box>
                <Text fontWeight="semibold" mb={2}>Interpretation</Text>
                <List spacing={2}>
                  {Object.entries(content.interpretation).map(([key, value]) => (
                    <ListItem key={key}>
                      <ListIcon as={FiCheckCircle} color="green.500" />
                      <Text as="span" fontWeight="medium">{key}:</Text> {value}
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Trading Signals */}
            {content.trading_signals && (
              <Box>
                <Text fontWeight="semibold" mb={2}>Trading Signals</Text>
                <List spacing={2}>
                  {content.trading_signals.map((signal, index) => (
                    <ListItem key={index}>
                      <ListIcon as={FiTarget} color="blue.500" />
                      {signal}
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Benchmarks */}
            {content.benchmarks && (
              <Box>
                <Text fontWeight="semibold" mb={2}>Industry Benchmarks</Text>
                <SimpleGrid columns={2} spacing={2}>
                  {Object.entries(content.benchmarks).map(([industry, range]) => (
                    <Box key={industry} p={2} bg="gray.50" borderRadius="md">
                      <Text fontSize="sm" fontWeight="medium">{industry}</Text>
                      <Text fontSize="sm" color="gray.600">{range}</Text>
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
            )}

            {/* External Links */}
            {content.external_links && content.external_links.length > 0 && (
              <Box>
                <Text fontWeight="semibold" mb={2}>Learn More</Text>
                <VStack align="stretch" spacing={2}>
                  {content.external_links.map((link, index) => (
                    <Button
                      key={index}
                      leftIcon={<Icon as={FiExternalLink} />}
                      variant="outline"
                      onClick={() => window.open(link.url, '_blank')}
                    >
                      {link.name}
                    </Button>
                  ))}
                </VStack>
              </Box>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );

  return (
    <>
      <Box
        display="inline-block"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        position="relative"
      >
        {children}
        {isOpen && !showModal && (
          <Box
            position="absolute"
            top={position === 'bottom' ? '100%' : 'auto'}
            bottom={position === 'top' ? '100%' : 'auto'}
            left="50%"
            transform="translateX(-50%)"
            zIndex={1000}
            mt={position === 'bottom' ? 2 : 0}
            mb={position === 'top' ? 2 : 0}
          >
            {tooltipContent}
          </Box>
        )}
      </Box>
      {modalContent}
    </>
  );
};

export default EducationalTooltip;
