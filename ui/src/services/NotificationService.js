class NotificationService {
  constructor() {
    this.ws = null;
    this.listeners = [];
    this.notifications = [];
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(token = 'default-token') {
    try {
      this.ws = new WebSocket(`ws://localhost:8003/v1/ws?token=${token}`);
      
      this.ws.onopen = () => {
        console.log('🔗 Connected to notification system');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          this.handleNotification(notification);
        } catch (error) {
          console.error('Failed to parse notification:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('🔌 Disconnected from notification system');
        this.isConnected = false;
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect to notification system:', error);
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  handleNotification(notification) {
    // Add timestamp if not present
    if (!notification.timestamp) {
      notification.timestamp = new Date().toISOString();
    }

    // Add to notifications list
    this.notifications.unshift(notification);
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });

    // Show toast notification
    this.showToast(notification);
  }

  showToast(notification) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `notification-toast notification-${notification.severity || 'medium'}`;
    toast.innerHTML = `
      <div class="toast-header">
        <strong>${notification.title || 'Notification'}</strong>
        <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="toast-body">
        ${notification.message || notification.body || ''}
      </div>
    `;

    // Add to page
    const container = document.getElementById('notification-container') || document.body;
    container.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);
  }

  onNotification(callback) {
    this.listeners.push(callback);
  }

  getNotifications(limit = 50) {
    return this.notifications.slice(0, limit);
  }

  markAsRead(notificationId) {
    // Mark notification as read
    fetch(`http://localhost:8003/v1/notifications/ack`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notification_id: notificationId })
    }).catch(error => {
      console.error('Failed to mark notification as read:', error);
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }

  // Get notification count
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  // Clear all notifications
  clearAll() {
    this.notifications = [];
  }
}

// Create global instance
window.notificationService = new NotificationService();

// Add CSS for toast notifications
const style = document.createElement('style');
style.textContent = `
  .notification-toast {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 350px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  }

  .notification-toast.notification-low {
    border-left: 4px solid #10b981;
  }

  .notification-toast.notification-medium {
    border-left: 4px solid #3b82f6;
  }

  .notification-toast.notification-high {
    border-left: 4px solid #f59e0b;
  }

  .notification-toast.notification-critical {
    border-left: 4px solid #ef4444;
  }

  .toast-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #eee;
  }

  .toast-close {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #666;
  }

  .toast-close:hover {
    color: #000;
  }

  .toast-body {
    padding: 12px 16px;
    font-size: 14px;
    line-height: 1.4;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  #notification-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
  }
`;
document.head.appendChild(style);

export default window.notificationService;
