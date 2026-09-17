# Team 3 (AI & Quality Module) — CECS AI Learning Hub

**AI Service tích hợp với Platform** | Port: `8001` | Branch gốc: `feature/TinNguyenn-rag-day02` → tích hợp trong `feature/day03`  
**AI Engine:** OpenAI-compatible LLM Engine (Cấu hình qua biến môi trường .env)

---

## 🔗 Tích hợp với Platform (Day 3)

Kiến trúc và bằng chứng kiểm thử đầy đủ: [`docs/exploration/day-03/INTEGRATION.md`](../docs/exploration/day-03/INTEGRATION.md).

| Hạng mục | Day 2 (standalone) | Sau tích hợp |
|---|---|---|
| Xác thực | `mock_auth.py` với token giả (`student_a_token`) | `auth.py`: xác minh **JWT thật của Platform** bằng `JWT_SECRET` dùng chung |
| Quyền vào khóa học | So `enrolled_courses` trong token giả | `platform_client.py` gọi Platform API **bằng chính token người dùng** → Platform trả 403 nếu không được phân công |
| Học liệu | `fixtures/sample_material.py` (`course-a`) | `GET /courses/{id}/materials/content` của Platform: chỉ tài liệu **đã duyệt**, có nội dung từng trang; `retriever.materials_from_platform()` lọc lại lần nữa |
| Không có LLM key | Trả câu "[AI service error]" / câu hỏi lỗi giả với status 200 | Chat & tutor trả lời **trích dẫn nguyên câu** từ tài liệu (`generation = "extractive"`); GenQuiz trả **503** rõ ràng |
| Cổng bằng chứng | Điểm RRF ≥ 0.05 (gần như luôn đạt) | Loại stopword Việt/Anh, yêu cầu đủ từ khóa nội dung, ưu tiên cụm 2 âm tiết ("tác tử" ≠ "điện tử") |
| Quiz tutor | — | `POST /courses/{id}/quiz-tutor`: **hint** khi đang làm bài (không bao giờ nạp đáp án), **review** sau khi nộp (đọc attempt của chính sinh viên) |
| Phân tích năng lực | Nhận kết quả do client gửi | `POST /api/ai/courses/{id}/quizzes/{qid}/competency` đọc attempt thật từ Platform, gợi ý đúng trang trích dẫn |

AI service **không kết nối database** và **không bao giờ đọc ghi chú riêng** của sinh viên.

Chạy test (offline, không gọi LLM thật — Platform được giả lập trong `tests/conftest.py` với JWT thật):
```bash
pytest tests test_rag.py -v      # 44 tests
```

---

## 👥 Phân công nội bộ Team 3

* **Thành viên A (Nga - `ngatt-17`):**
  - Phụ trách chính: **`GenQuiz` (Hệ thống tạo bài tập tự động 3 dạng)**.
  - Các file chính:
    - [`quiz_generator.py`](file:///c:/Users/Admin/Downloads/TT/CECS_AI_LearningHub/rag/quiz_generator.py): Lõi sinh đề từ slide (cho GV và SV tự ôn), ngân hàng đề và ghi chú cá nhân; chuẩn hóa JSON đầu ra.
    - [`run_quiz_demo.py`](file:///c:/Users/Admin/Downloads/TT/CECS_AI_LearningHub/rag/run_quiz_demo.py): Script chạy thử demo độc lập in ra màn hình cực kỳ trực quan.
    - [`sample_lecture_cs101.txt`](file:///c:/Users/Admin/Downloads/TT/CECS_AI_LearningHub/rag/sample_lecture_cs101.txt): Slide bài giảng mẫu CS101 về C/Pointers để chạy thử nghiệm.
    - [`routes/quiz_routes.py`](file:///c:/Users/Admin/Downloads/TT/CECS_AI_LearningHub/rag/routes/quiz_routes.py): Router cung cấp các API endpoint (bao gồm `POST /api/ai/gen-quiz` theo contract).
    - [`tests/test_genquiz_contract.py`](file:///c:/Users/Admin/Downloads/TT/CECS_AI_LearningHub/rag/tests/test_genquiz_contract.py): Bộ 3 bài test kiểm chứng JSON đầu ra của 3 dạng câu hỏi.
* **Thành viên B (Tin - `TinNguyenn`):**
  - Phụ trách chính: **`Grounded Chat (RAG)`** & **`Phân tích Năng lực Mạnh/Yếu`**.
  - Các file liên quan:
    - [`grounded_chat.py`](file:///c:/Users/Admin/Downloads/TT/CECS_AI_LearningHub/rag/grounded_chat.py): Luồng hỏi đáp bám sát slide có trích dẫn, 4 rào chắn bảo vệ ("Tutor, Not Solver").
    - [`chat_rag.py`](file:///c:/Users/Admin/Downloads/TT/CECS_AI_LearningHub/rag/chat_rag.py): RAG pipeline gọi LLM kèm trích dẫn số trang.
    - [`retriever.py`](file:///c:/Users/Admin/Downloads/TT/CECS_AI_LearningHub/rag/retriever.py): Bộ lọc tài liệu đã duyệt (`status='approved'`), chặn tài liệu `draft`.
    - [`routes/chat_routes.py`](file:///c:/Users/Admin/Downloads/TT/CECS_AI_LearningHub/rag/routes/chat_routes.py): Endpoint hỏi đáp cho sinh viên (`POST /courses/{course_id}/chat`).

---

## 🚀 Hướng dẫn chạy thử nhanh phần GenQuiz (Cho Tin)

Tin chỉ cần mở terminal trong môi trường ảo và chạy các lệnh sau:

### 1. Chạy Demo trực quan toàn bộ 3 luồng GenQuiz:
```bash
python rag/run_quiz_demo.py
```
> Kết quả in ra ngay trên terminal: 1 câu Single Choice (Radio), 1 câu Multiple Choice (Checkbox), 1 câu Short Answer (Điền từ), kèm số trang và trích dẫn bằng chứng từ bài giảng CS101.

### 2. Chạy bộ 3 test kiểm chứng cấu trúc JSON (Mock offline, <0.1s):
```bash
pytest rag/tests/test_genquiz_contract.py -v
```
*(Kết quả: 3 passed in <0.1s).*

### 3. Chạy demo Grounded Chat RAG (4 kịch bản của Tin):
```bash
python rag/demo.py
python -m unittest rag/test_rag.py
```

### 4. Chạy toàn bộ test suite AI & Quality (14 test cases):
```bash
pytest rag/tests/test_ai_quality.py -v
```

---

## 📋 Chuẩn hóa 3 dạng câu hỏi GenQuiz (JSON Schema)

Theo thỏa thuận API Contract của nhóm, hàm `gen_quiz_standard()` và endpoint `POST /api/ai/gen-quiz` trả về định dạng:

```json
{
  "lesson_id": "cs101-pointers",
  "topic": "Cú pháp cơ bản & Con trỏ",
  "generated_at": "2026-09-15T15:00:00Z",
  "questions": [
    {
      "id": "q1",
      "type": "single_choice",
      "topic": "Kiểu dữ liệu cơ bản",
      "question": "Trong ngôn ngữ C trên hệ thống 64-bit hiện đại, kiểu int thường chiếm bao nhiêu bytes?",
      "options": ["1 byte", "4 bytes", "8 bytes", "2 bytes"],
      "correct_answer": 1,
      "explanation": "Kiểu int có kích thước 4 bytes theo chuẩn...",
      "citation": {
        "source_file": "Lecture01_Intro.pdf",
        "page": 1,
        "evidence_snippet": "int: 4 bytes (standard integer type)"
      }
    },
    {
      "id": "q2",
      "type": "multiple_choice",
      "topic": "Quản lý bộ nhớ động",
      "question": "Những hàm nào sau đây trong stdlib.h dùng để cấp phát bộ nhớ? (Chọn tất cả đáp án đúng)",
      "options": ["malloc()", "calloc()", "free()", "realloc()"],
      "correct_answer": [0, 1, 3],
      "explanation": "malloc, calloc, realloc cấp phát/đổi kích thước heap. free() là giải phóng.",
      "citation": {
        "source_file": "Lecture02_Pointers.pdf",
        "page": 3,
        "evidence_snippet": "malloc, calloc, realloc allocate memory on the heap"
      }
    },
    {
      "id": "q3",
      "type": "short_answer",
      "topic": "Toán tử con trỏ",
      "question": "Toán tử nào trong C dùng để lấy giá trị tại địa chỉ ô nhớ mà con trỏ đang trỏ tới?",
      "options": [],
      "correct_answer": "*",
      "keywords": ["*", "dereference", "toán tử *", "indirection"],
      "explanation": "Toán tử '*' (dereference/indirection) dùng để truy xuất giá trị...",
      "citation": {
        "source_file": "Lecture02_Pointers.pdf",
        "page": 2,
        "evidence_snippet": "The dereference operator '*' accesses the value stored..."
      }
    }
  ]
}
```

---

## 🔌 Danh sách API Endpoints của AI Service (Port 8001)

Mọi endpoint (trừ `/health`) cần `Authorization: Bearer <JWT từ Platform>`.

| Phương thức | Đường dẫn | Phân quyền | Mô tả |
|---|---|---|---|
| `POST` | `/courses/{course_id}/chat` | Thành viên khóa học | Grounded Chat RAG kèm trích dẫn số trang (`material_id`, `page_number` tùy chọn để ưu tiên trang đang xem) |
| `POST` | `/courses/{course_id}/quiz-tutor` | Thành viên khóa học | Trợ lý Socratic cho màn hình làm bài: hint (không có `attempt_id`) / review (có `attempt_id` của chính mình) |
| `POST` | `/api/ai/courses/{course_id}/quizzes/{quiz_id}/competency` | Sinh viên | Điểm mạnh/yếu từ attempt thật trên Platform |
| `POST` | `/quiz/from-material` | Instructor / TA / Admin | Sinh câu hỏi nháp từ học liệu **đã duyệt** (UUID thật của Platform); web lưu thành quiz `draft` trên Platform |
| `POST` | `/quiz/from-bank` | Instructor / TA / Admin | Giảng viên sinh đề từ text ngân hàng câu hỏi (tạo draft) |
| `POST` | `/api/ai/gen-quiz` | Instructor / TA / Admin | **API Contract** sinh 3 dạng bài tập từ nội dung gửi lên |
| `POST` | `/api/ai/analyze-competency` | Staff; sinh viên chỉ cho chính mình | Phân tích từ kết quả gửi lên |
| `POST` | `/quiz/from-note` | Student | Sinh viên tự ôn tập từ ghi chú riêng (**không lưu DB**) |
| `POST` | `/quiz/from-material/self-study` | Student | Sinh viên tự ôn tập từ bài giảng chính thức đã duyệt (**không lưu DB/draft store**, không sinh `draft_id`) |
| `PATCH` | `/quiz/{draft_id}/publish` · `GET /quiz/{draft_id}` | Instructor / TA / Admin | (Legacy Day 2, bộ nhớ tạm) — cổng duyệt thật là `PATCH /courses/{id}/quizzes/{qid}/status` trên Platform |
| `GET` | `/health` | All | Tình trạng service, `llm_configured` |

---

## ⚙️ Cấu hình môi trường (.env)

Tạo file `.env` trong thư mục `rag/` (file này được bảo vệ trong `.gitignore`, tuyệt đối không commit lên Git):
```env
LLM_API_KEY=your-api-key-here
LLM_BASE_URL=https://api.your-provider.com/v1
LLM_MODEL=your-model-name-here
AI_SERVICE_PORT=8001

# Bắt buộc khi tích hợp
PLATFORM_API_URL=http://localhost:8000
JWT_SECRET=<giống hệt JWT_SECRET trong platform/backend/.env>
```
