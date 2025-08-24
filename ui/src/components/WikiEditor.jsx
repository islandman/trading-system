import React, { useState, useEffect } from 'react'

const WikiEditor = ({ wikiKey, initialContent, onSave, onCancel }) => {
  const [title, setTitle] = useState(initialContent.title || '')
  const [content, setContent] = useState(initialContent.content || '')
  const [previewMode, setPreviewMode] = useState(false)
  const [activeTab, setActiveTab] = useState('edit') // edit, preview, help

  useEffect(() => {
    setTitle(initialContent.title || '')
    setContent(initialContent.content || '')
  }, [initialContent])

  // Enhanced markdown rendering for wiki content
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

  const handleSave = () => {
    if (title.trim() && content.trim()) {
      onSave(title.trim(), content.trim())
    }
  }

  const insertTemplate = (template) => {
    setContent(prev => prev + '\n\n' + template)
  }

  const getWikiKeyDisplayName = (key) => {
    const names = {
      trading_strategies: 'Trading Strategies',
      risk_management: 'Risk Management',
      market_analysis: 'Market Analysis',
      psychology: 'Trading Psychology',
      advanced_techniques: 'Advanced Techniques'
    }
    return names[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: 0 }}>📝 Wiki Editor</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('edit')}
            style={{
              padding: '8px 16px',
              backgroundColor: activeTab === 'edit' ? '#3b82f6' : '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Edit
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            style={{
              padding: '8px 16px',
              backgroundColor: activeTab === 'preview' ? '#10b981' : '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab('help')}
            style={{
              padding: '8px 16px',
              backgroundColor: activeTab === 'help' ? '#f59e0b' : '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Help
          </button>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !content.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: (!title.trim() || !content.trim()) ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (!title.trim() || !content.trim()) ? 'not-allowed' : 'pointer',
              fontSize: '12px'
            }}
          >
            Save
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
          Wiki Section: {getWikiKeyDisplayName(wikiKey)}
        </div>
      </div>

      {activeTab === 'edit' && (
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '14px', color: '#374151', display: 'block', marginBottom: '4px' }}>
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter wiki page title..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '14px', color: '#374151', display: 'block', marginBottom: '4px' }}>
              Content * (Markdown supported)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter wiki content... Use markdown formatting for rich content"
              rows={20}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'monospace',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#374151' }}>🚀 Quick Templates</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
              <button
                onClick={() => insertTemplate(`## Strategy Overview

**Key Points:**
- Point 1
- Point 2
- Point 3

**Implementation:**
1. Step 1
2. Step 2
3. Step 3

**Risk Considerations:**
- Risk factor 1
- Risk factor 2`)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#eff6ff',
                  color: '#1e40af',
                  border: '1px solid #bfdbfe',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textAlign: 'left'
                }}
              >
                Strategy Template
              </button>
              <button
                onClick={() => insertTemplate(`## Risk Management Rules

**Position Sizing:**
- Never risk more than 1-2% per trade
- Calculate position size based on stop loss

**Stop Loss Strategy:**
- Set stops at logical support/resistance
- Use trailing stops for winners

**Exit Rules:**
- Take profits at predetermined levels
- Exit if thesis changes`)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#f0fdf4',
                  color: '#166534',
                  border: '1px solid #bbf7d0',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textAlign: 'left'
                }}
              >
                Risk Management
              </button>
              <button
                onClick={() => insertTemplate(`## Market Analysis Framework

**Technical Analysis:**
- Chart patterns
- Key indicators
- Support/resistance levels

**Fundamental Analysis:**
- Company financials
- Industry trends
- Economic factors

**Sentiment Analysis:**
- Market mood
- News impact
- Social sentiment`)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  border: '1px solid #fde68a',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textAlign: 'left'
                }}
              >
                Analysis Framework
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'preview' && (
        <div style={{
          padding: '24px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          minHeight: '400px'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#1e293b', borderBottom: '2px solid #3b82f6', paddingBottom: '8px' }}>
            {title || 'Preview Title'}
          </h2>
          <div 
            dangerouslySetInnerHTML={{ 
              __html: renderMarkdown(content || 'Preview content will appear here...') 
            }}
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }}
          />
        </div>
      )}

      {activeTab === 'help' && (
        <div style={{
          padding: '20px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1e293b' }}>📖 Wiki Markdown Guide</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            <div>
              <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151' }}>Text Formatting</h5>
              <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
                <div><strong>**bold text**</strong> - Bold formatting</div>
                <div><em>*italic text*</em> - Italic formatting</div>
                <div><code>`code`</code> - Inline code</div>
                <div><code>```code block```</code> - Code blocks</div>
              </div>
            </div>
            <div>
              <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151' }}>Headers</h5>
              <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
                <div><strong># Main Header</strong> - Large header</div>
                <div><strong>## Subheader</strong> - Medium header</div>
                <div><strong>### Section</strong> - Small header</div>
              </div>
            </div>
            <div>
              <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151' }}>Lists</h5>
              <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
                <div><strong>- List item</strong> - Bullet list</div>
                <div><strong>1. Numbered item</strong> - Numbered list</div>
                <div><strong>> Quote</strong> - Blockquote</div>
              </div>
            </div>
            <div>
              <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151' }}>Links & Structure</h5>
              <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
                <div><strong>[text](url)</strong> - External links</div>
                <div><strong>Empty line</strong> - New paragraph</div>
                <div><strong>| Table |</strong> - Basic tables</div>
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
            <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#1e40af' }}>💡 Pro Tips</h5>
            <div style={{ fontSize: '12px', color: '#1e40af', lineHeight: '1.4' }}>
              <div>• Use headers to organize content hierarchically</div>
              <div>• Include practical examples and code snippets</div>
              <div>• Add links to external resources for deeper learning</div>
              <div>• Use bullet points for easy scanning</div>
              <div>• Include risk warnings and disclaimers where appropriate</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WikiEditor
