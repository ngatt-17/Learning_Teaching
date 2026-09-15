# CECS AI Learning Hub — Platform & Access Backend

FastAPI backend implementing Email OTP authentication, server-enforced role and course permissions, and PostgreSQL Row-Level Security (RLS) for private study space notes.

## 🚀 Setup & Installation

### 1. Prerequisites
- Python 3.11+
- PostgreSQL running locally on port 5432 with database `cecs_ai_hub` and user `cecs_app` (password: `0000`).
- To initialize the database, execute:
  ```bash
  psql -U postgres -f ../database/schema.sql
  ```

### 2. Virtual Environment & Dependencies
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 4. Run Development Server
```bash
uvicorn main:app --reload --port 8000
```
Interactive Swagger API documentation available at:
👉 `http://localhost:8000/docs`

---

## 🧪 Running Automated Tests

Run the complete 14-test access control suite:
```bash
pytest tests/test_access_control.py -v
```

All 14 tests verify:
- [x] OTP generation & verification with domain restriction (`@vinuni.edu.vn`)
- [x] Course membership enforcement (allowed course returns 200, unauthorized returns 403)
- [x] Student material filtering (only `approved` materials with `approved_for_ai = true` exposed)
- [x] Instructor material management (all statuses visible)
- [x] Private notes database-level isolation via PostgreSQL RLS
- [x] Other students, instructors, and admins denied access to student private notes (403)
- [x] Absence of private notes from dashboards and analytics
- [x] Anonymous feedback isolation (no user identity stored)
