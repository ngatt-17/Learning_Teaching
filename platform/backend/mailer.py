"""
Email delivery for OTP verification codes.

Providers (set EMAIL_PROVIDER in .env):
  console  — development default. The code is printed to the server log only.
  smtp     — any SMTP server: Gmail App Password, a VinUni relay, or **AWS SES SMTP**.
  sendgrid — SendGrid HTTP API v3 (works when outbound SMTP ports are blocked).

AWS SES note: SES exposes standard SMTP credentials, so use EMAIL_PROVIDER=smtp with
SMTP_HOST=email-smtp.<region>.amazonaws.com, SMTP_PORT=587 and the SES SMTP user/password.
"""
import os
import ssl
import smtplib
import logging
from email.message import EmailMessage

import httpx
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("cecs.mailer")

EMAIL_PROVIDER = os.getenv("EMAIL_PROVIDER", "console").lower()
EMAIL_FROM = os.getenv("EMAIL_FROM", "no-reply@vinuni.edu.vn")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "CECS AI Learning Hub")

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")

OTP_TTL_MINUTES = int(os.getenv("OTP_TTL_MINUTES", "10"))


def _render(code: str) -> tuple:
    """Build the subject, plain-text and HTML bodies of the OTP email."""
    subject = f"{code} is your CECS AI Learning Hub verification code"
    text = (
        f"Your CECS AI Learning Hub verification code is: {code}\n\n"
        f"The code expires in {OTP_TTL_MINUTES} minutes. "
        "If you did not request it, you can ignore this email.\n"
    )
    html = f"""<!doctype html>
<html><body style="margin:0;padding:24px;background:#f5f6f8;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:28px;">
    <p style="margin:0 0 4px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;">CECS AI Learning Hub</p>
    <h1 style="margin:0 0 16px;font-size:20px;color:#111827;">Verification code</h1>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#374151;">
      Use the code below to sign in. It expires in {OTP_TTL_MINUTES} minutes.
    </p>
    <div style="font-size:34px;font-weight:700;letter-spacing:.28em;text-align:center;
                padding:18px;background:#f3f4f6;border-radius:10px;color:#111827;">{code}</div>
    <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#6b7280;">
      If you did not request this code, ignore this email — no action is taken.
    </p>
  </div>
</body></html>"""
    return subject, text, html


def _send_smtp(to_email: str, code: str) -> dict:
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASSWORD:
        raise RuntimeError("SMTP_HOST, SMTP_USER and SMTP_PASSWORD must be set for EMAIL_PROVIDER=smtp")

    subject, text, html = _render(code)
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = f"{EMAIL_FROM_NAME} <{EMAIL_FROM}>"
    msg["To"] = to_email
    msg.set_content(text)
    msg.add_alternative(html, subtype="html")

    context = ssl.create_default_context()
    if SMTP_PORT == 465:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context, timeout=15) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
    else:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)

    return {"delivered": True, "provider": f"smtp:{SMTP_HOST}", "detail": f"Sent to {to_email}"}


def _send_sendgrid(to_email: str, code: str) -> dict:
    if not SENDGRID_API_KEY:
        raise RuntimeError("SENDGRID_API_KEY must be set for EMAIL_PROVIDER=sendgrid")

    subject, text, html = _render(code)
    payload = {
        "personalizations": [{"to": [{"email": to_email}]}],
        "from": {"email": EMAIL_FROM, "name": EMAIL_FROM_NAME},
        "subject": subject,
        "content": [
            {"type": "text/plain", "value": text},
            {"type": "text/html", "value": html},
        ],
    }
    res = httpx.post(
        "https://api.sendgrid.com/v3/mail/send",
        headers={"Authorization": f"Bearer {SENDGRID_API_KEY}", "Content-Type": "application/json"},
        json=payload,
        timeout=15,
    )
    if res.status_code >= 300:
        raise RuntimeError(f"SendGrid rejected the message ({res.status_code}): {res.text}")

    return {"delivered": True, "provider": "sendgrid", "detail": f"Accepted for {to_email}"}


def send_otp_email(to_email: str, code: str) -> dict:
    """
    Deliver an OTP code. Never raises: a transport failure is reported in the
    return value so the caller can surface it without leaking the code.
    """
    try:
        if EMAIL_PROVIDER == "smtp":
            result = _send_smtp(to_email, code)
        elif EMAIL_PROVIDER == "sendgrid":
            result = _send_sendgrid(to_email, code)
        else:
            logger.info("[MAIL console] OTP for %s: %s", to_email, code)
            result = {"delivered": False, "provider": "console", "detail": "Code printed to the server log (development mode)"}
        logger.info("[MAIL %s] %s", result["provider"], result["detail"])
        return result
    except Exception as exc:  # transport failure must not break the login flow
        logger.error("[MAIL %s] delivery failed for %s: %s", EMAIL_PROVIDER, to_email, exc)
        return {"delivered": False, "provider": EMAIL_PROVIDER, "detail": f"Delivery failed: {exc}"}
