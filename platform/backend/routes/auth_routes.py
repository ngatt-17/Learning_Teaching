from fastapi import APIRouter, HTTPException, Depends, status
from auth import (
    OTPRequest, OTPVerify, TokenResponse, UserPayload,
    generate_otp, verify_otp_code, create_access_token, get_current_user
)
from database import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/request-otp")
def request_otp(req: OTPRequest):
    email = req.email.lower()
    if not email.endswith("@vinuni.edu.vn"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only @vinuni.edu.vn email addresses are permitted"
        )
    
    # Check if user exists
    with get_db() as cur:
        cur.execute("SELECT id, name, role FROM users WHERE LOWER(email) = %s;", (email,))
        user = cur.fetchone()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User account not found. Please contact your CECS administrator."
            )
    
    code = generate_otp(email)
    return {
        "status": "success",
        "message": f"Verification code sent to {email}",
        "dev_hint": "Dev master OTP is 000000"
    }

@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(req: OTPVerify):
    email = req.email.lower()
    if not verify_otp_code(email, req.otp):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired verification code"
        )
    
    with get_db() as cur:
        cur.execute("SELECT id, email, name, role FROM users WHERE LOWER(email) = %s;", (email,))
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get enrolled courses
        cur.execute("SELECT course_id FROM enrollments WHERE user_id = %s;", (user["id"],))
        enrollments = [str(r["course_id"]) for r in cur.fetchall()]
    
    user_payload = UserPayload(
        user_id=str(user["id"]),
        email=user["email"],
        name=user["name"],
        role=user["role"],
        enrolled_courses=enrollments
    )
    
    token = create_access_token(user_payload)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user_payload
    )

@router.get("/me", response_model=UserPayload)
def get_me(current_user: UserPayload = Depends(get_current_user)):
    return current_user
