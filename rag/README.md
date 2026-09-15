# Module Grounded Chat RAG (Hỏi Đáp Có Căn Cứ)
**Thực hiện:** Thành viên B — Team 3 (AI & Quality)  
**Dự án:** CECS AI Learning Hub — VinUniversity CECS  
**Mục tiêu Day 02:** Xây dựng lõi Grounded Chat RAG với 4 rào chắn bảo vệ, trích dẫn số trang và từ chối khi thiếu dữ liệu.

---

## 📁 Cấu trúc thư mục

```
rag/
├── __init__.py                  # Package init
├── grounded_chat.py             # Bộ não Chat RAG với 4 rào chắn bảo vệ
├── mock_materials.py            # Dữ liệu tài liệu bài học (Approved & Draft)
├── demo.py                      # Kịch bản Demo 4 tình huống Grounded Chat
├── chat_cli.py                  # Khung Chat tương tác trực tiếp trong Terminal
├── test_rag.py                  # 5 bài kiểm thử tự động (Unit tests pass 100%)
├── BAO_CAO_LUONG_VA_LOGIC.md    # Báo cáo kiến trúc chi tiết cho các team
└── README.md                    # Tài liệu hướng dẫn này
```

---

## 🚀 Cách chạy thử nghiệm trong Terminal

### 1. Chat trực tiếp với AI (Gõ câu hỏi tự do)
```powershell
python rag/chat_cli.py
```

### 2. Chạy Demo 4 kịch bản tự động
```powershell
python rag/demo.py
```

### 3. Chạy Unit Tests kiểm chứng code
```powershell
python rag/test_rag.py
```

---

## 🛡️ 4 Rào chắn bảo vệ cốt lõi trong `grounded_chat.py`

1. **Lọc trạng thái tài liệu (Security & Isolation):**
   * Chỉ tìm trong tài liệu có `status = 'approved'` thuộc đúng môn học `course_id`.
   * Loại bỏ 100% tài liệu `draft` (chưa duyệt) và tài liệu của môn học khác.

2. **Trích dẫn minh bạch (Transparent Citations):**
   * Mọi câu trả lời bắt buộc gắn kèm tên file tài liệu và số trang cụ thể (`source_file`, `page`) để Frontend có thể làm tính năng nhấp chuột lật trang PDF.

3. **Từ chối chuẩn khi thiếu chứng cứ (Anti-Hallucination):**
   * Nếu câu hỏi nằm ngoài tài liệu học phần, AI trả lời câu chuẩn:  
     *"Tài liệu môn học đã được phê duyệt không có đủ thông tin để trả lời câu hỏi này."*
   * Đặt cờ `is_insufficient_evidence = True`, `citations = []`.

4. **Tutor, Not Solver (Triết lý Socratic):**
   * Khi sinh viên yêu cầu giải bài tập hoặc viết sẵn toàn bộ mã nguồn, AI từ chối làm hộ và hướng dẫn bậc thang gợi ý tư duy 3 bước (Scaffolded Hints).
