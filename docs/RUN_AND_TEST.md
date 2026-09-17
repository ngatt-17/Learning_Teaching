# Run and test CECS AI Learning Hub locally

This guide gets the whole product running on your machine: database, Platform API, AI service and web app. It then shows how to run every test suite. It takes about 15 minutes the first time. Commands are given for **macOS/Linux (bash/zsh)** and **Windows (PowerShell)**.

For architecture, API contracts and test evidence, see the [integration report](exploration/day-03/INTEGRATION.md).

---

## What you will run

| # | Process | Folder | Port | Needed for |
|---|---|---|---|---|
| 1 | PostgreSQL | `platform/database` (schema + seed) | 5432 | Everything |
| 2 | Platform API (FastAPI) | `platform/backend` | 8000 | Web app, AI service, platform tests, smoke test |
| 3 | AI service (FastAPI) | `rag` | 8001 | Web app chat/tutor/quiz generation, smoke test |
| 4 | Web app (Vite + React) | `web` | 5173 | Using the product in a browser |

The AI service's own tests and the web lint/build do not need anything running.

## Prerequisites

| Tool | Version | Check |
|---|---|---|
| Git | any recent | `git --version` |
| Python | **3.11 or 3.12** | `python --version` (macOS/Linux may be `python3`) |
| Node.js | **22 LTS** (20.19+ also works) | `node --version` |
| PostgreSQL | 14+ (tested with 16), server encoding UTF-8 | `psql --version` |

On Windows, `psql` is usually not on `PATH`. Either add `C:\Program Files\PostgreSQL\16\bin` to `PATH` or call it with its full path, e.g. `& "C:\Program Files\PostgreSQL\16\bin\psql.exe" ...`.

No Docker, cloud account or API key is required. Without an LLM key, the AI features run in a labelled *extractive* mode (see [Optional: enable the LLM](#optional-enable-the-llm)).

## 0. Get the code

```bash
git clone https://github.com/VinUni-CECS/CECS_AI_LearningHub.git
cd CECS_AI_LearningHub
git switch feature/day03
```

All commands below start from the repository root unless a `cd` is shown.

---

## 1. Create the database

`schema.sql` creates the `cecs_ai_hub` database, the `cecs_app` role (password `0000`, local development only), all tables with Row-Level Security, migrations 002 and 003, and synthetic seed data.

```bash
psql -U postgres -f platform/database/schema.sql
```

Enter the password of your local `postgres` superuser when asked. Run it from any folder: the script includes its migrations relative to its own location.

**Already have `cecs_ai_hub` from Day 2?** Either upgrade it in place:

```bash
psql -U postgres -d cecs_ai_hub -f platform/database/migrations/003_integration.sql
```

or [reset it](#reset-the-database) to get exactly the seed data the tests and walkthrough expect.

## 2. Start the Platform API

**macOS / Linux**

```bash
cd platform/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

**Windows (PowerShell)**

```powershell
cd platform\backend
python -m venv .venv
.venv\Scripts\Activate.ps1          # if blocked: Set-ExecutionPolicy -Scope Process RemoteSigned
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn main:app --reload --port 8000
```

The defaults in `.env` match step 1: database `postgresql://cecs_app:0000@localhost:5432/cecs_ai_hub`, OTP codes printed to the server log, master code `000000` enabled for development. Change `DATABASE_URL` if your PostgreSQL uses another host or port.

Check: http://localhost:8000/health should return `"status": "healthy"`. API docs are at http://localhost:8000/docs, and the platform team's manual test console at http://localhost:8000/test-ui.

## 3. Start the AI service

Open a **second terminal** at the repository root.

**macOS / Linux**

```bash
cd rag
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8001
```

**Windows (PowerShell)**

```powershell
cd rag
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn main:app --reload --port 8001
```

> **`JWT_SECRET` must be identical in `platform/backend/.env` and `rag/.env`.** Both example files use `your-secret-key-here`, so copying both examples works. If you change one, change the other, otherwise every AI request returns `401`.

Check: http://localhost:8001/health should show `"status": "healthy"` and `"llm_configured": false`.

## 4. Start the web app

Open a **third terminal** at the repository root.

```bash
cd web
npm ci
npm run dev
```

Open http://localhost:5173. The dev server forwards `/api/platform` to port 8000 and `/api/ai` to port 8001, so no CORS setup is needed.

---

## 5. Try it

### Accounts

Sign in with one of the seeded emails. In development, the sign-in screen shows the generated code; `000000` also works.

| Email | Role | Courses |
|---|---|---|
| `student_a@vinuni.edu.vn` | Student | COMP2030 Operating Systems, **CS-AI3010** (quiz demo) |
| `student_b@vinuni.edu.vn` | Student | COMP3010 only |
| `student_c@vinuni.edu.vn` | Student | COMP2030 |
| `instructor@vinuni.edu.vn` | Instructor | COMP2030, CS-AI3010 |
| `admin@vinuni.edu.vn` | CECS admin | All courses |

### Student walkthrough (≈5 min)

1. Sign in as **Student A**. Only COMP2030 and CS-AI3010 are listed.
2. **CS-AI3010 → Quizzes → "Vào Làm Quizz"** on *Bài tập 8: Kiểm tra kiến thức E-Commerce & AI*. This is the exam view: question list and timer on the left, question in the centre, Socratic tutor on the right.
3. Pick an answer, then click **"Gợi ý Câu 1"** in the tutor panel. You get a hint with citation pills, but no answer. Click a citation: the **Slides** tab opens at that page.
4. Answer all questions (get a few wrong on purpose) and click **"Hoàn thành & Nộp bài"**. You see the server-graded score, the strengths/weaknesses box and per-question explanations.
5. Click **"HỎI AI"** on a wrong question. The tutor explains your choice versus the correct answer and quotes the cited page.
6. **COMP2030 → Home → "Week 1 — Introduction to OS"**. Ask *"PCB lưu những thông tin gì?"* in the AI panel, then click **"Lưu ghi chú"**. The answer is saved to your private note for that page (**My Notes** shows it with the *Owner-only access* badge).
7. Open http://localhost:5173/courses/10000000-0000-0000-0000-000000000002. Student A gets *"Không có quyền truy cập"* (not enrolled in COMP3010).

### Instructor walkthrough (≈3 min)

1. Sign out, sign in as **Instructor A** → **COMP2030**.
2. **Materials**: one draft ("Week 2 — Process Management (DRAFT)") is hidden from students. Upload a `.pdf`, `.txt` or `.md` file: it arrives as *Chờ duyệt*. Approve it and it becomes visible to students and the AI.
3. **Quizzes → Tạo quiz**: add a question, mark the correct option, **Lưu & phát hành**. Without an LLM key, *Sinh câu hỏi nháp* shows a clear "no LLM_API_KEY" message.
4. **Quizzes → Kết quả** on a quiz shows per-question correctness and attempts. **Students** shows scores.

### Admin walkthrough (≈2 min)

1. Sign in as **admin** → **Dashboard**: readiness per course (materials approved/pending/failed, quizzes published/draft, feedback count).
2. Any course → **Members**: assign or remove users. **Feedback**: anonymous feedback submitted by students.
3. **Admin** (sidebar): create a course.

---

## 6. Run the tests

| Suite | Needs running | Command (from the folder shown, venv active) | Expected |
|---|---|---|---|
| Platform: access control + integration contract | PostgreSQL with seed data | `cd platform/backend` → `pytest tests/ -v` | **43 passed** |
| AI service: quality, tutor, retrieval, competency, GenQuiz contract (incl. self-study) | nothing (Platform and LLM are faked) | `cd rag` → `pytest tests test_rag.py -v` | **44 passed** |
| AI retrieval benchmark (AI pair) | nothing | `cd rag` → `python eval_benchmark.py` | Hit@3 100%, MRR 0.95 |
| Web type-check, lint, build | nothing | `cd web` → `npm run lint` and `npm run build` | no errors |
| **End-to-end smoke test** | PostgreSQL + Platform API + AI service | repository root → `python scripts/smoke_e2e.py` | **25/25 checks passed** |

Notes:

- The platform tests use the seeded accounts, the master code `000000` and `EMAIL_PROVIDER=console` from `.env.example`. They write to the database (quiz attempts, archived probe quizzes) but can be re-run any number of times.
- `scripts/smoke_e2e.py` only needs `httpx`, which is in both virtual environments. Run it with either one active. Use `--platform` / `--ai` to point it at other hosts, e.g. a staging deployment.
- Run the smoke test and the demo walkthrough on a freshly reset database for the cleanest results.

### Reset the database

Stop the Platform API first (it holds connections), then:

```bash
psql -U postgres -c "DROP DATABASE IF EXISTS cecs_ai_hub WITH (FORCE);"
psql -U postgres -f platform/database/schema.sql
```

Start the Platform API again afterwards.

---

## Optional: enable the LLM

Without a key, grounded chat and the quiz tutor answer by quoting sentences from approved material, labelled *"Chế độ trích dẫn — chưa bật LLM"*, and AI quiz generation returns `503`. To use a real model, set these in `rag/.env` (any OpenAI-compatible provider) and restart the AI service:

```env
LLM_API_KEY=...
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
```

Never commit `.env` files; they are git-ignored. Which provider and key the team uses is still open (see [OPEN_QUESTIONS.md](exploration/day-03/OPEN_QUESTIONS.md), Q2).

## Configuration reference

| Variable | File | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | `platform/backend/.env` | `postgresql://cecs_app:0000@localhost:5432/cecs_ai_hub` | Platform database |
| `JWT_SECRET` | both `.env` files | `your-secret-key-here` | Signs/verifies sign-in tokens; must match |
| `ALLOW_DEV_MASTER_OTP` | `platform/backend/.env` | `true` | `000000` always verifies — set `false` outside local development |
| `EMAIL_PROVIDER` | `platform/backend/.env` | `console` | `smtp` / `sendgrid` for real email (see `platform/backend/README.md`) |
| `MATERIAL_STORAGE_DIR` | `platform/backend/.env` | `platform/backend/storage/materials` | Uploaded files (git-ignored) |
| `PLATFORM_API_URL` | `rag/.env` | `http://localhost:8000` | Where the AI service reads approved content |
| `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL` | `rag/.env` | unset | Optional LLM |
| `PLATFORM_API_URL`, `AI_API_URL` | environment when running `npm run dev` | ports 8000 / 8001 | Vite proxy targets |

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `psql: command not found` / not recognized (Windows) | Add `C:\Program Files\PostgreSQL\<version>\bin` to `PATH`, or use the full path to `psql.exe` |
| `database "cecs_ai_hub" already exists` and seed errors | You ran `schema.sql` twice. [Reset the database](#reset-the-database) |
| Platform API: `password authentication failed for user "cecs_app"` | The role was created by an older script with another password, or `DATABASE_URL` points elsewhere. Fix `DATABASE_URL` or reset the database |
| Every chat/tutor request fails with `401 Invalid authentication credentials` | `JWT_SECRET` differs between `platform/backend/.env` and `rag/.env`. Make them equal and restart both services |
| Tutor/chat shows `Platform API is unreachable from the AI service` (503) | The Platform API is not running on `PLATFORM_API_URL` |
| Web shows *"Không kết nối được máy chủ"* | A backend is not running on 8000/8001, or you opened the built files directly. Use `npm run dev` or `npm run preview` |
| `Address already in use` / port busy | Start the service on another port and point the others at it (`--port`, `PLATFORM_API_URL`, `AI_API_URL`) |
| `npm ci` fails with an engine or syntax error | Node is too old. Install Node 22 LTS |
| Vietnamese text looks garbled in the database | Your PostgreSQL server was created with a non-UTF-8 encoding. Recreate the cluster or database with `ENCODING 'UTF8'` (the scripts already force UTF-8 on the client side) |
| `UnicodeEncodeError: 'charmap' codec can't encode…` when running a Python script on Windows (e.g. `eval_benchmark.py`, `demo.py`) | The output is piped or the terminal is not UTF-8. Run `$env:PYTHONIOENCODING="utf-8"` (PowerShell) or `export PYTHONIOENCODING=utf-8` (Git Bash) first |
| Platform tests fail right after a demo session | Something in the seed data was changed by hand (e.g. a seeded quiz unpublished). [Reset the database](#reset-the-database) |
