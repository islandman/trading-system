import React, { useState, useEffect } from 'react';
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
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Checkbox,
  CheckboxGroup,
  Tag,
  TagLabel,
  TagCloseButton,
  InputGroup,
  InputLeftAddon,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
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
  FiAlertCircle,
  FiEdit,
  FiPlus,
  FiFilter,
  FiDownload,
  FiUpload,
  FiTag,
  FiTarget,
  FiTrendingUp as FiTrendingUpIcon,
  FiTrendingDown as FiTrendingDownIcon
} from 'react-icons/fi';

const BROKER = (import.meta.env.VITE_BROKER_URL) || 'http://localhost:8000';

// Predefined tags for categorization
const PREDEFINED_TAGS = [
  'breakout', 'earnings', 'RSI', 'MACD', 'support', 'resistance', 'volume', 'momentum',
  'reversal', 'consolidation', 'gap', 'news', 'technical', 'fundamental', 'swing', 'day-trade',
  'scalp', 'position', 'hedge', 'arbitrage', 'pairs', 'mean-reversion', 'trend-following'
];

// Predefined mistakes for tracking
const PREDEFINED_MISTAKES = [
  'chased entry', 'ignored stop-loss', 'exited on emotion', 'overtraded', 'poor position sizing',
  'missed reversal', 'held too long', 'exited too early', 'ignored volume', 'poor risk management',
  'fomo', 'revenge trading', 'averaging down', 'not following plan', 'impulsive entry',
  'ignored technical signals', 'poor market timing', 'emotional decision', 'lack of patience',
  'overconfidence', 'fear of missing out', 'revenge trading', 'averaging down losses'
];

// Entry/Exit timing options
const TIMING_OPTIONS = ['Good', 'Fair', 'Poor', 'Too Early', 'Too Late'];

// Outcome reasons
const OUTCOME_REASONS = [
  'Good timing', 'Strong setup', 'Luck', 'Poor analysis', 'Bad timing', 'External factors',
  'Market conditions', 'News impact', 'Technical failure', 'Execution issues', 'Volume alignment',
  'Volatility alignment', 'Perfect entry', 'Perfect exit', 'Market momentum', 'Sector rotation',
  'Earnings surprise', 'Fed announcement', 'Economic data', 'Geopolitical event'
];

function EnhancedJournal() {
  const [journal, setJournal] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedSymbol, setSelectedSymbol] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedOutcome, setSelectedOutcome] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEntry, setEditingEntry] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('journal');
  const [timeRange, setTimeRange] = useState('all'); // all, week, month, quarter, year
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const fetchJournal = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BROKER}/trade-journal?limit=1000`);
      if (response.ok) {
        const data = await response.json();
        setJournal(data);
      }
    } catch (error) {
      console.error('Trade journal error:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch trade journal',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJournal();
    const interval = setInterval(fetchJournal, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Filter journal entries
  const filteredJournal = journal.filter(entry => {
    if (filter === 'buys' && entry.side !== 'BUY') return false;
    if (filter === 'sells' && entry.side !== 'SELL') return false;
    if (selectedSymbol !== 'all' && entry.symbol !== selectedSymbol) return false;
    if (selectedOutcome !== 'all' && entry.outcome !== selectedOutcome) return false;
    if (selectedTags.length > 0 && !selectedTags.some(tag => entry.tags?.includes(tag))) return false;
    if (searchTerm && !entry.symbol.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !entry.reason_for_entry?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !entry.reflection?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    // Time range filtering
    if (timeRange !== 'all') {
      const entryDate = new Date(entry.timestamp * 1000);
      const now = new Date();
      const diffTime = Math.abs(now - entryDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      switch (timeRange) {
        case 'week':
          if (diffDays > 7) return false;
          break;
        case 'month':
          if (diffDays > 30) return false;
          break;
        case 'quarter':
          if (diffDays > 90) return false;
          break;
        case 'year':
          if (diffDays > 365) return false;
          break;
      }
    }
    
    return true;
  });

  // Calculate summary statistics
  const totalTrades = filteredJournal.length;
  const profitableTrades = filteredJournal.filter(entry => entry.outcome === 'Profit').length;
  const losingTrades = filteredJournal.filter(entry => entry.outcome === 'Loss').length;
  const winRate = totalTrades > 0 ? (profitableTrades / totalTrades * 100).toFixed(1) : 0;
  
  const totalPnl = filteredJournal.reduce((sum, entry) => sum + (entry.gain_loss || 0), 0);
  const avgPnl = totalTrades > 0 ? totalPnl / totalTrades : 0;
  
  const totalVolume = filteredJournal.reduce((sum, entry) => sum + (entry.quantity || entry.qty), 0);
  const totalValue = filteredJournal.reduce((sum, entry) => sum + ((entry.quantity || entry.qty) * entry.price), 0);
  const avgPrice = totalVolume > 0 ? totalValue / totalVolume : 0;

  // Tag analysis
  const tagAnalysis = {};
  filteredJournal.forEach(entry => {
    entry.tags?.forEach(tag => {
      if (!tagAnalysis[tag]) {
        tagAnalysis[tag] = { count: 0, wins: 0, totalPnl: 0 };
      }
      tagAnalysis[tag].count++;
      if (entry.outcome === 'Profit') tagAnalysis[tag].wins++;
      tagAnalysis[tag].totalPnl += entry.gain_loss || 0;
    });
  });

  // Mistake analysis
  const mistakeAnalysis = {};
  filteredJournal.forEach(entry => {
    entry.mistakes?.forEach(mistake => {
      if (!mistakeAnalysis[mistake]) {
        mistakeAnalysis[mistake] = { count: 0, totalPnl: 0, trades: [] };
      }
      mistakeAnalysis[mistake].count++;
      mistakeAnalysis[mistake].totalPnl += entry.gain_loss || 0;
      mistakeAnalysis[mistake].trades.push(entry);
    });
  });

  // Advanced analysis functions
  const analyzeEntryQuality = (entry) => {
    const score = {
      setup: entry.entry_setup_valid ? 1 : 0,
      plan: entry.followed_plan ? 1 : 0,
      timing: entry.entry_timing === 'Good' ? 1 : entry.entry_timing === 'Fair' ? 0.5 : 0,
      volume: entry.entry_volume_aligned ? 1 : 0,
      volatility: entry.entry_volatility_aligned ? 1 : 0
    };
    return {
      score: Object.values(score).reduce((a, b) => a + b, 0) / 5,
      details: score
    };
  };

  const analyzeExitQuality = (entry) => {
    const score = {
      timing: entry.exit_timing === 'Good' ? 1 : entry.exit_timing === 'Fair' ? 0.5 : 0,
      stopLoss: entry.respected_stop_loss ? 1 : 0,
      target: entry.respected_target ? 1 : 0,
      reversal: !entry.missed_reversal ? 1 : 0
    };
    return {
      score: Object.values(score).reduce((a, b) => a + b, 0) / 4,
      details: score
    };
  };

  const analyzeTradeOutcome = (entry) => {
    const entryQuality = analyzeEntryQuality(entry);
    const exitQuality = analyzeExitQuality(entry);
    const overallQuality = (entryQuality.score + exitQuality.score) / 2;
    
    return {
      entryQuality,
      exitQuality,
      overallQuality,
      outcome: entry.outcome,
      gainLoss: entry.gain_loss || 0,
      wasProfitable: entry.outcome === 'Profit'
    };
  };

  // Performance by analysis categories
  const performanceBySetup = {};
  const performanceByTiming = {};
  const performanceByPlan = {};

  filteredJournal.forEach(entry => {
    const analysis = analyzeTradeOutcome(entry);
    
    // Setup performance
    const setupKey = entry.entry_setup_valid ? 'Valid Setup' : 'Invalid Setup';
    if (!performanceBySetup[setupKey]) {
      performanceBySetup[setupKey] = { trades: 0, wins: 0, totalPnl: 0 };
    }
    performanceBySetup[setupKey].trades++;
    if (analysis.wasProfitable) performanceBySetup[setupKey].wins++;
    performanceBySetup[setupKey].totalPnl += analysis.gainLoss;

    // Timing performance
    const timingKey = entry.entry_timing || 'Unknown';
    if (!performanceByTiming[timingKey]) {
      performanceByTiming[timingKey] = { trades: 0, wins: 0, totalPnl: 0 };
    }
    performanceByTiming[timingKey].trades++;
    if (analysis.wasProfitable) performanceByTiming[timingKey].wins++;
    performanceByTiming[timingKey].totalPnl += analysis.gainLoss;

    // Plan adherence performance
    const planKey = entry.followed_plan ? 'Followed Plan' : 'Deviated from Plan';
    if (!performanceByPlan[planKey]) {
      performanceByPlan[planKey] = { trades: 0, wins: 0, totalPnl: 0 };
    }
    performanceByPlan[planKey].trades++;
    if (analysis.wasProfitable) performanceByPlan[planKey].wins++;
    performanceByPlan[planKey].totalPnl += analysis.gainLoss;
  });

  // Mistake frequency over time (last 30 days)
  const mistakeFrequencyOverTime = {};
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  filteredJournal
    .filter(entry => entry.timestamp * 1000 > thirtyDaysAgo)
    .forEach(entry => {
      const date = new Date(entry.timestamp * 1000).toLocaleDateString();
      if (!mistakeFrequencyOverTime[date]) {
        mistakeFrequencyOverTime[date] = { totalTrades: 0, totalMistakes: 0 };
      }
      mistakeFrequencyOverTime[date].totalTrades++;
      mistakeFrequencyOverTime[date].totalMistakes += entry.mistakes?.length || 0;
    });

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setIsEditModalOpen(true);
  };

  const handleSaveEntry = async (updatedEntry) => {
    try {
      // Save to the backend
      const response = await fetch(`${BROKER}/trade-journal/${updatedEntry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEntry),
      });
      
      if (response.ok) {
        // Update local state
        setJournal(prev => prev.map(entry => 
          entry.id === updatedEntry.id ? updatedEntry : entry
        ));
        
        toast({
          title: 'Success',
          description: 'Journal entry updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        setIsEditModalOpen(false);
        setEditingEntry(null);
      } else {
        throw new Error('Failed to update journal entry');
      }
    } catch (error) {
      console.error('Error updating journal entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to update journal entry',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const exportJournal = () => {
    const dataStr = JSON.stringify(filteredJournal, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trade-journal-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Tabs value={activeTab} onChange={setActiveTab}>
        <TabList>
          <Tab>Journal Entries</Tab>
          <Tab>Analytics</Tab>
          <Tab>Entry/Exit Analysis</Tab>
          <Tab>Tag Analysis</Tab>
          <Tab>Mistake Tracking</Tab>
          <Tab>Performance Insights</Tab>
        </TabList>

        <TabPanels>
          {/* Journal Entries Tab */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              {/* Filters and Controls */}
              <Card>
                <CardBody>
                  <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                    <FormControl>
                      <FormLabel fontSize="sm">Symbol</FormLabel>
                      <Select 
                        value={selectedSymbol} 
                        onChange={(e) => setSelectedSymbol(e.target.value)}
                        size="sm"
                      >
                        <option value="all">All Symbols</option>
                        {[...new Set(journal.map(entry => entry.symbol))].sort().map(symbol => (
                          <option key={symbol} value={symbol}>{symbol}</option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Side</FormLabel>
                      <Select value={filter} onChange={(e) => setFilter(e.target.value)} size="sm">
                        <option value="all">All Trades</option>
                        <option value="buys">Buys Only</option>
                        <option value="sells">Sells Only</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Outcome</FormLabel>
                      <Select value={selectedOutcome} onChange={(e) => setSelectedOutcome(e.target.value)} size="sm">
                        <option value="all">All Outcomes</option>
                        <option value="Profit">Profit</option>
                        <option value="Loss">Loss</option>
                        <option value="Break-even">Break-even</option>
                      </Select>
                    </FormControl>

                                         <FormControl>
                       <FormLabel fontSize="sm">Search</FormLabel>
                       <Input 
                         placeholder="Search symbols, reasons, reflections..."
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         size="sm"
                       />
                     </FormControl>

                     <FormControl>
                       <FormLabel fontSize="sm">Time Range</FormLabel>
                       <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} size="sm">
                         <option value="all">All Time</option>
                         <option value="week">Last Week</option>
                         <option value="month">Last Month</option>
                         <option value="quarter">Last Quarter</option>
                         <option value="year">Last Year</option>
                       </Select>
                     </FormControl>
                  </Grid>

                  <HStack mt={4} justify="space-between">
                    <HStack spacing={2}>
                      <Button size="sm" onClick={fetchJournal} isLoading={loading}>
                        <Icon as={FiRefreshCw} mr={2} />
                        Refresh
                      </Button>
                      <Button size="sm" onClick={exportJournal}>
                        <Icon as={FiDownload} mr={2} />
                        Export
                      </Button>
                    </HStack>

                    <Text fontSize="sm" color="gray.500">
                      {totalTrades} trades • Win Rate: {winRate}% • Total P&L: ${totalPnl.toFixed(2)}
                    </Text>
                  </HStack>
                </CardBody>
              </Card>

              {/* Journal Entries Table */}
              <Card>
                <CardBody>
                  {loading ? (
                    <Center py={8}>
                      <Spinner />
                    </Center>
                  ) : (
                    <Box overflowX="auto">
                      <Table size="sm">
                        <Thead>
                          <Tr>
                            <Th>Date</Th>
                            <Th>Symbol</Th>
                            <Th>Side</Th>
                            <Th>Qty</Th>
                            <Th>Price</Th>
                            <Th>P&L</Th>
                            <Th>Outcome</Th>
                            <Th>Tags</Th>
                            <Th>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {filteredJournal.map((entry) => (
                            <Tr key={entry.id}>
                              <Td>{new Date(entry.timestamp * 1000).toLocaleDateString()}</Td>
                              <Td fontWeight="bold">{entry.symbol}</Td>
                              <Td>
                                <Badge colorScheme={entry.side === 'BUY' ? 'green' : 'red'}>
                                  {entry.side}
                                </Badge>
                              </Td>
                              <Td>{(entry.quantity || entry.qty).toLocaleString()}</Td>
                              <Td>${entry.price.toFixed(2)}</Td>
                              <Td>
                                <Text 
                                  color={entry.gain_loss > 0 ? 'green.500' : entry.gain_loss < 0 ? 'red.500' : 'gray.500'}
                                  fontWeight="bold"
                                >
                                  ${entry.gain_loss?.toFixed(2) || '-'}
                                </Text>
                              </Td>
                              <Td>
                                <Badge 
                                  colorScheme={entry.outcome === 'Profit' ? 'green' : entry.outcome === 'Loss' ? 'red' : 'gray'}
                                >
                                  {entry.outcome || '-'}
                                </Badge>
                              </Td>
                              <Td>
                                <Wrap spacing={1}>
                                  {entry.tags?.slice(0, 3).map((tag, index) => (
                                    <WrapItem key={index}>
                                      <Tag size="sm" colorScheme="blue">
                                        <TagLabel>{tag}</TagLabel>
                                      </Tag>
                                    </WrapItem>
                                  ))}
                                  {entry.tags?.length > 3 && (
                                    <WrapItem>
                                      <Tag size="sm" colorScheme="gray">
                                        <TagLabel>+{entry.tags.length - 3}</TagLabel>
                                      </Tag>
                                    </WrapItem>
                                  )}
                                </Wrap>
                              </Td>
                              <Td>
                                <IconButton
                                  size="sm"
                                  icon={<FiEdit />}
                                  onClick={() => handleEditEntry(entry)}
                                  aria-label="Edit entry"
                                />
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  )}
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>

          {/* Analytics Tab */}
          <TabPanel>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
              <Stat>
                <StatLabel>Total Trades</StatLabel>
                <StatNumber>{totalTrades}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  {totalTrades > 0 ? 'Active trading' : 'No trades yet'}
                </StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>Win Rate</StatLabel>
                <StatNumber>{winRate}%</StatNumber>
                <StatHelpText>
                  {profitableTrades} wins / {losingTrades} losses
                </StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>Total P&L</StatLabel>
                <StatNumber color={totalPnl > 0 ? 'green.500' : totalPnl < 0 ? 'red.500' : 'gray.500'}>
                  ${totalPnl.toFixed(2)}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type={totalPnl > 0 ? 'increase' : 'decrease'} />
                  Avg: ${avgPnl.toFixed(2)} per trade
                </StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>Total Volume</StatLabel>
                <StatNumber>{totalVolume.toLocaleString()}</StatNumber>
                <StatHelpText>
                  Avg price: ${avgPrice.toFixed(2)}
                </StatHelpText>
              </Stat>
            </SimpleGrid>

            <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6} mt={6}>
              {/* Performance by Symbol */}
              <Card>
                <CardHeader>
                  <Text fontWeight="bold">Performance by Symbol</Text>
                </CardHeader>
                <CardBody>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Symbol</Th>
                        <Th>Trades</Th>
                        <Th>Win Rate</Th>
                        <Th>P&L</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {Object.entries(
                        filteredJournal.reduce((acc, entry) => {
                          if (!acc[entry.symbol]) {
                            acc[entry.symbol] = { trades: 0, wins: 0, pnl: 0 };
                          }
                          acc[entry.symbol].trades++;
                          if (entry.outcome === 'Profit') acc[entry.symbol].wins++;
                          acc[entry.symbol].pnl += entry.gain_loss || 0;
                          return acc;
                        }, {})
                      ).map(([symbol, data]) => (
                        <Tr key={symbol}>
                          <Td fontWeight="bold">{symbol}</Td>
                          <Td>{data.trades}</Td>
                          <Td>{(data.wins / data.trades * 100).toFixed(1)}%</Td>
                          <Td color={data.pnl > 0 ? 'green.500' : 'red.500'}>
                            ${data.pnl.toFixed(2)}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>

              {/* Recent Performance Trend */}
              <Card>
                <CardHeader>
                  <Text fontWeight="bold">Recent Performance Trend</Text>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4}>
                    <Text fontSize="sm" color="gray.500">
                      Last 10 trades performance
                    </Text>
                    <Progress 
                      value={winRate} 
                      colorScheme="green" 
                      size="lg"
                      borderRadius="md"
                    />
                    <Text fontSize="sm">
                      Win rate trend: {winRate > 50 ? 'Improving' : 'Needs work'}
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            </Grid>
                     </TabPanel>

           {/* Entry/Exit Analysis Tab */}
           <TabPanel>
             <VStack spacing={4} align="stretch">
               {/* Entry Quality Analysis */}
               <Card>
                 <CardHeader>
                   <Text fontWeight="bold">Entry Quality Analysis</Text>
                 </CardHeader>
                 <CardBody>
                   <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                     <VStack align="start" spacing={2}>
                       <Text fontWeight="semibold">Setup Validation Performance</Text>
                       <Table size="sm">
                         <Thead>
                           <Tr>
                             <Th>Setup Type</Th>
                             <Th>Trades</Th>
                             <Th>Win Rate</Th>
                             <Th>Avg P&L</Th>
                           </Tr>
                         </Thead>
                         <Tbody>
                           {Object.entries(performanceBySetup).map(([setup, data]) => (
                             <Tr key={setup}>
                               <Td>{setup}</Td>
                               <Td>{data.trades}</Td>
                               <Td>{(data.wins / data.trades * 100).toFixed(1)}%</Td>
                               <Td color={data.totalPnl > 0 ? 'green.500' : 'red.500'}>
                                 ${(data.totalPnl / data.trades).toFixed(2)}
                               </Td>
                             </Tr>
                           ))}
                         </Tbody>
                       </Table>
                     </VStack>

                     <VStack align="start" spacing={2}>
                       <Text fontWeight="semibold">Timing Performance</Text>
                       <Table size="sm">
                         <Thead>
                           <Tr>
                             <Th>Timing</Th>
                             <Th>Trades</Th>
                             <Th>Win Rate</Th>
                             <Th>Avg P&L</Th>
                           </Tr>
                         </Thead>
                         <Tbody>
                           {Object.entries(performanceByTiming).map(([timing, data]) => (
                             <Tr key={timing}>
                               <Td>{timing}</Td>
                               <Td>{data.trades}</Td>
                               <Td>{(data.wins / data.trades * 100).toFixed(1)}%</Td>
                               <Td color={data.totalPnl > 0 ? 'green.500' : 'red.500'}>
                                 ${(data.totalPnl / data.trades).toFixed(2)}
                               </Td>
                             </Tr>
                           ))}
                         </Tbody>
                       </Table>
                     </VStack>
                   </SimpleGrid>
                 </CardBody>
               </Card>

               {/* Plan Adherence Analysis */}
               <Card>
                 <CardHeader>
                   <Text fontWeight="bold">Plan Adherence Analysis</Text>
                 </CardHeader>
                 <CardBody>
                   <Table size="sm">
                     <Thead>
                       <Tr>
                         <Th>Plan Status</Th>
                         <Th>Trades</Th>
                         <Th>Win Rate</Th>
                         <Th>Total P&L</Th>
                         <Th>Avg P&L</Th>
                       </Tr>
                     </Thead>
                     <Tbody>
                       {Object.entries(performanceByPlan).map(([plan, data]) => (
                         <Tr key={plan}>
                           <Td>
                             <Badge colorScheme={plan === 'Followed Plan' ? 'green' : 'red'}>
                               {plan}
                             </Badge>
                           </Td>
                           <Td>{data.trades}</Td>
                           <Td>{(data.wins / data.trades * 100).toFixed(1)}%</Td>
                           <Td color={data.totalPnl > 0 ? 'green.500' : 'red.500'}>
                             ${data.totalPnl.toFixed(2)}
                           </Td>
                           <Td color={data.totalPnl > 0 ? 'green.500' : 'red.500'}>
                             ${(data.totalPnl / data.trades).toFixed(2)}
                           </Td>
                         </Tr>
                       ))}
                     </Tbody>
                   </Table>
                 </CardBody>
               </Card>

               {/* Individual Trade Analysis */}
               <Card>
                 <CardHeader>
                   <Text fontWeight="bold">Individual Trade Quality Scores</Text>
                 </CardHeader>
                 <CardBody>
                   <Box overflowX="auto">
                     <Table size="sm">
                       <Thead>
                         <Tr>
                           <Th>Date</Th>
                           <Th>Symbol</Th>
                           <Th>Entry Score</Th>
                           <Th>Exit Score</Th>
                           <Th>Overall Score</Th>
                           <Th>Outcome</Th>
                           <Th>P&L</Th>
                         </Tr>
                       </Thead>
                       <Tbody>
                         {filteredJournal.slice(0, 10).map((entry) => {
                           const analysis = analyzeTradeOutcome(entry);
                           return (
                             <Tr key={entry.id}>
                               <Td>{new Date(entry.timestamp * 1000).toLocaleDateString()}</Td>
                               <Td fontWeight="bold">{entry.symbol}</Td>
                               <Td>
                                 <Progress 
                                   value={analysis.entryQuality.score * 100} 
                                   size="sm" 
                                   colorScheme={analysis.entryQuality.score > 0.7 ? 'green' : analysis.entryQuality.score > 0.4 ? 'yellow' : 'red'}
                                 />
                                 <Text fontSize="xs">{(analysis.entryQuality.score * 100).toFixed(0)}%</Text>
                               </Td>
                               <Td>
                                 <Progress 
                                   value={analysis.exitQuality.score * 100} 
                                   size="sm" 
                                   colorScheme={analysis.exitQuality.score > 0.7 ? 'green' : analysis.exitQuality.score > 0.4 ? 'yellow' : 'red'}
                                 />
                                 <Text fontSize="xs">{(analysis.exitQuality.score * 100).toFixed(0)}%</Text>
                               </Td>
                               <Td>
                                 <Progress 
                                   value={analysis.overallQuality * 100} 
                                   size="sm" 
                                   colorScheme={analysis.overallQuality > 0.7 ? 'green' : analysis.overallQuality > 0.4 ? 'yellow' : 'red'}
                                 />
                                 <Text fontSize="xs">{(analysis.overallQuality * 100).toFixed(0)}%</Text>
                               </Td>
                               <Td>
                                 <Badge colorScheme={analysis.wasProfitable ? 'green' : 'red'}>
                                   {analysis.outcome}
                                 </Badge>
                               </Td>
                               <Td color={analysis.gainLoss > 0 ? 'green.500' : 'red.500'}>
                                 ${analysis.gainLoss.toFixed(2)}
                               </Td>
                             </Tr>
                           );
                         })}
                       </Tbody>
                     </Table>
                   </Box>
                 </CardBody>
               </Card>
             </VStack>
           </TabPanel>

           {/* Tag Analysis Tab */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Card>
                <CardHeader>
                  <Text fontWeight="bold">Tag Performance Analysis</Text>
                </CardHeader>
                <CardBody>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Tag</Th>
                        <Th>Count</Th>
                        <Th>Win Rate</Th>
                        <Th>Total P&L</Th>
                        <Th>Avg P&L</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {Object.entries(tagAnalysis)
                        .sort(([,a], [,b]) => b.count - a.count)
                        .map(([tag, data]) => (
                          <Tr key={tag}>
                            <Td>
                              <Tag colorScheme="blue">
                                <TagLabel>{tag}</TagLabel>
                              </Tag>
                            </Td>
                            <Td>{data.count}</Td>
                            <Td>{(data.wins / data.count * 100).toFixed(1)}%</Td>
                            <Td color={data.totalPnl > 0 ? 'green.500' : 'red.500'}>
                              ${data.totalPnl.toFixed(2)}
                            </Td>
                            <Td color={data.totalPnl > 0 ? 'green.500' : 'red.500'}>
                              ${(data.totalPnl / data.count).toFixed(2)}
                            </Td>
                          </Tr>
                        ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>

          {/* Mistake Tracking Tab */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Card>
                <CardHeader>
                  <Text fontWeight="bold">Mistake Analysis</Text>
                </CardHeader>
                <CardBody>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Mistake</Th>
                        <Th>Frequency</Th>
                        <Th>Total P&L Impact</Th>
                        <Th>Avg P&L Impact</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {Object.entries(mistakeAnalysis)
                        .sort(([,a], [,b]) => b.count - a.count)
                        .map(([mistake, data]) => (
                          <Tr key={mistake}>
                            <Td>
                              <Tag colorScheme="red">
                                <TagLabel>{mistake}</TagLabel>
                              </Tag>
                            </Td>
                            <Td>{data.count}</Td>
                            <Td color={data.totalPnl > 0 ? 'green.500' : 'red.500'}>
                              ${data.totalPnl.toFixed(2)}
                            </Td>
                            <Td color={data.totalPnl > 0 ? 'green.500' : 'red.500'}>
                              ${(data.totalPnl / data.count).toFixed(2)}
                            </Td>
                          </Tr>
                        ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>

              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>Mistake Tracking Tips!</AlertTitle>
                  <AlertDescription>
                    Track your mistakes to identify patterns and improve your trading. 
                    Common mistakes include chasing entries, ignoring stop-losses, and emotional trading.
                  </AlertDescription>
                </Box>
              </Alert>
                         </VStack>
           </TabPanel>

           {/* Performance Insights Tab */}
           <TabPanel>
             <VStack spacing={4} align="stretch">
               {/* Mistake Frequency Over Time */}
               <Card>
                 <CardHeader>
                   <Text fontWeight="bold">Mistake Frequency Over Time (Last 30 Days)</Text>
                 </CardHeader>
                 <CardBody>
                   <Box overflowX="auto">
                     <Table size="sm">
                       <Thead>
                         <Tr>
                           <Th>Date</Th>
                           <Th>Total Trades</Th>
                           <Th>Total Mistakes</Th>
                           <Th>Mistakes per Trade</Th>
                           <Th>Trend</Th>
                         </Tr>
                       </Thead>
                       <Tbody>
                         {Object.entries(mistakeFrequencyOverTime)
                           .sort(([a], [b]) => new Date(a) - new Date(b))
                           .map(([date, data]) => (
                             <Tr key={date}>
                               <Td>{date}</Td>
                               <Td>{data.totalTrades}</Td>
                               <Td>{data.totalMistakes}</Td>
                               <Td>{(data.totalMistakes / data.totalTrades).toFixed(2)}</Td>
                               <Td>
                                 <Progress 
                                   value={(data.totalMistakes / data.totalTrades) * 100} 
                                   size="sm" 
                                   colorScheme={(data.totalMistakes / data.totalTrades) < 0.5 ? 'green' : (data.totalMistakes / data.totalTrades) < 1 ? 'yellow' : 'red'}
                                 />
                               </Td>
                             </Tr>
                           ))}
                       </Tbody>
                     </Table>
                   </Box>
                 </CardBody>
               </Card>

               {/* Top Mistakes Impact */}
               <Card>
                 <CardHeader>
                   <Text fontWeight="bold">Top Mistakes by Financial Impact</Text>
                 </CardHeader>
                 <CardBody>
                   <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                     <VStack align="start" spacing={2}>
                       <Text fontWeight="semibold">Most Costly Mistakes</Text>
                       <Table size="sm">
                         <Thead>
                           <Tr>
                             <Th>Mistake</Th>
                             <Th>Total Loss</Th>
                             <Th>Frequency</Th>
                           </Tr>
                         </Thead>
                         <Tbody>
                           {Object.entries(mistakeAnalysis)
                             .filter(([, data]) => data.totalPnl < 0)
                             .sort(([, a], [, b]) => a.totalPnl - b.totalPnl)
                             .slice(0, 5)
                             .map(([mistake, data]) => (
                               <Tr key={mistake}>
                                 <Td>
                                   <Tag colorScheme="red" size="sm">
                                     <TagLabel>{mistake}</TagLabel>
                                   </Tag>
                                 </Td>
                                 <Td color="red.500">${data.totalPnl.toFixed(2)}</Td>
                                 <Td>{data.count}</Td>
                               </Tr>
                             ))}
                         </Tbody>
                       </Table>
                     </VStack>

                     <VStack align="start" spacing={2}>
                       <Text fontWeight="semibold">Most Frequent Mistakes</Text>
                       <Table size="sm">
                         <Thead>
                           <Tr>
                             <Th>Mistake</Th>
                             <Th>Frequency</Th>
                             <Th>Avg Impact</Th>
                           </Tr>
                         </Thead>
                         <Tbody>
                           {Object.entries(mistakeAnalysis)
                             .sort(([, a], [, b]) => b.count - a.count)
                             .slice(0, 5)
                             .map(([mistake, data]) => (
                               <Tr key={mistake}>
                                 <Td>
                                   <Tag colorScheme="orange" size="sm">
                                     <TagLabel>{mistake}</TagLabel>
                                   </Tag>
                                 </Td>
                                 <Td>{data.count}</Td>
                                 <Td color={data.totalPnl > 0 ? 'green.500' : 'red.500'}>
                                   ${(data.totalPnl / data.count).toFixed(2)}
                                 </Td>
                               </Tr>
                             ))}
                         </Tbody>
                       </Table>
                     </VStack>
                   </SimpleGrid>
                 </CardBody>
               </Card>

               {/* Improvement Recommendations */}
               <Card>
                 <CardHeader>
                   <Text fontWeight="bold">Improvement Recommendations</Text>
                 </CardHeader>
                 <CardBody>
                   <VStack align="start" spacing={3}>
                     {(() => {
                       const recommendations = [];
                       
                       // Analyze setup performance
                       if (performanceBySetup['Invalid Setup'] && performanceBySetup['Invalid Setup'].trades > 0) {
                         const invalidWinRate = (performanceBySetup['Invalid Setup'].wins / performanceBySetup['Invalid Setup'].trades) * 100;
                         if (invalidWinRate < 50) {
                           recommendations.push({
                             type: 'warning',
                             title: 'Setup Validation',
                             message: `Your invalid setups have only ${invalidWinRate.toFixed(1)}% win rate. Focus on validating setups before entry.`
                           });
                         }
                       }

                       // Analyze plan adherence
                       if (performanceByPlan['Deviated from Plan'] && performanceByPlan['Deviated from Plan'].trades > 0) {
                         const deviatedWinRate = (performanceByPlan['Deviated from Plan'].wins / performanceByPlan['Deviated from Plan'].trades) * 100;
                         if (deviatedWinRate < 50) {
                           recommendations.push({
                             type: 'error',
                             title: 'Plan Adherence',
                             message: `Trades where you deviated from plan have only ${deviatedWinRate.toFixed(1)}% win rate. Stick to your trading plan.`
                           });
                         }
                       }

                       // Analyze timing
                       if (performanceByTiming['Poor'] && performanceByTiming['Poor'].trades > 0) {
                         const poorTimingWinRate = (performanceByTiming['Poor'].wins / performanceByTiming['Poor'].trades) * 100;
                         if (poorTimingWinRate < 40) {
                           recommendations.push({
                             type: 'warning',
                             title: 'Entry Timing',
                             message: `Poor timing entries have only ${poorTimingWinRate.toFixed(1)}% win rate. Improve your entry timing analysis.`
                           });
                         }
                       }

                       // Analyze most costly mistakes
                       const mostCostlyMistake = Object.entries(mistakeAnalysis)
                         .filter(([, data]) => data.totalPnl < 0)
                         .sort(([, a], [, b]) => a.totalPnl - b.totalPnl)[0];
                       
                       if (mostCostlyMistake) {
                         recommendations.push({
                           type: 'error',
                           title: 'Critical Mistake',
                           message: `"${mostCostlyMistake[0]}" has cost you $${Math.abs(mostCostlyMistake[1].totalPnl).toFixed(2)}. Focus on eliminating this mistake.`
                         });
                       }

                       return recommendations.length > 0 ? recommendations.map((rec, index) => (
                         <Alert key={index} status={rec.type}>
                           <AlertIcon />
                           <Box>
                             <AlertTitle>{rec.title}</AlertTitle>
                             <AlertDescription>{rec.message}</AlertDescription>
                           </Box>
                         </Alert>
                       )) : (
                         <Alert status="success">
                           <AlertIcon />
                           <Box>
                             <AlertTitle>Great Job!</AlertTitle>
                             <AlertDescription>Your trading analysis shows good performance across all metrics. Keep up the excellent work!</AlertDescription>
                           </Box>
                         </Alert>
                       );
                     })()}
                   </VStack>
                 </CardBody>
               </Card>
             </VStack>
           </TabPanel>
         </TabPanels>
      </Tabs>

      {/* Edit Entry Modal */}
      <EditEntryModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingEntry(null);
        }}
        entry={editingEntry}
        onSave={handleSaveEntry}
        predefinedTags={PREDEFINED_TAGS}
        predefinedMistakes={PREDEFINED_MISTAKES}
        timingOptions={TIMING_OPTIONS}
        outcomeReasons={OUTCOME_REASONS}
      />
    </Box>
  );
}

// Edit Entry Modal Component
function EditEntryModal({ isOpen, onClose, entry, onSave, predefinedTags, predefinedMistakes, timingOptions, outcomeReasons }) {
  const [formData, setFormData] = useState({});
  const [newTag, setNewTag] = useState('');
  const [newMistake, setNewMistake] = useState('');

  useEffect(() => {
    if (entry) {
      setFormData({
        reason_for_entry: entry.reason_for_entry || '',
        reason_for_exit: entry.reason_for_exit || '',
        outcome: entry.outcome || '',
        gain_loss: entry.gain_loss || 0,
        reflection: entry.reflection || '',
        tags: entry.tags || [],
        mistakes: entry.mistakes || [],
        entry_setup_valid: entry.entry_setup_valid,
        followed_plan: entry.followed_plan,
        entry_timing: entry.entry_timing || '',
        exit_timing: entry.exit_timing || '',
        respected_stop_loss: entry.respected_stop_loss,
        respected_target: entry.respected_target,
        outcome_reason: entry.outcome_reason || '',
        position_size_appropriate: entry.position_size_appropriate,
        risk_reward_ratio: entry.risk_reward_ratio || 0,
        notes: entry.notes || ''
      });
    }
  }, [entry]);

  const handleSave = () => {
    const updatedEntry = { ...entry, ...formData };
    onSave(updatedEntry);
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addMistake = () => {
    if (newMistake && !formData.mistakes.includes(newMistake)) {
      setFormData(prev => ({
        ...prev,
        mistakes: [...prev.mistakes, newMistake]
      }));
      setNewMistake('');
    }
  };

  const removeMistake = (mistakeToRemove) => {
    setFormData(prev => ({
      ...prev,
      mistakes: prev.mistakes.filter(mistake => mistake !== mistakeToRemove)
    }));
  };

  if (!entry) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Trade Journal Entry - {entry.symbol}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            {/* Basic Trade Info */}
            <Grid templateColumns="1fr 1fr" gap={4} w="full">
              <FormControl>
                <FormLabel>Symbol</FormLabel>
                <Input value={entry.symbol} isReadOnly />
              </FormControl>
              <FormControl>
                <FormLabel>Side</FormLabel>
                <Input value={entry.side} isReadOnly />
              </FormControl>
              <FormControl>
                <FormLabel>Quantity</FormLabel>
                <Input value={entry.qty} isReadOnly />
              </FormControl>
              <FormControl>
                <FormLabel>Price</FormLabel>
                <Input value={`$${entry.price.toFixed(2)}`} isReadOnly />
              </FormControl>
            </Grid>

            <Divider />

            {/* Reasoning */}
            <FormControl>
              <FormLabel>Reason for Entry</FormLabel>
              <Textarea
                value={formData.reason_for_entry}
                onChange={(e) => setFormData(prev => ({ ...prev, reason_for_entry: e.target.value }))}
                placeholder="Why did you enter this trade?"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Reason for Exit</FormLabel>
              <Textarea
                value={formData.reason_for_exit}
                onChange={(e) => setFormData(prev => ({ ...prev, reason_for_exit: e.target.value }))}
                placeholder="Why did you exit this trade?"
              />
            </FormControl>

            {/* Outcome */}
            <Grid templateColumns="1fr 1fr" gap={4} w="full">
              <FormControl>
                <FormLabel>Outcome</FormLabel>
                <Select
                  value={formData.outcome}
                  onChange={(e) => setFormData(prev => ({ ...prev, outcome: e.target.value }))}
                >
                  <option value="">Select outcome</option>
                  <option value="Profit">Profit</option>
                  <option value="Loss">Loss</option>
                  <option value="Break-even">Break-even</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>P&L</FormLabel>
                <InputGroup>
                  <InputLeftAddon>$</InputLeftAddon>
                  <Input
                    type="number"
                    value={formData.gain_loss}
                    onChange={(e) => setFormData(prev => ({ ...prev, gain_loss: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </InputGroup>
              </FormControl>
            </Grid>

            {/* Reflection */}
            <FormControl>
              <FormLabel>Reflection</FormLabel>
              <Textarea
                value={formData.reflection}
                onChange={(e) => setFormData(prev => ({ ...prev, reflection: e.target.value }))}
                placeholder="What went well? What went wrong? What would you do differently?"
                rows={3}
              />
            </FormControl>

            {/* Tags */}
            <FormControl>
              <FormLabel>Tags</FormLabel>
              <VStack align="stretch" spacing={2}>
                <HStack>
                  <Select
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Select or type a tag"
                  >
                    {predefinedTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </Select>
                  <Button size="sm" onClick={addTag}>Add</Button>
                </HStack>
                <Wrap spacing={2}>
                  {formData.tags?.map((tag, index) => (
                    <WrapItem key={index}>
                      <Tag colorScheme="blue">
                        <TagLabel>{tag}</TagLabel>
                        <TagCloseButton onClick={() => removeTag(tag)} />
                      </Tag>
                    </WrapItem>
                  ))}
                </Wrap>
              </VStack>
            </FormControl>

            {/* Mistakes */}
            <FormControl>
              <FormLabel>Mistakes Made</FormLabel>
              <VStack align="stretch" spacing={2}>
                <HStack>
                  <Select
                    value={newMistake}
                    onChange={(e) => setNewMistake(e.target.value)}
                    placeholder="Select or type a mistake"
                  >
                    {predefinedMistakes.map(mistake => (
                      <option key={mistake} value={mistake}>{mistake}</option>
                    ))}
                  </Select>
                  <Button size="sm" onClick={addMistake}>Add</Button>
                </HStack>
                <Wrap spacing={2}>
                  {formData.mistakes?.map((mistake, index) => (
                    <WrapItem key={index}>
                      <Tag colorScheme="red">
                        <TagLabel>{mistake}</TagLabel>
                        <TagCloseButton onClick={() => removeMistake(mistake)} />
                      </Tag>
                    </WrapItem>
                  ))}
                </Wrap>
              </VStack>
            </FormControl>

                         {/* Analysis */}
             <Grid templateColumns="1fr 1fr" gap={4} w="full">
               <FormControl>
                 <FormLabel>Entry Timing</FormLabel>
                 <Select
                   value={formData.entry_timing}
                   onChange={(e) => setFormData(prev => ({ ...prev, entry_timing: e.target.value }))}
                 >
                   <option value="">Select timing</option>
                   {timingOptions.map(option => (
                     <option key={option} value={option}>{option}</option>
                   ))}
                 </Select>
               </FormControl>

               <FormControl>
                 <FormLabel>Exit Timing</FormLabel>
                 <Select
                   value={formData.exit_timing}
                   onChange={(e) => setFormData(prev => ({ ...prev, exit_timing: e.target.value }))}
                 >
                   <option value="">Select timing</option>
                   {timingOptions.map(option => (
                     <option key={option} value={option}>{option}</option>
                   ))}
                 </Select>
               </FormControl>
             </Grid>

             {/* Entry Analysis */}
             <Grid templateColumns="1fr 1fr" gap={4} w="full">
               <FormControl>
                 <FormLabel>Volume Alignment</FormLabel>
                 <Select
                   value={formData.entry_volume_aligned ? 'true' : 'false'}
                   onChange={(e) => setFormData(prev => ({ ...prev, entry_volume_aligned: e.target.value === 'true' }))}
                 >
                   <option value="true">Aligned with Volume</option>
                   <option value="false">Not Aligned with Volume</option>
                 </Select>
               </FormControl>

               <FormControl>
                 <FormLabel>Volatility Alignment</FormLabel>
                 <Select
                   value={formData.entry_volatility_aligned ? 'true' : 'false'}
                   onChange={(e) => setFormData(prev => ({ ...prev, entry_volatility_aligned: e.target.value === 'true' }))}
                 >
                   <option value="true">Aligned with Volatility</option>
                   <option value="false">Not Aligned with Volatility</option>
                 </Select>
               </FormControl>
             </Grid>

            <Grid templateColumns="1fr 1fr" gap={4} w="full">
              <FormControl>
                <FormLabel>Outcome Reason</FormLabel>
                <Select
                  value={formData.outcome_reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, outcome_reason: e.target.value }))}
                >
                  <option value="">Select reason</option>
                  {outcomeReasons.map(reason => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Risk/Reward Ratio</FormLabel>
                <Input
                  type="number"
                  value={formData.risk_reward_ratio}
                  onChange={(e) => setFormData(prev => ({ ...prev, risk_reward_ratio: parseFloat(e.target.value) || 0 }))}
                  placeholder="1.5"
                />
              </FormControl>
            </Grid>

            {/* Checkboxes */}
            <Grid templateColumns="1fr 1fr" gap={4} w="full">
              <VStack align="start" spacing={2}>
                <Checkbox
                  isChecked={formData.entry_setup_valid}
                  onChange={(e) => setFormData(prev => ({ ...prev, entry_setup_valid: e.target.checked }))}
                >
                  Valid Setup
                </Checkbox>
                <Checkbox
                  isChecked={formData.followed_plan}
                  onChange={(e) => setFormData(prev => ({ ...prev, followed_plan: e.target.checked }))}
                >
                  Followed Plan
                </Checkbox>
                <Checkbox
                  isChecked={formData.respected_stop_loss}
                  onChange={(e) => setFormData(prev => ({ ...prev, respected_stop_loss: e.target.checked }))}
                >
                  Respected Stop-Loss
                </Checkbox>
              </VStack>

              <VStack align="start" spacing={2}>
                <Checkbox
                  isChecked={formData.respected_target}
                  onChange={(e) => setFormData(prev => ({ ...prev, respected_target: e.target.checked }))}
                >
                  Respected Target
                </Checkbox>
                <Checkbox
                  isChecked={formData.position_size_appropriate}
                  onChange={(e) => setFormData(prev => ({ ...prev, position_size_appropriate: e.target.checked }))}
                >
                  Appropriate Position Size
                </Checkbox>
              </VStack>
            </Grid>

            {/* Additional Notes */}
            <FormControl>
              <FormLabel>Additional Notes</FormLabel>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional observations or notes..."
                rows={2}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSave}>
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default EnhancedJournal;
