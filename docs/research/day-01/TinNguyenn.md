# Day 1 Research — TinNguyenn

> Target: 700–1,000 words + source links. Work independently, then bring recommendations to team session.
> Branch: `research/TinNguyenn-day01`

## 1. Product understanding

### Instructor / TA journey
TODO: describe sign-in (VinUni email + OTP), assigned courses, upload materials (textbooks, slides, quizzes, assignments), track processing (ready/failed/retry), approve/unpublish/remove, generate draft practice (sources, topic, difficulty, type, quantity), review/edit/publish, view activity/results/engagement/misconceptions.

### Student journey
TODO: describe sign-in, open assigned courses, read approved materials, grounded Q&A with inspectable citations + insufficient-evidence behavior, optional web expansion (labeled Course vs Web), private study space (annotate, personal notes/questions, generate, save/edit/delete), complete published practice + formative feedback, separate feedback channel.

### CECS admin journey
TODO: describe assign users to courses, check readiness (uploads, processing/approval, practice review/publication), view engagement/difficulties/submitted feedback, aggregate insights only (no private notes access).

### Private notes vs shared data
TODO: explain boundary.

| Type | Who can access | Used for insights? | Notes |
|---|---|---|---|
| Private student notes / personal questions / annotations | Owner only | No | Exclude from retrieval, dashboards, ordinary logs; show privacy message; test server-side |
| Course materials (approved) | Assigned course members per role | Yes (status/readiness) | Versioned, approval-gated |
| Submitted feedback (explicit) | Instructor / CECS per visibility rules | Yes | Separate channel from private notes |
| Activity / practice attempts | Aggregated per policy | Yes | No private-note content inside |

### Pilot success signals + assumption to check

TODO: suggest 2 measurable signs + 1 assumption.

1. Signal 1: TODO (e.g., % approved materials with grounded answers + citations clicked, practice completion rate).
2. Signal 2: TODO.
3. Assumption to validate with users: TODO (e.g., instructors will review/publish AI drafts within X days; students trust citations).

## 2. Three university AI learning applications

> Use university pages or original papers. Distinguish announcement vs deployed service vs evaluated outcome. Include source dates + access date (2026-09-14). State when evidence is missing.

| Application and source | Users and learning problem | Key features | Evidence and limitations | What CECS could adopt |
|---|---|---|---|---|
| 1. PyTutor (MIT / GSU / QCC) — https://raise.mit.edu/research/research-projects/pytutor/ — Source date: TODO — Accessed: 2026-09-14 | TODO: who, what problem | TODO: course-material grounding, use of current work + prior interactions | TODO: deployed? evaluated? outcome? If no learning-gain data, state “impact evidence missing” | TODO: e.g., context window design (materials + student work + history), but keep privacy boundary |
| 2. TODO name — source link — Source date: TODO — Accessed: 2026-09-14 | TODO | TODO | TODO: announcement / deployed / evaluated? | TODO |
| 3. TODO name — source link — Source date: TODO — Accessed: 2026-09-14 | TODO | TODO | TODO | TODO |

### Takeaway for CECS
TODO: 2–3 sentences — what to copy, what to avoid (e.g., don’t auto-copy PyTutor context without private-notes isolation).

## 3. Proposed CECS product and stack ideas

### 3.1 Flow sketches (pilot-minimal)
TODO: sketch 3 flows including grounded answers, private notes, reviewed practice, insights.

- Instructor: upload → processing → approve → generate draft → review/edit → publish → insights.
- Student: read approved → ask (citations / insufficient-evidence) → private notes → do practice → feedback.
- Admin: assign → readiness check → engagement view.

### 3.2 Simplest useful pilot vs later
TODO.

**Pilot (by 24 Sep):** TODO — real persistence, live grounded AI, approval gate, owner-only notes, reviewed practice, basic insights.

**Later (do not build now):** TODO — e.g., SSO Microsoft, Canvas, student file uploads, formal AI grading, advanced personalization, extra formats, polish, full web expansion.

### 3.3 Initial stack suggestion
TODO: one option per layer + why + uncertainty. No detailed schema/API needed.

| Layer | Proposal | Why | Uncertainty / fallback |
|---|---|---|---|
| Frontend | TODO | TODO | TODO |
| Backend / Data + private storage | TODO | TODO: authz server-side, private-notes isolation | TODO |
| Auth (email-code) | TODO | TODO | TODO |
| AI / Retrieval (grounded chat, citations) | TODO | TODO: metadata-derived citations, Course vs Web labels | TODO |
| Hosting / Ops | TODO | TODO: staging, monitoring, backup | TODO |

### 3.4 QS Reimagine Education angle
TODO: 3–5 sentences on how pilot ideas (grounded learning, privacy-preserving study space, instructor-in-the-loop practice, measurable pilot evidence) could support a QS Reimagine Education Awards application and VinUni QS-100 ambition. Link: https://www.qs.com/conferences/reimagine/apply

## 4. Interests and contribution

- **Experience:** TODO.
- **Preferred work areas (2):** TODO (e.g., grounded chat + citations; private notes + authz).
- **Learning goal (1):** TODO.
- **Support needed:** TODO (access, pairing, review).
- **Concrete Day 2 contribution:** TODO (must be testable, e.g., “connect one working flow + privacy test for private notes”).

---
*AI assistance disclosure:* TODO: state tools used and what was verified.
