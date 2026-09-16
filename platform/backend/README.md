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
- An existing database created before the quiz engine needs migration 002:
  ```bash
  psql -U postgres -d cecs_ai_hub -f ../database/migrations/002_quiz.sql
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
- Swagger API documentation: `http://localhost:8000/docs`
- **Manual test console (all Day 2 flows): `http://localhost:8000/test-ui`**

---

## 📚 API Surface (Day 2)

Legend — 🎓 student · 👨‍🏫 instructor/TA · 🏛️ admin. Every course-scoped route also passes
`require_course_access`, so a caller outside the course gets `403` regardless of role.

| Method & path | 🎓 | 👨‍🏫 | 🏛️ | Purpose |
|---|:--:|:--:|:--:|---|
| `POST /auth/request-otp` | ✅ | ✅ | ✅ | Send the OTP (domain-restricted to `@vinuni.edu.vn`) |
| `POST /auth/verify-otp` | ✅ | ✅ | ✅ | Exchange the code for a JWT |
| `GET /auth/me` | ✅ | ✅ | ✅ | Identity and role of the current token |
| `GET /courses/` | ✅ | ✅ | ✅ | **My courses** — scoped by enrolment; admin sees all |
| `GET /courses/{id}` | ✅ | ✅ | ✅ | Course detail |
| `POST /courses/` | — | — | ✅ | Create a course |
| `POST /courses/{id}/enroll` | — | — | ✅ | Assign an instructor/student to a course |
| `DELETE /courses/{id}/enroll/{user_id}` | — | — | ✅ | Remove an assignment |
| `GET /courses/{id}/members` | — | ✅ | ✅ | Course roster (`?role=student` to filter) |
| `GET /users/` | — | — | ✅ | Account directory |
| `GET /users/{id}/courses` | — | — | ✅ | Which courses a given user is assigned to |
| `GET /courses/{id}/materials/` | ✅ | ✅ | ✅ | Lesson list — **only `approved` + `approved_for_ai`** |
| `GET /courses/{id}/materials/manage` | — | ✅ | ✅ | All statuses, including drafts |
| `POST /courses/{id}/materials/` | — | ✅ | ✅ | Upload + week classification (created as `draft`) |
| `PATCH /courses/{id}/materials/{mid}/status` | — | ✅ | ✅ | Review pipeline `draft → approved → archived` |
| `GET /courses/{id}/notes` | ✅ | ✅ | ✅ | My private notes in the course (RLS-scoped to the caller) |
| `POST /courses/{id}/notes` | ✅ | ✅ | ✅ | Create a private note |
| `GET/PATCH/DELETE /notes/{note_id}` | ✅ | ✅ | ✅ | Owner-only — anyone else gets `403` from the RLS policy |
| `GET /courses/{id}/scores/my-score` | ✅ | ✅ | ✅ | My streak + score breakdown |
| `POST /courses/{id}/scores/activity` | — | ✅ | ✅ | **Award** points to a named student (1–100 per award) |
| `GET /courses/{id}/scores/students` | — | ✅ | ✅ | Per-student dashboard roster, ranked by total score |
| `GET /courses/{id}/scores/class-summary` | — | ✅ | ✅ | Class averages, no private-note data |
| `GET /courses/{id}/quizzes/` | ✅ | ✅ | ✅ | Published quizzes + my own attempt summary |
| `GET /courses/{id}/quizzes/topics` | ✅ | ✅ | ✅ | Topics for a comprehensive quiz, with lock reasons |
| `GET /courses/{id}/quizzes/{qid}` | ✅ | ✅ | ✅ | Take a quiz — **correct answers stripped out** |
| `POST /courses/{id}/quizzes/{qid}/submit` | ✅ | ✅ | ✅ | Server grades the answers and awards the points |
| `GET /courses/{id}/quizzes/{qid}/my-attempts` | ✅ | ✅ | ✅ | My marked attempts with explanations |
| `POST /courses/{id}/quizzes/comprehensive` | ✅ | ✅ | ✅ | Build a quiz across ≥2 already-studied topics |
| `GET /courses/{id}/quizzes/manage/all` | — | ✅ | ✅ | Every quiz, including AI drafts awaiting review |
| `POST /courses/{id}/quizzes/` | — | ✅ | ✅ | Create a quiz (always starts as `draft`) |
| `GET /courses/{id}/quizzes/{qid}/manage` | — | ✅ | ✅ | Full quiz **with** correct answers, for review |
| `PATCH /courses/{id}/quizzes/{qid}/status` | — | ✅ | ✅ | Publish gate — an empty quiz cannot be published |
| `GET /courses/{id}/quizzes/{qid}/attempts` | — | ✅ | ✅ | Who took it and what they scored |
| `DELETE /courses/{id}/quizzes/{qid}` | own comprehensive | ✅ | ✅ | Only while the quiz has no attempts (`409` otherwise) |
| `POST /courses/{id}/feedback/` | ✅ | ✅ | ✅ | Submit anonymous feedback (no author column) |
| `GET /courses/{id}/feedback/` | — | — | ✅ | Raw feedback — admin only |

### Score integrity
A student can never write their own score. `POST /scores/activity` is the staff grading
channel: it requires an instructor/TA/admin token, names the student explicitly, verifies
that student is enrolled in the course, bounds each award to 1–100 points and rejects an
award that would overflow the `NUMERIC(5,2)` score columns (`400` instead of a `500`).

### How quiz points are earned
The automated path is implemented in `routes/quiz_routes.py`:

1. `GET /quizzes/{id}` returns the questions with `correct_answer` and `explanation`
   removed — a student never receives the answer key before submitting.
2. `POST /quizzes/{id}/submit` sends only the chosen answers. The server marks them
   against `quiz_questions.correct_answer` (short answers are matched case- and
   whitespace-insensitively), computes `score = correct × points_per_question`, stores the
   attempt, and writes the points itself.
3. **Only the first attempt awards points.** A replay is stored with `points_awarded = 0`,
   so a quiz cannot be farmed for score.
4. Lesson quizzes credit `quiz_score`; comprehensive quizzes credit `comprehensive_score`.
   The daily streak advances on the same write.

`POST /scores/activity` remains as the manual instructor channel (adjustments, offline
work). Active-learning game points are **not implemented yet** — and they must follow the
same rule: the questions, the timer and the marking all have to live on the server, because
a client that reports its own result can always lie.

### Quiz review gate
A quiz is created as `draft` regardless of `source`, so an `ai_draft` quiz cannot reach
students until an instructor publishes it, and a quiz with no questions cannot be published
at all.

---

## 🖥️ Test Console (`/test-ui`)

A dependency-free single page served by the API itself — no build step, no frontend
install. It drives every endpoint with the four seeded accounts:

| Tab | What it exercises |
|---|---|
| Sidebar | One-click login for the 4 seed accounts, real OTP login, course selector |
| 🎓 Sinh viên | Approved materials (Lesson), take a quiz and see it graded, build a comprehensive quiz from unlocked topics, private notes CRUD, read-only score, anonymous feedback |
| 👨‍🏫 Giảng viên | Upload material + week classification, approve `draft → approved`, create and publish quizzes, read submitted attempts, roster, per-student scores, manual grading |
| 🏛️ Admin | User directory, create course, assign instructor/student, read raw feedback |
| 🛡️ Kiểm tra phân quyền | Runs 24 authorization checks from the browser (cross-course denial, RLS note privacy, dashboard privacy, feedback isolation) |

Every call is recorded in the request log at the bottom with method, path, HTTP status,
duration and the full JSON body, so a denial can be shown as evidence during the demo.

---

## 📧 Real OTP Email (SMTP / SendGrid / AWS SES)

Delivery is selected with `EMAIL_PROVIDER` in `.env`. The code path is
`routes/auth_routes.py` → `auth.deliver_otp()` → `mailer.send_otp_email()`.

| Provider | `.env` | When to use |
|---|---|---|
| `console` | default, no config | Local development — the code is printed to the server log and returned in `dev_otp` |
| `sendgrid` | `SENDGRID_API_KEY` | Outbound SMTP ports blocked; HTTPS only |
| `smtp` | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | AWS SES SMTP, a VinUni relay, or a Gmail App Password |

### Option A — SendGrid (fastest to get working)
1. Create a free SendGrid account (100 emails/day).
2. **Settings → Sender Authentication**: verify `no-reply@vinuni.edu.vn` as a Single Sender,
   or authenticate the domain with the DNS records SendGrid provides (needed to avoid spam
   folders and to send from a VinUni address).
3. **Settings → API Keys → Create API Key** with *Restricted Access → Mail Send* only.
4. In `.env`:
   ```env
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxx
   EMAIL_FROM=no-reply@vinuni.edu.vn
   ```
5. Restart the server and press **Gửi mã OTP** in `/test-ui`; the response shows
   `email_provider`, `delivered` and `delivery_detail`.

### Option B — AWS SES (production choice; uses the `smtp` provider)
1. SES console → **Verified identities** → verify the domain `vinuni.edu.vn`
   (add the DKIM CNAME records to DNS) or at minimum the single sender address.
2. A new SES account is in **sandbox mode**: it can only send to verified addresses.
   Open **Account dashboard → Request production access** before the pilot.
3. **SMTP settings → Create SMTP credentials** — this creates an IAM user and returns an
   SMTP username/password pair (*not* the AWS access key).
4. In `.env`:
   ```env
   EMAIL_PROVIDER=smtp
   SMTP_HOST=email-smtp.ap-southeast-1.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=<SES SMTP username>
   SMTP_PASSWORD=<SES SMTP password>
   EMAIL_FROM=no-reply@vinuni.edu.vn
   ```

### Option C — Gmail App Password (demo only)
Enable 2-Step Verification → App passwords, then `SMTP_HOST=smtp.gmail.com`,
`SMTP_PORT=587`, and the 16-character app password. Gmail rewrites the From address, so
this is unsuitable for the real launch.

### Security settings that must change before the pilot
| Setting | Dev | Staging / production |
|---|---|---|
| `ALLOW_DEV_MASTER_OTP` | `true` (code `000000` always verifies, `/test-ui` and pytest rely on it) | **`false`** |
| `EMAIL_PROVIDER` | `console` | `sendgrid` or `smtp` |
| `JWT_SECRET` | dev default | a long random secret |
| `dev_otp` in the response | returned (console mode only) | never returned |

Other OTP policy knobs: `OTP_TTL_MINUTES` (default 10), `OTP_MAX_ATTEMPTS` (5 wrong tries
invalidate the code) and `OTP_RESEND_COOLDOWN_SECONDS` (60s between requests, enforced only
when a real provider is configured so tests are not throttled).

A transport failure never breaks login: `send_otp_email` catches it, logs it, and returns
`delivered: false` with the reason in `delivery_detail`.

---

## 🧪 Running Automated Tests

Run the complete 29-test access control suite:
```bash
pytest tests/test_access_control.py -v
```

All 29 tests verify:
- [x] OTP generation & verification with domain restriction (`@vinuni.edu.vn`)
- [x] Course membership enforcement (allowed course returns 200, unauthorized returns 403)
- [x] Student material filtering (only `approved` materials with `approved_for_ai = true` exposed)
- [x] Instructor material management (all statuses visible)
- [x] Private notes database-level isolation via PostgreSQL RLS
- [x] Other students, instructors, and admins denied access to student private notes (403)
- [x] Absence of private notes from dashboards and analytics
- [x] Anonymous feedback isolation (no user identity stored)
- [x] Score integrity (students cannot write their own score; awards are bounded and staff-only)
- [x] Quiz answer keys hidden from students; draft quizzes unreachable; grading done server-side
- [x] Replaying a quiz awards no extra points; comprehensive quizzes are private per student

The same checks can be replayed visually from the **🛡️ Kiểm tra phân quyền** tab of
`http://localhost:8000/test-ui`.
