import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { platform } from '../../lib/api';
import type { ManagedQuiz, QuestionStat } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';
import { formatDateTime, formatScore } from '../../lib/format';
import { useCourse } from '../courses/CourseLayout';
import { Empty, ErrorState, Loading } from '../../components/StateViews';
import { QuizStatusBadge } from '../../components/Badges';
import { btn } from '../../components/styles';

interface AttemptRow {
  name: string;
  email: string;
  attempt_number: number;
  correct_count: number;
  total_questions: number;
  score: number;
  max_score: number;
  points_awarded: number;
  submitted_at: string;
}

/** Instructor view of one quiz: per-question correctness (misconceptions) and the attempt log. */
export function QuizResults() {
  const course = useCourse();
  const { quizId = '' } = useParams();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useAsync(
    () =>
      Promise.all([
        platform.get<ManagedQuiz>(`/courses/${course.id}/quizzes/${quizId}/manage`),
        platform.get<QuestionStat[]>(`/courses/${course.id}/quizzes/${quizId}/question-stats`),
        platform.get<AttemptRow[]>(`/courses/${course.id}/quizzes/${quizId}/attempts`),
      ]),
    [course.id, quizId],
  );

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const [quiz, stats, attempts] = data!;
  const hardest = [...stats].filter((s) => s.correct_ratio !== null).sort((a, b) => (a.correct_ratio ?? 1) - (b.correct_ratio ?? 1));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 border-b pb-3">
        <button onClick={() => navigate(`/courses/${course.id}/quizzes`)} className={btn.ghost}><ArrowLeft size={14} /></button>
        <h2 className="text-xl font-bold text-slate-800">{quiz.title}</h2>
        <QuizStatusBadge status={quiz.status} />
      </div>

      <section className="space-y-2">
        <h3 className="font-bold text-sm text-slate-900">Tỉ lệ trả lời đúng theo câu (lần làm đầu tiên)</h3>
        <p className="text-xs text-slate-500">Số liệu tổng hợp — dùng để phát hiện lỗ hổng chung của lớp. Không bao gồm ghi chú riêng tư.</p>
        {stats.length === 0 ? (
          <Empty title="Quiz chưa có câu hỏi" />
        ) : (
          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
            {stats.map((s) => {
              const pct = s.correct_ratio === null ? null : Math.round(s.correct_ratio * 100);
              const low = pct !== null && pct < 60;
              return (
                <div key={s.question_id} className="px-4 py-2.5 flex items-center gap-4 text-xs">
                  <span className="w-12 font-semibold text-slate-700">Câu {s.position}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 truncate">{s.prompt}</p>
                    {s.topic && <p className="text-[11px] text-slate-500">{s.topic}</p>}
                  </div>
                  <div className="w-40 h-2 bg-slate-100 rounded-full overflow-hidden" aria-hidden>
                    {pct !== null && <div className={`h-full ${low ? 'bg-[#C8232C]' : 'bg-emerald-600'}`} style={{ width: `${pct}%` }} />}
                  </div>
                  <span className={`w-24 text-right tabular-nums ${low ? 'text-[#C8232C] font-bold' : 'text-slate-700'}`}>
                    {pct === null ? 'Chưa có' : `${pct}% (${s.correct}/${s.answered})`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {hardest[0] && (hardest[0].correct_ratio ?? 1) < 0.6 && (
          <p className="text-xs text-[#C8232C] bg-[#FDF2F2] border border-red-100 rounded-lg px-3 py-2">
            Chủ đề cần giảng lại: <strong>{hardest[0].topic ?? `Câu ${hardest[0].position}`}</strong> — chỉ {Math.round((hardest[0].correct_ratio ?? 0) * 100)}% sinh viên trả lời đúng.
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="font-bold text-sm text-slate-900">Lượt làm bài ({attempts.length})</h3>
        {attempts.length === 0 ? (
          <Empty title="Chưa có sinh viên nộp bài" />
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="text-left px-3 py-2">Sinh viên</th>
                  <th className="text-right px-3 py-2">Lần</th>
                  <th className="text-right px-3 py-2">Đúng</th>
                  <th className="text-right px-3 py-2">Điểm</th>
                  <th className="text-right px-3 py-2">Điểm cộng</th>
                  <th className="text-left px-3 py-2">Nộp lúc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attempts.map((a, i) => (
                  <tr key={`${a.email}-${a.attempt_number}-${i}`}>
                    <td className="px-3 py-2"><p className="font-semibold text-slate-900">{a.name}</p><p className="text-[11px] text-slate-500">{a.email}</p></td>
                    <td className="px-3 py-2 text-right tabular-nums">{a.attempt_number}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{a.correct_count}/{a.total_questions}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatScore(a.score)}/{formatScore(a.max_score)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatScore(a.points_awarded)}</td>
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{formatDateTime(a.submitted_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
