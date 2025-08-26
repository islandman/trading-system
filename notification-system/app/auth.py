import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import settings

logger = logging.getLogger(__name__)

# Security scheme
security = HTTPBearer()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRATION)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        return None
    except jwt.JWTError as e:
        logger.warning(f"Invalid token: {e}")
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Get current user from JWT token"""
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user_id

async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[str]:
    """Get current user from JWT token (optional)"""
    if credentials is None:
        return None
    
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        return None
    
    user_id: str = payload.get("sub")
    return user_id

def create_api_key_token(api_key: str, permissions: list = None) -> str:
    """Create a JWT token for API key authentication"""
    data = {
        "sub": f"api:{api_key}",
        "type": "api_key",
        "permissions": permissions or ["read", "write"]
    }
    return create_access_token(data, timedelta(hours=24))

def verify_api_key(api_key: str) -> bool:
    """Verify API key (placeholder - implement your own logic)"""
    # In production, you would validate against a database or external service
    valid_api_keys = [
        "test-api-key-1",
        "test-api-key-2",
        "trading-system-api-key",
        "risk-system-api-key"
    ]
    return api_key in valid_api_keys

async def get_current_user_from_api_key(api_key: str) -> str:
    """Get current user from API key"""
    if not verify_api_key(api_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    
    # Map API key to user/system
    api_key_mapping = {
        "trading-system-api-key": "trading-system",
        "risk-system-api-key": "risk-system",
        "test-api-key-1": "test-user-1",
        "test-api-key-2": "test-user-2"
    }
    
    return api_key_mapping.get(api_key, "unknown-system")

# Utility functions for token management
def get_token_expiration(token: str) -> Optional[datetime]:
    """Get token expiration time"""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM], options={"verify_exp": False})
        exp_timestamp = payload.get("exp")
        if exp_timestamp:
            return datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
    except jwt.JWTError:
        pass
    return None

def is_token_expired(token: str) -> bool:
    """Check if token is expired"""
    exp_time = get_token_expiration(token)
    if exp_time is None:
        return True
    return datetime.now(timezone.utc) > exp_time

def refresh_token(token: str) -> Optional[str]:
    """Refresh a JWT token if it's close to expiration"""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM], options={"verify_exp": False})
        
        # Check if token expires within the next 5 minutes
        exp_timestamp = payload.get("exp")
        if exp_timestamp:
            exp_time = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
            if datetime.now(timezone.utc) + timedelta(minutes=5) > exp_time:
                # Create new token with same data but new expiration
                payload.pop("exp", None)
                return create_access_token(payload)
    except jwt.JWTError:
        pass
    return None
