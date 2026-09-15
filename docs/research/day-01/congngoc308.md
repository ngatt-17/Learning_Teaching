# Day 1 — Individual Research: congngoc308

## 2.1. Product understanding

### Three user journeys

**Instructor / TA journey**

The instructor signs in using a verified VinUni email and a one-time code (OTP). Microsoft SSO is not required for the pilot. Upon entering the application, the instructor opens assigned courses and uploads teaching materials (textbooks, slides, exams, practice sets, etc.). The system processes these materials, and the instructor monitors their status: processed successfully → approve for student access; failed → retry processing or remove the file. The instructor can also select source materials, topic, difficulty level, question type, and quantity to generate draft practice activities; then review, edit, and publish them for students. Additionally, the instructor views course activity dashboards: practice results, engagement levels, and common student misconceptions to refine classroom teaching.

**Student journey**

The student signs in with a verified VinUni email and accesses assigned courses. The student reads approved instructor materials and asks questions grounded in those materials. The AI provides course-grounded answers accompanied by inspectable citations (source material name, page/section). When supporting evidence is insufficient, the system displays a clear limitation message. Optionally, the student can expand a discussion to the web, with Web sources clearly labeled and distinguished from approved course content. The student uses a private study space to take notes, draft personal questions or generate them via AI, and save, edit, or delete them. The student completes published practice exercises and receives formative feedback with source references. Finally, the student can submit explicit feedback on teaching or the platform through a dedicated, separate feedback channel.

**CECS Administrator journey**

The CECS administrator signs in and performs user management: assigning instructors/TAs and students to courses. The admin verifies course readiness by checking material uploads, processing/approval status, and practice review/publication. The admin views aggregate dashboards at the course and college levels: overall engagement metrics, common learning difficulties, and intentionally submitted feedback to guide institutional improvements. Crucially, the administrator only accesses aggregate insights and must **never** view or access a student's private study space.

### Private notes vs. course materials, submitted feedback, and dashboard data

| Data category | Created by | Accessible by | Purpose | Appears on dashboard? |
|---|---|---|---|---|
| **Course materials** | Instructor uploaded & approved | All enrolled students in the course | Official course learning content | Yes (upload/approval status) |
| **Private notes** | Student (manually written or AI-generated) | **Owner student only** | Personal study notes & reflection | **No** — excluded from dashboards, APIs, exports, retrieval, & logs |
| **Submitted feedback** | Student (intentionally submitted) | Instructor + CECS Admin | Constructive feedback on teaching or platform | Yes (in feedback module) |
| **Dashboard data** | System aggregated from activity | Instructor + CECS Admin | Analytics on engagement, results, & misconceptions | Yes (forms the dashboard itself) |

Core distinction: **Private notes are the absolute personal property of the student.** No other student, instructor/TA, CECS administrator, or AI retrieval system can access them — whether through direct API requests, user interfaces, data exports, or logs. This boundary is enforced server-side and communicated explicitly in the UI ("Private means private"). In contrast, submitted feedback is an intentional, explicit action by the student aimed at instructors/admins, making it fundamentally different from private notes.

### Two measurable signs of pilot success

1. **Meaningful Grounded Chat Adoption Rate:** At least 60% of students in pilot courses actively use the AI grounded chat at least 3 times per week during the first two weeks, with at least 80% of generated responses containing valid, inspectable citations pointing directly to approved course materials. This demonstrates that the grounded RAG system provides real academic value.

2. **Instructor Practice Adoption & Publication:** At least 75% of pilot instructors successfully generate at least one AI practice draft, review/edit it, and publish it for students within the first two weeks. Concurrently, at least 50% of enrolled students complete the published practice and receive formative feedback. This proves adoption on both teaching and learning sides.

### One assumption to check with users

**Assumption: Students will trust and actively use the private study space once clear privacy guarantees are stated.** We must verify whether students truly believe their notes and personal questions remain private, or if privacy concerns prevent them from writing candid notes. If students lack trust in server-side isolation, the private study space feature will be underutilized despite being fully built. *Verification method:* Conduct short interviews or surveys with 5–10 pilot students after Week 1 asking: "Do you feel comfortable keeping personal study notes on the platform? Why or why not?"

---

## 2.2. Three university examples

| Application and source | Users and learning problem | Key features | Evidence and limitations | What CECS could adopt |
|---|---|---|---|---|
| **CS50 Duck (CS50.ai)** — *Harvard University* — [CS50.ai Portal](https://cs50.ai/) / SIGCSE 2024 & 2025 — *Access:* Sep 2026 — *Source:* 2023–2025 | **Users:** CS50 students at Harvard, Yale, and tens of thousands of CS50x learners. **Problem:** TAs overwhelmed during off-hours; students prone to misusing AI to copy solutions. | **Socratic AI Tutor**: guides thinking step-by-step, refuses to provide full code solutions. Integrated into VS Code. **Rate Limiting (hearts)**: 10 hearts max, 1 regenerates every 3 minutes, forcing independent thought. Academic integrity policy: CS50.ai allowed; external ChatGPT/Claude for solutions prohibited. | **Evidence:** Supported tens of thousands of learners; SIGCSE 2024 recorded positive student sentiment ("like a 24/7 1:1 tutor"). **Limitations:** Highly abstract questions yield broad responses; requires continuous guardrail updates against jailbreaks. | Socratic Formative Feedback for Practice. Rate Limiting to prevent spam/overreliance. Clear limitation messages when AI context is insufficient. Academic integrity guidelines. |
| **Maizey (Custom GenAI Platform)** — *University of Michigan* — [UMich GenAI](https://genai.umich.edu/maizey) — *Access:* Sep 2026 — *Source:* 2023–2025 | **Users:** Instructors, staff, and students across UMich. **Problem:** Course data fragmented across Canvas/Drive; risk of leaking exam data if using public LLMs. | **Enterprise RAG** connected directly to Canvas LMS, Google Drive, PDFs. Instructors configure custom bots per course: select document stores, define system prompts. Role-based access control (RBAC); enterprise agreement ensuring data is not used for model training. | **Evidence:** Deployed across hundreds of courses; instructors reported significant reductions in repetitive administrative forum queries. **Limitations:** High token/RAG API costs at campus scale; effectiveness depends heavily on curated document indexing. | Instructor Upload & Approve Materials + RAG grounded chat + Citations. Data isolation between courses. Server-side RBAC. |
| **Code-in-Place AI Assistant** — *Stanford University* — [Code-in-Place](https://codeinplace.stanford.edu/) / SIGCSE/EDM — *Access:* Sep 2026 — *Source:* 2023–2025 | **Users:** Code in Place 2021: over 12,000 global students and 1,120 Section Leaders (cumulative cohorts larger). **Problem:** Lack of human capacity to review code style and identify misconceptions at scale. | **Real-time Style & Logic Feedback (RTSF)**: combines static analysis with LLMs. **Human-in-the-loop**: drafts feedback for TA/Instructor approval before sending. Analyzes submissions to cluster common student misconceptions (MalruleLib). | **Evidence:** SIGCSE/EDM studies: student agreement with AI feedback reached 97.9% (2021); students receiving RTSF were 5x more likely to resubmit; >79% corrected code style accordingly. **Limitations:** Requires detailed rubrics per problem; human oversight needed to catch subtle logic errors. | Instructor Review & Approve for AI practice. Dashboard Misconception Analytics. RTSF for coding courses if applicable. |

### Data verification notes

| Metric / Claim | Status | Recommendation |
|---|---|---|
| ~40% reduction in admin queries (UMich) | Direct citation unverified | Frame as "significant reduction" or cite UMich GenAI report |
| 60,000 Code in Place students | Likely cumulative across cohorts | Specify exact year or label as "cumulative" |
| 97.9% student agreement with AI feedback (Stanford 2021) | Verified in EDM 2021 paper | Use exact 97.9% with 2021 citation |
| No decrease in exam scores (CS50) | Verify against SIGCSE 2024 paper text | Cite SIGCSE 2024 explicitly |

### Key references

- CS50.ai Portal: https://cs50.ai/
- Liu et al., *Teaching CS50 with AI*, SIGCSE 2024.
- Liu et al., *Improving AI in CS50*, SIGCSE 2025.
- UMich GenAI Initiative — Maizey: https://genai.umich.edu/
- Stanford Code-in-Place: https://codeinplace.stanford.edu/
- Related SIGCSE/EDM papers on Code in Place, RTSF, and MalruleLib.


---

## 2.3. Proposed CECS product and stack ideas

### Three core lessons from the research

1. **RAG + Data Isolation (UMich Maizey):** Strict data isolation between courses is essential — students must only query approved materials within their assigned courses. Student data must never be shared with public model training pipelines.
2. **Socratic Feedback + Rate Limiting (Harvard CS50 Duck):** AI should guide thinking through Socratic prompting rather than handing out direct answers. Rate limiting (hearts system) prevents spam. A clear academic integrity policy must distinguish approved internal AI tools from unapproved external tools.
3. **Human-in-the-loop + Misconception Dashboard (Stanford Code-in-Place):** All AI-generated practice must undergo **Instructor review & approval** before publication. Aggregating student misconceptions on dashboards empowers instructors to address learning gaps in class.

### Sketch of three user flows for CECS pilot

**Flow 1 — Instructor / TA:**

```
[Authentication] Enter VinUni email → Receive OTP → Sign in → Select assigned course

[Material lifecycle]
  Upload document (PDF/slides) → System processing (chunking + embedding)
  → Status: Processing → Ready / Failed
  → Ready: Instructor reviews & Approves → Accessible by students
  → Failed: Retry processing or Remove file
  → Approved: Can Unpublish or Remove at any time

[Reviewed practice]
  Select source materials + topic + difficulty + question type + quantity
  → AI generates practice draft (DRAFT state — invisible to students)
  → Instructor reviews each question → Edit / Delete / Add
  → Publish → Students attempt practice + receive formative feedback

[Course insights]
  View dashboard: material access counts, practice completion rates,
  common misconceptions (aggregated from incorrect attempts), submitted feedback
  → CANNOT view students' private study notes
```

**Flow 2 — Student:**

```
[Authentication] Enter VinUni email → Receive OTP → Sign in → Select assigned course
  → Only assigned courses visible; cross-course access denied server-side

[Course-grounded answers]
  Read approved materials → Ask question in grounded chat
  → Backend queries vector DB (pgvector) restricted to APPROVED materials for that course
  → LLM generates grounded answer + inspectable citations (doc name, page/paragraph)
  → Student clicks citation → jumps to exact source location in material
  → If evidence is insufficient → AI responds: "I cannot find sufficient evidence
    in the approved course materials to answer this question."
  → [Optional] Expand to Web: results clearly labeled [Web],
    accompanied by notice: "This content extends beyond approved course materials."

[Private notes]
  Open Private Study Space → Create new note (manually or AI-assisted)
  → Save / Edit / Delete note — owner student access only
  → Server-side enforcement: API rejects any read/write request if user_id != note.owner_id
  → Private notes EXCLUDED from: dashboards, retrieval, exports, logs, & feedback

[Practice + Feedback]
  View published practice → Complete exercise → Submit
  → Receive formative feedback per question + source citations
  → Submit explicit feedback on teaching/platform via separate feedback channel
```

**Flow 3 — CECS Administrator:**

```
[Authentication] Sign in (VinUni email + OTP)

[Course management]
  Create course → Assign instructors/TAs → Assign students
  → Check course readiness: materials (uploaded/processed/approved),
    practice (drafted/reviewed/published)

[Aggregate insights]
  View course-level and college-level dashboards:
  → Engagement: access counts, active usage, completion rates
  → Learning difficulties: common misconceptions aggregated from practice
  → Feedback: intentionally submitted student feedback only
  → CANNOT access private study notes, personal chat history, or private notes
```

### Simplest useful pilot version (Core vs. Later)

Principle: keep everything necessary to run 3 user flows end-to-end for 1–4 Fall 2026 pilot courses. Cut optional scope that does not block the core demo.

**Core Pilot (Required by 24 September):**

| Area | Core scope |
|---|---|
| Identity | Email OTP verification for @vinuni.edu.vn addresses |
| Materials | Upload PDF/slides → processing → approve/reject/retry/remove/unpublish |
| Grounded Chat | RAG grounded on APPROVED materials + inspectable citations + insufficient-evidence behavior |
| Private Notes | CRUD (create/read/update/delete), owner-only access, server-side enforcement |
| Practice | AI draft generation → instructor review/edit → publish → student attempt → formative feedback |
| Dashboards | Topic summaries, activity counts, misconceptions, submitted feedback (private notes excluded) |
| Authorization | Server-side RBAC: roles (student/instructor/admin) + course membership check |
| Operations | Runnable staging environment, passing CI pipeline |

**Later list (Post-pilot — must not delay launch):**
- Microsoft SSO, Canvas LMS integration
- Extra file formats: video, SCORM, audio
- Optional Web expansion (implement if time permits, but non-blocking)
- AI flashcard generation, spaced repetition algorithms
- Formal AI grading, adaptive difficulty engines
- Advanced analytics, learning personalization
- Student private file uploads (distinct from private notes)
- Fine-grained permissions, UI visual polish


### Proposed technical stack

| Layer | Recommended stack | Reasoning |
|---|---|---|
| **Frontend** | React (Vite) + Tailwind CSS | Team familiarity with React; Vite provides fast HMR/builds; Tailwind accelerates styling; rich component ecosystem (shadcn/ui, Radix) for rapid prototyping |
| **Backend** | Python FastAPI | Native async performance; seamless integration with Python AI/ML ecosystem (LangChain, OpenAI SDK); auto-generated OpenAPI docs speed up frontend-backend integration |
| **Database** | PostgreSQL + pgvector | PostgreSQL: robust relational support for users/roles/courses/memberships/notes; pgvector extension for vector similarity search in RAG — single database simplifies operations |
| **Private storage** | Azure Blob Storage | Stores raw files (PDFs, slides) separately from DB; container access restricted per course_id; leverages existing VinUni Azure tenant |
| **AI / Retrieval** | Azure OpenAI (GPT-4o) + LangChain | Enterprise agreement ensures data privacy (no model training); LangChain orchestrates RAG pipeline (load → chunk → embed → retrieve → generate); pgvector as vector store |
| **Email OTP** | SendGrid / Azure Communication Services | Fast setup (<1 day), near-zero cost for pilot scale, straightforward API |
| **Hosting** | Azure App Service + Azure Database for PostgreSQL Flexible Server | Aligns with VinUni Azure tenant; managed DB reduces ops; App Service integrates with GitHub CI/CD; easy staging/production separation |
| **CI/CD** | GitHub Actions | Repo hosted on GitHub; workflow: lint → test → build → deploy staging; free for public repos |

**Overall reasoning:** This stack minimizes operational overhead for a 6-person team delivering in 3 weeks — 1 primary DB engine (PostgreSQL + pgvector), 1 cloud provider (Azure), 1 primary backend language (Python). *Fallback plan:* If Azure provisioning is delayed, use Supabase (hosted PostgreSQL + pgvector) + Vercel (frontend) + Railway (backend) to unblock Week 1 development.

**Uncertainties:**
- GPT-4o token costs at scale — need usage monitoring and budget alerts ($50–100/month estimated for pilot).
- pgvector performance is sufficient for pilot (~100–1,000 documents) but may require dedicated vector DB (Pinecone/Weaviate) if scaling significantly.
- VinUni Azure tenant access, quotas, and region availability require early confirmation.
- LangChain introduces a minor learning curve but saves development time building RAG pipelines from scratch.

### Potential for QS Reimagine Education Awards

The CECS AI Learning Hub is well-positioned for the **"AI in Education"** and **"Nurturing Creativity and Critical Thinking"** categories at the [QS Reimagine Education Awards](https://www.qs.com/conferences/reimagine/apply), directly supporting VinUni's QS-100 ambition:

1. **Grounded AI + Citations** — All responses are cited directly from instructor-approved materials, ensuring academic rigor — distinguishing it from ungrounded generic AI chatbots.
2. **Socratic Formative Feedback** — Guides student reasoning rather than giving away answers, directly advancing critical thinking (supported by research from Harvard CS50 and Stanford Code-in-Place).
3. **Privacy-first design** — Server-side enforced private study space demonstrates an institutional commitment to student data privacy in the AI era — a key strength in AI ethics.
4. **Human-in-the-loop** — Mandatory instructor review before publishing AI practice builds a strong narrative: "AI empowers instructors, it does not replace them."
5. **Measurable pilot outcomes** — Deployment in 1–4 Fall 2026 courses provides empirical evidence (usage rates, citation accuracy, practice completion) which QS evaluates highly.


---

## 2.4. Interests and contribution

### Relevant experience

I have practical experience in web frontend development and have independently designed, built, and deployed an end-to-end mobile application — from UI/UX design to backend integration and deployment. Additionally, I possess foundational knowledge of Large Language Models (LLMs) and Computer Vision (CV) at a conceptual level, understanding API integration patterns and model limitations. This background enables me to contribute immediately from Day 1 to both user interface development and AI integration tasks.

### Two preferred work areas

1. **Frontend & UX Flows** — Building intuitive user interfaces across all three user journeys (student, instructor, admin): grounded chat interface, private study space, material management UI, and practice exercise flow. Focus on handling loading, error, and access-denied states clearly with a consistent user experience.

2. **Testing & Dashboard** — Writing comprehensive test cases for authorization rules (course data isolation, private notes ownership verification), testing edge cases (unapproved materials, out-of-scope questions), and supporting the implementation of instructor and admin insight dashboards.

### One learning goal

My primary objective extends beyond technical skills: I aim to learn effective teamwork within a professional corporate software engineering environment — collaborating via PRs/issues/project boards instead of informal group chats, escalating blockers proactively, giving and receiving constructive code reviews, and maintaining delivery commitments in interdependent team settings. Concurrently, I want to deepen my practical knowledge of LLM engineering: RAG pipeline optimization, prompt engineering for grounded answers, and evaluating AI output quality in higher education.

### Support needed

- **AI Tooling:** Access to Claude (Anthropic) for research, coding assistance, and review — particularly valuable when working with LangChain orchestration and prompt engineering.
- **API Budget:** Requesting team/mentor approval for API key usage budgets (OpenAI / Azure OpenAI) during development and testing to prevent work stoppages due to quota limits.
- **Technical Networking:** If possible, I welcome connections with team members experienced in Computer Vision or mobile development for technical exchange — supporting a personal academic research effort alongside this project (not blocking project progress).

### Concrete Day 2 contribution

On Day 2, I will focus on **clarifying and documenting detailed system use cases** — explicitly defining functional behaviors, state transitions, and edge conditions for each user flow. Specifically, I will write clear acceptance criteria for at least 3 core use cases (grounded chat with citations, private notes CRUD with access denial enforcement, and instructor material approval), while beginning the frontend implementation for the student flow (chat UI and private study space screens) connected to backend API endpoints built by the Platform & Access pair. *Concrete output:* Wireframes/mockups for student screens plus at least 1 working interface screen integrated with real API endpoints.

