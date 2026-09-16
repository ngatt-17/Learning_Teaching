# Open questions — integration of the three Day 2 branches

**Branch:** `feature/day03` · **Opened:** 16 Sep 2026 · **Related:** [INTEGRATION.md](INTEGRATION.md)

Only decisions that are expensive to reverse, affect another pair, or touch security are listed here. Each item already has a default applied in the branch so work is not blocked; write your answer under **Answer** and the branch will be adjusted.

---

## Q1. Leaked LLM key in pushed history — security

A real xKiro key (`XKIRO_API_KEY=sk-xt-db53…`) was committed in `src/ai/README.md` (`44fa8fc`, ngatt-17, 15 Sep) and carried into `rag/README.md` (`7041694`). Both commits are on `origin/feature/ngatt-17-ai-quality-day02` and `origin/feature/TinNguyenn-rag-day02`. Commit `669db7c` says "revoke leaked key" but only edits the files; the value stays readable in history.

- **Default applied:** the integration branch contains no key values. History is not rewritten.
- **Needed:** confirm the key was actually revoked at the provider. Decide whether history must be rewritten (force-push to both branches; every clone has to re-fetch).

**Answer:**

---

## Q2. Which LLM provider and key for staging and the 24 Sep demo? — blocks "live grounded AI"

The AI service accepts any OpenAI-compatible provider through `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL` (`rag/.env`). Team synthesis Decision 1 (OpenAI GPT-4o-mini vs. VinUni Azure OpenAI) is still open.

- **Default applied:** no key configured. Grounded chat and the quiz tutor fall back to an *extractive* mode that quotes approved material with citations and is labelled in the UI ("Chế độ trích dẫn — chưa bật LLM"). AI quiz generation returns `503` with a clear message until a key exists.
- **Needed:** provider/model, who holds the key, monthly budget cap.

**Answer:**

---

## Q3. Question-type vocabulary shared by Platform and AI — contract

Platform stored `multiple_choice` meaning *one* correct option. The AI pair's circulated contract uses `single_choice` (one), `multiple_choice` (select all that apply) and `short_answer` (+ `keywords`).

- **Default applied:** the AI contract is used everywhere. Migration `003_integration.sql` renames existing platform rows to `single_choice`. `multiple_choice` is graded all-or-nothing. AI `keywords` are stored as `accepted_answers` for short answers (case/space-insensitive match).
- **Needed:** confirm, or ask for partial credit on select-all questions.

**Answer:**

---

## Q4. May the AI tutor be used during a scored quiz attempt? — academic integrity

The target quiz screen shows the Socratic tutor next to an in-progress quiz, and the first attempt of a quiz awards points.

- **Default applied:** during an attempt the tutor runs in **hint mode**: the AI service loads the *student* view of the quiz (no answer key exists in its context), is instructed never to pick or judge an option, and a post-filter blocks "the answer is…" style output. Full explanations (correct answer, the student's choice, instructor explanation, citation) unlock only after submission (**review mode**, read from the student's own graded attempt).
- **Needed:** keep hint mode for point-earning attempts, or disable the tutor until submission.

**Answer:**

---

## Q5. Two backend services or one? — deployment

- **Default applied:** two services, following the AI pair's Week 2 plan. The **Platform API** (port 8000) owns auth, database, RLS and grading. The **AI service** (port 8001) owns retrieval and LLM calls. The AI service verifies the Platform JWT with the shared `JWT_SECRET`. It reads course content only through the Platform API *with the caller's own token*, so enrolment and approval rules live in one place and the AI service never connects to the database.
- **Alternative:** mount the AI routes inside the Platform process (one deployment, but mixed dependencies and module-name clashes between `rag/` and `platform/backend/`).
- **Needed:** confirm two services for staging; the deployment owner must set the same `JWT_SECRET` in both.

**Answer:**

---

## Q6. Lecture PDF committed by the frontend branch — content approval

`prototypes/vin-uni/public/DHMT_01.pdf` (2.2 MB, a computer graphics lecture) is on `origin/research/Tung205-day02`. The README requires approved sample content only. The new `web/` app does not use it; seeded demo materials are synthetic text.

- **Default applied:** file left untouched inside `prototypes/`.
- **Needed:** is it approved sample content? If not, it should be removed before anything merges to `main`.

**Answer:**

---

## Q7. Commit, push and PR

Nothing has been committed yet.

- **Proposed:** three merge commits for the team branches, preserving each author's history (only `.gitignore` conflicts), then one integration commit. After that, push `feature/day03` and open a **draft** PR to `main` for non-author review.
- **Needed:** go ahead? (yes / commit only / wait)

**Answer:**
