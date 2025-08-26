import React, { useState, useEffect } from 'react'
import { TOOLTIP_CONTENT, getTooltipContent } from '../data/tooltipContent'
import { WIKI_CONTENT, getWikiContent } from '../data/wikiContent'
import TooltipEditor from './TooltipEditor'
import WikiEditor from './WikiEditor'

const Settings = ({ settings, onSettingsChange }) => {
  const [localSettings, setLocalSettings] = useState(settings)
  const [tooltipCategory, setTooltipCategory] = useState('fundamental')
  const [editingTooltip, setEditingTooltip] = useState(null)
  const [creatingNewTooltip, setCreatingNewTooltip] = useState(false)
  const [newTooltipKey, setNewTooltipKey] = useState('')
  const [customTooltips, setCustomTooltips] = useState(() => {
    const saved = localStorage.getItem('customTooltips')
    return saved ? JSON.parse(saved) : {}
  })
  
  // Wiki management state
  const [wikiSection, setWikiSection] = useState('trading_strategies')
  const [editingWiki, setEditingWiki] = useState(null)
  const [creatingNewWiki, setCreatingNewWiki] = useState(false)
  const [newWikiKey, setNewWikiKey] = useState('')
  const [customWiki, setCustomWiki] = useState(() => {
    const saved = localStorage.getItem('customWiki')
    return saved ? JSON.parse(saved) : {}
  })

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleSettingChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: value }
    setLocalSettings(newSettings)
    onSettingsChange(newSettings)
    
    // Save to localStorage
    localStorage.setItem('tradingSystemSettings', JSON.stringify(newSettings))
  }

  const resetToDefaults = () => {
    const defaultSettings = {
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
    
    setLocalSettings(defaultSettings)
    onSettingsChange(defaultSettings)
    localStorage.setItem('tradingSystemSettings', JSON.stringify(defaultSettings))
  }

  // Tooltip management functions
  const saveCustomTooltip = (category, key, title, content) => {
    const newCustomTooltips = {
      ...customTooltips,
      [category]: {
        ...customTooltips[category],
        [key]: { title, content }
      }
    }
    setCustomTooltips(newCustomTooltips)
    localStorage.setItem('customTooltips', JSON.stringify(newCustomTooltips))
    setEditingTooltip(null)
  }

  const deleteCustomTooltip = (category, key) => {
    const newCustomTooltips = { ...customTooltips }
    if (newCustomTooltips[category]) {
      delete newCustomTooltips[category][key]
      if (Object.keys(newCustomTooltips[category]).length === 0) {
        delete newCustomTooltips[category]
      }
    }
    setCustomTooltips(newCustomTooltips)
    localStorage.setItem('customTooltips', JSON.stringify(newCustomTooltips))
  }

  const getEffectiveTooltipContent = (category, key) => {
    // Check custom tooltips first, then fall back to default content
    if (customTooltips[category]?.[key]) {
      return customTooltips[category][key]
    }
    return TOOLTIP_CONTENT[category]?.[key] || { title: '', content: '' }
  }

  const getAllTooltipKeys = (category) => {
    const defaultKeys = Object.keys(TOOLTIP_CONTENT[category] || {})
    const customKeys = Object.keys(customTooltips[category] || {})
    return [...new Set([...defaultKeys, ...customKeys])]
  }

  const createNewTooltip = (category, key, title, content) => {
    const newCustomTooltips = {
      ...customTooltips,
      [category]: {
        ...customTooltips[category],
        [key]: { title, content }
      }
    }
    setCustomTooltips(newCustomTooltips)
    localStorage.setItem('customTooltips', JSON.stringify(newCustomTooltips))
    setCreatingNewTooltip(false)
    setNewTooltipKey('')
  }

  // Wiki management functions
  const saveCustomWiki = (key, title, content) => {
    const newCustomWiki = {
      ...customWiki,
      [key]: { title, content }
    }
    setCustomWiki(newCustomWiki)
    localStorage.setItem('customWiki', JSON.stringify(newCustomWiki))
    setEditingWiki(null)
  }

  const deleteCustomWiki = (key) => {
    const newCustomWiki = { ...customWiki }
    delete newCustomWiki[key]
    setCustomWiki(newCustomWiki)
    localStorage.setItem('customWiki', JSON.stringify(newCustomWiki))
  }

  const getEffectiveWikiContent = (key) => {
    // Check custom wiki first, then fall back to default content
    if (customWiki[key]) {
      return customWiki[key]
    }
    return WIKI_CONTENT[key] || { title: '', content: '' }
  }

  const getAllWikiKeys = () => {
    const defaultKeys = Object.keys(WIKI_CONTENT)
    const customKeys = Object.keys(customWiki)
    return [...new Set([...defaultKeys, ...customKeys])]
  }

  const createNewWiki = (key, title, content) => {
    const newCustomWiki = {
      ...customWiki,
      [key]: { title, content }
    }
    setCustomWiki(newCustomWiki)
    localStorage.setItem('customWiki', JSON.stringify(newCustomWiki))
    setCreatingNewWiki(false)
    setNewWikiKey('')
  }

  return (
    <div style={{
      padding: '24px',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      backgroundColor: 'var(--bg-primary)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>⚙️ System Settings</h3>
        <button
          onClick={resetToDefaults}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--text-secondary)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Reset to Defaults
        </button>
      </div>

      {/* Tooltip Editor Modal */}
      {editingTooltip && (
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
            padding: '24px',
            borderRadius: '8px',
            width: '80%',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'auto',
            border: '1px solid var(--border-color)'
          }}>
            <TooltipEditor
              category={editingTooltip.category}
              key={editingTooltip.key}
              initialContent={getEffectiveTooltipContent(editingTooltip.category, editingTooltip.key)}
              onSave={(title, content) => saveCustomTooltip(editingTooltip.category, editingTooltip.key, title, content)}
              onCancel={() => setEditingTooltip(null)}
            />
          </div>
        </div>
      )}

      {/* Create New Tooltip Modal */}
      {creatingNewTooltip && (
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
            padding: '24px',
            borderRadius: '8px',
            width: '80%',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'auto',
            border: '1px solid var(--border-color)'
          }}>
            <TooltipEditor
              category={tooltipCategory}
              key={newTooltipKey}
              initialContent={{ title: '', content: '' }}
              onSave={(title, content) => createNewTooltip(tooltipCategory, newTooltipKey, title, content)}
              onCancel={() => {
                setCreatingNewTooltip(false)
                setNewTooltipKey('')
              }}
            />
          </div>
        </div>
      )}

      {/* Wiki Editor Modal */}
      {editingWiki && (
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
            padding: '24px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '1200px',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid var(--border-color)'
          }}>
            <WikiEditor
              wikiKey={editingWiki}
              initialContent={getEffectiveWikiContent(editingWiki)}
              onSave={(title, content) => saveCustomWiki(editingWiki, title, content)}
              onCancel={() => setEditingWiki(null)}
            />
          </div>
        </div>
      )}

      {/* Create New Wiki Modal */}
      {creatingNewWiki && (
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
            padding: '24px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '1200px',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid var(--border-color)'
          }}>
            <WikiEditor
              wikiKey={newWikiKey}
              initialContent={{ title: '', content: '' }}
              onSave={(title, content) => createNewWiki(newWikiKey, title, content)}
              onCancel={() => {
                setCreatingNewWiki(false)
                setNewWikiKey('')
              }}
            />
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: '24px' }}>
        
        {/* Tooltip Settings */}
        <div style={{
          padding: '16px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>💡 Tooltip Configuration</h4>
          
          {/* Tooltip Management */}
          <div style={{ marginBottom: '24px' }}>
            <h5 style={{ margin: '0 0 12px 0', color: 'var(--text-primary)' }}>📝 Tooltip Content Management</h5>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                Category
              </label>
              <select
                value={tooltipCategory}
                onChange={(e) => setTooltipCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="technical">Technical Analysis</option>
                <option value="fundamental">Fundamental Analysis</option>
                <option value="value_investing">Value Investing</option>
                <option value="growth_investing">Growth Investing</option>
              </select>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              marginBottom: '12px',
              alignItems: 'flex-end'
            }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                  New Tooltip Key
                </label>
                <input
                  type="text"
                  value={newTooltipKey}
                  onChange={(e) => setNewTooltipKey(e.target.value)}
                  placeholder="e.g., new_metric, custom_strategy"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              <button
                onClick={() => {
                  if (newTooltipKey.trim()) {
                    setCreatingNewTooltip(true)
                  }
                }}
                disabled={!newTooltipKey.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: !newTooltipKey.trim() ? 'var(--text-muted)' : 'var(--accent-success)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: !newTooltipKey.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  whiteSpace: 'nowrap'
                }}
              >
                Create New Tooltip
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '8px' }}>
              {getAllTooltipKeys(tooltipCategory).map(key => {
                const content = getEffectiveTooltipContent(tooltipCategory, key)
                const isCustom = customTooltips[tooltipCategory]?.[key]
                
                return (
                  <div key={key} style={{
                    padding: '12px',
                    backgroundColor: isCustom ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                    border: `1px solid ${isCustom ? 'var(--border-color)' : 'var(--border-color)'}`,
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)' }}>
                        {content.title || key}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {isCustom ? 'Custom' : 'Default'} • {content.content.substring(0, 100)}...
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                                              <button
                          onClick={() => setEditingTooltip({ category: tooltipCategory, key })}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'var(--accent-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          {isCustom ? 'Edit' : 'Customize'}
                        </button>
                        {isCustom && (
                          <button
                            onClick={() => deleteCustomTooltip(tooltipCategory, key)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: 'var(--accent-danger)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Delete
                          </button>
                        )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Enable Tooltips</label>
              <input
                type="checkbox"
                checked={localSettings.tooltips?.enabled ?? true}
                onChange={(e) => handleSettingChange('tooltips', {
                  ...localSettings.tooltips,
                  enabled: e.target.checked
                })}
                style={{ width: '18px', height: '18px' }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                  Show Delay (ms)
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={localSettings.tooltips?.delay ?? 200}
                  onChange={(e) => handleSettingChange('tooltips', {
                    ...localSettings.tooltips,
                    delay: parseInt(e.target.value)
                  })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              
              <div>
                <label style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                  Max Width (px)
                </label>
                <input
                  type="number"
                  min="200"
                  max="800"
                  value={localSettings.tooltips?.maxWidth ?? 400}
                  onChange={(e) => handleSettingChange('tooltips', {
                    ...localSettings.tooltips,
                    maxWidth: parseInt(e.target.value)
                  })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                  Position
                </label>
                <select
                  value={localSettings.tooltips?.position ?? 'top'}
                  onChange={(e) => handleSettingChange('tooltips', {
                    ...localSettings.tooltips,
                    position: e.target.value
                  })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Show Arrow</label>
                <input
                  type="checkbox"
                  checked={localSettings.tooltips?.showArrow ?? true}
                  onChange={(e) => handleSettingChange('tooltips', {
                    ...localSettings.tooltips,
                    showArrow: e.target.checked
                  })}
                  style={{ width: '18px', height: '18px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Market Data Settings */}
        <div style={{
          padding: '16px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>📊 Market Data Settings</h4>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                Update Interval (ms)
              </label>
              <input
                type="number"
                min="1000"
                max="30000"
                step="1000"
                value={localSettings.marketData?.updateInterval ?? 5000}
                onChange={(e) => handleSettingChange('marketData', {
                  ...localSettings.marketData,
                  updateInterval: parseInt(e.target.value)
                })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Show Volume</label>
                <input
                  type="checkbox"
                  checked={localSettings.marketData?.showVolume ?? true}
                  onChange={(e) => handleSettingChange('marketData', {
                    ...localSettings.marketData,
                    showVolume: e.target.checked
                  })}
                  style={{ width: '18px', height: '18px' }}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Show Bid/Ask</label>
                <input
                  type="checkbox"
                  checked={localSettings.marketData?.showBidAsk ?? true}
                  onChange={(e) => handleSettingChange('marketData', {
                    ...localSettings.marketData,
                    showBidAsk: e.target.checked
                  })}
                  style={{ width: '18px', height: '18px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Trading Settings */}
        <div style={{
          padding: '16px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>💰 Trading Settings</h4>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                Default Order Size
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                value={localSettings.trading?.defaultOrderSize ?? 100}
                onChange={(e) => handleSettingChange('trading', {
                  ...localSettings.trading,
                  defaultOrderSize: parseInt(e.target.value)
                })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Confirm Orders</label>
                <input
                  type="checkbox"
                  checked={localSettings.trading?.confirmOrders ?? true}
                  onChange={(e) => handleSettingChange('trading', {
                    ...localSettings.trading,
                    confirmOrders: e.target.checked
                  })}
                  style={{ width: '18px', height: '18px' }}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Auto Refresh</label>
                <input
                  type="checkbox"
                  checked={localSettings.trading?.autoRefresh ?? true}
                  onChange={(e) => handleSettingChange('trading', {
                    ...localSettings.trading,
                    autoRefresh: e.target.checked
                  })}
                  style={{ width: '18px', height: '18px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Wiki Management */}
        <div style={{
          padding: '16px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>📚 Wiki Content Management</h4>
          
          <div style={{ marginBottom: '24px' }}>
            <h5 style={{ margin: '0 0 12px 0', color: 'var(--text-primary)' }}>📝 Strategy Wiki Editor</h5>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                Wiki Section
              </label>
              <select
                value={wikiSection}
                onChange={(e) => setWikiSection(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="trading_strategies">Trading Strategies</option>
                <option value="risk_management">Risk Management</option>
                <option value="market_analysis">Market Analysis</option>
                <option value="psychology">Trading Psychology</option>
                <option value="advanced_techniques">Advanced Techniques</option>
              </select>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              marginBottom: '12px',
              alignItems: 'flex-end'
            }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                  New Wiki Key
                </label>
                <input
                  type="text"
                  value={newWikiKey}
                  onChange={(e) => setNewWikiKey(e.target.value)}
                  placeholder="e.g., new_strategy, custom_analysis"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              <button
                onClick={() => {
                  if (newWikiKey.trim()) {
                    setCreatingNewWiki(true)
                  }
                }}
                disabled={!newWikiKey.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: !newWikiKey.trim() ? 'var(--text-muted)' : 'var(--accent-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: !newWikiKey.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  whiteSpace: 'nowrap'
                }}
              >
                Create New Wiki
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '8px' }}>
              {getAllWikiKeys().map(key => {
                const content = getEffectiveWikiContent(key)
                const isCustom = customWiki[key]
                
                return (
                  <div key={key} style={{
                    padding: '12px',
                    backgroundColor: isCustom ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                    border: `1px solid ${isCustom ? 'var(--border-color)' : 'var(--border-color)'}`,
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)' }}>
                        {content.title || key}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {isCustom ? 'Custom' : 'Default'} • {content.content.substring(0, 100)}...
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                                              <button
                          onClick={() => setEditingWiki(key)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'var(--accent-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          {isCustom ? 'Edit' : 'Customize'}
                        </button>
                        {isCustom && (
                          <button
                            onClick={() => deleteCustomWiki(key)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: 'var(--accent-danger)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Delete
                          </button>
                        )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div style={{
          padding: '16px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>🎨 Display Settings</h4>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                Theme
              </label>
              <select
                value={localSettings.display?.theme ?? 'light'}
                onChange={(e) => handleSettingChange('display', {
                  ...localSettings.display,
                  theme: e.target.value
                })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Compact Mode</label>
                <input
                  type="checkbox"
                  checked={localSettings.display?.compactMode ?? false}
                  onChange={(e) => handleSettingChange('display', {
                    ...localSettings.display,
                    compactMode: e.target.checked
                  })}
                  style={{ width: '18px', height: '18px' }}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Show Animations</label>
                <input
                  type="checkbox"
                  checked={localSettings.display?.showAnimations ?? true}
                  onChange={(e) => handleSettingChange('display', {
                    ...localSettings.display,
                    showAnimations: e.target.checked
                  })}
                  style={{ width: '18px', height: '18px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
