import { useNavigate } from 'react-router-dom';
import { PlayCircle, RotateCcw } from 'lucide-react';
import { platform } from '../../lib/api';
import type { QuizSummary } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';
import { formatDeadline, formatScore } from '../../lib/format';
import { useCourse } from '../courses/CourseLayout';
import { Empty, ErrorState, Loading } from '../../components/StateViews';
import { btn } from '../../components/styles';
import { ComprehensiveBuilder } from './ComprehensiveBuilder';

export function StudentQuizList() {
  const course = useCourse();
  const navigate = useNavigate();
  const { data: quizzes, error, loading, reload } = useAsync(
    () => platform.get<QuizSummary[]>(`/courses/${course.id}/quizzes/`),
    [course.id],
  );

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const take = (q: QuizSummary, review = false) =>
    navigate(`/courses/${course.id}/quizzes/${q.id}/take${review ? '?review=latest' : ''}`);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <h2 className="text-xl font-bold text-slate-800">Danh sách Quizzes môn học</h2>
        <span className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full">
          {quizzes!.length} bài trắc nghiệm sẵn có
        </span>
      </div>

      {quizzes!.length === 0 && <Empty title="Chưa có quiz nào được phát hành" />}

      {quizzes!.map((q) => (
        <div key={q.id} className="p-4 border border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 text-[10px] font-bold bg-[#1E3A6E] text-white rounded-md uppercase">
                {q.quiz_type === 'comprehensive' ? 'Quiz tổng hợp' : q.week_number ? `Week ${q.week_number}` : 'Quiz'}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded-md">
                {q.time_limit_seconds ? `${Math.round(q.time_limit_seconds / 60)} Phút` : 'Không giới hạn thời gian'} • {q.question_count} Câu hỏi
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-base">{q.title}</h4>
            <p className="text-xs text-slate-500">
              Hạn nộp: {formatDeadline(q.due_at)} • Điểm tối đa: {q.max_score}
              {q.my_attempts ? ` • Đã làm ${q.my_attempts} lần, cao nhất ${formatScore(q.my_best_score ?? 0)}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {q.my_attempts ? (
              <>
                <button onClick={() => take(q, true)} className={btn.secondary}>Xem kết quả</button>
                <button onClick={() => take(q)} className={btn.primary}>
                  <RotateCcw size={14} /> Làm lại
                </button>
              </>
            ) : (
              <button onClick={() => take(q)} className={`${btn.primary} px-5 py-2.5`}>
                <PlayCircle size={16} /> Vào Làm Quizz
              </button>
            )}
          </div>
        </div>
      ))}

      <ComprehensiveBuilder courseId={course.id} onCreated={(quizId) => navigate(`/courses/${course.id}/quizzes/${quizId}/take`)} />
    </div>
  );
}
