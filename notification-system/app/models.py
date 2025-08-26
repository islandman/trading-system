import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from sqlalchemy import Column, String, DateTime, JSON, Integer, Boolean, Text, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class Event(Base):
    """Domain events that trigger notifications"""
    __tablename__ = "events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(String, unique=True, nullable=False, index=True)
    type = Column(String, nullable=False, index=True)
    producer = Column(String, nullable=False)
    payload = Column(JSON, nullable=False)
    severity = Column(String, nullable=False, default="medium")
    dedupe_key = Column(String, nullable=True, index=True)
    occurred_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "event_id": self.event_id,
            "type": self.type,
            "producer": self.producer,
            "payload": self.payload,
            "severity": self.severity,
            "dedupe_key": self.dedupe_key,
            "occurred_at": self.occurred_at.isoformat() if self.occurred_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Notification(Base):
    """Notifications sent to users"""
    __tablename__ = "notifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id"), nullable=False)
    user_id = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    priority = Column(String, nullable=False, default="normal")
    status = Column(String, nullable=False, default="sent")  # sent, failed, pending
    read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    event = relationship("Event", backref="notifications")
    channel_jobs = relationship("NotificationChannelJob", back_populates="notification")
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "event_id": str(self.event_id),
            "user_id": self.user_id,
            "title": self.title,
            "message": self.message,
            "priority": self.priority,
            "status": self.status,
            "read_at": self.read_at.isoformat() if self.read_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class NotificationChannelJob(Base):
    """Individual channel delivery jobs"""
    __tablename__ = "notification_channel_jobs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    notification_id = Column(UUID(as_uuid=True), ForeignKey("notifications.id"), nullable=False)
    channel = Column(String, nullable=False, index=True)  # inapp, email, sms, voice, push
    status = Column(String, nullable=False, default="queued")  # queued, sent, failed, retrying
    attempts = Column(Integer, nullable=False, default=0)
    max_attempts = Column(Integer, nullable=False, default=3)
    provider_msg_id = Column(String, nullable=True)  # External provider message ID
    last_error = Column(Text, nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    notification = relationship("Notification", back_populates="channel_jobs")
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "notification_id": str(self.notification_id),
            "channel": self.channel,
            "status": self.status,
            "attempts": self.attempts,
            "max_attempts": self.max_attempts,
            "provider_msg_id": self.provider_msg_id,
            "last_error": self.last_error,
            "sent_at": self.sent_at.isoformat() if self.sent_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class UserChannelPrefs(Base):
    """User preferences for notification channels"""
    __tablename__ = "user_channel_prefs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False, index=True)
    channel = Column(String, nullable=False)  # inapp, email, sms, voice, push
    enabled = Column(Boolean, nullable=False, default=True)
    severity_min = Column(String, nullable=False, default="low")  # low, medium, high, critical
    quiet_hours = Column(JSON, nullable=True)  # {"start": "22:00", "end": "08:00", "timezone": "UTC"}
    digest = Column(String, nullable=False, default="none")  # none, daily, weekly
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "user_id": self.user_id,
            "channel": self.channel,
            "enabled": self.enabled,
            "severity_min": self.severity_min,
            "quiet_hours": self.quiet_hours,
            "digest": self.digest,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class ChannelEndpoint(Base):
    """User endpoints for different channels"""
    __tablename__ = "channel_endpoints"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False, index=True)
    channel = Column(String, nullable=False)  # email, sms, push, voice
    endpoint_data = Column(JSON, nullable=False)  # Channel-specific data
    verified = Column(Boolean, nullable=False, default=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "user_id": self.user_id,
            "channel": self.channel,
            "endpoint_data": self.endpoint_data,
            "verified": self.verified,
            "verified_at": self.verified_at.isoformat() if self.verified_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class Template(Base):
    """Notification templates for different channels and locales"""
    __tablename__ = "templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_key = Column(String, nullable=False, index=True)  # e.g., "order.filled"
    channel = Column(String, nullable=False)  # inapp, email, sms, voice, push
    locale = Column(String, nullable=False, default="en")
    subject = Column(String, nullable=True)  # For email
    body = Column(Text, nullable=False)
    cta_url = Column(String, nullable=True)  # Call-to-action URL
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "template_key": self.template_key,
            "channel": self.channel,
            "locale": self.locale,
            "subject": self.subject,
            "body": self.body,
            "cta_url": self.cta_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class AuditLog(Base):
    """Audit trail for all notification activities"""
    __tablename__ = "audit_log"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=True, index=True)
    action = Column(String, nullable=False)  # event_received, notification_created, delivery_attempted, delivery_succeeded, delivery_failed
    channel = Column(String, nullable=True)
    notification_id = Column(UUID(as_uuid=True), nullable=True)
    event_id = Column(UUID(as_uuid=True), nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "user_id": self.user_id,
            "action": self.action,
            "channel": self.channel,
            "notification_id": str(self.notification_id) if self.notification_id else None,
            "event_id": str(self.event_id) if self.event_id else None,
            "details": self.details,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class DeadLetter(Base):
    """Failed events and jobs for investigation and replay"""
    __tablename__ = "dead_letter"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_type = Column(String, nullable=False)  # event, notification, channel_job
    source_id = Column(UUID(as_uuid=True), nullable=True)
    error_type = Column(String, nullable=False)
    error_message = Column(Text, nullable=False)
    payload = Column(JSON, nullable=True)  # Original payload
    retry_count = Column(Integer, nullable=False, default=0)
    max_retries = Column(Integer, nullable=False, default=3)
    next_retry_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "source_type": self.source_type,
            "source_id": str(self.source_id) if self.source_id else None,
            "error_type": self.error_type,
            "error_message": self.error_message,
            "payload": self.payload,
            "retry_count": self.retry_count,
            "max_retries": self.max_retries,
            "next_retry_at": self.next_retry_at.isoformat() if self.next_retry_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class RateLimit(Base):
    """Rate limiting for channels and users"""
    __tablename__ = "rate_limits"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(String, nullable=False, index=True)  # e.g., "user:123:email" or "channel:email"
    window_start = Column(DateTime(timezone=True), nullable=False)
    count = Column(Integer, nullable=False, default=0)
    limit = Column(Integer, nullable=False)
    window_size = Column(Integer, nullable=False)  # seconds
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "key": self.key,
            "window_start": self.window_start.isoformat() if self.window_start else None,
            "count": self.count,
            "limit": self.limit,
            "window_size": self.window_size
        }
