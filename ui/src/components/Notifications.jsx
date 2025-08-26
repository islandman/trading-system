import React, { useState, useEffect } from 'react'
import notificationService from '../services/NotificationService'

function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Connect to notification service
    notificationService.connect()

    // Listen for new notifications
    const handleNotification = (notification) => {
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
    }

    notificationService.onNotification(handleNotification)

    // Load existing notifications
    setNotifications(notificationService.getNotifications())

    return () => {
      notificationService.disconnect()
    }
  }, [])

  const markAsRead = (notificationId) => {
    notificationService.markAsRead(notificationId)
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const clearAll = () => {
    notificationService.clearAll()
    setNotifications([])
    setUnreadCount(0)
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-blue-600'
      case 'high': return 'text-orange-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'low': return 'ℹ️'
      case 'medium': return '📢'
      case 'high': return '⚠️'
      case 'critical': return '🚨'
      default: return '📋'
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="absolute right-0 top-12 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex gap-2">
              <button
                onClick={clearAll}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div
                  key={notification.id || index}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">
                      {getSeverityIcon(notification.severity)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-medium ${getSeverityColor(notification.severity)}`}>
                          {notification.title || 'Notification'}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message || notification.body || ''}
                      </p>
                      {notification.payload && (
                        <div className="mt-2 text-xs text-gray-500">
                          {notification.payload.symbol && (
                            <span className="mr-2">Symbol: {notification.payload.symbol}</span>
                          )}
                          {notification.payload.order_id && (
                            <span className="mr-2">Order: {notification.payload.order_id.slice(0, 8)}...</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Notification Container for Toasts */}
      <div id="notification-container"></div>
    </div>
  )
}

export default Notifications
