import type { ReactNode } from 'react';
import { BookOpen, Bookmark, Bot } from 'lucide-react';
import type { AnswerValue, GradedAnswer, StudentQuestion } from '../../lib/types';
import { formatScore } from '../../lib/format';

/** Answer controls while taking the quiz (one-by-one card and "all" list share them). */
export function AnswerOptions({
  question,
  value,
  onChange,
  large = false,
}: {
  question: StudentQuestion;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
  large?: boolean;
}) {
  if (question.question_type === 'short_answer') {
    return (
      <input
        type="text"
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Nhập câu trả lời ngắn…"
        className="w-full text-sm px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-[#1E3A6E] focus:ring-2 focus:ring-[#1E3A6E]/10"
      />
    );
  }

  const multi = question.question_type === 'multiple_choice';
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  return (
    <div className="divide-y divide-slate-100 border-t border-slate-100">
      {multi && <p className="py-2 px-2 text-[11px] text-slate-500 italic">Chọn tất cả đáp án đúng.</p>}
      {(question.options ?? []).map((option) => {
        const checked = selected.includes(option);
        const toggle = () =>
          onChange(multi ? (checked ? selected.filter((o) => o !== option) : [...selected, option]) : option);
        return (
          <label
            key={option}
            className={`${large ? 'py-3.5 gap-3.5' : 'py-2.5 gap-3'} px-2 flex items-center cursor-pointer transition-colors ${
              checked ? 'bg-blue-50/60 font-semibold text-[#1E3A6E]' : 'hover:bg-slate-50'
            }`}
          >
            <input
              type={multi ? 'checkbox' : 'radio'}
              name={`q_${question.id}`}
              checked={checked}
              onChange={toggle}
              className="w-4 h-4 accent-[#1E3A6E] cursor-pointer shrink-0"
            />
            <span className={`${large ? 'text-xs sm:text-sm' : 'text-xs sm:text-sm'} text-slate-800`}>{option}</span>
          </label>
        );
      })}
    </div>
  );
}

export function QuestionHeader({
  number,
  points,
  answered,
  children,
}: {
  number: number;
  points: number;
  answered: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="bg-white px-5 py-3 border-b border-slate-200 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <Bookmark size={18} className={answered ? 'text-amber-500 fill-amber-400' : 'text-slate-400'} />
        <span className="font-bold text-sm text-slate-800">Câu hỏi {number}</span>
        {children}
      </div>
      <span className="text-xs font-semibold text-slate-500">{formatScore(points)} điểm</span>
    </div>
  );
}

const asList = (value: AnswerValue | null | undefined) => (Array.isArray(value) ? value : value ? [value] : []);

/** Graded question after submission: marking, explanation, citation, "HỎI AI". */
export function ReviewCard({
  answer,
  number,
  points,
  onAskAi,
  onOpenCitation,
}: {
  answer: GradedAnswer;
  number: number;
  points: number;
  onAskAi: () => void;
  onOpenCitation: () => void;
}) {
  const correct = asList(answer.correct_answer);
  const submitted = asList(answer.submitted_answer);
  const citation = answer.citation;

  return (
    <div
      id={`question-card-${answer.question_id}`}
      className={`bg-white border rounded-xl overflow-hidden shadow-2xs ${
        answer.is_correct ? 'border-emerald-300 ring-1 ring-emerald-100' : 'border-rose-300 ring-1 ring-rose-100'
      }`}
    >
      <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bookmark size={16} className={submitted.length ? 'text-amber-500 fill-amber-400' : 'text-slate-400'} />
          <span className="font-bold text-xs sm:text-sm text-slate-800">Câu hỏi {number}</span>
          <span
            className={`px-2 py-px rounded-full text-[10.5px] font-bold ${
              answer.is_correct ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}
          >
            {answer.is_correct ? `✓ Đúng (${formatScore(points)} điểm)` : '✗ Sai (0 điểm)'}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">{formatScore(points)} điểm</span>
          <button
            type="button"
            onClick={onAskAi}
            className="px-2.5 py-1 bg-[#1E3A6E] hover:bg-[#14274E] text-white text-xs font-bold rounded-lg transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            title="Gửi câu hỏi này sang Trợ lý AI Socratic để được giải thích"
          >
            <Bot size={13} className="text-amber-300" />
            <span>HỎI AI</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-3">
        <p className="text-sm font-semibold text-slate-900 leading-relaxed">{answer.prompt}</p>

        {answer.question_type === 'short_answer' ? (
          <div className="text-xs sm:text-sm space-y-1.5">
            <p className={answer.is_correct ? 'text-emerald-800' : 'text-rose-800'}>
              Bạn trả lời: <strong>{submitted[0] || '(bỏ trống)'}</strong>
            </p>
            <p className="text-emerald-800">
              Đáp án chính xác: <strong>{correct[0]}</strong>
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {(answer.options ?? []).map((option) => {
              const isCorrect = correct.includes(option);
              const chosen = submitted.includes(option);
              const cls = isCorrect
                ? 'bg-emerald-50/80 font-bold text-emerald-900 border border-emerald-200'
                : chosen
                  ? 'bg-rose-50/80 line-through text-rose-800 border border-rose-200'
                  : 'opacity-60 border border-transparent';
              return (
                <div key={option} className={`py-2.5 px-2 rounded-lg flex items-center gap-3 text-xs sm:text-sm ${cls}`}>
                  <input
                    type={answer.question_type === 'multiple_choice' ? 'checkbox' : 'radio'}
                    checked={chosen}
                    disabled
                    readOnly
                    className="w-4 h-4 accent-[#1E3A6E] shrink-0"
                  />
                  <span>{option}</span>
                  {isCorrect && (
                    <span className="ml-auto text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-px rounded-full shrink-0 no-underline">
                      Đáp án chính xác
                    </span>
                  )}
                  {chosen && !isCorrect && (
                    <span className="ml-auto text-[11px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-px rounded-full shrink-0">
                      Bạn đã chọn
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {(answer.explanation || citation) && (
          <div className="mt-3 p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#1E3A6E]">
              <BookOpen size={13} />
              <span>Giải thích đáp án & Căn cứ giáo trình:</span>
            </div>
            {answer.explanation && <p className="text-slate-700 leading-relaxed">{answer.explanation}</p>}
            {citation?.title && (
              <button
                type="button"
                onClick={onOpenCitation}
                disabled={!citation.material_id}
                className="text-[11px] text-slate-500 italic hover:text-[#1E3A6E] hover:underline cursor-pointer disabled:cursor-default disabled:no-underline"
              >
                Trích dẫn: {citation.title}
                {citation.page ? `, Trang ${citation.page}` : ''}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
