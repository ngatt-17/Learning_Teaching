// Shapes returned by the Platform API (platform/backend) and the AI service (rag/).
// Field names mirror the JSON contracts; see docs/exploration/day-03/INTEGRATION.md.

export type Role = 'student' | 'instructor' | 'ta' | 'admin';

export interface User {
  user_id: string;
  email: string;
  name: string;
  role: Role;
  enrolled_courses: string[];
}

export interface Course {
  id: string;
  code: string;
  name: string;
  term: string;
  instructor_name?: string | null;
  instructor_email?: string | null;
  my_role?: Role;
}

export type MaterialStatus = 'draft' | 'processing' | 'failed' | 'approved' | 'archived';

export interface Material {
  id: string;
  course_id: string;
  title: string;
  status: MaterialStatus;
  approved_for_ai: boolean;
  page_count: number;
  week_number: number | null;
  lesson_title: string | null;
  has_file?: boolean;
  original_filename?: string | null;
  processing_error?: string | null;
  uploaded_by_name?: string | null;
  created_at?: string;
}

export interface MaterialPage {
  page_number: number;
  content: string;
}

export type QuestionType = 'single_choice' | 'multiple_choice' | 'short_answer';
export type QuizStatus = 'draft' | 'published' | 'archived';

export interface QuestionCitation {
  material_id?: string | null;
  title?: string | null;
  page?: number | null;
  snippet?: string | null;
}

export interface QuizSummary {
  id: string;
  week_number: number | null;
  title: string;
  description?: string | null;
  quiz_type: 'lesson' | 'comprehensive';
  source: 'manual' | 'ai_draft';
  status: QuizStatus;
  points_per_question: number;
  time_limit_seconds: number | null;
  due_at: string | null;
  material_id: string | null;
  question_count: number;
  max_score?: number;
  my_attempts?: number;
  my_best_score?: number | null;
  attempt_count?: number;
  student_count?: number;
  first_attempt_avg_ratio?: number | null;
}

export interface StudentQuestion {
  id: string;
  position: number;
  question_type: QuestionType;
  prompt: string;
  options: string[] | null;
  topic: string | null;
}

export interface StudentQuiz {
  id: string;
  course_id: string;
  material_id: string | null;
  title: string;
  description: string | null;
  week_number: number | null;
  quiz_type: 'lesson' | 'comprehensive';
  status: QuizStatus;
  points_per_question: number;
  time_limit_seconds: number | null;
  due_at: string | null;
  questions: StudentQuestion[];
}

export type AnswerValue = string | string[];

export interface GradedAnswer {
  question_id: string;
  position: number;
  prompt: string;
  question_type: QuestionType;
  options: string[] | null;
  correct_answer: AnswerValue;
  explanation: string | null;
  topic: string | null;
  citation: QuestionCitation | null;
  submitted_answer: AnswerValue | null;
  is_correct: boolean;
}

export interface Attempt {
  attempt_id: string;
  attempt_number: number;
  correct_count: number;
  total_questions: number;
  score: number;
  max_score: number;
  points_awarded: number;
  submitted_at: string;
  answers: GradedAnswer[];
}

export interface SubmitResult {
  attempt_id: string;
  attempt_number: number;
  correct_count: number;
  total_questions: number;
  score: number;
  max_score: number;
  points_awarded: number;
  submitted_at: string;
  note: string | null;
}

export interface ManagedQuestion {
  id?: string;
  question_type: QuestionType;
  prompt: string;
  options: string[] | null;
  correct_answer: AnswerValue;
  accepted_answers: string[] | null;
  explanation: string | null;
  topic: string | null;
  citation: QuestionCitation | null;
}

export interface ManagedQuiz extends Omit<StudentQuiz, 'questions'> {
  source: 'manual' | 'ai_draft';
  created_by: string | null;
  questions: ManagedQuestion[];
}

export interface QuestionStat {
  question_id: string;
  position: number;
  prompt: string;
  topic: string | null;
  answered: number;
  correct: number;
  correct_ratio: number | null;
}

export interface Note {
  id: string;
  owner_id: string;
  course_id: string;
  material_id: string | null;
  page_number: number | null;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  week_number: number;
  lesson_title: string;
  available: boolean;
  locked_reason: string | null;
}

export interface Member {
  id: string;
  email: string;
  name: string;
  role: Role;
  enrolled_at: string | null;
}

export interface StudentScore {
  student_id: string;
  name: string;
  email: string;
  streak_days: number;
  quiz_score: number;
  comprehensive_score: number;
  active_score: number;
  total_score: number;
  last_active_date: string | null;
}

export interface MyScore {
  streak_days: number;
  quiz_score: number;
  comprehensive_score: number;
  active_score: number;
  total_score: number;
}

export interface Readiness {
  id: string;
  code: string;
  name: string;
  term: string;
  instructor_name: string | null;
  students: number;
  materials_total: number;
  materials_approved: number;
  materials_pending: number;
  materials_failed: number;
  quizzes_published: number;
  quizzes_draft: number;
  feedback_count: number;
}

export interface FeedbackItem {
  id: string;
  course_id: string;
  content: string;
  submitted_at: string;
}

// ── AI service ──────────────────────────────────────────────

export type Generation = 'llm' | 'extractive' | 'guardrail';

export interface AiCitation {
  material_id: string;
  title: string;
  page: number;
  snippet: string;
}

export interface ChatAnswer {
  answer: string;
  citations: AiCitation[];
  evidence_level: 'supported' | 'insufficient';
  generation: Generation;
}

export interface TutorAnswer extends ChatAnswer {
  mode: 'hint' | 'review';
  question_id: string | null;
}

export interface CompetencyItem {
  topic: string;
  mastery_pct: number;
  status: string;
  evidence: string;
  recommended_action?: string;
}

export interface CompetencyReport {
  student_id: string;
  course_id: string;
  competency_summary: { strengths: CompetencyItem[]; weaknesses: CompetencyItem[] };
}

export interface AiDraftQuestion {
  id: string;
  type: string;
  topic?: string;
  question: string;
  options?: string[];
  correct_answer: number | number[] | string;
  keywords?: string[];
  explanation?: string;
  citation?: { source_file?: string; page?: number; evidence_snippet?: string };
}

export interface AiDraft {
  draft_id: string;
  topic: string;
  questions: AiDraftQuestion[];
}
