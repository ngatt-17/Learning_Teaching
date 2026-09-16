import type { AiDraftQuestion, ManagedQuestion, Material, QuestionType } from '../../lib/types';

/** Editor row: a ManagedQuestion plus a stable client key. */
export interface EditableQuestion extends ManagedQuestion {
  key: string;
}

let counter = 0;
export const newKey = () => `q${Date.now().toString(36)}${(counter++).toString(36)}`;

export function blankQuestion(type: QuestionType = 'single_choice'): EditableQuestion {
  return {
    key: newKey(),
    question_type: type,
    prompt: '',
    options: type === 'short_answer' ? null : ['', '', '', ''],
    correct_answer: type === 'multiple_choice' ? [] : '',
    accepted_answers: null,
    explanation: '',
    topic: '',
    citation: null,
  };
}

/**
 * AI contract (rag/quiz_generator.py) → Platform question contract.
 * AI answers are option indices; the Platform stores option texts, so reordering options
 * during review can never silently change which answer is correct.
 */
export function fromAiQuestion(q: AiDraftQuestion, material: Material | undefined): EditableQuestion {
  const options = (q.options ?? []).map(String);
  const type: QuestionType =
    q.type === 'multiple_choice' ? 'multiple_choice' : q.type === 'short_answer' || q.type === 'short' ? 'short_answer' : 'single_choice';

  let correct: string | string[];
  if (type === 'multiple_choice') {
    const indices = Array.isArray(q.correct_answer) ? q.correct_answer : [];
    correct = indices.map((i) => options[Number(i)]).filter(Boolean);
  } else if (type === 'single_choice') {
    const i = typeof q.correct_answer === 'number' ? q.correct_answer : Number(q.correct_answer);
    correct = options[Number.isFinite(i) ? i : 0] ?? '';
  } else {
    correct = String(q.correct_answer ?? '');
  }

  return {
    key: newKey(),
    question_type: type,
    prompt: q.question,
    options: type === 'short_answer' ? null : options,
    correct_answer: correct,
    accepted_answers: type === 'short_answer' ? (q.keywords ?? []).filter((k) => k && k !== correct) : null,
    explanation: q.explanation ?? '',
    topic: q.topic ?? '',
    citation: material
      ? {
          material_id: material.id,
          title: material.title,
          page: q.citation?.page ?? null,
          snippet: q.citation?.evidence_snippet ?? null,
        }
      : null,
  };
}

/** Client-side mirror of the Platform validator, so problems show before saving. */
export function validateQuestion(q: EditableQuestion): string | null {
  if (!q.prompt.trim()) return 'Thiếu nội dung câu hỏi';
  if (q.question_type === 'short_answer') {
    return typeof q.correct_answer === 'string' && q.correct_answer.trim() ? null : 'Thiếu đáp án mẫu';
  }
  const options = (q.options ?? []).map((o) => o.trim()).filter(Boolean);
  if (options.length < 2) return 'Cần ít nhất 2 phương án';
  if (new Set(options).size !== options.length) return 'Các phương án không được trùng nhau';
  if (q.question_type === 'single_choice') {
    return typeof q.correct_answer === 'string' && options.includes(q.correct_answer.trim()) ? null : 'Chọn đáp án đúng';
  }
  const chosen = Array.isArray(q.correct_answer) ? q.correct_answer : [];
  return chosen.length > 0 && chosen.every((c) => options.includes(c)) ? null : 'Chọn ít nhất một đáp án đúng';
}

export function toPayload(q: EditableQuestion) {
  const options = q.question_type === 'short_answer' ? null : (q.options ?? []).map((o) => o.trim()).filter(Boolean);
  return {
    question_type: q.question_type,
    prompt: q.prompt.trim(),
    options,
    correct_answer: Array.isArray(q.correct_answer) ? q.correct_answer : q.correct_answer.trim(),
    accepted_answers: q.question_type === 'short_answer' ? (q.accepted_answers ?? []).map((a) => a.trim()).filter(Boolean) : null,
    explanation: q.explanation?.trim() || null,
    topic: q.topic?.trim() || null,
    citation: q.citation?.material_id || q.citation?.title ? q.citation : null,
  };
}
