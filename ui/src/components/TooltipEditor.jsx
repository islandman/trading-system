import React, { useState, useEffect } from 'react'

const TooltipEditor = ({ category, key, initialContent, onSave, onCancel }) => {
  const [title, setTitle] = useState(initialContent.title || '')
  const [content, setContent] = useState(initialContent.content || '')
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    setTitle(initialContent.title || '')
    setContent(initialContent.content || '')
  }, [initialContent])

  // Markdown-like rendering for preview
  const renderMarkdown = (text) => {
    if (!text) return ''
    
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background: var(--bg-tertiary); padding: 2px 4px; border-radius: 3px; font-family: monospace; color: var(--text-primary);">$1</code>')
      .replace(/\n/g, '<br>')
      .replace(/^### (.*$)/gim, '<h3 style="margin: 8px 0 4px 0; font-size: 14px; color: var(--accent-primary);">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="margin: 12px 0 6px 0; font-size: 16px; color: var(--text-primary);">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="margin: 16px 0 8px 0; font-size: 18px; color: var(--text-primary);">$1</h1>')
      .replace(/^- (.*$)/gim, '<li style="margin: 2px 0; color: var(--text-primary);">$1</li>')
      .replace(/(<li.*<\/li>)/g, '<ul style="margin: 4px 0; padding-left: 16px;">$1</ul>')
  }

  const handleSave = () => {
    if (title.trim() && content.trim()) {
      onSave(title.trim(), content.trim())
    }
  }

  const getCategoryDisplayName = (cat) => {
    const names = {
      technical: 'Technical Analysis',
      fundamental: 'Fundamental Analysis',
      value_investing: 'Value Investing',
      growth_investing: 'Growth Investing'
    }
    return names[cat] || cat
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>📝 Edit Tooltip</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            style={{
              padding: '8px 16px',
              backgroundColor: previewMode ? 'var(--accent-success)' : 'var(--text-secondary)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {previewMode ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={onCancel}
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
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !content.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: (!title.trim() || !content.trim()) ? 'var(--text-muted)' : 'var(--accent-success)',
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
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
          Category: {getCategoryDisplayName(category)} • Key: {key}
        </div>
      </div>

      {!previewMode ? (
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter tooltip title..."
              style={{
                width: '100%',
                padding: '12px',
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
              Content * (Markdown supported)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter tooltip content... Use **bold**, *italic*, `code`, # headers, - lists"
              rows={15}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'monospace',
                resize: 'vertical',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div style={{
            padding: '12px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '4px',
            border: '1px solid var(--border-color)'
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-primary)' }}>📖 Markdown Guide</h4>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              <div><strong>**bold text**</strong> - Bold formatting</div>
              <div><em>*italic text*</em> - Italic formatting</div>
              <div><code>`code`</code> - Inline code</div>
              <div><strong># Header</strong> - Main header</div>
              <div><strong>## Subheader</strong> - Subheader</div>
              <div><strong>### Section</strong> - Section header</div>
              <div><strong>- List item</strong> - Bullet list</div>
              <div><strong>Line break</strong> - Use empty line for paragraphs</div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          padding: '16px',
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-primary)' }}>{title || 'Preview Title'}</h4>
          <div 
            dangerouslySetInnerHTML={{ 
              __html: renderMarkdown(content || 'Preview content will appear here...') 
            }}
            style={{
              fontSize: '13px',
              lineHeight: '1.4',
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }}
          />
        </div>
      )}
    </div>
  )
}

export default TooltipEditor
