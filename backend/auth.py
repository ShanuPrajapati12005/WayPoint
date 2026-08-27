"""WayPoint — Authentication helpers (JWT + hashing)"""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRE_HOURS

security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hash password using SHA256 with salt. Simple + works everywhere."""
    salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}${hashed}"


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a password against a salted SHA256 hash."""
    try:
        salt, stored_hash = hashed.split("$", 1)
        return hashlib.sha256((salt + plain).encode()).hexdigest() == stored_hash
    except (ValueError, AttributeError):
        return False


def create_token(user_id: str, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """FastAPI dependency — extracts user_id from the Bearer token.
    Returns a fallback user id if no token is present (for demo/mock compat)."""
    if credentials is None:
        return "demo-user"
    payload = decode_token(credentials.credentials)
    return payload["sub"]
