# Day 1 Research — TinNguyenn

> Target: 700–1,000 words + source links. Work independently, then bring recommendations to team session.
> Branch: `research/TinNguyenn-day01`

## 1. Product understanding

### Instructor / TA journey
Sign in with approved VinUni email + one-time code (no Microsoft SSO for pilot). Open assigned courses, upload materials (textbooks, slides, quizzes, assignments) to private storage with real records. Track processing status (processing → ready / failed → retry) and resolve failures. Approve materials for students, or unpublish/remove when needed. Separately curate the **question bank**: review, edit, and approve individual questions (manual / import / AI-suggested from approved materials) via `draft → pending_review → approved_in_bank / rejected`. This review gates entry **into the bank**, not each AI on-demand quiz students generate later. View course activity, practice results (split by bank vs AI-generated), engagement and common misconceptions to improve teaching. All role/course checks enforced server-side. In my proposal, instructors do **not** see identifiable student feedback on teaching/platform — only aggregated course activity and practice results.

### Student journey
Sign in with verified VinUni email and open assigned courses. Read only approved instructor materials in those courses. Ask questions grounded in those materials via live retrieval + AI answers with inspectable citations (source + location); receive clear "insufficient evidence" response when retrieval is weak. Optionally expand discussion to the Web — Web sources must be clearly labeled and cited as beyond approved course content. Use a private study space to annotate materials and write/generate personal notes/questions, with save/edit/delete and an explicit privacy boundary. Practice via **two quiz modes**: (1) **Bank quiz** — questions already approved into the bank, trusted with source references; (2) **AI-generated quiz on demand** — student selects approved sources + topic/difficulty/type/quantity and AI generates instantly, labeled `AI-draft, chưa duyệt`, for formative practice only and never auto-promoted into the bank. Both modes return formative feedback with source references, no formal grade in pilot. Submit explicit feedback on teaching/platform through a separate feedback channel (distinct from private notes). In my proposal this feedback is **admin-only**: only CECS admins can read identifiable feedback; instructors/TAs and other students cannot.

### CECS admin journey
Assign instructors/TAs and students to courses. Check course readiness: uploads, processing/approval status, question-bank review/publication (counts of `pending_review` vs `approved_in_bank`, bank coverage per material/topic). View college/course engagement, common learning difficulties and intentionally submitted feedback to guide improvements. In my proposal, identifiable student feedback on teaching/platform is **admin-only** — admins are the sole readers. Access only aggregate insights otherwise — never open a student's private study space via UI, API, export or dashboard.

### Private notes vs shared data

| Type | Who can access | Used for insights/dashboard? | Retrieval / logging |
|---|---|---|---|
| Private student notes, annotations, personal questions | Owner only (student). Instructors, TAs, CECS admins, other students must not access via app/API/exports/dashboards/logs. Infrastructure/operator access documented separately. Display boundary in study space and test server-side. | No — explicitly excluded | Excluded from shared retrieval, ordinary logs, and analytics |
| Course materials (approved) | Members of assigned course per role; approval-gated | Yes — readiness/status counts | Stored as real records, retrievable for grounded chat |
| Submitted feedback (explicit, admin-only in my proposal) | CECS admin only. Instructors, TAs, and other students must not access identifiable feedback. | Yes — aggregate only for admins | Separate channel, intentionally shared with admins only |
| Dashboard / activity data (practice attempts, engagement) | Aggregated views per role | Yes — basic counts/summaries for pilot | Derived from stored activity, never includes private-note content |

This follows `README.md:34` — "Private means private" — and core pilot requirements (server-side authz, citations, owner-only notes).

### Pilot success signals + assumption to check

1. **Grounded Q&A works in practice:** ≥70% of student questions on approved materials return an answer with ≥1 inspectable citation (derived from retrieved metadata) and <15% fallback to "insufficient evidence" without hallucinated sources; citation click-through logged as evidence of inspection.
2. **Material & question-bank lifecycle is real:** ≥80% of uploaded materials reach terminal state (ready/failed) within 10 min, plus a non-empty bank per pilot course (e.g., ≥20 `approved_in_bank` questions covering ≥70% of approved materials/topics) — measured via DB records: `ready` rate + `approved_in_bank` counts, not mocked. Bank attempts and AI on-demand attempts logged separately.
3. **One assumption to check with users:** Instructors will actually review/edit candidate questions (manual/import/AI-suggested) into the bank rather than letting the bank stay empty while students rely only on AI on-demand quizzes. Need to validate time willingness (interviews) and enforce `review-required-before-enter-bank` gate; if review takes >48h, pilot risks demonstrating only unvetted AI quizzes with no trusted bank content.

## 2. Three university AI learning applications

> Use university pages or original papers. Distinguish announcement vs deployed service vs evaluated outcome. Include source dates + access date (2026-09-14). State when evidence is missing.

| Application and source | Users and learning problem | Key features | Evidence and limitations | What CECS could adopt |
|---|---|---|---|---|
| 1. PyTutor — MIT / Georgia State (GSU) / Quinsigamond Community College (QCC) — https://raise.mit.edu/research/research-projects/pytutor/ — Page updated 2025-07-31 — MIT Media Lab overview: https://www.media.mit.edu/projects/pytutor-empowering-equitable-education-pathways-in-computing-with-generative-ai/overview/ — Course page: https://introcomp.mit.edu/fall26/aitutor — Accessed: 2026-09-14 | Intro Python students, esp. under-resourced / minority-serving and community-college learners balancing work and study. Problem: no 1:1 help, high attrition in intro computing. | Context-aware LLM tutor with 3 context sources: course content (lectures, assignments), student ongoing work (code editor, whiteboard attachments), past tutor interactions. Instructor-configurable workspace and tutor behavior. Socratic-style prompting instead of direct answers. | **Deployed service** (not just announcement): live in intro Python across all 3 partner schools, now expanding to high-school calculus with multimodal support. **Evaluated:** focus-group studies on Socratic vs didactic preferences. **Limitation:** no large-scale RCT on learning gains published on the RAISE page — impact evidence on grades/retention missing. | Copy the 3-source context design (materials + current work + history) for grounded chat, but enforce CECS privacy boundary: keep private notes out of tutor context. Copy instructor-configurable tutor settings for approval-gated materials. |
| 2. CS50.ai Duck debugger — Harvard University CS50 — https://cs50.harvard.edu/college/2025/spring/notes/ai/ (Spring 2025 notes) — Docs: https://cs50.readthedocs.io/cs50.ai/ — Papers: Liu et al. SIGCSE 2024 (doi:10.1145/3626252.3630938) and Liu et al. SIGCSE 2025 (doi:10.1145/3641554.3701945), PDF: https://cs.harvard.edu/malan/publications/fp0627-liu.pdf — Accessed: 2026-09-14 | CS50 on-campus + online students (hundreds to 200k+). Problem: waiting for staff for debugging and conceptual help; need 24/7 1:1 support without giving away solutions. | ChatGPT-based rubber-duck debugger in VS Code and Ed forum. RAG over recent lecture captions and course cheat sheets, PII anonymization, system prompt forbidding direct homework solutions. Complementary tools: code explainer and style suggester. Clear academic-honesty policy: ChatGPT banned, only CS50.ai allowed. | **Deployed at scale:** 70-student pilot Summer 2023 → hundreds on-campus Fall 2023 + thousands online → ~211k users and ~10M queries by Nov 2024 at ~$1.50/student/year, ~35k prompts/day. **Evaluated:** 75% frequent use, 94% found helpful; TF human evals (1,309 comparisons Summer 2024, 480 multi-turn Fall 2024 with Harvard/Yale TFs) rank few-shot + fine-tuned V2/V3 above V0 baseline. **Limitation:** instruction dilution — ~1,000-token system prompt still leaks near-complete solutions; evaluation framework still being built. | Copy RAG-over-approved-materials + PII scrubbing + honesty policy + cost/usage logging. Copy the eval loop (TF pairwise comparison, Elo) for CECS citation quality. Avoid copying the over-long system prompt; keep a small verifiable prompt plus insufficient-evidence fallback. |
| 3. Jill Watson — Georgia Institute of Technology (Design Intelligence Lab) — https://dilab.gatech.edu/jill-watson/ — Papers: Taneja et al. arXiv:2405.11070 (2024-05-17) https://arxiv.org/html/2405.11070v1 and Kakar et al. ITS 2024 https://dilab.gatech.edu/test/wp-content/uploads/2024/05/ITS2024_JillWatson_paper.pdf — Interaction study: https://arxiv.org/html/2407.17429 — Accessed: 2026-09-14 | Online OMSCS graduate students (KBAI, Cognitive Science) + community-college English learners (Wiregrass, Columbus). Problem: thousands of forum questions, too few instructors, low teaching presence in async courses. | ChatGPT + dense passage retrieval (DPR) + RAG constrained to instructor-approved courseware (textbooks, slides, transcripts, syllabi). Skill-based architecture, LTI private chat in Canvas/Blackboard, conversation memory, document citations + textual-entailment grounding check, relevance classifier + toxicity filters. | **Deployed service:** since Summer 2023 across Georgia Tech + 2 TCSG colleges, ~1,300 students; avg response 6.8s in Fall 2023 KBAI. **Evaluated:** human-graded accuracy 75–97% across courses (lower on syllabus tables); outperforms legacy intent-classifier Jill and OpenAI Assistants on quality/safety; Spring 2024 analysis shows higher-order (Bloom) questions and increased exploration. **Limitation:** authors state grade/retention gains are preliminary and need further study — no causal learning-outcome claim yet. | Copy RAG-only-from-approved-sources + citation + entailment check + LTI private-chat pattern for CECS grounded answers. Copy moderation pipeline. Do not over-claim grade gains in pilot; report accuracy and fallback rate as CECS will. |

### Takeaway for CECS
All three prove the same core works: RAG constrained to approved materials plus citations and safety filters can scale to hundreds of thousands of queries at low cost. For CECS the lesson is two-tier practice: keep a **human-approved question bank** as the trusted practice source (like Jill's approved-courseware constraint + CS50's TF eval loop for quality), while allowing **AI on-demand quizzes** for flexible drilling with an explicit `AI-draft` label and no auto-promotion into the bank. CECS should copy that grounding and eval discipline, but must add what none of them emphasize: strict isolation of private study notes from retrieval and dashboards, and admin-only handling of identifiable teaching feedback. That privacy + bank-review gate is our differentiator for the pilot and QS story.

## 3. Proposed CECS product and stack ideas

### 3.1 Flow sketches (pilot-minimal)

| Step | Instructor / TA | Student | CECS admin |
|---|---|---|---|
| 1. Access | Sign in with VinUni email + OTP; open only assigned courses. | Sign in with verified VinUni email; open only assigned courses. | Sign in; assign Instructor A / Student A to Course A, Student B to Course B. |
| 2. Materials | Upload PDF/slides (PDF, PPTX, TXT/MD) → status `processing` → `ready`/`failed` → retry if failed → `approve` for students; can unpublish/remove anytime. Removed/draft never retrievable. | See only `approved` materials in own courses (Course B denied for Student A). Open material reader. | Check readiness per course: upload counts, processing/approval states, bank size/coverage (`pending_review` vs `approved_in_bank`). |
| 3. Grounded Q&A | — | Ask question → RAG over approved Course A chunks only → answer with inspectable citation (source title + chunk/page + link) or explicit "insufficient evidence, try rephrasing / ask instructor" when retrieval score low. Optional Web toggle: results labeled `Web`, cited separately, with notice "extends beyond approved course content". History is owner-only. | — |
| 4. Private study | Cannot view/search any student note via UI/API/dashboard/export/log. | In study space (banner: "Private — only you can see this"): annotate material, write or AI-generate personal notes/questions from approved sources, then save/edit/delete/reopen. Server-side `owner_id = auth.uid()` check on every CRUD call. | Never opens private notes; dashboards exclude note content by construction. |
| 5. Question bank (instructor duyệt vào bank) | Review candidate questions (manual / import / AI-suggested from approved sources) → edit → `approve_in_bank` / `reject`. Cannot enter bank without review checkbox + diff saved. Can remove/archive bank questions anytime. Good AI on-demand questions can be `promoted` to `pending_review`, never auto-approved. | — | See bank readiness: pending vs approved counts, coverage per topic. |
| 6. Practice (2 quiz modes cho sinh viên) | View results split by mode to improve teaching; no per-quiz publish gate. | (1) **Bank quiz:** do quiz assembled from `approved_in_bank` questions → trusted formative feedback with source refs. (2) **AI quiz on demand:** pick approved sources + topic/difficulty/type/quantity → AI generates instantly with label `AI-draft, chưa duyệt` → do immediately → feedback with refs + `Report bad question` button. No formal grade in pilot. | See attempt counts and misconception summaries split by bank vs AI-generated only. |
| 7. Insights & feedback | View own courses: activity counts, practice results (bank vs AI split), top misconceptions. No identifiable teaching feedback (per my §1 proposal). | Submit explicit feedback via separate form (course/platform). Told clearly: "Shared with CECS admins only, not private." | View aggregate engagement + readiness + admin-only identifiable feedback; route improvements. |

Key guards across flows: server-side course-membership check on every read/retrieval; bank quizzes only query `approved_in_bank` questions in student's own course; AI on-demand generation only uses approved chunks and is always labeled `AI-draft`; citation built from retrieved metadata (never from LLM free text); unapproved/removed chunks and non-bank questions filtered before embedding search; prompt-injection rule — source text cannot override system instructions or widen access.

### 3.2 Simplest useful pilot vs later

Pilot principle: cut format variety, dashboard depth, and web expansion; preserve authz, private-notes isolation, approved-source retrieval + citations, bank-review gate, testing/monitoring/recovery.

| Feature | Pilot minimal (demo 24 Sep, real persistence + live AI) | Later (explicitly cut now) |
|---|---|---|
| Identity/courses | Email-OTP for `@vinuni.edu.vn`, roles (student/instructor/admin), course memberships, server-side denies (other-course, cross-user notes) | Microsoft SSO, Canvas/LTI sync, bulk roster import |
| Materials | PDF + PPTX + TXT/MD upload (≤50 MB), private storage, extract→chunk→embed pipeline, states `processing/ready/failed/approved/unpublished/removed`, retry/unpublish/remove | DOCX/video/audio, OCR scans, student file uploads, versioning UI |
| Grounded chat | RAG over approved chunks only, metadata-derived citations, insufficient-evidence fallback, owner-only history, PII scrub + injection guard | Multi-turn memory across courses, follow-up suggestions, full web-expansion, chat sharing |
| Private study | Notes/questions save/edit/delete/reopen, owner-only CRUD + tests, privacy banner, AI-generate-from-approved-sources inside private space | Rich-text collaboration, tags/search across notes, spaced-repetition personalization |
| Question bank | Questions table with `draft/pending_review/approved_in_bank/rejected/archived`, source link to approved material chunk; mandatory review/edit before `approved_in_bank`; promote good AI questions to `pending_review` only | Versioning UI, bulk import validation, cross-course sharing, auto-publish |
| Practice (2 modes) | (1) Bank quiz from `approved_in_bank` only; (2) AI quiz on demand from approved sources with `AI-draft` label + report button; both with formative feedback + refs, attempts logged per mode | Formal AI grading/gradebook, adaptive difficulty, extra question formats (code runner, peer review) |
| Insights/feedback | Basic counts/summaries: readiness, activity, attempt rates, misconceptions; feedback channel admin-only identifiable | Advanced analytics, learning-outcome prediction, instructor-visible identifiable feedback, exports |
| Ops | Staging deploy, CI build+critical tests, error/usage/cost logs, daily DB backup + restore runbook, demo accounts + support notes | 99.9% SLA, multi-region, cost autoscaling, full audit UI |

If time threatens 24 Sep: drop PPTX (keep PDF/TXT), drop Web toggle (Course-only answers), keep privacy + citation + bank-review gates at all costs.

### 3.3 Initial stack suggestion

| Tầng | Stack đề xuất | Ý chính |
|---|---|---|
| Frontend | Next.js (React) + Tailwind CSS | UI nhanh, hỗ trợ tốt luồng chat, reader và dashboard phân quyền. |
| Backend & Database | FastAPI (Python) + PostgreSQL (pgvector) | Tối ưu xử lý pipeline AI/RAG bằng Python; một DB duy nhất quản lý quan hệ người dùng, phân quyền môn học và tìm kiếm vector. |
| Auth | Email OTP (domain @vinuni.edu.vn) | Xác thực mã 6 số qua email, không phụ thuộc Microsoft SSO phức tạp cho đợt pilot. |
| AI & Retrieval | Gemini API (1.5 Flash / Flash-Lite) | Tốc độ cao, chi phí rẻ, context lớn phục vụ RAG có trích dẫn từ tài liệu đã duyệt và tạo bài tập. |
| Hosting & Ops | Docker + GitHub Actions CI + Vercel/VPS Staging | Dễ đóng gói, tự động chạy test quyền riêng tư, sẵn sàng staging cho demo 24/09 và ra mắt 05/10. |

> Toàn bộ việc kiểm soát quyền truy cập và cô lập ghi chú cá nhân của sinh viên được thực thi chặt chẽ ở phía server/backend.

### 3.4 QS Reimagine Education angle

This pilot maps directly to a [QS Reimagine Education Awards](https://www.qs.com/conferences/reimagine/apply) story on ethical, scalable AI: course-grounded tutoring with inspectable citations, a privacy-by-design study space that excludes personal notes from analytics, and instructor-curated question bank plus labeled AI on-demand practice. For VinUni's QS-100 ambition, we can submit measurable pilot evidence from 1–4 Fall 2026 courses — citation coverage, insufficient-evidence rate, material readiness, bank size/coverage and bank-vs-AI engagement — showing equitable 24/7 support without compromising academic integrity. The low-cost RAG + managed-services design also proves transferability to other Vietnamese universities, strengthening the "scalability and impact" criterion QS rewards.

## 4. Interests and contribution

- **Experience:** SV năm 4 CNTT HUST. Dùng được Python, mới học cơ bản FastAPI, Postgres/pgvector, RAG/LangChain. Có làm project nhóm STEMVERSE (backend + RAG đơn giản).
- **Preferred work areas (2):** (1) Backend RAG cơ bản (chunk/retrieval, chat có citation); (2) Authz + cô lập private notes.
- **Learning goal (1):** Học làm RAG và test privacy chuẩn production.
- **Support needed:** Tài khoản Claude để hỗ trợ research và code.
- **Concrete Day 2 contribution:** Xây dựng luồng kết nối cơ bản từ lúc Giảng viên tải file PDF lên (upload → chunking → trạng thái ready/approve) cho đến khi Sinh viên hỏi đáp qua RAG và nhận câu trả lời có kèm trích dẫn metadata (tên tài liệu + số trang).

---

