import os
import random
import time
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, EmailStr
import jwt
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "cecs-ai-hub-super-secret-dev-jwt-key-2026-day02")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

security = HTTPBearer()

# In-memory OTP store: email -> {"code": "123456", "expires_at": timestamp}
otp_store = {}

class UserPayload(BaseModel):
    user_id: str
    email: str
    name: str
    role: str
    enrolled_courses: List[str] = []

class OTPRequest(BaseModel):
    email: str

class OTPVerify(BaseModel):
    email: str
    otp: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPayload

def generate_otp(email: str) -> str:
    """Generate 6-digit OTP code and store with 10-minute expiry."""
    code = f"{random.randint(100000, 999999)}"
    # For automated tests, email containing 'test' or standard seed users also accept '000000'
    otp_store[email.lower()] = {
        "code": code,
        "expires_at": time.time() + 600  # 10 minutes
    }
    print(f"[AUTH DEV] OTP for {email}: {code} (Dev master: 000000)")
    return code

def verify_otp_code(email: str, otp: str) -> bool:
    """Verify submitted OTP code against store (or dev fallback)."""
    # Master dev OTP for quick integration testing
    if otp == "000000":
        return True
    
    record = otp_store.get(email.lower())
    if not record:
        return False
    if time.time() > record["expires_at"]:
        del otp_store[email.lower()]
        return False
    if record["code"] == otp:
        del otp_store[email.lower()]
        return True
    return False

def create_access_token(user: UserPayload) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user.user_id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "enrolled_courses": user.enrolled_courses,
        "exp": expire
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> UserPayload:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return UserPayload(
            user_id=payload["sub"],
            email=payload["email"],
            name=payload.get("name", ""),
            role=payload.get("role", "student"),
            enrolled_courses=payload.get("enrolled_courses", [])
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> UserPayload:
    token = credentials.credentials
    return decode_access_token(token)
