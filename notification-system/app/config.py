import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Application settings
    APP_NAME: str = "Notification System"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"
    
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8003
    
    # Database settings
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost/notifications"
    
    # Redis settings
    REDIS_URL: str = "redis://localhost:6379"
    
    # JWT settings
    JWT_SECRET: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION: int = 3600  # 1 hour
    
    # Email settings (SendGrid)
    SENDGRID_API_KEY: Optional[str] = None
    SENDGRID_FROM_EMAIL: str = "noreply@example.com"
    SENDGRID_FROM_NAME: str = "Notification System"
    
    # SMS settings (Twilio)
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    
    # Voice settings (Twilio)
    TWILIO_VOICE_PHONE_NUMBER: Optional[str] = None
    
    # Push notification settings
    FCM_SERVER_KEY: Optional[str] = None
    APNS_KEY_ID: Optional[str] = None
    APNS_TEAM_ID: Optional[str] = None
    APNS_KEY_FILE: Optional[str] = None
    
    # Rate limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_DEFAULT: int = 100  # requests per minute
    RATE_LIMIT_CHANNELS: dict = {
        "email": 60,
        "sms": 10,
        "voice": 5,
        "push": 100,
        "inapp": 1000
    }
    
    # Retry settings
    MAX_RETRY_ATTEMPTS: int = 3
    RETRY_DELAY_BASE: int = 1  # seconds
    RETRY_DELAY_MAX: int = 60  # seconds
    
    # Queue settings
    QUEUE_WORKER_CONCURRENCY: int = 10
    QUEUE_BATCH_SIZE: int = 100
    
    # Monitoring
    METRICS_ENABLED: bool = True
    HEALTH_CHECK_INTERVAL: int = 30  # seconds
    
    # Security
    CORS_ORIGINS: list = ["*"]
    API_KEY_HEADER: str = "X-API-Key"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Templates
    DEFAULT_LOCALE: str = "en"
    TEMPLATE_CACHE_TTL: int = 3600  # 1 hour
    
    # Compliance
    TCPA_COMPLIANCE_ENABLED: bool = True
    CAN_SPAM_COMPLIANCE_ENABLED: bool = True
    GDPR_COMPLIANCE_ENABLED: bool = True
    
    # Quiet hours
    DEFAULT_QUIET_HOURS_START: str = "22:00"
    DEFAULT_QUIET_HOURS_END: str = "08:00"
    DEFAULT_TIMEZONE: str = "UTC"
    
    # Digest settings
    DIGEST_ENABLED: bool = True
    DIGEST_BATCH_SIZE: int = 50
    DIGEST_SEND_TIME: str = "09:00"  # Daily digest send time
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create settings instance
settings = Settings()

# Environment-specific overrides
if settings.ENVIRONMENT == "production":
    settings.DEBUG = False
    settings.LOG_LEVEL = "WARNING"
elif settings.ENVIRONMENT == "development":
    settings.DEBUG = True
    settings.LOG_LEVEL = "DEBUG"
elif settings.ENVIRONMENT == "testing":
    settings.DEBUG = True
    settings.LOG_LEVEL = "DEBUG"
    settings.DATABASE_URL = "postgresql+asyncpg://test:test@localhost/test_notifications"
    settings.REDIS_URL = "redis://localhost:6379/1"
