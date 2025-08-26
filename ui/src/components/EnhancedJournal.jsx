import React, { useState, useEffect } from 'react';

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
        
        setIsEditModalOpen(false);
        setEditingEntry(null);
      } else {
        throw new Error('Failed to update journal entry');
      }
    } catch (error) {
      console.error('Error updating journal entry:', error);
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
    <div style={{
      padding: '16px',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      backgroundColor: 'var(--bg-primary)'
    }}>
      <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Enhanced Trade Journal</h3>
      
      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        marginBottom: '16px',
        backgroundColor: 'var(--bg-tertiary)',
        borderRadius: '6px',
        overflow: 'hidden'
      }}>
        <button
          onClick={() => setActiveTab('journal')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'journal' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'journal' ? 'white' : 'var(--text-secondary)',
            border: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'journal' ? 'bold' : 'normal'
          }}
        >
          Journal Entries
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'analytics' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'analytics' ? 'white' : 'var(--text-secondary)',
            border: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'analytics' ? 'bold' : 'normal'
          }}
        >
          Analytics
        </button>
      </div>

      {/* Journal Entries Tab */}
      {activeTab === 'journal' && (
        <div>
          {/* Filters and Controls */}
          <div style={{
            padding: '16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-primary)' }}>Symbol</label>
                <select 
                  value={selectedSymbol} 
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  style={{ 
                    padding: '8px', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '4px', 
                    width: '100%',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="all">All Symbols</option>
                  {[...new Set(journal.map(entry => entry.symbol))].sort().map(symbol => (
                    <option key={symbol} value={symbol}>{symbol}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-primary)' }}>Side</label>
                <select 
                  value={filter} 
                  onChange={(e) => setFilter(e.target.value)}
                  style={{ 
                    padding: '8px', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '4px', 
                    width: '100%',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="all">All Trades</option>
                  <option value="buys">Buys Only</option>
                  <option value="sells">Sells Only</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-primary)' }}>Outcome</label>
                <select 
                  value={selectedOutcome} 
                  onChange={(e) => setSelectedOutcome(e.target.value)}
                  style={{ 
                    padding: '8px', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '4px', 
                    width: '100%',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="all">All Outcomes</option>
                  <option value="Profit">Profit</option>
                  <option value="Loss">Loss</option>
                  <option value="Break-even">Break-even</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-primary)' }}>Search</label>
                <input 
                  placeholder="Search symbols, reasons, reflections..."
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
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-primary)' }}>Time Range</label>
                <select 
                  value={timeRange} 
                  onChange={(e) => setTimeRange(e.target.value)}
                  style={{ 
                    padding: '8px', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '4px', 
                    width: '100%',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="all">All Time</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="quarter">Last Quarter</option>
                  <option value="year">Last Year</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={fetchJournal} 
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
                  {loading ? 'Loading...' : 'Refresh'}
                </button>
                <button 
                  onClick={exportJournal}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--accent-success)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Export
                </button>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {totalTrades} trades • Win Rate: {winRate}% • Total P&L: ${totalPnl.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Journal Entries Table */}
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            overflow: 'hidden'
          }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-primary)' }}>Loading journal entries...</div>
            ) : (
              <div style={{ overflow: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '12px'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Date</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Symbol</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Side</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Qty</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Price</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>P&L</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Outcome</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJournal.map((entry) => (
                      <tr key={entry.id} style={{
                        borderBottom: '1px solid var(--border-light)',
                        backgroundColor: 'var(--bg-primary)'
                      }}>
                        <td style={{ padding: '8px', color: 'var(--text-primary)' }}>
                          {new Date(entry.timestamp * 1000).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '8px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                          {entry.symbol}
                        </td>
                        <td style={{ padding: '8px' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            backgroundColor: entry.side === 'BUY' ? 'var(--accent-success)' : 'var(--accent-danger)',
                            color: 'white'
                          }}>
                            {entry.side}
                          </span>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', color: 'var(--text-primary)' }}>
                          {(entry.quantity || entry.qty).toLocaleString()}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', color: 'var(--text-primary)' }}>
                          ${entry.price.toFixed(2)}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          <span style={{
                            color: entry.gain_loss > 0 ? 'var(--accent-success)' : entry.gain_loss < 0 ? 'var(--accent-danger)' : 'var(--text-secondary)',
                            fontWeight: 'bold'
                          }}>
                            ${entry.gain_loss?.toFixed(2) || '-'}
                          </span>
                        </td>
                        <td style={{ padding: '8px' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            backgroundColor: entry.outcome === 'Profit' ? 'var(--accent-success)' : entry.outcome === 'Loss' ? 'var(--accent-danger)' : 'var(--text-secondary)',
                            color: 'white'
                          }}>
                            {entry.outcome || '-'}
                          </span>
                        </td>
                        <td style={{ padding: '8px' }}>
                          <button
                            onClick={() => handleEditEntry(entry)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: 'var(--accent-primary)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '10px'
                            }}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              padding: '16px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{totalTrades}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Trades</div>
            </div>
            
            <div style={{
              padding: '16px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-success)' }}>{winRate}%</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Win Rate</div>
            </div>
            
            <div style={{
              padding: '16px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: totalPnl > 0 ? 'var(--accent-success)' : totalPnl < 0 ? 'var(--accent-danger)' : 'var(--text-secondary)'
              }}>
                ${totalPnl.toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total P&L</div>
            </div>
            
            <div style={{
              padding: '16px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{totalVolume.toLocaleString()}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Volume</div>
            </div>
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Performance by Symbol</h4>
            <div style={{ overflow: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '12px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Symbol</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Trades</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Win Rate</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>P&L</th>
                  </tr>
                </thead>
                <tbody>
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
                    <tr key={symbol} style={{
                      borderBottom: '1px solid var(--border-light)',
                      backgroundColor: 'var(--bg-primary)'
                    }}>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{symbol}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: 'var(--text-primary)' }}>{data.trades}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: 'var(--text-primary)' }}>
                        {(data.wins / data.trades * 100).toFixed(1)}%
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        <span style={{
                          color: data.pnl > 0 ? 'var(--accent-success)' : 'var(--accent-danger)'
                        }}>
                          ${data.pnl.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      {isEditModalOpen && editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingEntry(null);
          }}
          onSave={handleSaveEntry}
          predefinedTags={PREDEFINED_TAGS}
          predefinedMistakes={PREDEFINED_MISTAKES}
          timingOptions={TIMING_OPTIONS}
          outcomeReasons={OUTCOME_REASONS}
        />
      )}
    </div>
  );
}

// Edit Entry Modal Component
function EditEntryModal({ entry, onClose, onSave, predefinedTags, predefinedMistakes, timingOptions, outcomeReasons }) {
  const [formData, setFormData] = useState({});

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

  if (!entry) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Edit Trade Journal Entry - {entry.symbol}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'grid', gap: '16px' }}>
          {/* Basic Trade Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-primary)' }}>Symbol</label>
              <input value={entry.symbol} readOnly style={{
                padding: '8px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                width: '100%',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)'
              }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-primary)' }}>Side</label>
              <input value={entry.side} readOnly style={{
                padding: '8px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                width: '100%',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)'
              }} />
            </div>
          </div>

          {/* Reasoning */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-primary)' }}>Reason for Entry</label>
            <textarea
              value={formData.reason_for_entry}
              onChange={(e) => setFormData(prev => ({ ...prev, reason_for_entry: e.target.value }))}
              placeholder="Why did you enter this trade?"
              style={{
                padding: '8px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                width: '100%',
                minHeight: '60px',
                resize: 'vertical',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-primary)' }}>Reason for Exit</label>
            <textarea
              value={formData.reason_for_exit}
              onChange={(e) => setFormData(prev => ({ ...prev, reason_for_exit: e.target.value }))}
              placeholder="Why did you exit this trade?"
              style={{
                padding: '8px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                width: '100%',
                minHeight: '60px',
                resize: 'vertical',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Outcome */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-primary)' }}>Outcome</label>
              <select
                value={formData.outcome}
                onChange={(e) => setFormData(prev => ({ ...prev, outcome: e.target.value }))}
                style={{
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  width: '100%',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="">Select outcome</option>
                <option value="Profit">Profit</option>
                <option value="Loss">Loss</option>
                <option value="Break-even">Break-even</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-primary)' }}>P&L</label>
              <input
                type="number"
                value={formData.gain_loss}
                onChange={(e) => setFormData(prev => ({ ...prev, gain_loss: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
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

          {/* Reflection */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: 'var(--text-primary)' }}>Reflection</label>
            <textarea
              value={formData.reflection}
              onChange={(e) => setFormData(prev => ({ ...prev, reflection: e.target.value }))}
              placeholder="What went well? What went wrong? What would you do differently?"
              style={{
                padding: '8px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                width: '100%',
                minHeight: '80px',
                resize: 'vertical',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--text-secondary)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedJournal;
