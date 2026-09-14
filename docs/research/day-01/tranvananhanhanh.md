# Day 1 Research & Product Proposal — tranvananhanhanh

**Date:** 14 September 2026  
**Author:** tranvananhanhanh (khuctieuho@gmail.com)  
**Project:** CECS AI Learning Hub (VinUniversity)

---

## 1. Product Understanding

### 1.1. Core User Journeys

The CECS AI Learning Hub addresses three distinct user roles within the College of Engineering and Computer Science (CECS):

**1. Instructor / Teaching Assistant (TA):**
- **Material Ingestion & Verification:** Instructors upload course assets (lecture slides, syllabi, textbooks, code samples, problem sets). They monitor processing status (Ready / Failed / Retry) and explicitly approve materials before student access.
- **Assisted Practice Generation:** Instructors configure parameters (source, topic, difficulty, question type) to generate draft quizzes. Instructors review, edit, and publish before students can attempt them.
- **Pedagogical Analytics & Feedback Loop:** Instructors view aggregated metrics on engagement, common questions, misconceptions, and anonymous student feedback (e.g., pace-adjustment requests).

**2. Student (Student-Centric Learning Experience):**
- **Course-Grounded Q&A with Socratic Guidance:** Students interact with an AI tutor grounded in approved course materials. Responses include citations (document name + page/slide number). Rather than providing final answers immediately, the AI offers scaffolded Socratic hints to encourage reasoning. When course materials lack sufficient evidence, the system explicitly states this.
- **Controlled Web Expansion:** Students may optionally expand queries to web sources; results are labeled clearly to distinguish from official course content.
- **Private Study Space — Server-Enforced Owner-Only Access:** Students maintain an isolated personal workspace to take notes, annotate materials, and ask questions without peer judgment. Access is enforced at the server and database level. Note: hosting/operator access will be documented separately before any broader privacy guarantees are made.
- **Formative Practice & Anonymous Pacing Feedback:** Students complete published practice, receive formative feedback with source references, and may submit anonymous pace-adjustment requests to instructors.

**3. CECS Administrator:**
- **Governance & Readiness:** Manage course assignments, enrollments, and track material processing and practice publication status.
- **College-Level Insights:** Access aggregate statistics on engagement and learning bottlenecks without accessing individual student private study spaces.

---

### 1.2. Privacy Boundaries: Private Notes vs. Shared Data

Privacy is a non-negotiable architectural boundary:

- **Private Student Notes:** Personal notes, self-generated questions, and annotations belong exclusively to their creator. Access is enforced server-side and at the database level (row-level policies). These are excluded from shared vector retrieval, public APIs, admin exports, instructor dashboards, and ordinary logs. Infrastructure/operator access will be documented before broader privacy guarantees are made.
- **Course Materials:** Accessible to all enrolled students and instructional staff after instructor approval.
- **Submitted Feedback:** Voluntarily submitted by students (anonymized if configured) for instructor review.
- **Dashboard Data:** Anonymized aggregated metrics (question topics, misconception tags) — never revealing individual note contents.

---

### 1.3. Pilot Hypotheses & Target Metrics

*These are initial targets for validation, not proven benchmarks. Methodology for each is described in Section 3.3.*

- **Pilot Target 1 (Citation Correctness):** ≥85% of student queries return responses citing valid source documents with page/slide numbers, measured against a manually sampled evaluation set; hallucination rate <5% under predefined test cases.
- **Pilot Target 2 (Weekly Active Adoption):** ≥60% WAU (Weekly Active Users) among enrolled students in the 1–4 pilot courses — used to assess product-market fit, not a guaranteed outcome.
- **Key Assumption to Validate:** *Students find Socratic-guided responses and course-grounded answers more useful for learning than ungrounded general chatbots.*

---

## 2. Three University AI Learning Applications

*Research note: Each claim below is sourced from publicly available university or conference publications. Where specific metrics were not directly confirmable, conservative descriptions are used.*

| Application & Source | Users & Learning Problem | Key Features | Evidence & Limitations | What CECS Could Adopt |
|---|---|---|---|---|
| **1. MAIC (Massive AI-empowered Course)**<br>*Tsinghua University*<br>[Source: MAIC project site / NeurIPS 2024 paper (if available); Access Date: 14 Sep 2026] | **Users:** Large-scale undergraduate engineering courses at Tsinghua.<br>**Problem:** High cost of interactive online course delivery; students passive in traditional lecture settings. | • **Multi-Agent Classroom:** AI Teacher dynamically adjusts lecture pacing; AI Teaching Assistants respond to individual questions; AI Classmates with varied personas simulate peer discussion.<br>• Course-grounded Q&A with citations and automated quiz generation.<br>• Instructor uploads slides; system generates the interactive experience. | • **Evidence:** Reported large-scale interactions and high student satisfaction in Tsinghua pilot deployments; OpenMAIC was released as open-source (GitHub star count not directly verified by this author at time of writing).<br>• **Limitations:** Requires ongoing expert oversight to reduce hallucinations; less suitable for hands-on physical lab courses. | • AI-assisted classroom pacing and Q&A grounded in approved lecture materials.<br>• Automated quiz generation from uploaded slides, with instructor review before publication. |
| **2. Finch AI Student Tutor**<br>*Oxford University Press (OUP)* — *Note: OUP is a department of the University of Oxford but operates independently as a publisher.*<br>[Source: OUP Finch project documentation; Access Date: 14 Sep 2026] | **Users:** Science Foundation Year students (OUP partnership).<br>**Problem:** Students over-rely on direct answers, reducing deep conceptual understanding. | • **Socratic Tutoring Engine:** Decomposes complex queries into manageable sub-questions; provides hints and guided reasoning steps rather than direct answers.<br>• Personalized self-testing and revision materials. | • **Evidence:** Pilot with hundreds of participants showed measurable gains in conceptual confidence.<br>• **Limitations:** Currently narrow in subject scope; dependent on OUP content integration. | • **Socratic prompting pattern:** For practice questions, AI offers scaffolded hints before full explanations — directly applicable to CECS programming and math courses. |
| **3. PKU Zhixue (北大智学)**<br>*Peking University — Boya AI Education Platform*<br>[Source: PKU Boya AI Platform official documentation 2024–2026; Access Date: 14 Sep 2026] | **Users:** Faculty and students in core CS courses at PKU.<br>**Problem:** Students have varied learning paces and limited 24/7 access to personalized guidance; instructors face grading burden. | • **Student-side:** 24/7 course-specific Q&A, active inquiry prompts, and learning path suggestions.<br>• **Instructor-side:** AI-assisted course material drafting and student learning analytics. | • **Evidence:** Operational across multiple university-wide CS courses at PKU.<br>• **Limitations:** Quantitative learning outcome data is not yet widely published for non-programming disciplines. | • **Instructor-in-the-loop workflow:** AI generates draft assessments and material summaries; instructors retain full editorial and approval authority before publication.<br>• 24/7 Q&A grounded in course-specific knowledge base. |

---

## 2.5. Prior Team Exploration: VLearn AI Notes Prototype

Before Day 1, our team built a small interactive prototype to explore **how AI can assist students in taking notes from a lecture** — an area directly relevant to the Private Study Space feature proposed in this report.

**Prototype:** [VLearn AI Notes — Three Note-Taking Approaches (A / B / C)](https://chipper-basbousa-bccf28.netlify.app/)  
**Context used:** Lesson 4 — Vector Database & RAG Basics (32-minute lecture with slides; instructor also elaborates beyond slide content).  
**Prototype type:** Internal UX/interaction concept demo; not yet formally evaluated with real users.

The prototype explored three distinct AI-assisted note-taking interaction models (Option A / B / C) applied to the same lesson content, simulating the scenario where a student is preparing for an exam two weeks later. The goal was to understand which interaction model feels most natural and useful from the student's perspective.

**Relevance to CECS AI Learning Hub:**

| Dimension | Observation from Prototype |
|---|---|
| **Note structure** | AI-generated structure from lecture content helps students who struggle to organize raw notes from dense slides |
| **Student agency** | Students need the ability to edit, annotate, and personalize AI-generated notes rather than receive a fixed output |
| **Lecture coverage gap** | Content spoken by the instructor beyond what appears on slides is a common student pain point — AI notes should capture both |
| **Private space boundary** | Notes generated in this context should remain strictly personal; the prototype reinforces why owner-only access is architecturally necessary |

**Limitations of the prototype:**
- No formal user testing or quantitative evaluation has been conducted.
- The demo uses a single fixed lesson; behavior across diverse course types and formats (math-heavy, code-heavy) has not been validated.
- The prototype does not yet integrate with course-approved material retrieval or citation grounding.

**Design lesson for CECS:** Rather than auto-generating a final note document, the most useful pattern appears to be **AI-assisted scaffolding** — the system proposes a structure and key points, and the student fills in, edits, and annotates to make it their own. This aligns with Private Study Space as an *active learning tool*, not a passive content repository.

---

## 3. Proposed CECS Product & Stack

### 3.1. Feature Scope — Prioritized by Delivery Risk

Given a team delivery deadline of **24 September** for core flow demo and **5 October** for launch, features are prioritized as follows:

#### P0 — Absolutely Critical (Week 1–2)
Must function end-to-end for the Week 2 demo:
1. **Email-OTP Authentication & Server-Side Role Authorization** — Instructor, Student, Admin roles enforced at every API endpoint.
2. **Material Upload, Processing & Approval Pipeline** — PDF/PPTX ingestion, chunking with page-level metadata, instructor approve/unpublish/remove workflow.
3. **Grounded RAG Chat with Citations & Insufficient-Evidence Handling** — Retrieval from approved materials only; inspectable citations (document name + slide/page number); explicit fallback message when evidence is insufficient.
4. **Private Study Space — Server-Enforced Owner-Only Access** — Personal notes and self-generated questions; database-level isolation; no shared retrieval or admin access.

#### P1 — Core Feature (Week 2)
Required for a complete core flow demo:

5. **Practice/Quiz Generation, Instructor Review & Student Attempt with Formative Feedback** — AI-drafted questions; instructor edits and publishes; students attempt; feedback references source materials.
6. **Anonymous Pacing Feedback Channel** — Students submit anonymous requests; aggregated for instructor view.

#### P2 — Supporting Feature (Week 2–3)
7. **Basic Instructor & Admin Insights Dashboard** — Aggregated question topics, misconception tags, quiz score summaries.

#### P3 — Later Roadmap (Post-Pilot)
- Socratic multi-step guided tutoring mode (beyond basic hints)
- Slide-to-micro-lesson decomposition with structured learning paths
- Curriculum Knowledge Graph across the 4-year CECS program
- Multi-agent virtual classroom peers (MAIC-style)
- Microsoft SSO, Canvas LTI integration, formal auto-grading

*Note: Per the project README, Microsoft SSO, Canvas integration, advanced personalization, and visual polish must not delay the pilot.*

---

### 3.2. Recommended Baseline Tech Stack

A single recommended baseline for the team to validate on Day 2, with alternatives noted only if implementation constraints require them.

| Layer | Recommended Baseline | Rationale |
|---|---|---|
| **Frontend** | Next.js 14+ (App Router) + TypeScript + Tailwind CSS | SSR support, strong React ecosystem, fast iteration |
| **Backend API** | FastAPI (Python 3.11+, async) | Native Python AI library compatibility (LlamaIndex, PyMuPDF, Unstructured) |
| **Database** | PostgreSQL + Row-Level Security (RLS) | Relational integrity; RLS enforces private notes isolation at DB level |
| **File Storage** | Supabase Storage or S3-compatible object store | Secure private material storage separate from DB |
| **Vector Store** | pgvector (same PostgreSQL instance) | Avoids additional service; hybrid BM25+vector in one DB |
| **Retrieval** | Hybrid: dense semantic embeddings + BM25 keyword | Handles both concept-level and exact-term matching from slides |
| **LLM API** | Team-agreed model API (Gemini or equivalent) | To be finalized in Joint Planning based on API access and cost |

*Alternatives may be evaluated if implementation or cost constraints require them; decisions to be recorded in `docs/decisions/`.*

**Technical uncertainties to validate on Day 2:**
- Accuracy of page-number metadata extraction from PDF/PPTX at the chunk level.
- RLS policy correctness under cross-user query scenarios (security test required).
- Latency and cost of hybrid retrieval at pilot scale.

---

### 3.3. Evaluation Methodology

| Metric | Measurement Method |
|---|---|
| Citation correctness | Human evaluation on a manually sampled set of student queries vs. retrieved source |
| Groundedness | % of answer sentences supported by at least one retrieved chunk |
| Hallucination rate | % of factual claims not supported by retrieved context, in predefined test cases |
| Retrieval Recall@K | Gold-source benchmark: does the correct slide appear in top-K retrieved chunks? |
| Socratic response quality | Rubric: does AI offer a hint → reasoning scaffold → final answer sequence? |
| Quiz quality | Instructor acceptance rate (% of AI-generated questions approved without edit) |
| WAU (adoption) | Weekly unique students who perform at least one action (chat, quiz, note) |
| Privacy enforcement | Automated cross-user authorization tests: student A cannot access student B's notes |

*Baseline measurements will be established during Week 2 demo using real course materials from the pilot.*

---

### 3.4. Strategic Alignment with VinUni's Educational Innovation Goals

The CECS AI Learning Hub has potential to position VinUni as a regional leader in responsible, evidence-based AI adoption in higher education — which may align with opportunities such as the **QS Reimagine Education Awards** (*AI in Education* or *Nurturing Critical Thinking* categories). This is a potential strategic positioning opportunity, not a guaranteed outcome.

Three areas of differentiation worth developing as evidence for any future award application:
1. **Pedagogical intent over raw automation:** Socratic guidance, instructor-in-the-loop approval, and grounded citations distinguish the hub from a generic chatbot.
2. **Privacy by design:** Explicit server-enforced isolation of student private work, with documented operator access boundaries, addresses a gap in most existing university AI deployments.
3. **Instructor empowerment:** The platform is designed to reduce instructor burden while keeping instructors in control of what students access — a balance that is often missing in fully automated tutoring systems.

---

## 4. Interests & Contribution

**Relevant Technical Experience:**
- Python backend development, RESTful API design, async systems.
- React/Next.js frontend, PostgreSQL schema design and query optimization.
- LLM integration: prompt engineering, embedding pipelines, vector search.

**Preferred Work Areas (2):**
1. **RAG Retrieval Pipeline & Citation Grounding** — Slide ingestion, chunking with page metadata, hybrid retrieval, and citation extraction.
2. **Backend API & Privacy Architecture** — OTP authentication, role-based authorization, and RLS configuration for private notes isolation.

**Personal Learning Goal (1):** Build and benchmark a production-grade hybrid retrieval system (BM25 + dense vector) with verifiable citation fidelity on real lecture materials.

**Support Needed:**
- Sample CECS lecture materials (at least one course: slides + syllabus) for retrieval benchmarking.
- Agreed team LLM API access and cloud staging environment.

**Day 2 Contribution:** Contribute to the integrated material-ingestion and grounded-RAG pipeline within the shared application codebase — specifically the PDF parsing, chunk-level page metadata extraction, hybrid retrieval, and citation output. Will deliver a working vertical slice (not a standalone prototype) with a test case demonstrating correct citation and explicit insufficient-evidence fallback behavior.
