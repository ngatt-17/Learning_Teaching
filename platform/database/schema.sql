-- ============================================================
-- CECS AI Learning Hub — PostgreSQL Schema
-- Cách chạy:
--   psql -U postgres -f schema.sql
-- ============================================================

-- 1. Tạo database
CREATE DATABASE cecs_ai_hub;

-- Kết nối vào database vừa tạo
\c cecs_ai_hub;

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

-- Policy: chỉ owner mới đọc/sửa/xóa được note của mình
-- App phải set: SET app.current_user_id = '<user_id>' trước mỗi query
CREATE POLICY note_owner_only ON private_notes
    FOR ALL
    USING (owner_id = current_setting('app.current_user_id')::UUID);

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
-- Kiểm tra nhanh sau khi chạy:
-- SELECT * FROM users;
-- SELECT * FROM enrollments;
-- SELECT * FROM materials;
-- SELECT * FROM private_notes;
-- ============================================================
