-- ============================================================
-- CECS AI Learning Hub — PostgreSQL Schema
-- Cách chạy:
--   psql -U postgres -f schema.sql
-- ============================================================

-- The files are UTF-8 (Vietnamese seed text). Without this, psql on Windows uses the
-- console code page (e.g. WIN1252) and the seed inserts fail or store garbled text.
\encoding UTF8

-- 1. Tạo database
CREATE DATABASE cecs_ai_hub;

-- Kết nối vào database vừa tạo
\c cecs_ai_hub;
\encoding UTF8

-- ============================================================
-- 2. Enable UUID extension
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 3. BẢNG: users
-- ============================================================
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    role        TEXT NOT NULL CHECK (role IN ('student', 'instructor', 'ta', 'admin')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. BẢNG: courses
-- ============================================================
CREATE TABLE courses (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code           TEXT NOT NULL UNIQUE,
    name           TEXT NOT NULL,
    term           TEXT NOT NULL,
    instructor_id  UUID REFERENCES users(id),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. BẢNG: enrollments
-- Ai có quyền vào course nào, với role gì
-- ============================================================
CREATE TABLE enrollments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id    UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    role         TEXT NOT NULL CHECK (role IN ('student', 'instructor', 'ta', 'admin')),
    enrolled_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, course_id)
);

-- ============================================================
-- 6. BẢNG: materials
-- Tài liệu do giảng viên upload (slide, pdf)
-- ============================================================
CREATE TABLE materials (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id        UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title            TEXT NOT NULL,
    file_path        TEXT,
    status           TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'processing', 'approved', 'archived')),
    approved_for_ai  BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_by      UUID REFERENCES users(id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. BẢNG: week_classifications
-- Giảng viên tự phân loại tài liệu theo tuần
-- ============================================================
CREATE TABLE week_classifications (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id    UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    course_id      UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    week_number    INTEGER NOT NULL CHECK (week_number >= 1),
    lesson_title   TEXT NOT NULL,
    classified_by  UUID REFERENCES users(id),
    classified_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 8. BẢNG: question_banks
-- Ngân hàng đề giảng viên upload thủ công
-- ============================================================
CREATE TABLE question_banks (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id    UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    material_id  UUID REFERENCES materials(id),
    title        TEXT NOT NULL,
    file_path    TEXT,
    uploaded_by  UUID REFERENCES users(id),
    uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 9. BẢNG: private_notes  ← bảo vệ bằng RLS
-- ============================================================
CREATE TABLE private_notes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title       TEXT NOT NULL DEFAULT 'Untitled Note',
    content     TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bật Row-Level Security
ALTER TABLE private_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_notes FORCE ROW LEVEL SECURITY;

-- Policy: chỉ owner mới đọc/sửa/xóa được note của mình
-- App phải set: SET app.current_user_id = '<user_id>' trước mỗi query
CREATE POLICY note_owner_only ON private_notes
    FOR ALL
    USING (owner_id = NULLIF(current_setting('app.current_user_id', true), '')::UUID);

-- Tạo role cecs_app (non-superuser) để app kết nối và enforce RLS
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cecs_app') THEN
      CREATE ROLE cecs_app WITH LOGIN PASSWORD '0000';
   END IF;
END
$$;

GRANT ALL ON SCHEMA public TO cecs_app;
GRANT ALL ON ALL TABLES IN SCHEMA public TO cecs_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO cecs_app;

-- ============================================================
-- 10. BẢNG: student_scores
-- ============================================================
CREATE TABLE student_scores (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id            UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    streak_days          INTEGER NOT NULL DEFAULT 0,
    quiz_score           NUMERIC(5,2) NOT NULL DEFAULT 0,
    comprehensive_score  NUMERIC(5,2) NOT NULL DEFAULT 0,
    active_score         NUMERIC(5,2) NOT NULL DEFAULT 0,
    last_active_date     DATE,
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, course_id)
);

-- ============================================================
-- 11. BẢNG: anonymous_feedback  ← KHÔNG lưu user_id
-- ============================================================
CREATE TABLE anonymous_feedback (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id    UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    content      TEXT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 12. SEED DATA — Fixtures cho Day 2 testing
-- ============================================================

-- Users
INSERT INTO users (id, email, name, role) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@vinuni.edu.vn',      'Admin A',      'admin'),
    ('00000000-0000-0000-0000-000000000002', 'instructor@vinuni.edu.vn', 'Instructor A', 'instructor'),
    ('00000000-0000-0000-0000-000000000003', 'student_a@vinuni.edu.vn',  'Student A',    'student'),
    ('00000000-0000-0000-0000-000000000004', 'student_b@vinuni.edu.vn',  'Student B',    'student');

-- Courses
INSERT INTO courses (id, code, name, term, instructor_id) VALUES
    ('10000000-0000-0000-0000-000000000001', 'COMP2030', 'Operating Systems & Concurrency', 'Fall 2026', '00000000-0000-0000-0000-000000000002'),
    ('10000000-0000-0000-0000-000000000002', 'COMP3010', 'Data Structures & Algorithms',    'Fall 2026', '00000000-0000-0000-0000-000000000002');

-- Enrollments
INSERT INTO enrollments (user_id, course_id, role) VALUES
    -- Admin thấy tất cả
    ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'admin'),
    ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'admin'),
    -- Instructor A → Course A
    ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'instructor'),
    -- Student A → Course A only
    ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'student'),
    -- Student B → Course B only
    ('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'student');

-- Materials — Course A: 1 approved + 1 draft
INSERT INTO materials (id, course_id, title, file_path, status, approved_for_ai, uploaded_by) VALUES
    ('20000000-0000-0000-0000-000000000001',
     '10000000-0000-0000-0000-000000000001',
     'Week 1 — Introduction to OS',
     'uploads/comp2030_week1_intro.pdf',
     'approved', TRUE,
     '00000000-0000-0000-0000-000000000002'),

    ('20000000-0000-0000-0000-000000000002',
     '10000000-0000-0000-0000-000000000001',
     'Week 2 — Process Management (DRAFT)',
     'uploads/comp2030_week2_process.pdf',
     'draft', FALSE,
     '00000000-0000-0000-0000-000000000002');

-- Week classifications
INSERT INTO week_classifications (material_id, course_id, week_number, lesson_title, classified_by) VALUES
    ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1, 'Introduction to Operating Systems', '00000000-0000-0000-0000-000000000002'),
    ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 2, 'Process Management',               '00000000-0000-0000-0000-000000000002');

-- Private note của Student A (Course A)
INSERT INTO private_notes (owner_id, course_id, title, content) VALUES
    ('00000000-0000-0000-0000-000000000003',
     '10000000-0000-0000-0000-000000000001',
     'Ghi chú tuần 1',
     'Process là chương trình đang chạy. Mỗi process có PCB riêng...');

-- Student scores
INSERT INTO student_scores (student_id, course_id, streak_days, quiz_score, comprehensive_score, active_score) VALUES
    ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 3, 60, 20, 5);


-- ============================================================
-- 10-13. QUIZ ENGINE (migration 002)
-- Chấm điểm hoàn toàn phía server; correct_answer không bao giờ
-- lộ cho sinh viên trước khi nộp bài.
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

-- ============================================================
-- 14. INTEGRATION CONTRACT (migration 003)
-- material_pages, question types/citations, quiz due dates, note anchors,
-- and the CS-AI3010 demo course. Included rather than copied so a fresh
-- install and a migrated database can never drift apart.
-- ============================================================
\ir migrations/003_integration.sql

-- ============================================================
-- Kiểm tra nhanh sau khi chạy:
-- SELECT * FROM users;
-- SELECT * FROM enrollments;
-- SELECT * FROM materials;
-- SELECT * FROM private_notes;
-- ============================================================
