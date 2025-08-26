# Notification System

A standalone, decoupled notification system for trading applications and other systems. Supports multiple channels (browser, email, SMS, voice, mobile push) with configurable routing and delivery guarantees.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Producer      │    │   Event Bus     │    │  Orchestrator   │
│   Services      │───▶│   (Redis/Kafka) │───▶│   (Rules Engine)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Channel       │    │   Delivery      │    │   WebSocket     │
│   Workers       │◀───│   Queue         │◀───│   Hub           │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Features

- **Multi-Channel Support**: Browser (WebSocket), Email, SMS, Voice, Mobile Push
- **Event-Driven Architecture**: Decoupled from producer services
- **Configurable Routing**: Rules-based notification routing
- **Delivery Guarantees**: At-least-once delivery with idempotency
- **User Preferences**: Channel preferences, quiet hours, severity filters
- **Compliance Ready**: TCPA, CAN-SPAM, GDPR support
- **Scalable**: Horizontal scaling with Redis/Kafka
- **Observable**: Comprehensive metrics and monitoring

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Redis (for event bus and caching)
- PostgreSQL (for persistence)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd notification-system
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the system:
```bash
docker-compose up -d
```

4. Verify the system is running:
```bash
curl http://localhost:8003/health
```

## API Documentation

### Core Endpoints

#### Publish Event
```http
POST /v1/events
Content-Type: application/json

{
  "event_id": "uuid",
  "type": "ORDER_FILLED",
  "producer": "trading-system",
  "payload": {
    "user_id": "user123",
    "order_id": "order456",
    "symbol": "AAPL",
    "quantity": 100,
    "price": 150.25
  },
  "severity": "medium",
  "dedupe_key": "order456"
}
```

#### Get User Notifications
```http
GET /v1/notifications?cursor=123&limit=20
Authorization: Bearer <jwt-token>
```

#### Mark Notification as Read
```http
POST /v1/notifications/ack
Content-Type: application/json

{
  "notification_id": "uuid"
}
```

#### WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:8003/v1/ws?token=<jwt-token>');
ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  // Handle notification
};
```

#### User Preferences
```http
GET /v1/prefs
POST /v1/prefs
```

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost/notifications

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key

# Email Provider (SendGrid)
SENDGRID_API_KEY=your-api-key

# SMS Provider (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token

# Voice Provider (Twilio)
TWILIO_VOICE_PHONE_NUMBER=+1234567890

# Push Notifications
FCM_SERVER_KEY=your-fcm-key
APNS_KEY_ID=your-apns-key-id
APNS_TEAM_ID=your-team-id
```

### Rules Configuration

Rules are defined in YAML format:

```yaml
rules:
  - name: "Order Filled"
    event_type: "ORDER_FILLED"
    conditions:
      - field: "severity"
        operator: "gte"
        value: "low"
    actions:
      - type: "notify"
        channels: ["inapp", "email"]
        template: "order.filled"
        priority: "normal"

  - name: "Margin Call"
    event_type: "MARGIN_CALL"
    conditions:
      - field: "severity"
        operator: "eq"
        value: "critical"
    actions:
      - type: "notify"
        channels: ["inapp", "sms", "voice", "email"]
        template: "risk.margin_call"
        priority: "high"
        bypass_quiet_hours: true
```

## Integration Guide

### Producer Service Integration

1. **Install the client library**:
```bash
pip install notification-client
```

2. **Initialize the client**:
```python
from notification_client import NotificationClient

client = NotificationClient(
    base_url="http://localhost:8003",
    api_key="your-api-key"
)
```

3. **Publish events**:
```python
# Order filled event
await client.publish_event(
    event_type="ORDER_FILLED",
    producer="trading-system",
    payload={
        "user_id": "user123",
        "order_id": "order456",
        "symbol": "AAPL",
        "quantity": 100,
        "price": 150.25
    },
    severity="medium",
    dedupe_key="order456"
)

# Margin call event
await client.publish_event(
    event_type="MARGIN_CALL",
    producer="risk-system",
    payload={
        "user_id": "user123",
        "account_id": "acc789",
        "shortfall": 5000.00,
        "deadline": "2024-01-15T10:00:00Z"
    },
    severity="critical",
    dedupe_key="margin_call_user123_20240115"
)
```

### Frontend Integration

1. **WebSocket Connection**:
```javascript
class NotificationService {
  constructor(token) {
    this.token = token;
    this.ws = null;
    this.listeners = [];
  }

  connect() {
    this.ws = new WebSocket(`ws://localhost:8003/v1/ws?token=${this.token}`);
    
    this.ws.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      this.listeners.forEach(listener => listener(notification));
    };

    this.ws.onclose = () => {
      // Reconnect after delay
      setTimeout(() => this.connect(), 5000);
    };
  }

  onNotification(callback) {
    this.listeners.push(callback);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Usage
const notificationService = new NotificationService(jwtToken);
notificationService.connect();

notificationService.onNotification((notification) => {
  // Show toast notification
  showToast(notification.title, notification.message);
  
  // Update notification count
  updateNotificationCount();
});
```

2. **Service Worker for Push Notifications**:
```javascript
// service-worker.js
self.addEventListener('push', (event) => {
  const notification = event.data.json();
  
  event.waitUntil(
    self.registration.showNotification(notification.title, {
      body: notification.message,
      icon: '/icon.png',
      badge: '/badge.png',
      data: notification.data
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
```

## Monitoring and Observability

### Metrics

The system exposes Prometheus metrics:

```bash
curl http://localhost:8003/metrics
```

Key metrics:
- `notifications_emitted_total`
- `notifications_delivered_total`
- `notifications_failed_total`
- `delivery_latency_seconds`
- `queue_depth`

### Health Checks

```bash
# Overall health
curl http://localhost:8003/health

# Detailed health
curl http://localhost:8003/health/detailed
```

### Dead Letter Queue

Failed notifications are sent to DLQ for investigation:

```bash
# List DLQ items
curl http://localhost:8003/admin/dlq

# Replay DLQ item
curl -X POST http://localhost:8003/admin/dlq/replay \
  -H "Content-Type: application/json" \
  -d '{"job_id": "uuid"}'
```

## Development

### Local Development Setup

1. **Install dependencies**:
```bash
pip install -r requirements.txt
```

2. **Set up database**:
```bash
alembic upgrade head
```

3. **Run tests**:
```bash
pytest
```

4. **Start development server**:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8003
```

### Adding New Channels

1. **Create channel adapter**:
```python
# app/channels/slack.py
from app.channels.base import ChannelAdapter, SendResult

class SlackAdapter(ChannelAdapter):
    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url

    async def send(self, job: ChannelJob, rendered: TemplateOutput) -> SendResult:
        # Implementation
        pass
```

2. **Register the adapter**:
```python
# app/channels/__init__.py
from .slack import SlackAdapter

CHANNEL_ADAPTERS = {
    "slack": SlackAdapter,
    # ... other adapters
}
```

3. **Add configuration**:
```yaml
# config/channels.yaml
slack:
  webhook_url: "https://hooks.slack.com/services/..."
  rate_limit: 100  # per minute
```

## Deployment

### Docker Deployment

```bash
# Build image
docker build -t notification-system .

# Run container
docker run -d \
  --name notification-system \
  -p 8003:8003 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  notification-system
```

### Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notification-system
spec:
  replicas: 3
  selector:
    matchLabels:
      app: notification-system
  template:
    metadata:
      labels:
        app: notification-system
    spec:
      containers:
      - name: notification-system
        image: notification-system:latest
        ports:
        - containerPort: 8003
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: notification-secrets
              key: database-url
```

## Security

### Authentication

- JWT tokens for API access
- WebSocket authentication via token parameter
- API key authentication for service-to-service communication

### Data Protection

- PII encryption at rest
- TLS for all communications
- Rate limiting per user and per event type
- Audit logging for all operations

### Compliance

- TCPA compliance for SMS/voice
- CAN-SPAM compliance for email
- GDPR/CCPA support for data export/deletion
- Opt-in/opt-out endpoints

## Troubleshooting

### Common Issues

1. **WebSocket Connection Fails**
   - Check JWT token validity
   - Verify CORS configuration
   - Check network connectivity

2. **Notifications Not Delivered**
   - Check user preferences
   - Verify channel configuration
   - Check provider credentials
   - Review DLQ for failed deliveries

3. **High Latency**
   - Monitor queue depth
   - Check Redis performance
   - Review worker concurrency settings

### Logs

```bash
# View application logs
docker logs notification-system

# View worker logs
docker logs notification-worker

# View orchestrator logs
docker logs notification-orchestrator
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
