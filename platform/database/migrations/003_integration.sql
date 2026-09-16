-- ============================================================
-- Migration 003 — Integration contract (Platform ⇄ AI service ⇄ Web)
-- Apply to an existing database:
--   psql -U postgres -d cecs_ai_hub -f platform/database/migrations/003_integration.sql
-- (schema.sql already contains these changes for a fresh install)
--
-- 1. material_pages: extracted text per page. The AI service reads it only
--    through the Platform API, which filters to approved materials.
-- 2. Material lifecycle gains 'failed' so extraction errors can be retried.
-- 3. Question types follow the AI pair's contract:
--    single_choice | multiple_choice (select all) | short_answer.
-- 4. Questions carry topic, accepted answers and a source citation.
-- 5. Quizzes carry a description and an optional due date.
-- 6. Private notes can be anchored to a material page (still owner-only RLS).
-- ============================================================
\encoding UTF8

-- ------------------------------------------------------------
-- 1-2. Materials: lifecycle + extracted pages
-- ------------------------------------------------------------
ALTER TABLE materials DROP CONSTRAINT IF EXISTS materials_status_check;
ALTER TABLE materials ADD CONSTRAINT materials_status_check
    CHECK (status IN ('draft', 'processing', 'failed', 'approved', 'archived'));
ALTER TABLE materials ADD COLUMN IF NOT EXISTS original_filename TEXT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS page_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS processing_error TEXT;

CREATE TABLE IF NOT EXISTS material_pages (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id  UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    page_number  INTEGER NOT NULL CHECK (page_number >= 1),
    content      TEXT NOT NULL DEFAULT '',
    UNIQUE (material_id, page_number)
);

-- ------------------------------------------------------------
-- 3-4. Question contract
-- The rename only runs while the old constraint (without single_choice) is in
-- place, so re-applying the migration never rewrites real select-all questions.
-- ------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'quiz_questions_question_type_check'
          AND pg_get_constraintdef(oid) LIKE '%single_choice%'
    ) THEN
        ALTER TABLE quiz_questions DROP CONSTRAINT IF EXISTS quiz_questions_question_type_check;
        UPDATE quiz_questions SET question_type = 'single_choice' WHERE question_type = 'multiple_choice';
        ALTER TABLE quiz_questions ADD CONSTRAINT quiz_questions_question_type_check
            CHECK (question_type IN ('single_choice', 'multiple_choice', 'short_answer'));
    END IF;
END
$$;
ALTER TABLE quiz_questions ALTER COLUMN question_type SET DEFAULT 'single_choice';
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS accepted_answers JSONB;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS citation JSONB;

-- ------------------------------------------------------------
-- 5. Quiz metadata
-- ------------------------------------------------------------
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ;

-- ------------------------------------------------------------
-- 6. Private notes anchored to a material page. RLS policy is unchanged.
-- ------------------------------------------------------------
ALTER TABLE private_notes ADD COLUMN IF NOT EXISTS material_id UUID REFERENCES materials(id) ON DELETE SET NULL;
ALTER TABLE private_notes ADD COLUMN IF NOT EXISTS page_number INTEGER;

GRANT SELECT, INSERT, UPDATE, DELETE ON material_pages TO cecs_app;

-- ============================================================
-- Seed — synthetic page text for the Day 2 scenario
-- ============================================================

-- Course A (COMP2030) — Week 1 approved material
UPDATE materials SET page_count = 3 WHERE id = '20000000-0000-0000-0000-000000000001';
INSERT INTO material_pages (material_id, page_number, content) VALUES
    ('20000000-0000-0000-0000-000000000001', 1,
     'Hệ điều hành (Operating System) là phần mềm quản lý phần cứng và cung cấp dịch vụ cho chương trình ứng dụng. '
     'Các chức năng chính: quản lý tiến trình, quản lý bộ nhớ, quản lý file và quản lý thiết bị vào/ra. '
     'Kernel là phần lõi luôn chạy ở chế độ privileged (kernel mode).'),
    ('20000000-0000-0000-0000-000000000001', 2,
     'Tiến trình (process) là một chương trình đang chạy. Chương trình (program) chỉ là file thực thi nằm trên đĩa; '
     'khi được nạp vào bộ nhớ và thực thi, nó trở thành process. Mỗi process có không gian địa chỉ riêng gồm '
     'code, data, heap và stack.'),
    ('20000000-0000-0000-0000-000000000001', 3,
     'Process Control Block (PCB) là cấu trúc dữ liệu kernel dùng để lưu trạng thái của một process: '
     'PID, trạng thái (new, ready, running, waiting, terminated), program counter, các thanh ghi CPU, '
     'thông tin lập lịch và thông tin quản lý bộ nhớ.')
ON CONFLICT (material_id, page_number) DO NOTHING;

-- Course A — Week 2 DRAFT material. The canary phrase must never appear in a
-- student-facing answer, citation or content payload.
UPDATE materials SET page_count = 1 WHERE id = '20000000-0000-0000-0000-000000000002';
INSERT INTO material_pages (material_id, page_number, content) VALUES
    ('20000000-0000-0000-0000-000000000002', 1,
     'DRAFT-CANARY: Nội dung nháp về process management chưa được giảng viên duyệt. '
     'Semaphore và mutex sẽ được bổ sung sau. Nội dung này không được xuất hiện trong câu trả lời cho sinh viên.')
ON CONFLICT (material_id, page_number) DO NOTHING;

-- Course A — Week 2 approved material
UPDATE materials SET page_count = 3 WHERE id = '20000000-0000-0000-0000-000000000003';
INSERT INTO material_pages (material_id, page_number, content) VALUES
    ('20000000-0000-0000-0000-000000000003', 1,
     'Lập lịch CPU (CPU scheduling) chọn process tiếp theo trong hàng đợi ready để cấp CPU. '
     'Tiêu chí đánh giá: thời gian chờ trung bình (average waiting time), thời gian hoàn thành và thông lượng.'),
    ('20000000-0000-0000-0000-000000000003', 2,
     'FCFS (First Come First Served) phục vụ theo thứ tự đến. Shortest Job First (SJF) chọn process có CPU burst '
     'ngắn nhất và cho thời gian chờ trung bình tối ưu, nhưng cần biết trước độ dài burst.'),
    ('20000000-0000-0000-0000-000000000003', 3,
     'Round Robin (RR) cấp cho mỗi process tối đa một time quantum rồi preempt và đưa process về cuối hàng đợi ready. '
     'Chuyển ngữ cảnh (context switch) xảy ra khi CPU chuyển từ process này sang process khác: '
     'kernel lưu trạng thái vào PCB cũ và nạp trạng thái từ PCB mới.')
ON CONFLICT (material_id, page_number) DO NOTHING;

-- Course A — topics and citations for the seeded lesson quizzes
UPDATE quiz_questions SET topic = 'Tiến trình (Process)',
       citation = '{"material_id": "20000000-0000-0000-0000-000000000001", "title": "Week 1 — Introduction to OS", "page": 2}'::jsonb
 WHERE quiz_id = '30000000-0000-0000-0000-000000000001' AND position = 1;
UPDATE quiz_questions SET topic = 'Process Control Block',
       citation = '{"material_id": "20000000-0000-0000-0000-000000000001", "title": "Week 1 — Introduction to OS", "page": 3}'::jsonb
 WHERE quiz_id = '30000000-0000-0000-0000-000000000001' AND position IN (2, 3);
UPDATE quiz_questions SET topic = 'Lập lịch CPU',
       citation = '{"material_id": "20000000-0000-0000-0000-000000000003", "title": "Week 2 — Process Scheduling (approved)", "page": 2}'::jsonb
 WHERE quiz_id = '30000000-0000-0000-0000-000000000003' AND position = 1;
UPDATE quiz_questions SET topic = 'Round Robin', accepted_answers = '["quantum", "time slice"]'::jsonb,
       citation = '{"material_id": "20000000-0000-0000-0000-000000000003", "title": "Week 2 — Process Scheduling (approved)", "page": 3}'::jsonb
 WHERE quiz_id = '30000000-0000-0000-0000-000000000003' AND position = 2;

-- Course B (COMP3010) — its own approved material, so cross-course retrieval can be tested
INSERT INTO materials (id, course_id, title, file_path, status, approved_for_ai, uploaded_by, page_count) VALUES
    ('20000000-0000-0000-0000-000000000004',
     '10000000-0000-0000-0000-000000000002',
     'Week 1 — Stacks and Queues',
     NULL, 'approved', TRUE,
     '00000000-0000-0000-0000-000000000002', 2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO week_classifications (material_id, course_id, week_number, lesson_title, classified_by)
SELECT '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 1,
       'Stacks and Queues', '00000000-0000-0000-0000-000000000002'
WHERE NOT EXISTS (SELECT 1 FROM week_classifications WHERE material_id = '20000000-0000-0000-0000-000000000004');
INSERT INTO material_pages (material_id, page_number, content) VALUES
    ('20000000-0000-0000-0000-000000000004', 1,
     'A stack is a last-in, first-out (LIFO) data structure. Operations: push (add to top), pop (remove from top), '
     'peek (view top). Use cases: undo functionality, the call stack in recursion, expression evaluation.'),
    ('20000000-0000-0000-0000-000000000004', 2,
     'A queue is a first-in, first-out (FIFO) data structure. Operations: enqueue (add to rear), dequeue (remove from front). '
     'Use cases: task scheduling, print queues, breadth-first search.')
ON CONFLICT (material_id, page_number) DO NOTHING;

-- ============================================================
-- Seed — Course C (CS-AI3010): the student quiz demo
-- "Bài tập 8: Kiểm tra kiến thức E-Commerce & AI" with synthetic lecture pages
-- ============================================================
INSERT INTO courses (id, code, name, term, instructor_id) VALUES
    ('10000000-0000-0000-0000-000000000003', 'CS-AI3010', 'Trí tuệ nhân tạo nâng cao', 'Fall 2026',
     '00000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

INSERT INTO enrollments (user_id, course_id, role) VALUES
    ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'admin'),
    ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'instructor'),
    ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'student')
ON CONFLICT (user_id, course_id) DO NOTHING;

INSERT INTO materials (id, course_id, title, file_path, status, approved_for_ai, uploaded_by, page_count) VALUES
    ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000003',
     'Giáo trình E-Commerce Foundations — Chương 1', NULL, 'approved', TRUE, '00000000-0000-0000-0000-000000000002', 2),
    ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000003',
     'Đồ họa máy tính & Thiết bị hiển thị — Chương 2', NULL, 'approved', TRUE, '00000000-0000-0000-0000-000000000002', 2),
    ('20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000003',
     'AI Nâng cao — Tác tử thông minh (Slide AI(1))', NULL, 'approved', TRUE, '00000000-0000-0000-0000-000000000002', 2),
    ('20000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000003',
     'Machine Learning & Khai phá dữ liệu — Chương 3', NULL, 'approved', TRUE, '00000000-0000-0000-0000-000000000002', 2),
    ('20000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000003',
     'Ứng dụng LLM & Đạo đức AI — Chương 4', NULL, 'approved', TRUE, '00000000-0000-0000-0000-000000000002', 2),
    ('20000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000003',
     'Chương 5 — Học tăng cường (DRAFT)', NULL, 'draft', FALSE, '00000000-0000-0000-0000-000000000002', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO week_classifications (material_id, course_id, week_number, lesson_title, classified_by)
SELECT v.material_id::uuid, '10000000-0000-0000-0000-000000000003', v.week_number, v.lesson_title,
       '00000000-0000-0000-0000-000000000002'
FROM (VALUES
    ('20000000-0000-0000-0000-000000000011', 1, 'Nền tảng E-Commerce'),
    ('20000000-0000-0000-0000-000000000012', 2, 'Đồ họa & Hiển thị'),
    ('20000000-0000-0000-0000-000000000013', 3, 'Tác tử AI & PEAS'),
    ('20000000-0000-0000-0000-000000000014', 4, 'Học máy & Phân cụm'),
    ('20000000-0000-0000-0000-000000000015', 5, 'Mô hình ngôn ngữ lớn (LLM)'),
    ('20000000-0000-0000-0000-000000000016', 6, 'Học tăng cường')
) AS v(material_id, week_number, lesson_title)
WHERE NOT EXISTS (SELECT 1 FROM week_classifications w WHERE w.material_id = v.material_id::uuid);

INSERT INTO material_pages (material_id, page_number, content) VALUES
    ('20000000-0000-0000-0000-000000000011', 13,
     'Sàn thương mại điện tử (E-Commerce Marketplace) là nền tảng trung gian kết nối nhiều người bán và người mua, '
     'xử lý đơn hàng, thanh toán và vận chuyển. Mô hình phổ biến: B2C và C2C.'),
    ('20000000-0000-0000-0000-000000000011', 14,
     'Sàn TMĐT độc lập tại Việt Nam: Lazada, Shopee, Tiki — hoạt động cốt lõi là mua bán trực tuyến. '
     'Social Commerce khác với sàn TMĐT: TikTok là mạng xã hội chia sẻ video ngắn; TikTok Shop chỉ là tính năng bán hàng '
     'tích hợp trong nền tảng mạng xã hội, nên tiktok.com không phải là sàn TMĐT độc lập.'),
    ('20000000-0000-0000-0000-000000000012', 21,
     'Độ phân giải màn hình là số điểm ảnh (pixel) theo chiều ngang nhân chiều dọc. Tỷ lệ khung hình phổ biến là 16:9.'),
    ('20000000-0000-0000-0000-000000000012', 22,
     'Các chuẩn độ phân giải: HD 1280x720; Full HD (FHD, 1080p) 1920x1080; 2K QHD 2560x1440; 4K UHD 3840x2160.'),
    ('20000000-0000-0000-0000-000000000013', 15,
     'Tác tử (agent) cảm nhận môi trường qua cảm biến và hành động qua bộ chấp hành. '
     'Mô tả bài toán tác tử bằng PEAS: Performance measure, Environment, Actuators, Sensors.'),
    ('20000000-0000-0000-0000-000000000013', 16,
     'Tác tử duy lý (rational agent) chọn hành động nhằm tối đa hóa thước đo hiệu năng kỳ vọng, dựa trên chuỗi tri giác '
     'đã nhận được và tri thức sẵn có. Duy lý không đồng nghĩa với toàn tri (omniscience): tác tử duy lý vẫn có thể sai '
     'khi thiếu thông tin.'),
    ('20000000-0000-0000-0000-000000000014', 55,
     'Học có giám sát (supervised learning) dùng dữ liệu có nhãn, ví dụ Linear Regression, Decision Tree, CNN phân loại ảnh.'),
    ('20000000-0000-0000-0000-000000000014', 56,
     'Học không giám sát (unsupervised learning) tìm cấu trúc trong dữ liệu không nhãn. K-Means Clustering phân cụm '
     'dữ liệu, ví dụ phân nhóm khách hàng, bằng cách lặp lại hai bước: gán điểm vào tâm cụm gần nhất và cập nhật tâm cụm.'),
    ('20000000-0000-0000-0000-000000000015', 81,
     'Mô hình ngôn ngữ lớn (LLM) sinh văn bản bằng cách dự đoán token tiếp theo dựa trên dữ liệu huấn luyện.'),
    ('20000000-0000-0000-0000-000000000015', 82,
     'Ảo giác thông tin (hallucination) là hiện tượng LLM sinh ra thông tin sai lệch hoặc không có trong tài liệu nguồn '
     'nhưng trình bày rất tự tin và thuyết phục. RAG (Retrieval-Augmented Generation) giảm ảo giác bằng cách truy xuất '
     'tài liệu đã duyệt làm bằng chứng và trích dẫn nguồn.'),
    ('20000000-0000-0000-0000-000000000016', 1,
     'DRAFT-CANARY: Q-learning và chính sách epsilon-greedy — bản nháp chưa duyệt, không được dùng để trả lời sinh viên.')
ON CONFLICT (material_id, page_number) DO NOTHING;

INSERT INTO quizzes (id, course_id, material_id, week_number, title, description, quiz_type, source, status,
                     points_per_question, time_limit_seconds, due_at, created_by)
VALUES
    ('30000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000003', NULL, 8,
     'Bài tập 8: Kiểm tra kiến thức E-Commerce & AI',
     'Hãy đọc kỹ nội dung từng câu hỏi và chọn phương án chính xác nhất. Bạn có thể sử dụng bảng danh sách câu hỏi ở bên trái để chuyển nhanh giữa các câu.',
     'lesson', 'manual', 'published', 1, 900, '2026-09-24 23:59:00+07',
     '00000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

INSERT INTO quiz_questions (quiz_id, position, question_type, prompt, options, correct_answer, explanation, topic, citation)
VALUES
    ('30000000-0000-0000-0000-000000000011', 1, 'single_choice',
     'Website nào dưới đây không phải là Sàn Thương mại điện tử độc lập?',
     '["Lazada Việt Nam", "Shopee Việt Nam", "Tiki", "Tiktok.com"]'::jsonb,
     'Tiktok.com',
     'Tiktok.com là nền tảng mạng xã hội chia sẻ video ngắn; TikTok Shop chỉ là tính năng thương mại tích hợp. Lazada, Shopee và Tiki là các sàn thương mại điện tử thuần túy.',
     'Nền tảng E-Commerce',
     '{"material_id": "20000000-0000-0000-0000-000000000011", "title": "Giáo trình E-Commerce Foundations — Chương 1", "page": 14}'::jsonb),
    ('30000000-0000-0000-0000-000000000011', 2, 'single_choice',
     'Màn hình Full HD có độ phân giải tiêu chuẩn là bao nhiêu?',
     '["3840x2160", "2560x1440", "1920x1080", "1280x720"]'::jsonb,
     '1920x1080',
     'Full HD (FHD / 1080p) là 1920x1080 pixel, tỷ lệ 16:9. 3840x2160 là 4K UHD, 2560x1440 là 2K QHD và 1280x720 là HD.',
     'Đồ họa & Hiển thị',
     '{"material_id": "20000000-0000-0000-0000-000000000012", "title": "Đồ họa máy tính & Thiết bị hiển thị — Chương 2", "page": 22}'::jsonb),
    ('30000000-0000-0000-0000-000000000011', 3, 'single_choice',
     'Trong trí tuệ nhân tạo, tác tử duy lý (Rational Agent) được định nghĩa là tác tử như thế nào?',
     '["Tác tử hành động nhằm tối đa hóa thước đo hiệu năng kỳ vọng dựa trên chuỗi tri giác và tri thức tích lũy", "Tác tử luôn đưa ra quyết định giống 100% hành vi của con người", "Tác tử có tốc độ xử lý phần cứng nhanh nhất trong hệ thống", "Tác tử không bao giờ mắc bất kỳ sai sót nào trong mọi tình huống tương lai"]'::jsonb,
     'Tác tử hành động nhằm tối đa hóa thước đo hiệu năng kỳ vọng dựa trên chuỗi tri giác và tri thức tích lũy',
     'Tính duy lý không đồng nghĩa với toàn tri. Tác tử duy lý chọn hành động tối đa hóa hiệu năng mong đợi dựa trên chuỗi tri giác và tri thức cơ sở.',
     'Khung tác tử AI & PEAS',
     '{"material_id": "20000000-0000-0000-0000-000000000013", "title": "AI Nâng cao — Tác tử thông minh (Slide AI(1))", "page": 16}'::jsonb),
    ('30000000-0000-0000-0000-000000000011', 4, 'single_choice',
     'Thuật toán nào dưới đây thuộc nhóm học máy không giám sát (Unsupervised Learning) dùng để phân cụm dữ liệu khách hàng?',
     '["Linear Regression (Hồi quy tuyến tính)", "K-Means Clustering", "Convolutional Neural Network (CNN)", "Decision Tree (Cây quyết định)"]'::jsonb,
     'K-Means Clustering',
     'K-Means Clustering là thuật toán phân cụm không giám sát, tự gom nhóm các điểm dữ liệu tương đồng mà không cần nhãn. Linear Regression và Decision Tree là học có giám sát.',
     'Học máy & Phân cụm',
     '{"material_id": "20000000-0000-0000-0000-000000000014", "title": "Machine Learning & Khai phá dữ liệu — Chương 3", "page": 56}'::jsonb),
    ('30000000-0000-0000-0000-000000000011', 5, 'single_choice',
     'Hiện tượng "Ảo giác thông tin" (Hallucination) trong các mô hình ngôn ngữ lớn (LLM) là gì?',
     '["Mô hình tự động tắt server khi quá tải truy cập", "Mô hình sinh ra các thông tin sai lệch nhưng với giọng điệu rất tự tin và thuyết phục", "Mô hình bị nhiễm virus phần cứng từ máy khách", "Mô hình chỉ dịch được tiếng Anh mà không dịch được tiếng Việt"]'::jsonb,
     'Mô hình sinh ra các thông tin sai lệch nhưng với giọng điệu rất tự tin và thuyết phục',
     'Hallucination là hiện tượng LLM tạo ra nội dung sai sự thật hoặc không có trong tài liệu ngữ cảnh nhưng được trình bày tự nhiên và tự tin.',
     'Mô hình ngôn ngữ lớn (LLM)',
     '{"material_id": "20000000-0000-0000-0000-000000000015", "title": "Ứng dụng LLM & Đạo đức AI — Chương 4", "page": 82}'::jsonb)
ON CONFLICT (quiz_id, position) DO NOTHING;
