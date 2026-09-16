"""
auth.py — Platform JWT verification (replaces the Day 2 mock_auth.py)

The Platform API (port 8000) issues the token after email OTP verification. This service
only verifies its signature with the shared JWT_SECRET and reads the identity claims.
Course membership is NOT decided from the token's `enrolled_courses` claim (it can be
stale for up to 24h): every course-scoped call goes back to the Platform API with the
same token, which re-checks enrolment and material approval server-side.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import jwt
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

import config

STAFF_ROLES = ("instructor", "ta", "admin")

_bearer = HTTPBearer(auto_error=False)


@dataclass
class AuthUser:
    user_id: str
    email: str
    name: str
    role: str                      # "student" | "instructor" | "ta" | "admin"
    token: str = field(repr=False)  # forwarded to the Platform API, never logged


def decode_platform_token(token: str) -> AuthUser:
    try:
        payload = jwt.decode(token, config.JWT_SECRET, algorithms=[config.JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired",
                            headers={"WWW-Authenticate": "Bearer"})
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials",
                            headers={"WWW-Authenticate": "Bearer"})
    if "sub" not in payload or "role" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token is missing identity claims")
    return AuthUser(
        user_id=payload["sub"],
        email=payload.get("email", ""),
        name=payload.get("name", ""),
        role=payload["role"],
        token=token,
    )


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Security(_bearer)) -> AuthUser:
    """FastAPI dependency — the verified caller."""
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Missing bearer token. Sign in through the Platform API first.",
                            headers={"WWW-Authenticate": "Bearer"})
    return decode_platform_token(credentials.credentials)


def require_staff(user: AuthUser, action: str = "use this endpoint") -> AuthUser:
    if user.role not in STAFF_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail=f"Only instructors, TAs or admins can {action}.")
    return user
