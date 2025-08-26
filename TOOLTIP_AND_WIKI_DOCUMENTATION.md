# Tooltip and Wiki Management Documentation

## Table of Contents
1. [Tooltip Management System](#tooltip-management-system)
2. [Wiki Management System](#wiki-management-system)
3. [System Architecture](#system-architecture)
4. [Usage Examples](#usage-examples)
5. [Configuration Guide](#configuration-guide)
6. [Troubleshooting](#troubleshooting)

---

## Tooltip Management System

### Overview
The tooltip management system provides educational popups throughout the trading application, particularly in the Learning tab. It supports markdown formatting, real-time editing, and category-based organization.

### Key Components

#### 1. AdvancedTooltip Component (`ui/src/components/AdvancedTooltip.jsx`)
- **Purpose**: Renders configurable tooltips with markdown support
- **Features**:
  - Markdown rendering for rich content
  - Icon-based trigger system
  - Modal popup display
  - Responsive design
  - Category-based styling

#### 2. TooltipEditor Component (`ui/src/components/TooltipEditor.jsx`)
- **Purpose**: Provides interface for creating and editing tooltip content
- **Features**:
  - Live markdown preview
  - Category selection (fundamental, technical)
  - Content validation
  - Template insertion
  - Real-time saving

#### 3. Tooltip Content Database (`ui/src/data/tooltipContent.js`)
- **Purpose**: Centralizes all tooltip content with markdown formatting
- **Categories**:
  - `fundamental`: P/E Ratio, P/B Ratio, Market Cap, etc.
  - `technical`: RSI, MACD, Bollinger Bands, etc.

### Tooltip Categories

#### Fundamental Analysis Tooltips
- **P/E Ratio**: Price-to-Earnings ratio explanation
- **P/B Ratio**: Price-to-Book ratio analysis
- **Market Cap**: Market capitalization significance
- **Debt-to-Equity**: Financial leverage metrics
- **Current Ratio**: Liquidity assessment
- **ROE/ROA**: Return on equity and assets
- **Revenue Growth**: Growth rate analysis
- **EPS**: Earnings per share importance
- **Profit Margin**: Profitability metrics

#### Technical Analysis Tooltips
- **RSI**: Relative Strength Index interpretation
- **MACD**: Moving Average Convergence Divergence
- **Bollinger Bands**: Volatility and trend analysis
- **Moving Averages**: Trend identification
- **Volume Analysis**: Volume-price relationships
- **Support & Resistance**: Key price levels
- **Chart Patterns**: Pattern recognition
- **Fibonacci Retracements**: Retracement levels

### Usage

#### Adding Tooltips to Components
```jsx
import AdvancedTooltip from './components/AdvancedTooltip'

// Wrap any element with tooltip
<AdvancedTooltip 
  category="fundamental" 
  tooltipKey="pe_ratio"
  enabled={settings.tooltips?.enabled}
>
  <div className="card">
    <h3>P/E Ratio</h3>
    <p>Content...</p>
  </div>
</AdvancedTooltip>
```

#### Creating Custom Tooltips
1. Navigate to Settings tab
2. Go to "Tooltip Management" section
3. Select category (fundamental/technical)
4. Enter tooltip key (e.g., "custom_analysis")
5. Write markdown content
6. Save to persist in localStorage

---

## Wiki Management System

### Overview
The wiki management system provides comprehensive trading education content with real-time editing capabilities. It supports rich markdown formatting, multiple sections, and persistent storage.

### Key Components

#### 1. WikiEditor Component (`ui/src/components/WikiEditor.jsx`)
- **Purpose**: Full-featured wiki content editor
- **Features**:
  - Multi-tab interface (Edit, Preview, Help)
  - Rich markdown rendering
  - Quick templates for common content
  - Live preview mode
  - Markdown help guide

#### 2. Wiki Content Database (`ui/src/data/wikiContent.js`)
- **Purpose**: Default wiki content and management functions
- **Sections**:
  - Trading Strategies
  - Risk Management
  - Market Analysis
  - Trading Psychology
  - Advanced Techniques

#### 3. Helper Functions
- `getWikiContent(key)`: Retrieves content (custom or default)
- `getAllWikiKeys()`: Lists all available wiki sections
- `hasWiki(key)`: Checks if wiki section exists

### Wiki Sections

#### 1. Trading Strategies
- **Content**: Swing Trading, Day Trading, Position Trading, Scalping, Options Trading
- **Key Topics**:
  - Strategy selection criteria
  - Implementation guidelines
  - Risk considerations
  - Performance metrics

#### 2. Risk Management
- **Content**: Position Sizing, Stop Loss Strategy, Portfolio Risk Management
- **Key Topics**:
  - Risk calculation methods
  - Stop loss placement
  - Portfolio diversification
  - Risk metrics tracking

#### 3. Market Analysis
- **Content**: Technical Analysis, Fundamental Analysis, Sentiment Analysis
- **Key Topics**:
  - Analysis frameworks
  - Data interpretation
  - Market timing
  - Sector analysis

#### 4. Trading Psychology
- **Content**: Emotional Control, Mental Framework, Discipline
- **Key Topics**:
  - Psychology principles
  - Stress management
  - Confidence building
  - Performance psychology

#### 5. Advanced Techniques
- **Content**: Options Strategies, Algorithmic Trading, Quantitative Analysis
- **Key Topics**:
  - Advanced strategies
  - Technology integration
  - Risk arbitrage
  - High-frequency trading

### Usage

#### Accessing Wiki Content
```jsx
import { getWikiContent } from '../data/wikiContent'

// Get content for specific section
const content = getWikiContent('trading_strategies')
```

#### Editing Wiki Content
1. Navigate to Settings tab
2. Go to "Wiki Content Management" section
3. Select wiki section from dropdown
4. Click "Edit" button
5. Use WikiEditor interface
6. Save changes

#### Creating New Wiki Sections
1. In Settings → Wiki Content Management
2. Enter new wiki key (e.g., "crypto_trading")
3. Click "Create New Wiki"
4. Use WikiEditor to add content
5. Save to persist in localStorage

---

## System Architecture

### Data Flow
```
User Interface → Settings Component → TooltipEditor/WikiEditor → localStorage → Content Database
```

### Storage Structure
```javascript
// Tooltip storage
localStorage.setItem('customTooltips', JSON.stringify({
  fundamental: { custom_key: { content: "..." } },
  technical: { custom_key: { content: "..." } }
}))

// Wiki storage
localStorage.setItem('customWiki', JSON.stringify({
  custom_section: { title: "...", content: "..." }
}))
```

### Component Integration
- **Settings.jsx**: Central management interface
- **App.jsx**: Content rendering and tooltip integration
- **Learning Tab**: Primary display area for both systems

---

## Usage Examples

### Example 1: Adding Tooltip to New Component
```jsx
// In your component
import AdvancedTooltip from './components/AdvancedTooltip'

function MyComponent({ settings }) {
  return (
    <AdvancedTooltip 
      category="technical" 
      tooltipKey="volume_analysis"
      enabled={settings.tooltips?.enabled}
    >
      <div className="volume-card">
        <h3>Volume Analysis</h3>
        <p>Volume data here...</p>
      </div>
    </AdvancedTooltip>
  )
}
```

### Example 2: Creating Custom Tooltip
```javascript
// Via Settings interface
// Category: technical
// Key: custom_volume_pattern
// Content: 
// # Volume Pattern Analysis
// 
// **Key Concepts:**
// - Volume confirmation
// - Divergence patterns
// - Breakout validation
```

### Example 3: Editing Wiki Content
```javascript
// Via Settings interface
// Section: trading_strategies
// Add content:
// ## New Strategy: Momentum Breakout
// 
// **Setup Criteria:**
// - Strong volume on breakout
// - Clear resistance level
// - Positive market sentiment
// 
// **Risk Management:**
// - Stop loss below breakout level
// - Position size: 2% risk per trade
```

---

## Configuration Guide

### Tooltip Settings
```javascript
// In Settings component
const tooltipSettings = {
  enabled: true,           // Enable/disable all tooltips
  categories: {            // Category-specific settings
    fundamental: true,
    technical: true
  },
  displayMode: 'modal',    // Display mode (modal/popover)
  autoHide: 5000          // Auto-hide delay (ms)
}
```

### Wiki Settings
```javascript
// In Settings component
const wikiSettings = {
  defaultSection: 'trading_strategies',
  autoSave: true,         // Auto-save changes
  previewMode: 'live',    // Preview mode (live/separate)
  markdownExtensions: ['tables', 'links', 'code']
}
```

### System Integration
```javascript
// In App.jsx
const [settings, setSettings] = useState(() => {
  const saved = localStorage.getItem('appSettings')
  return saved ? JSON.parse(saved) : {
    tooltips: { enabled: true },
    wiki: { autoSave: true }
  }
})
```

---

## Troubleshooting

### Common Issues

#### 1. Tooltips Not Displaying
**Symptoms**: Tooltip icons visible but no popup
**Solutions**:
- Check `settings.tooltips?.enabled` is true
- Verify tooltip key exists in content database
- Check browser console for JavaScript errors
- Clear localStorage and recreate tooltips

#### 2. Wiki Content Not Saving
**Symptoms**: Changes lost after page refresh
**Solutions**:
- Verify localStorage is enabled
- Check for JavaScript errors in console
- Ensure proper JSON formatting
- Verify save function is called

#### 3. Markdown Not Rendering
**Symptoms**: Raw markdown displayed instead of formatted text
**Solutions**:
- Check markdown syntax
- Verify renderMarkdown function is imported
- Check for HTML sanitization issues
- Test with simple markdown first

#### 4. Performance Issues
**Symptoms**: Slow rendering or lag
**Solutions**:
- Reduce tooltip content size
- Implement lazy loading for wiki sections
- Optimize markdown rendering
- Use debouncing for real-time updates

### Debug Commands
```javascript
// Check tooltip content
console.log(JSON.parse(localStorage.getItem('customTooltips')))

// Check wiki content
console.log(JSON.parse(localStorage.getItem('customWiki')))

// Check settings
console.log(JSON.parse(localStorage.getItem('appSettings')))

// Clear all custom content
localStorage.removeItem('customTooltips')
localStorage.removeItem('customWiki')
```

### Best Practices

#### Tooltip Management
1. Keep tooltip content concise and focused
2. Use consistent markdown formatting
3. Organize content by logical categories
4. Test tooltips across different screen sizes
5. Provide fallback content for missing tooltips

#### Wiki Management
1. Use clear, descriptive section names
2. Structure content with proper headers
3. Include practical examples and code snippets
4. Add links to external resources
5. Regular backup of custom content
6. Version control for major content changes

#### Content Creation
1. Write for target audience (beginner to advanced)
2. Include risk warnings where appropriate
3. Use consistent terminology
4. Provide actionable insights
5. Update content regularly

---

## API Reference

### Tooltip Functions
```javascript
// Get tooltip content
getTooltipContent(category, key)

// Save custom tooltip
saveCustomTooltip(category, key, content)

// Delete custom tooltip
deleteCustomTooltip(category, key)

// Get all tooltip categories
getTooltipCategories()
```

### Wiki Functions
```javascript
// Get wiki content
getWikiContent(key)

// Save custom wiki
saveCustomWiki(key, title, content)

// Delete custom wiki
deleteCustomWiki(key)

// Get all wiki keys
getAllWikiKeys()

// Check if wiki exists
hasWiki(key)
```

### Settings Functions
```javascript
// Update tooltip settings
updateTooltipSettings(settings)

// Update wiki settings
updateWikiSettings(settings)

// Reset to defaults
resetToDefaults()

// Export settings
exportSettings()

// Import settings
importSettings(data)
```

---

## Future Enhancements

### Planned Features
1. **Advanced Search**: Search across all tooltip and wiki content
2. **Content Versioning**: Track changes and rollback capability
3. **Collaborative Editing**: Multi-user content creation
4. **Content Analytics**: Track most viewed/used content
5. **Export/Import**: Backup and restore functionality
6. **Rich Media**: Support for images, videos, and interactive content
7. **Content Templates**: Pre-built templates for common topics
8. **Accessibility**: Screen reader support and keyboard navigation

### Integration Opportunities
1. **Quiz System**: Link tooltips to quiz questions
2. **Trade Journal**: Reference tooltips in trade analysis
3. **Portfolio Analysis**: Contextual tooltips for portfolio metrics
4. **Market Data**: Real-time tooltips for market events
5. **Social Features**: Share and rate content

---

*This documentation covers the complete tooltip and wiki management systems implemented in the trading application. For technical support or feature requests, refer to the development team.*


