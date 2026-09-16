import { useCallback, useRef, useState } from 'react';
import { ai } from '../../lib/api';
import type { AiCitation, AnswerValue, Generation, TutorAnswer } from '../../lib/types';
import { errorMessage } from '../../lib/useAsync';

export interface TutorMessage {
  id: number;
  sender: 'bot' | 'user';
  text: string;
  citations?: AiCitation[];
  generation?: Generation;
  insufficient?: boolean;
  failed?: boolean;
}

export interface TutorQuestionRef {
  id: string;
  number: number;
  prompt: string;
}

const GREETING =
  'Xin chào! Tôi là Trợ lý AI Socratic của VinUni. Trong lúc bạn làm bài, tôi chỉ gợi ý hướng suy nghĩ và chỉ ra trang tài liệu liên quan — không đưa đáp án. Sau khi nộp bài, bấm "HỎI AI" cạnh từng câu để được giải thích chi tiết.';

const formatAnswer = (value: AnswerValue | null | undefined) =>
  Array.isArray(value) ? value.join(', ') || 'Chưa chọn' : value || 'Chưa chọn';

/**
 * Conversation state for the quiz tutor. The request carries only ids and the student's
 * words; which data the tutor may use (hint vs review) is decided server-side.
 */
export function useQuizTutor({ courseId, quizId }: { courseId: string; quizId: string }) {
  const nextId = useRef(1);
  const [messages, setMessages] = useState<TutorMessage[]>([{ id: 0, sender: 'bot', text: GREETING }]);
  const [pending, setPending] = useState(false);
  const [askedQuestionIds, setAskedQuestionIds] = useState<string[]>([]);

  const push = useCallback((message: Omit<TutorMessage, 'id'>) => {
    setMessages((m) => [...m, { ...message, id: nextId.current++ }]);
  }, []);

  const send = useCallback(
    async (text: string, options: { questionId?: string; attemptId?: string | null } = {}) => {
      push({ sender: 'user', text });
      if (options.questionId) {
        const qid = options.questionId;
        setAskedQuestionIds((ids) => [qid, ...ids.filter((x) => x !== qid)]);
      }
      setPending(true);
      try {
        const res = await ai.post<TutorAnswer>(`/courses/${courseId}/quiz-tutor`, {
          quiz_id: quizId,
          question_id: options.questionId ?? null,
          attempt_id: options.attemptId ?? null,
          message: text,
        });
        push({
          sender: 'bot',
          text: res.answer,
          citations: res.citations,
          generation: res.generation,
          insufficient: res.evidence_level === 'insufficient',
        });
      } catch (err) {
        push({ sender: 'bot', text: `Không kết nối được Trợ lý AI: ${errorMessage(err)}`, failed: true });
      } finally {
        setPending(false);
      }
    },
    [courseId, quizId, push],
  );

  const askAboutQuestion = useCallback(
    (question: TutorQuestionRef, review?: { attemptId: string; submitted: AnswerValue | null; correct: AnswerValue }) => {
      const text = review
        ? `Giải thích chi tiết giúp em Câu ${question.number}: "${question.prompt}". Em đã chọn: "${formatAnswer(review.submitted)}", tại sao đáp án đúng lại là: "${formatAnswer(review.correct)}"?`
        : `Gợi ý giúp em hướng suy nghĩ cho Câu ${question.number}: "${question.prompt}"`;
      return send(text, { questionId: question.id, attemptId: review?.attemptId });
    },
    [send],
  );

  const announce = useCallback((text: string) => push({ sender: 'bot', text }), [push]);

  return { messages, pending, send, askAboutQuestion, askedQuestionIds, announce };
}
