import React, { useState, useEffect } from 'react'

// Markdown-like rendering for tooltips
const renderMarkdown = (text) => {
  if (!text) return ''
  
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background: #f1f5f9; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>')
    .replace(/\n/g, '<br>')
    .replace(/^### (.*$)/gim, '<h3 style="margin: 8px 0 4px 0; font-size: 14px; color: #1e40af;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="margin: 12px 0 6px 0; font-size: 16px; color: #1e293b;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="margin: 16px 0 8px 0; font-size: 18px; color: #0f172a;">$1</h1>')
    .replace(/^- (.*$)/gim, '<li style="margin: 2px 0;">$1</li>')
    .replace(/(<li.*<\/li>)/g, '<ul style="margin: 4px 0; padding-left: 16px;">$1</ul>')
}

const AdvancedTooltip = ({ 
  content, 
  children, 
  position = 'top', 
  delay = 200,
  maxWidth = 400,
  showArrow = true,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [timeoutId, setTimeoutId] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  const showTooltip = (e) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    const rect = e.currentTarget.getBoundingClientRect()
    const tooltipWidth = Math.min(maxWidth, 400)
    const tooltipHeight = 200 // Approximate height
    
    let x = rect.left + (rect.width / 2) - (tooltipWidth / 2)
    let y = 0
    
    switch (position) {
      case 'top':
        y = rect.top - tooltipHeight - 10
        break
      case 'bottom':
        y = rect.bottom + 10
        break
      case 'left':
        x = rect.left - tooltipWidth - 10
        y = rect.top + (rect.height / 2) - (tooltipHeight / 2)
        break
      case 'right':
        x = rect.right + 10
        y = rect.top + (rect.height / 2) - (tooltipHeight / 2)
        break
      default:
        y = rect.top - tooltipHeight - 10
    }
    
    // Ensure tooltip stays within viewport
    x = Math.max(10, Math.min(x, window.innerWidth - tooltipWidth - 10))
    y = Math.max(10, Math.min(y, window.innerHeight - tooltipHeight - 10))
    
    setTooltipPosition({ x, y })
    
    const id = setTimeout(() => setIsVisible(true), delay)
    setTimeoutId(id)
  }

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [timeoutId])

  return (
    <div 
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      className={className}
    >
      {children}
      
      {isVisible && (
        <div
          style={{
            position: 'fixed',
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            zIndex: 1000,
            maxWidth: maxWidth,
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            padding: '12px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            fontSize: '13px',
            lineHeight: '1.4',
            border: '1px solid #334155',
            pointerEvents: 'none'
          }}
        >
          {showArrow && (
            <div
              style={{
                position: 'absolute',
                width: 0,
                height: 0,
                border: '6px solid transparent',
                [position === 'top' ? 'top' : position === 'bottom' ? 'bottom' : position === 'left' ? 'left' : 'right']: '100%',
                [position === 'top' ? 'borderTopColor' : position === 'bottom' ? 'borderBottomColor' : position === 'left' ? 'borderLeftColor' : 'borderRightColor']: '#1e293b',
                transform: position === 'top' || position === 'bottom' ? 'translateX(-50%)' : 'translateY(-50%)',
                left: position === 'left' || position === 'right' ? 'auto' : '50%',
                top: position === 'top' || position === 'bottom' ? 'auto' : '50%'
              }}
            />
          )}
          
          <div 
            dangerouslySetInnerHTML={{ 
              __html: renderMarkdown(content) 
            }}
            style={{
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }}
          />
        </div>
      )}
    </div>
  )
}

export default AdvancedTooltip
