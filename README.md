# CECS AI Learning Hub

Our shared workspace for team documents, research, prototype, and application code.

**Product launch:** 5 October 2026. All basic features must be working and ready to showcase to leaders and faculty, supporting a controlled pilot in 1–4 Fall 2026 courses.  
**Current state:** Documentation only. The AI Studio demo has not been imported; application code, database setup, CI, and staging are not yet available here.

## Start here

1. [Working in this project](docs/team_instructions/WORKING_IN_THIS_PROJECT.md)
2. [Day 1: research and joint product plan](docs/team_instructions/DAY_01_INSTRUCTIONS.md)
3. [Day 2: build and integrate](docs/team_instructions/DAY_02_INSTRUCTIONS.md)
4. [Prototype status](prototypes/README.md)

## Product flows

### Instructor / TA

1. Sign in using an approved VinUni email and one-time code. Microsoft SSO is not required for the pilot.
2. Open assigned courses and upload textbooks, slides, quizzes, assignments, or other supported materials.
3. Track processing, resolve failures, and approve materials for students. Retry, unpublish, or remove materials when needed.
4. Select sources, topic, difficulty, question type, and quantity; generate draft practice/activities; review, edit, and publish.
5. View course activity, practice results, engagement, and common misconceptions to improve teaching.

### Student

1. Sign in with a verified VinUni email and open assigned courses.
2. Read approved instructor materials and ask questions grounded in those materials. Inspect the supporting source and location; receive a clear limitation when evidence is insufficient.
3. Optionally expand a discussion to the web. Clearly label Web sources, cite them, and explain that they extend beyond approved course content.
4. Use a private study space to annotate materials, write or generate personal notes/questions, and save, edit, or delete them.
5. Complete published practice and receive formative feedback with source references.
6. Submit explicit feedback on teaching or the platform through a separate feedback channel.

**Private means private:** Other students, instructors/TAs, and CECS administrators must not access a student's notes or personal questions through the application, APIs, exports, or dashboards. Keep this content out of shared retrieval and ordinary logs. Display this boundary clearly in the study space and test it server-side. Document hosting/operator access before making broader privacy guarantees.

### CECS administrator

1. Assign instructors/TAs and students to courses.
2. Check course readiness: material uploads, processing/approval, and practice review/publication.
3. View course/college engagement, common learning difficulties, and intentionally submitted feedback to guide improvements.
4. Access appropriate aggregate insights without opening students' private study spaces.

## Core pilot requirements

| Area | Required behavior |
|---|---|
| Identity and courses | Email-code verification, roles, course assignments, and server-side authorization |
| Materials | Real records and private storage; upload, processing, ready/failed/retry, approval, unpublish, and removal |
| Grounded chat | Live retrieval and AI answers, inspectable citations, insufficient-evidence behavior, and user-owned history |
| Private study | Personal annotations and notes/questions, including generation; save/edit/delete; owner-only access |
| Practice | Source-based drafts, instructor review/edit/publish, student attempts, and formative feedback |
| Insights and feedback | Instructor and CECS views based on stored activity, material/practice status, and submitted feedback; private notes excluded |
| Operations | Staging/pilot deployment, critical tests, error/usage/cost monitoring, backup/recovery, and run/support instructions |

Define dashboard metrics, permitted data sources, and feedback visibility before implementation. Basic topic summaries and counts are sufficient initially; detailed analytics can follow.

Optional web expansion must distinguish Course and Web sources. Microsoft SSO, Canvas integration, student private **file uploads**, formal AI grading, advanced personalization, extra file/question formats, and visual polish must not delay the pilot. Private notes are a core feature, distinct from optional student file uploads.

## Delivery milestones

| Week and dates (2026) | Required outcome |
|---|---|
| W1 · 11–17 September | Agree scope, stack and data boundaries; assign owners and deadlines; start the integrated application, database/access foundations, CI, and staging |
| W2 · 18–24 September | Demonstrate all core flows: sign-in/course assignment; material lifecycle; live grounded chat/citations; private notes; reviewed practice/feedback; basic instructor/admin insights |
| W3 · 25 September–1 October | Complete integrated and critical security/privacy tests, representative user trials, and release-blocking fixes |
| Launch preparation · 2–4 October | Verify deployment and access, prepare approved demo data, rehearse all three user journeys, and finalize quick-start/support notes |
| Launch · 5 October | Showcase the working product to leaders and faculty with all basic features ready and release evidence accepted |

Onboarding fits inside Week 1. Plan all core features together; do not postpone chat, practice, notes, or dashboards to later feature weeks. The Week 2 demo must use real persistence and live grounded AI, with any remaining gaps reported explicitly.

Reduce polish, format variety, dashboard depth, optional web expansion, conversation extras, or pilot breadth when needed. Preserve authorization, private notes/storage, approved-source retrieval, citations, instructor review, critical testing, monitoring, and recovery. Pilot release requires Mentor acceptance of the evidence.

For the 5 October showcase, demonstrate the instructor, student, and CECS admin journeys on the deployed product using approved sample content. Confirm course assignments, material approval, grounded answers/citations, private notes, reviewed practice, feedback, and insights. Prepare demo accounts, a short walkthrough, known limitations, and a named support contact. Launch preparation is for readiness and rehearsal; all basic features are due in the Week 2 demo.

## Repository map

| Path | Purpose |
|---|---|
| `docs/team_instructions/` | Shared onboarding and delivery rules |
| `docs/research/` | Individual research and joint product plan, created through contributions |
| `docs/exploration/` | Day 2 integration evidence, created through contributions |
| `docs/decisions/` | Reviewed product/technical decisions, added as agreed |
| `prototypes/` | Reference-demo guidance; source import pending |
| `src/`, `tests/`, `.github/` | Planned application, tests, and automation; not yet created |

Organize code by feature with shared components and services. Keep reference-demo dependencies separate until a reviewed decision establishes the application baseline. Use task branches, not permanent branches per person or specialty.
