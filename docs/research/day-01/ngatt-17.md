# Day 1 Research: CECS AI Learning Hub — Product Proposal

**Author:** ngatt-17  
**Project:** CECS AI Learning Hub — VinUniversity  
**Date / Sources accessed:** 14 September 2026

---

## 2.1 Product Understanding

The pilot targets 1–4 courses in Fall 2026, launching 05 October 2026, with three user roles.

**Instructor / TA:** Authenticates via VinUni email OTP. Uploads materials (PDFs, slides, problem sets) and monitors processing status (`uploading → processing → ready / failed → retry`). Approves materials before student access. Reviews and publishes AI-drafted practice questions. Views aggregated misconception and engagement dashboard.

**Student:** Accesses only enrolled courses. Grounded chat returns answers from approved materials with inspectable citations (`[Document, Page X]`). When evidence is absent the system must say "insufficient evidence" — no hallucination. The **Private Study Space** (personal notes, self-made questions) is exclusively the student's own: no instructor, admin, or peer may read it through any interface, API call, or export. Students submit course feedback through a separate channel.

**CECS Administrator:** Assigns users to courses, monitors material-readiness rates, views aggregated engagement reports. Accesses **no content** from individual Private Study Spaces.

### Data Partition Boundaries — "Private means private"

| Partition | Who can read | Enters RAG index? | Storage |
|---|---|---|---|
| **Private Notes / Annotations** | Owner only | **Never** | Separate table, `user_id` FK, server-side row filter |
| **Course Materials** | Enrolled instructors, TAs, students (post-approval) | **Yes** — chunked & vectorised | Secure file store + pgvector |
| **Submitted Feedback** | Instructor + CECS Admin | **No** | Separate channel, optional anonymity |
| **Dashboard Insights** | Instructor + CECS Admin | **No** (aggregated only) | Computed from query logs & submissions; Private Notes excluded |

### Pilot Success Metrics

- **Groundedness ≥ 85 %:** AI responses cite an approved source correctly ≥ 85 % of the time; student helpfulness rating ≥ 80 %.
- **Private Space Adoption ≥ 60 %:** ≥ 60 % of pilot students create ≥ 3 personal notes or practice questions, demonstrating trust in the privacy guarantee.
- **Core assumption to validate:** Students will shift from personal ChatGPT/Claude to the CECS hub because it cites exam-relevant materials precisely and guarantees private notes are never exposed.

---

## 2.2 Three University AI Models

> Sources accessed 14 Sep 2026. Stage labels distinguish announcements, deployed services, and peer-reviewed outcomes.

| Application and source | Users and learning problem | Key features | Evidence and limitations | What CECS could adopt |
|---|---|---|---|---|
| **Purdue — PeteChat** Li et al. [arXiv:2606.09845](https://arxiv.org/abs/2606.09845) *(arXiv preprint, submitted 27 Apr 2026 — under review, not yet peer-reviewed)* · Stage: Deployed service + Design-Based Research | STEM/CS students & instructors at Purdue. Challenge: preventing AI from becoming a "Solver" instead of a "Tutor" | Local Llama-3 + RAG on course slides & syllabus. **8 design principles** incl. homework guardrails, debugging scaffolds, self-regulated learning support, instructor customisation tools | DBR evaluation via interaction logs & TA feedback. Limitation: no end-of-term RCT score comparison | Adopt "Tutor, Not Solver" guardrail philosophy; debugging scaffolds fit CECS CS/Engineering courses |
| **CMU + Gates Foundation — Learnvia** [learnvia.org](https://learnvia.org/) · [CMU news](https://www.cmu.edu/news/stories/archives/2026/january/learnvia.html) · Announced **29 Jan 2026** · Stage: Deployed service at scale | Gateway-course students (starting Calculus I). Problem: high failure rates in foundational STEM courses | All-in-one AI courseware (lessons, homework, quizzes, AI tutor, formative feedback with citations). **38 partner institutions** across the US; **$55 M Gates Foundation** grant | Won *Teaching & Learning Innovation Award*, 1EdTech Conference, Jun 2026. Limitation: large upfront content-digitalisation effort | Deliver formative feedback with source citations in the practice flow, not just correct/incorrect |
| **University of Iowa — Educational AI Hub** Sajja et al. *Scientific Reports* [DOI: 10.1038/s41598-026-39237-5](https://doi.org/10.1038/s41598-026-39237-5) · Published **6 Feb 2026** · Stage: Peer-reviewed evaluated outcome | Civil & Environmental Engineering students at an R1 university. Students reluctant to approach instructors/TAs for help | Canvas LTI integration; RAG with Qdrant. **6 features:** notes generation, context-aware chatbot, Bloom flashcards, formative quizzes, tiered coding sandbox (pseudocode first), syllabus support | **~50 % of students found it easier to ask the AI than approach instructors/TAs** (Nature, 2026). Limitation: academic-integrity boundary confusion | Closest reference architecture for CECS: same Engineering/CS audience; tiered coding hints prevent copy-paste |

---

## 2.3 Product & Stack Ideas

### Core User Flows (Pilot)

- **Instructor:** Login (OTP) → Upload → Chunk & vectorise → Approve → Configure practice → AI drafts → Edit & Publish → View misconceptions dashboard.
- **Student:** Login (OTP) → Select course → Ask (RAG) → Answer with `[Doc, Page X]` citation → Private Study Space (owner-only) → Attempt practice → Formative feedback → Submit feedback.
- **Admin:** Login → Assign users → Check readiness → Aggregated reports → *No Private Notes access*.

### Minimum Viable Pilot (Demo 24 Sep · Launch 05 Oct 2026)

| In scope | Deferred — Later List |
|---|---|
| VinUni email + OTP auth; JWT; 3 roles | Microsoft SSO / Canvas LTI |
| PDF/Markdown upload → chunk → embed → Approve | Student personal file upload |
| Grounded RAG chat: top-3 retrieval, citations, insufficient-evidence refusal | Flashcards & spaced repetition |
| Private Study Space: server-side `WHERE user_id = current_user` | Automated grading of formal exams |
| Reviewed practice: AI drafts 3 MCQs → instructor edits → Publish | Speech-to-text / 3-D avatar |
| Basic dashboard: query count, submissions, top topics | |

### Proposed Tech Stack

| Layer | Preferred | Fallback | Rationale |
|---|---|---|---|
| **Frontend** | React + Vite (TypeScript) | Next.js | Team familiarity; avoids SSR complexity |
| **Backend** | Python / FastAPI | Node.js / Express | Native RAG ecosystem; auto Swagger UI |
| **Database** | PostgreSQL + pgvector | SQLite + Supabase | Relational + vector in one DB; Row-Level Security for Private Notes |
| **Auth** | VinUni Email + mock OTP (→ real SMTP in staging) | Simple JWT | No SSO at pilot stage |
| **AI & Retrieval** | Gemini 1.5 Flash/Pro + `text-embedding-004` | Llama-3 via Ollama | Mentor resources & AI Studio templates; large context window |
| **Hosting** | Docker Compose on Render / VPS | Vercel + Railway | Reproducible; easy university handover |

*Open uncertainties:* Gemini API quota for the team; mock vs. real OTP SMTP setup.

### Learning Impact & QS Reimagine Education

The [QS Reimagine Education Awards](https://www.qs.com/conferences/reimagine/apply) evaluates on four criteria directly aligned with this project: evidence of learning impact, pedagogical innovation, scalability, and AI ethics & privacy. Strategy: collect pre/post pilot data on comprehension and course-completion rates. **All award preparation stays outside the pilot codebase** to protect the 05 Oct deadline.

---

## 2.4 Interests & Contribution

- **Relevant experience:** Hands-on RAG pipeline work — text chunking, vector embedding generation, semantic search. Limited production backend/DB-schema experience; willing to learn with team support.
- **Preferred area 1 — AI/RAG Pipeline:** Build PDF ingestion (semantic chunking → `text-embedding-004` → pgvector), implement grounded RAG endpoint, write "Tutor, Not Solver" system-prompt template (3 explicit guardrails).
- **Preferred area 2 — AI Quality & Testing:** Write automated RAG-quality tests (≥ 5 Q&A pairs); verify citations trace to correct chunks; debug prompts when responses deviate from pedagogical intent.
- **Learning goal:** Understand how to enforce data-partition boundaries (Private Notes never enter the shared vector index) at the query layer inside a real multi-role application.
- **Support needed:** (1) Team member with backend experience to guide DB schema and auth API so I can wire the RAG pipeline correctly. (2) Mentor confirmation that Gemini API quota and `text-embedding-004` are available in dev.

### Day 2 Concrete Deliverables

1. **PDF Ingestion Pipeline:** semantic chunking, `text-embedding-004` embeddings, stored in PostgreSQL + pgvector.
2. **Grounded RAG endpoint** (`POST /api/chat`): top-3 retrieval → Socratic-constrained Gemini prompt → `[Document, Page X]` citation; refuses when no evidence found.
3. **System Prompt template:** three guardrails — no direct homework solutions, CECS course-context localisation, mandatory source citation.
4. **RAG quality test suite:** ≥ 5 (question, expected-answer) pairs from sample materials; checks citations and no hallucination.

### Sources Read

1. Li, B., Tan, L., Zakharov, W., Qiu, Q., & Acton, C. B. (2026, April 27). *Tutor, Not Solver: Designing a Guardrailed AI Assistant for Learning in Higher Education: A Design Case of PeteChat*. arXiv preprint [arXiv:2606.09845](https://arxiv.org/abs/2606.09845). Accessed 14 Sep 2026.
2. Learnvia / CMU. (2026, January 29). *Carnegie Mellon Launches Learnvia To Catalyze Student Success Nationwide*. [cmu.edu/news/.../learnvia.html](https://www.cmu.edu/news/stories/archives/2026/january/learnvia.html) · [learnvia.org](https://learnvia.org/). Accessed 14 Sep 2026.
3. Sajja, R., Sermet, Y., Fodale, B., & Demir, I. (2026, Feb 6). *Evaluating AI-powered learning assistants in engineering higher education*. *Scientific Reports*, 16, 39237. DOI: [10.1038/s41598-026-39237-5](https://doi.org/10.1038/s41598-026-39237-5). Accessed 14 Sep 2026.
4. Kestin, G., Miller, K., Klales, A., Milbourne, T., & Ponti, G. (2025). *AI tutoring outperforms active learning: an RCT*. *Scientific Reports*, 15, 97652. DOI: [10.1038/s41598-025-97652-6](https://doi.org/10.1038/s41598-025-97652-6). Accessed 14 Sep 2026.
5. RAISE Initiative / MIT. (2023–2026). *PyTutor*. [raise.mit.edu/research/research-projects/pytutor](https://raise.mit.edu/research/research-projects/pytutor/). Accessed 14 Sep 2026.
6. Quacquarelli Symonds. *QS Reimagine Education Awards*. [qs.com/conferences/reimagine/apply](https://www.qs.com/conferences/reimagine/apply). Accessed 14 Sep 2026.
7. CECS AI Learning Hub Repository: `README.md`, `DAY_01_INSTRUCTIONS.md`, `WORKING_IN_THIS_PROJECT.md`. Accessed 14 Sep 2026.

### AI Assistance & Verification Disclosure

**AI tools used:** Antigravity AI Assistant — terminology translation, Markdown structure review, cross-referencing project documents. Claude — initial brainstorming and idea generation for product concepts and stack options.

**Author-verified independently:** All links, papers, author names, and university systems were verified by directly fetching original paper content and official pages. PeteChat arXiv submission date (27 Apr 2026) confirmed from arXiv submission history. Learnvia institution count (38) confirmed from the verbatim CMU news article sentence. Iowa publication date (6 Feb 2026) confirmed from Nature metadata. No speculative or unverified information was used. All "Private means private" requirements and pilot-exclusion boundaries were cross-checked against the project `README.md`.
