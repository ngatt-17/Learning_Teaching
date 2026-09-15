# AI & Quality Integration — Day 2 Report

**Date:** 2026-09-15 | **Module:** `src/ai/` | **Branch:** `feature/ngatt-17-ai-quality-day02`

---

## ✅ Test Results: 7/7 PASSED

```
======================== 7 passed in 2.48s ========================

T01 chat_returns_answer_with_citation      PASSED
T02 chat_insufficient_evidence             PASSED
T03 draft_material_excluded_from_retrieval PASSED
T04 genquiz_from_material_returns_draft    PASSED
T05 genquiz_publish_requires_instructor    PASSED
T06 genquiz_from_note_not_stored           PASSED
T07 student_cannot_access_other_course_chat PASSED
```

---

## Architecture: Standalone FastAPI (Port 8001)

```
[Student / Instructor Browser]
         ↓ HTTP
[AI Service — port 8001]  ←→  [xkiro.com API — qwen3.5-flash:free]
         ↓ TF-IDF retrieval
[Synthetic Materials — fixtures/sample_material.py]   ← ⚠️ MOCKED
[Mock Auth — mock_auth.py]                            ← ⚠️ MOCKED
```

### Mock State (Day 2)
| Component | Status | Tuần 2 Migration |
|---|---|---|
| Auth | `MOCKED_AUTH=True` — Bearer fake tokens | Swap `mock_auth.py::get_current_user()` → JWT verify từ port 8000 |
| File Parsing | `MOCKED_FILE_PARSING=True` — synthetic text | Swap `retriever.py` source → PyMuPDF parse real PDF |
| AI Calls | **REAL** — xkiro API `qwen3.5-flash:free` | Có thể nâng model nếu cần |
| Vector Search | TF-IDF in-memory | Swap → pgvector `semantic search` |
| Quiz Storage | In-memory `_DRAFT_STORE` dict | Swap → INSERT bảng `quiz_drafts` PostgreSQL |

---

## API Endpoints (Port 8001)

| Endpoint | Auth | Role | Description |
|---|---|---|---|
| `GET /health` | None | - | Health check |
| `POST /courses/{course_id}/chat` | Bearer | student/any | Chat RAG + citation |
| `POST /quiz/from-material` | Bearer | instructor/ta/admin | GenQuiz from slide |
| `POST /quiz/from-bank` | Bearer | instructor/ta/admin | GenQuiz from question bank |
| `PATCH /quiz/{draft_id}/publish` | Bearer | instructor/ta/admin | Instructor publish |
| `GET /quiz/{draft_id}` | Bearer | instructor/ta/admin | View draft |
| `POST /quiz/from-note` | Bearer | student | Private quiz (NOT stored) |

---

## Quality Checklist (DAY_02_INSTRUCTIONS §4)

### Chat RAG
- [x] **Citations point to valid source locations** — `material_id + title + page + snippet`
- [x] **Unsupported questions receive limitation message** — `evidence_level = "insufficient"`, `citations = []`
- [x] **Draft/unapproved materials excluded** — `approved_for_ai=False` filters at retrieval layer

### GenQuiz
- [x] **Practice-generation examples** — 3 modes: from-material, from-bank, from-note
- [x] **Instructor review required before publish** — draft flow: `PATCH /{draft_id}/publish`
- [x] **Private notes absent from shared systems** — `from-note` returns direct, no `draft_id`, `stored: false`

### Access Control
- [x] **Cross-course isolation** — Student B cannot access course-a materials (403)
- [x] **Role enforcement** — Student cannot call instructor endpoints (403)

---

## Known Limitations (Day 2)

1. **TF-IDF retrieval** là bag-of-words — không hiểu ngữ nghĩa. Tuần 2 → pgvector.
2. **Draft store là in-memory** — restart server sẽ mất tất cả drafts.
3. **No file upload** — chỉ support text input cho `from-bank`; không parse PDF thật.
4. **Model**: `qwen3.5-flash:free` — giới hạn RPM. Production nên dùng tier cao hơn.

---

## Files Created

| File | Purpose |
|---|---|
| [`src/ai/main.py`](file:///c:/Users/Admin/Downloads/TT/CECS_AI_LearningHub/src/ai/main.py) | FastAPI app, port 8001 |
| [`src/ai/config.py`](file:///c:/Users/Admin/Downloads/TT/CECS_AI_LearningHub/src/ai/config.py) | Centralized config, reads .env |
| [`src/ai/mock_auth.py`](file:///c:/Users/Admin/Downloads/TT/CECS_AI_LearningHub/src/ai/mock_auth.py) | ⚠️ MOCKED_AUTH — fake Bearer tokens |
| [`src/ai/retriever.py`](file:///c:/Users/Admin/Downloads/TT/CECS_AI_LearningHub/src/ai/retriever.py) | TF-IDF retrieval, approved-only |
| [`src/ai/chat_rag.py`](file:///c:/Users/Admin/Downloads/TT/CECS_AI_LearningHub/src/ai/chat_rag.py) | RAG + LLM + citation builder |
| [`src/ai/quiz_generator.py`](file:///c:/Users/Admin/Downloads/TT/CECS_AI_LearningHub/src/ai/quiz_generator.py) | GenQuiz 3 modes + draft store |
| [`src/ai/routes/chat_routes.py`](file:///c:/Users/Admin/Downloads/TT/CECS_AI_LearningHub/src/ai/routes/chat_routes.py) | Chat RAG endpoint |
| [`src/ai/routes/quiz_routes.py`](file:///c:/Users/Admin/Downloads/TT/CECS_AI_LearningHub/src/ai/routes/quiz_routes.py) | GenQuiz endpoints |
| [`src/ai/fixtures/sample_material.py`](file:///c:/Users/Admin/Downloads/TT/CECS_AI_LearningHub/src/ai/fixtures/sample_material.py) | ⚠️ MOCKED_FILE_PARSING — synthetic content |
| [`src/ai/tests/test_ai_quality.py`](file:///c:/Users/Admin/Downloads/TT/CECS_AI_LearningHub/src/ai/tests/test_ai_quality.py) | 7 test cases |
