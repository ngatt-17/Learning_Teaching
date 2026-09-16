# Day 2 Integration Report — Platform & Access Foundation

**Author:** tranvananhanhanh  
**Date:** 15 September 2026  
**Branch:** `feature/tranvananhanhanh-platform-access-day02`  
**Pull Request:** [Draft PR](https://github.com/VinUni-CECS/CECS_AI_LearningHub/pull/new/feature/tranvananhanhanh-platform-access-day02)  
**Deliverables Path:** `platform/database/schema.sql`, `platform/backend/`

---

## 1. Run Instructions

### 1.1. Database Initialization
Ensure PostgreSQL is running locally on port 5432:
```bash
# Initialize database cecs_ai_hub, 9 tables, RLS policies, and Day 2 seed data
psql -U postgres -f platform/database/schema.sql
# (Enter password '0000' when prompted)
```

### 1.2. Backend Setup & Startup
```bash
cd platform/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

# Run development server
uvicorn main:app --reload --port 8000
```
Interactive Swagger API documentation: `http://localhost:8000/docs`

### 1.3. Running Automated Test Suite
```bash
pytest tests/test_access_control.py -v
```

---

## 2. What Was Built & Validated

### 2.1. PostgreSQL Schema & Row-Level Security (RLS)
Created `platform/database/schema.sql` with 9 relational tables:
1. `users` — Stores system accounts (admin, instructor, ta, student).
2. `courses` — Course registry (code, name, term, instructor).
3. `enrollments` — Server-side mapping of user access to courses.
4. `materials` — Course slides/PDFs with status lifecycle (`draft`, `processing`, `approved`, `archived`) and `approved_for_ai` flag.
5. `week_classifications` — Instructor-managed mapping of slides to syllabus weeks.
6. `question_banks` — Instructor-uploaded question pools for AI quiz drafting.
7. `private_notes` — Student personal study notes with **enforced Row-Level Security (RLS)**.
8. `student_scores` — Tracks daily streak and score breakdown (quiz, comprehensive, active).
9. `anonymous_feedback` — Course feedback stored strictly without student identity.

**Database-Level Security Guarantee:**
- Created dedicated non-superuser role `cecs_app` (`PASSWORD '0000'`).
- Enforced `ALTER TABLE private_notes FORCE ROW LEVEL SECURITY`.
- Policy: `USING (owner_id = NULLIF(current_setting('app.current_user_id', true), '')::UUID)`.
- Verified: When queried without setting the matching user ID or under another user's session, the database engine returns `0 rows`.

### 2.2. FastAPI Backend API (`platform/backend/`)
- **Authentication (`auth.py`, `routes/auth_routes.py`):**
  - Restricts access strictly to `@vinuni.edu.vn` domains.
  - Generates 6-digit OTP codes (with dev master code `000000`).
  - Issues signed JWT tokens carrying `user_id`, `role`, and `enrolled_courses`.
- **Authorization & Course Middleware (`middleware.py`):**
  - `require_role(*roles)`: Server-enforced endpoint protection.
  - `require_course_access(course_id)`: Verifies enrollment or admin privilege before processing requests.
- **Materials API (`routes/material_routes.py`):**
  - `GET /courses/{id}/materials`: Filters strictly for `status = 'approved'` and `approved_for_ai = TRUE`.
  - `GET /courses/{id}/materials/manage`: Exposes all statuses only to course instructors, TAs, and admins.
  - `PATCH /courses/{id}/materials/{id}/status`: Instructor review & approve pipeline.
- **Private Notes API (`routes/note_routes.py`):**
  - Full CRUD (`GET`, `POST`, `PATCH`, `DELETE`) with session-based `app.current_user_id` injection to guarantee owner-only access.
- **Scores & Analytics API (`routes/score_routes.py`):**
  - Calculates total score: $\text{Streak Bonus} + \text{Quiz} + \text{Comprehensive} + \text{Active Learning}$.
  - Computes class summary statistics while completely excluding private notes.
- **Anonymous Feedback API (`routes/feedback_routes.py`):**
  - Ingestion without author metadata; raw export restricted to administrators.

---

## 3. Automated Test Outcomes (14/14 Passed)

Execution command: `pytest platform/backend/tests/test_access_control.py -v`

| Test Case | Verification Target | Result | Security / Business Guarantee |
|---|---|:---:|---|
| `test_01_otp_rejects_non_vinuni_email` | Non-VinUni domain rejection | ✅ PASS | External emails cannot request OTP |
| `test_02_otp_success_for_student_a` | Student A authentication | ✅ PASS | JWT issued with correct role and course memberships |
| `test_03_student_a_accesses_course_a_success` | Assigned course access | ✅ PASS | Student A can view enrolled Course A |
| `test_04_student_a_denied_course_b` | Unassigned course isolation | ✅ PASS | Student A receives 403 when requesting Course B |
| `test_05_student_b_denied_course_a` | Cross-student course barrier | ✅ PASS | Student B receives 403 when requesting Course A |
| `test_06_admin_can_access_any_course` | Administrative oversight | ✅ PASS | Admins can view any course structure |
| `test_07_draft_materials_hidden_from_student` | Unapproved material isolation | ✅ PASS | Draft materials are omitted from student retrieval |
| `test_08_instructor_sees_all_materials_including_drafts` | Instructor material management | ✅ PASS | Instructors see draft and approved states |
| `test_09_student_denied_manage_materials` | Privilege escalation prevention | ✅ PASS | Students receive 403 on instructor manage endpoints |
| `test_10_student_a_creates_and_reads_note` | Private note CRUD | ✅ PASS | Student can create and inspect personal note |
| `test_11_student_b_cannot_read_student_a_note` | Peer-to-peer note privacy | ✅ PASS | Student B receives 403 via RLS database policy |
| `test_12_instructor_and_admin_cannot_read_student_note` | Staff note privacy | ✅ PASS | Instructors and Admins receive 403 via RLS |
| `test_13_dashboard_excludes_private_notes` | Analytics privacy boundary | ✅ PASS | Aggregated analytics contain no note content |
| `test_14_anonymous_feedback_contains_no_user_identity` | Student feedback safety | ✅ PASS | Submitted feedback contains no student identifiers |

---

## 4. Real vs. Mocked Behavior

| Component | Current State | Notes |
|---|---|---|
| PostgreSQL Database | **REAL** | Running locally with 9 tables, pgcrypto UUIDs, and foreign keys |
| Row-Level Security (RLS) | **REAL** | Enforced at database engine level via `cecs_app` role |
| Authentication & JWT | **REAL** | Signed JWTs with expiration and role/course claims |
| Course & Role Middleware | **REAL** | Enforced on every FastAPI route |
| Email Transport (SMTP) | **MOCKED / DEV** | OTP logged to console with dev master `000000` (Week 2 SMTP deliverable) |
| File Storage (PDF parsing) | **MOCKED PATHS** | File paths stored in DB; integration with object store in progress |

---

## 5. Next Tasks for Core Features (Through 24 September)

| Feature | Next Step | Owner | Dependencies | Target Date |
|---|---|---|---|---|
| **Email OTP Auth** | Connect SendGrid / AWS SES SMTP for live email delivery | Platform Pair | API credentials | 18 Sep 2026 |
| **Material Ingestion** | Connect PyMuPDF parser + slide chunking with page metadata | AI & Quality Pair | Upload endpoint | 19 Sep 2026 |
| **Grounded RAG** | Vectorize approved materials into pgvector / dense store | AI & Quality Pair | Parser output | 21 Sep 2026 |
| **Frontend Connection** | Connect React/Vite UI (`prototypes/google-ai-studio`) to FastAPI endpoints | Experience Pair | API specification | 22 Sep 2026 |
| **Core Flow Demo** | Complete connected walkthrough: Login → Slide → Grounded Q&A → Private Note | All Pairs | Integrated stack | 24 Sep 2026 |

---

## 6. Showcase & Deployment Preparation

- **Staging Environment:** Docker Compose file to be created by 17 September bundling PostgreSQL + FastAPI + React frontend.
- **Demo Accounts & Fixtures:** Pre-populated in `schema.sql` (`admin@vinuni.edu.vn`, `instructor@vinuni.edu.vn`, `student_a@vinuni.edu.vn`, `student_b@vinuni.edu.vn`).
- **Showcase Rehearsal:** Scheduled for 2–4 October to rehearse all three user journeys ahead of the 5 October launch.
