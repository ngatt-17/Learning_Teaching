# Day 1 Research & Product Proposal — tranvananhanhanh

**Date:** 14 September 2026  
**Author:** tranvananhanhanh (khuctieuho@gmail.com)  
**Project:** CECS AI Learning Hub (VinUniversity)  

---

## 1. Product Understanding

### 1.1. Core User Journeys

The CECS AI Learning Hub addresses three distinct user roles within the College of Engineering and Computer Science (CECS):

1. **Instructor / Teaching Assistant (TA):**
   * **Material Ingestion & Verification:** Instructors upload course assets (lecture slides, syllabi, textbooks, code samples, and problem sets). They monitor processing status (Ready / Failed / Retry) and explicitly approve materials before they become accessible to students.
   * **Assisted Practice Generation:** Instructors configure parameters (source slides, topic, difficulty level, question types) to automatically generate draft quizzes and practice exercises. Instructors review, edit, and publish these assessments.
   * **Pedagogical Analytics & Feedback Loop:** Instructors view aggregated metrics on student engagement, commonly asked questions, identified conceptual misconceptions, and anonymous feedback (e.g., requests to adjust lecture pacing) to refine their teaching.

2. **Student (Student-Centric Learning Experience):**
   * **Course-Grounded Q&A with Socratic Guidance:** Students interact with an AI tutor strictly grounded in instructor-approved course materials. Responses provide explicit citations (source document and page/slide reference). Instead of spoon-feeding final answers, the AI offers Socratic hints and step-by-step scaffolding to foster critical thinking.
   * **Slide-to-Micro-Lesson Decomposition:** Students can prompt the system to break down dense lecture slides into bite-sized (5–10 min) modular lessons accompanied by active-recall checkpoint quizzes.
   * **Controlled Web Expansion:** Students may optionally expand searches to web sources; these external results are explicitly flagged with warning labels to distinguish them from official course content.
   * **Psychologically Safe Private Study Space:** Students maintain an isolated personal workspace to take notes, annotate materials, ask "elementary/basic" questions without peer judgment, and generate self-testing quizzes.
   * **Formative Practice & Anonymous Pacing Feedback:** Students complete published practice exercises, receive immediate formative feedback, and submit anonymous feedback or pace-adjustment requests directly to the instructor.

3. **CECS Administrator:**
   * **Governance & Readiness:** Administrators manage course allocations, monitor instructor/student enrollments, and track course readiness (material processing and published practice volume).
   * **College-Level Insights:** Administrators access aggregate statistics across courses and departments to understand common learning bottlenecks while maintaining strict privacy boundaries.

---

### 1.2. Privacy Boundaries: Private Notes vs. Shared Data

Data privacy is a non-negotiable architectural boundary in this system:

* **Private Student Notes ("Private means Private"):** Personal notes, generated self-study questions, personal micro-lessons, and custom study plans belong exclusively to the student who created them. They are protected by server-side row-level access controls and are completely excluded from shared vector retrieval, public APIs, administrative exports, instructor dashboards, and ordinary application logs.
* **Course Materials:** Public to all enrolled students and instructional staff within the assigned course after instructor approval.
* **Submitted Feedback:** Intentionally and voluntarily submitted by students (anonymized if configured) for instructor review.
* **Dashboard Data:** Anonymized, aggregated behavioral metrics (e.g., total questions asked per topic, common misconception tags) that never reveal individual note contents or raw personal queries.

---

### 1.3. Pilot Success Metrics & Key Assumptions

* **Measurable Metric 1 (Grounded Retrieval Precision & Socratic Utility):** Over 85% of student chat queries successfully cite approved course materials with valid page/slide references, maintaining a verified hallucination rate under 5% during pilot testing.
* **Measurable Metric 2 (Weekly Active Engagement):** At least 60% of enrolled students in the 1–4 pilot courses actively engage with the hub weekly (using Grounded Chat, completing practice quizzes, or using their private study space).
* **Key Assumption to Validate:** *Students find bite-sized micro-lessons and Socratic guidance from slides more effective for exam preparation and active learning than passive slide reading or ungrounded external chatbots.*

---

## 2. Three University AI Learning Applications

| Application & Source | Users & Learning Problem | Key Features | Evidence & Limitations | What CECS Could Adopt (Student-Centric Focus) |
|---|---|---|---|---|
| **1. AI Learning Companion & MAIC**<br>*(Tsinghua University, Dept. of Automation & OpenMAIC)*<br>[Source: Tsinghua Automation / OpenMAIC 2024–2026; Access Date: 14 Sep 2026] | **Users:** 1,300+ students across 36 engineering courses.<br>**Problem:** Information overload, siloed course knowledge, and students struggling to connect prerequisite math/science concepts to advanced engineering courses. | • **Curriculum Knowledge Graph:** Isolate course-level knowledge bases while mapping cross-course concept links (e.g., *gradient descent* linked across AI and Signal Processing).<br>• **Multi-Agent Classrooms:** AI Teacher, AI TA, and virtual AI classmates with distinct learning styles.<br>• Grounded RAG with strict citations and automated quiz generation. | • **Evidence:** Deployed across 36 courses; MAIC logged 100,000+ interactions across 500–2,000+ students; 84% student satisfaction; OpenMAIC reached 30,000+ GitHub stars.<br>• **Limitations:** Requires continuous expert supervision to suppress hallucinations; less applicable for manual physical lab skills. | • **Cross-Course Concept Linkage:** Remind students of prerequisite concepts from earlier semesters (e.g., Calculus in ML).<br>• **Slide-to-Quiz Decomposition:** Allow students to turn dense slides into active-recall quizzes. |
| **2. ChatGPT Edu & Socratic AI Tutors**<br>*(University of Oxford)*<br>[Source: Univ. of Oxford & OUP Finch Project 2025–2026; Access Date: 14 Sep 2026] | **Users:** University-wide students & staff, with focused deployment for Science Foundation Year students.<br>**Problem:** Over-reliance on direct answer generation without fostering conceptual understanding, resulting in shallow learning. | • **Socratic Tutoring Engine:** Guides students step-by-step through inquiry and conceptual hints rather than providing raw solutions.<br>• **Finch AI Student Tutor:** Deconstructs complex scientific queries into manageable sub-questions.<br>• Custom self-testing and personalized study revision materials. | • **Evidence:** Successful campus-wide rollout following pilot programs showing measurable gains in student conceptual confidence.<br>• **Limitations:** Heavy reliance on external LLM vendor endpoints; requires mandatory ethical/responsible AI training for students. | • **Socratic Tutoring Mode:** Ask probing questions, break down complex algorithm/math problems into bite-sized steps, and provide scaffolded hints instead of raw answers. |
| **3. PKU Zhixue / Boya AI Education**<br>*(Peking University)*<br>[Source: Peking University Boya Large Model Project 2024–2026; Access Date: 14 Sep 2026] | **Users:** Faculty and students across core Computer Science and Math courses (Python, C/C++, Java, Data Structures, Discrete Math, Intro to AI).<br>**Problem:** Students have varied learning paces, lack 24/7 personalized guidance, and hesitate to ask basic questions in public lectures. | • **Student Hub:** 24/7 intelligent Q&A, active inquiry prompts, personalized learning path recommendation.<br>• **Instructor Hub:** Automated material drafting, automated code/assignment grading, student learning analytics, and syllabus planning. | • **Evidence:** Operational across major university-wide STEM courses.<br>• **Limitations:** Quantitative learning impact evaluations are still actively developing for non-programming courses. | • **Personalized Learning Paths:** AI suggests a self-paced study sequence based on student questions.<br>• **Safe Private Study Environment & Anonymous Pacing Feedback:** Enables students to ask fundamental questions without fear and send anonymous pace feedback to instructors. |

---

## 3. Proposed CECS Product & Stack Ideas

### 3.1. Proposed Core Features & Scope Boundaries

#### ✅ Must-Have for Pilot (Delivery by 24 September / Launch on 5 October 2026)
1. **Email-OTP Authentication & Role-Based Authorization:** Secure email verification for `@vinuni.edu.vn` accounts with strict Instructor, Student, and Admin role enforcement.
2. **Material Processing & Ingestion Pipeline:** Parsing of course lecture slides (PDF/PPTX) and reading materials into clean markdown/text chunks with page-level metadata.
3. **Course-Grounded RAG Chat with Socratic Hints & Citations:** Answering queries strictly based on approved course materials, displaying inspectable citations (document name + slide number), prompting Socratic hints, and providing explicit insufficient-evidence fallbacks.
4. **Slide-to-Lesson & Practice Quiz Generation:** Automatic extraction of key learning points from slides to create bite-sized review modules and draft quizzes (multiple choice, short answer), subject to instructor review.
5. **Psychologically Safe Private Study Space:** A strictly isolated student workspace for personal notes, self-generated flashcards, and annotations, protected by database-level row-level security.
6. **Anonymous Course Feedback & Pace Indicator:** Mechanism for students to submit anonymous pace-adjustment requests or feedback to instructors.
7. **Basic Instructor Insights:** Aggregated metrics showing frequent question topics, difficult concepts, and average quiz scores.

#### ⏳ Later Scope (Post-Pilot / Future Roadmap)
* Automatic multi-agent virtual classroom peers (like Tsinghua MAIC).
* Deep Curriculum Knowledge Graph across all 4-year CECS degree programs.
* Automated Canvas LMS LTI integration and Microsoft Single Sign-On (SSO).
* Automated formal grading with LMS gradebook sync.
* Support for multimodal video/audio lecture stream indexing.

---

### 3.2. Recommended Technical Stack

```
[ Frontend: Next.js 14+ (App Router) + React + Tailwind CSS + Shadcn UI ]
                                   │  (REST / Server Actions)
[ Backend API: FastAPI (Python 3.11+) / Async Architecture ]
                                   │
      ┌────────────────────────────┼────────────────────────────┐
      ▼                            ▼                            ▼
[ Database & Storage ]     [ Vector Retrieval ]      [ LLM & RAG Engine ]
• PostgreSQL (Supabase)   • pgvector / ChromaDB     • Gemini 1.5 Flash / Pro
• Row-Level Security       • Hybrid Search (Dense    • Socratic Prompting
• Object Store (S3/GCS)      + BM25 Keyword)         • Grounded Citations
```

* **Frontend:** **Next.js (React / TypeScript / Tailwind CSS)** — Fast, responsive, server-side rendering support, with clean UI components for chat, document viewing, and note-taking.
* **Backend:** **FastAPI (Python)** — High performance, native async support, and direct compatibility with Python-based AI/RAG libraries (LangChain/LlamaIndex, PyMuPDF, Unstructured).
* **Database & Private Storage:** **PostgreSQL with Row-Level Security (RLS)** — Relational integrity for users, courses, materials, and strict database-level isolation for student private notes.
* **Vector Store & Retrieval:** **pgvector** (or ChromaDB for local staging) using hybrid retrieval (Dense Semantic Embeddings + Sparse BM25) to ensure exact keyword and concept matching from slide decks.
* **LLM Engine:** **Google Gemini 1.5 Pro/Flash API** (or OpenAI API) — High context window, strong structured JSON output for quiz generation, and fast token generation.

**Technical Uncertainties to Test in Day 2:**
* Accuracy of slide PDF text/table extraction and bounding-box page tracking for citations.
* Latency and cost trade-offs between dense vector search vs. hybrid BM25 search.
* Strictness of database RLS policies to guarantee zero accidental leakage of private student notes.

---

### 3.3. Alignment with QS Reimagine Education Awards & VinUni QS-100 Ambition

To support VinUni's strategic ambition of reaching the **QS Top 100**, the CECS AI Learning Hub should be positioned as an innovative pedagogical intervention targeting the **QS Reimagine Education Awards** (specifically the *AI in Education* or *Nurturing Critical Thinking* categories):

1. **Pedagogical Innovation over Generic Chatbots:** Rather than acting as a shortcut answer generator, the system incorporates Oxford's **Socratic guiding method** and Tsinghua's **concept-linked curriculum scaffolding**, actively training students in problem-solving and critical analysis.
2. **Academic Integrity & Responsible AI by Design:** By strictly enforcing grounded source citations and explicit failure notifications when evidence is lacking, the hub establishes a gold-standard framework for ethical AI adoption in Southeast Asian higher education.
3. **Evidence-Based Learning Analytics:** The platform provides actionable feedback loops between students' learning bottlenecks and instructors' teaching strategies, enabling verifiable improvements in student course outcomes.

---

## 4. Interests & Contribution

* **Relevant Technical Experience:** 
  * Strong background in Python backend development, RESTful API design, and asynchronous systems.
  * Experience with modern frontend frameworks (React/Next.js) and relational database modeling (PostgreSQL).
  * Hands-on familiarity with LLM orchestration (prompt engineering, RAG pipelines, embedding generation, and vector search).
* **Preferred Work Areas (2):**
  1. **AI / RAG Pipeline & Citation Grounding:** Designing the slide-parsing, embedding, retrieval, and citation verification mechanisms.
  2. **Backend Services & Data Privacy Architecture:** Implementing authentication (OTP), course authorization, and Row-Level Security for the Private Study Space.
* **Personal Learning Goal (1):** Master the design of low-latency, production-grade hybrid retrieval systems (combining BM25 and vector embeddings) with guaranteed citation fidelity.
* **Support Needed from Team & Mentor:**
  * Sample CECS course materials (PDF slides, syllabi, and sample quizzes) for realistic benchmark testing.
  * Approved development API keys (e.g., Gemini API / OpenAI API) and cloud staging infrastructure access.
* **Concrete Day 2 Contribution:** Build and validate an end-to-end prototype of the **Slide Ingestion & Grounded RAG Retrieval Pipeline**, demonstrating:
  1. Parsing of a sample CECS lecture slide PDF into indexed chunks with slide number metadata.
  2. Grounded Q&A response generation returning accurate inline citations and an explicit "insufficient context" fallback when queried on out-of-scope topics.
