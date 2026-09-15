# AI & Quality Service — CECS AI Learning Hub

**Day 2 Standalone Build** | Port: `8001` | Branch: `feature/ngatt-17-ai-quality-day02`

---

## Tổng quan

Module AI độc lập cung cấp:
1. **Chat RAG** — Hỏi đáp bám sát tài liệu khoá học, trích dẫn nguồn theo trang
2. **GenQuiz (3 luồng)** — Sinh quiz từ slide, ngân hàng đề, hoặc ghi chú riêng của sinh viên
3. **Test checklist** — 7 test case theo yêu cầu Day 2

> ⚠️ **Day 2 Mock state:**
> - `MOCKED_AUTH = True` — Auth dùng fake token (xem `mock_auth.py`)
> - `MOCKED_FILE_PARSING = True` — Nội dung tài liệu là synthetic text (xem `fixtures/sample_material.py`)
> - **AI calls là THẬT** — Gọi xkiro.com API với model `google/gemini-3.5-flash`
>
> **Tuần 2 migration:** Swap 2 file trên → JWT thật + PyMuPDF parser.

---

## Cài đặt & Chạy

```bash
cd src/ai

# 1. Tạo virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Mac/Linux

# 2. Cài dependencies
pip install -r requirements.txt

# 3. Tạo file .env
cp .env.example .env
# Điền XKIRO_API_KEY vào .env

# 4. Chạy server
python main.py
# hoặc: uvicorn main:app --reload --port 8001
```

Swagger docs: **http://localhost:8001/docs**

---

## Mock tokens (Day 2)

| Token | Role | Enrolled courses |
|---|---|---|
| `student_a_token` | student | course-a |
| `student_b_token` | student | course-b |
| `instructor_token` | instructor | course-a |
| `admin_token` | admin | all |

Dùng trong header: `Authorization: Bearer student_a_token`

---

## API Endpoints

### Chat RAG
```
POST /courses/{course_id}/chat
Auth: Bearer <token>
Body: { "question": "What is a variable?" }
Response: { "answer", "citations": [{material_id, title, page, snippet}], "evidence_level" }
```

### GenQuiz — Instructor từ slide
```
POST /quiz/from-material
Auth: Bearer instructor_token
Body: { "material_id", "course_id", "topic", "difficulty", "question_type", "count" }
Response: { "draft_id", "status": "draft", "questions": [...] }
```

### GenQuiz — Instructor từ ngân hàng đề
```
POST /quiz/from-bank
Auth: Bearer instructor_token
Body: { "bank_content": "<raw text>", "count", "difficulty", "question_type" }
Response: { "draft_id", "status": "draft", "questions": [...] }
```

### Publish Quiz (bắt buộc instructor review)
```
PATCH /quiz/{draft_id}/publish
Auth: Bearer instructor_token
Response: { "status": "published" }
```

### GenQuiz — Student từ ghi chú riêng (PRIVATE)
```
POST /quiz/from-note
Auth: Bearer student_a_token
Body: { "note_content": "<ghi chú>", "count": 5 }
Response: { "questions": [...], "stored": false, "privacy_notice": "..." }
```
> Kết quả **không lưu vào bất kỳ database hay store nào.**

---

## Chạy tests

```bash
cd src/ai
.venv\Scripts\activate
pytest tests/test_ai_quality.py -v
```

### 7 test cases

| # | Test | Tiêu chí Day 2 |
|---|---|---|
| T01 | Chat trả về answer + citation có page | Citations point to valid source locations |
| T02 | Câu hỏi ngoài scope → "insufficient" | Unsupported questions receive limitation |
| T03 | Draft material loại khỏi retrieval | Draft/unapproved excluded from retrieval |
| T04 | GenQuiz từ material → draft JSON | Practice-generation examples |
| T05 | Student không publish được (403) | Instructor review required before publish |
| T06 | from-note không ghi vào store | Private notes absent from shared systems |
| T07 | Student B không vào course-a (403) | Cross-course access denied |

---

## Cấu trúc file

```
src/ai/
├── main.py                 ← FastAPI app (port 8001)
├── config.py               ← API key, model, settings
├── mock_auth.py            ← ⚠️ MOCKED_AUTH=True
├── retriever.py            ← TF-IDF in-memory retrieval
├── chat_rag.py             ← RAG + citation
├── quiz_generator.py       ← GenQuiz 3 luồng
├── routes/
│   ├── chat_routes.py
│   ├── quiz_routes.py
│   └── health_routes.py
├── fixtures/
│   └── sample_material.py  ← ⚠️ MOCKED_FILE_PARSING=True
├── tests/
│   └── test_ai_quality.py  ← 7 test cases
├── requirements.txt
├── .env.example
└── README.md
```

---

## Tuần 2 — Migration path

| Tuần 2 việc cần làm | File cần sửa |
|---|---|
| Swap mock auth → JWT từ platform backend (port 8000) | `mock_auth.py` → `get_current_user()` |
| Swap synthetic text → PyMuPDF đọc file thật | `fixtures/sample_material.py` → `retriever.py` |
| Quiz drafts lưu vào bảng `quiz_drafts` (PostgreSQL) | `quiz_generator.py` → `_DRAFT_STORE` |
| Upgrade retrieval → pgvector semantic search | `retriever.py` → `retrieve()` |
