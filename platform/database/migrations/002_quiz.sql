-- ============================================================
-- Migration 002 — Quiz engine with server-side grading
-- Apply to an existing database:
--   psql -U postgres -d cecs_ai_hub -f platform/database/migrations/002_quiz.sql
-- (schema.sql already contains these tables for a fresh install)
-- ============================================================

-- ------------------------------------------------------------
-- quizzes — một bài quiz của buổi học, hoặc quiz tổng hợp sinh ra cho SV
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quizzes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id           UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    material_id         UUID REFERENCES materials(id) ON DELETE SET NULL,
    week_number         INTEGER,
    title               TEXT NOT NULL,
    quiz_type           TEXT NOT NULL DEFAULT 'lesson'
                        CHECK (quiz_type IN ('lesson', 'comprehensive')),
    -- 'ai_draft' = do AI sinh nháp, luôn bắt đầu ở 'draft' và cần giảng viên duyệt
    source              TEXT NOT NULL DEFAULT 'manual'
                        CHECK (source IN ('manual', 'ai_draft')),
    status              TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'published', 'archived')),
    points_per_question NUMERIC(5,2) NOT NULL DEFAULT 1 CHECK (points_per_question > 0),
    time_limit_seconds  INTEGER,
    created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quizzes_course_status ON quizzes(course_id, status);

-- ------------------------------------------------------------
-- quiz_questions — correct_answer KHÔNG BAO GIỜ trả về cho sinh viên
-- trước khi nộp bài (xem routes/quiz_routes.py)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quiz_questions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id        UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    position       INTEGER NOT NULL,
    question_type  TEXT NOT NULL DEFAULT 'multiple_choice'
                   CHECK (question_type IN ('multiple_choice', 'short_answer')),
    prompt         TEXT NOT NULL,
    options        JSONB,
    correct_answer TEXT NOT NULL,
    explanation    TEXT,
    UNIQUE (quiz_id, position)
);

-- ------------------------------------------------------------
-- quiz_attempts — mỗi lần nộp bài, điểm do server tính
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id         UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    attempt_number  INTEGER NOT NULL DEFAULT 1,
    correct_count   INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0,
    score           NUMERIC(6,2) NOT NULL DEFAULT 0,
    max_score       NUMERIC(6,2) NOT NULL DEFAULT 0,
    -- Chỉ lần nộp đầu tiên được cộng điểm; các lần sau là luyện tập (0 điểm)
    points_awarded  NUMERIC(5,2) NOT NULL DEFAULT 0,
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (quiz_id, student_id, attempt_number)
);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON quiz_attempts(student_id, course_id);

-- ------------------------------------------------------------
-- quiz_attempt_answers — đáp án SV đã chọn + kết quả chấm
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id       UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id      UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    submitted_answer TEXT,
    is_correct       BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (attempt_id, question_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON quizzes, quiz_questions, quiz_attempts, quiz_attempt_answers TO cecs_app;

-- ============================================================
-- Seed Day 2: 1 quiz đã publish (Week 1) + 1 quiz nháp (Week 2)
-- ============================================================
INSERT INTO quizzes (id, course_id, material_id, week_number, title, quiz_type, source, status, points_per_question, created_by)
VALUES
    ('30000000-0000-0000-0000-000000000001',
     '10000000-0000-0000-0000-000000000001',
     '20000000-0000-0000-0000-000000000001',
     1, 'Quiz 1 — Introduction to Operating Systems', 'lesson', 'manual', 'published', 5,
     '00000000-0000-0000-0000-000000000002'),
    ('30000000-0000-0000-0000-000000000002',
     '10000000-0000-0000-0000-000000000001',
     '20000000-0000-0000-0000-000000000002',
     2, 'Quiz 2 — Process Management (AI draft, chờ duyệt)', 'lesson', 'ai_draft', 'draft', 5,
     '00000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

INSERT INTO quiz_questions (quiz_id, position, question_type, prompt, options, correct_answer, explanation)
VALUES
    ('30000000-0000-0000-0000-000000000001', 1, 'multiple_choice',
     'Process là gì?',
     '["Một file trên đĩa", "Một chương trình đang chạy", "Một thư viện liên kết động", "Một vùng nhớ trống"]'::jsonb,
     'Một chương trình đang chạy',
     'Process là một chương trình đang trong trạng thái thực thi, có PCB và không gian địa chỉ riêng.'),
    ('30000000-0000-0000-0000-000000000001', 2, 'multiple_choice',
     'Cấu trúc nào lưu trạng thái của một process?',
     '["PCB", "MMU", "TLB", "DMA"]'::jsonb,
     'PCB',
     'Process Control Block lưu PID, trạng thái, thanh ghi và thông tin lập lịch.'),
    ('30000000-0000-0000-0000-000000000001', 3, 'short_answer',
     'Viết tắt của Process Control Block là gì?',
     NULL,
     'PCB',
     'Chấm bằng so khớp không phân biệt hoa thường và khoảng trắng thừa.'),
    ('30000000-0000-0000-0000-000000000002', 1, 'multiple_choice',
     'Chuyển ngữ cảnh (context switch) xảy ra khi nào?',
     '["Khi CPU chuyển từ process này sang process khác", "Khi ghi file ra đĩa", "Khi cấp phát bộ nhớ", "Khi biên dịch chương trình"]'::jsonb,
     'Khi CPU chuyển từ process này sang process khác',
     'Kernel lưu trạng thái process hiện tại và nạp trạng thái của process kế tiếp.')
ON CONFLICT (quiz_id, position) DO NOTHING;

-- ------------------------------------------------------------
-- Fixture bổ sung: tuần 2 có tài liệu đã duyệt + quiz đã phát hành,
-- để quiz tổng hợp (cần >= 2 chủ đề đã học) có dữ liệu chạy thật.
-- Tài liệu draft của tuần 2 vẫn giữ nguyên để kiểm tra "draft bị ẩn".
-- ------------------------------------------------------------
INSERT INTO materials (id, course_id, title, file_path, status, approved_for_ai, uploaded_by) VALUES
    ('20000000-0000-0000-0000-000000000003',
     '10000000-0000-0000-0000-000000000001',
     'Week 2 — Process Scheduling (approved)',
     'uploads/comp2030_week2_scheduling.pdf',
     'approved', TRUE,
     '00000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

INSERT INTO week_classifications (material_id, course_id, week_number, lesson_title, classified_by) VALUES
    ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 2,
     'Process Management', '00000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

INSERT INTO quizzes (id, course_id, material_id, week_number, title, quiz_type, source, status, points_per_question, created_by)
VALUES
    ('30000000-0000-0000-0000-000000000003',
     '10000000-0000-0000-0000-000000000001',
     '20000000-0000-0000-0000-000000000003',
     2, 'Quiz 2 — Process Scheduling', 'lesson', 'manual', 'published', 5,
     '00000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

INSERT INTO quiz_questions (quiz_id, position, question_type, prompt, options, correct_answer, explanation) VALUES
    ('30000000-0000-0000-0000-000000000003', 1, 'multiple_choice',
     'Thuật toán lập lịch nào cho thời gian chờ trung bình tối ưu?',
     '["FCFS", "Shortest Job First", "Round Robin", "Priority"]'::jsonb,
     'Shortest Job First',
     'SJF tối ưu thời gian chờ trung bình nhưng cần biết trước độ dài burst.'),
    ('30000000-0000-0000-0000-000000000003', 2, 'short_answer',
     'Round Robin cần tham số nào để hoạt động?',
     NULL,
     'time quantum',
     'Mỗi process được chạy tối đa một time quantum trước khi bị preempt.')
ON CONFLICT (quiz_id, position) DO NOTHING;

-- Student C (cùng Course A với Student A) — dùng để kiểm tra quiz tổng hợp
-- của một sinh viên không lộ sang sinh viên khác trong cùng lớp.
INSERT INTO users (id, email, name, role) VALUES
    ('00000000-0000-0000-0000-000000000005', 'student_c@vinuni.edu.vn', 'Student C', 'student')
ON CONFLICT (id) DO NOTHING;

INSERT INTO enrollments (user_id, course_id, role) VALUES
    ('00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'student')
ON CONFLICT (user_id, course_id) DO NOTHING;
