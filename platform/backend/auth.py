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

from mailer import send_otp_email, EMAIL_PROVIDER, OTP_TTL_MINUTES

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "cecs-ai-hub-super-secret-dev-jwt-key-2026-day02")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Development convenience: master code 000000 always verifies.
# MUST be set to false in staging/production (see .env.example).
ALLOW_DEV_MASTER_OTP = os.getenv("ALLOW_DEV_MASTER_OTP", "true").lower() == "true"
# Resend throttle, applied only when real email is being sent.
OTP_RESEND_COOLDOWN_SECONDS = int(os.getenv("OTP_RESEND_COOLDOWN_SECONDS", "60"))
OTP_MAX_ATTEMPTS = int(os.getenv("OTP_MAX_ATTEMPTS", "5"))

security = HTTPBearer()

# In-memory OTP store: email -> {"code", "expires_at", "sent_at", "attempts"}
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

def otp_cooldown_remaining(email: str) -> int:
    """Seconds left before a new code may be requested. Always 0 in console mode."""
    if EMAIL_PROVIDER == "console" or OTP_RESEND_COOLDOWN_SECONDS <= 0:
        return 0
    record = otp_store.get(email.lower())
    if not record:
        return 0
    elapsed = time.time() - record.get("sent_at", 0)
    return max(0, int(OTP_RESEND_COOLDOWN_SECONDS - elapsed))


def generate_otp(email: str) -> str:
    """Generate a 6-digit OTP code and store it with its expiry."""
    code = f"{random.randint(100000, 999999)}"
    now = time.time()
    otp_store[email.lower()] = {
        "code": code,
        "expires_at": now + OTP_TTL_MINUTES * 60,
        "sent_at": now,
        "attempts": 0,
    }
    return code


def deliver_otp(email: str, code: str) -> dict:
    """Send the code through the configured email provider (console/smtp/sendgrid)."""
    return send_otp_email(email, code)


def verify_otp_code(email: str, otp: str) -> bool:
    """Verify a submitted OTP code against the store (or the dev master code)."""
    if ALLOW_DEV_MASTER_OTP and otp == "000000":
        return True

    record = otp_store.get(email.lower())
    if not record:
        return False
    if time.time() > record["expires_at"]:
        del otp_store[email.lower()]
        return False
    if record["attempts"] >= OTP_MAX_ATTEMPTS:
        del otp_store[email.lower()]
        return False
    if record["code"] == otp:
        del otp_store[email.lower()]
        return True
    record["attempts"] += 1
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
