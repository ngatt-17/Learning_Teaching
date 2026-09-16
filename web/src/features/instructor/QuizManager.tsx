import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, Eye, Pencil, Plus, Send, Trash2, Undo2 } from 'lucide-react';
import { platform } from '../../lib/api';
import { useCurrentUser } from '../../lib/auth';
import type { QuizStatus, QuizSummary } from '../../lib/types';
import { errorMessage, useAsync } from '../../lib/useAsync';
import { formatDeadline } from '../../lib/format';
import { useCourse } from '../courses/CourseLayout';
import { Empty, ErrorState, InlineError, Loading } from '../../components/StateViews';
import { AiDraftBadge, QuizStatusBadge } from '../../components/Badges';
import { ConfirmDialog } from '../../components/Dialog';
import { btn } from '../../components/styles';

export function QuizManager() {
  const course = useCourse();
  const user = useCurrentUser();
  const navigate = useNavigate();
  const canPublish = user.role === 'instructor' || user.role === 'admin';
  const { data: quizzes, error, loading, reload } = useAsync(
    () => platform.get<QuizSummary[]>(`/courses/${course.id}/quizzes/manage/all`),
    [course.id],
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<QuizSummary | null>(null);

  const run = async (label: string, action: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await action();
      reload();
    } catch (err) {
      setActionError(`${label}: ${errorMessage(err)}`);
    }
  };
  const setStatus = (q: QuizSummary, status: QuizStatus) =>
    run(q.title, () => platform.patch(`/courses/${course.id}/quizzes/${q.id}/status`, { status }));

  if (loading && !quizzes) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const lessonQuizzes = (quizzes ?? []).filter((q) => q.quiz_type === 'lesson');
  const drafts = lessonQuizzes.filter((q) => q.status === 'draft').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quiz & ngân hàng câu hỏi</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {drafts} quiz nháp chờ duyệt. Quiz do AI tạo luôn ở trạng thái nháp cho đến khi giảng viên xem lại và phát hành.
          </p>
        </div>
        <button onClick={() => navigate('new')} className={btn.primary}>
          <Plus size={14} /> Tạo quiz
        </button>
      </div>

      <InlineError message={actionError} />
      {lessonQuizzes.length === 0 && <Empty title="Chưa có quiz nào" />}

      {lessonQuizzes.length > 0 && (
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="text-left px-3 py-2">Tuần</th>
                <th className="text-left px-3 py-2">Quiz</th>
                <th className="text-left px-3 py-2">Trạng thái</th>
                <th className="text-right px-3 py-2">Câu</th>
                <th className="text-right px-3 py-2">SV đã làm</th>
                <th className="text-right px-3 py-2">TB lần 1</th>
                <th className="text-left px-3 py-2">Hạn nộp</th>
                <th className="text-right px-3 py-2">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lessonQuizzes.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50/60">
                  <td className="px-3 py-2.5 align-top font-semibold text-slate-700">{q.week_number ? `W${q.week_number}` : '—'}</td>
                  <td className="px-3 py-2.5 align-top">
                    <p className="font-semibold text-slate-900">{q.title}</p>
                    {q.source === 'ai_draft' && <div className="mt-1"><AiDraftBadge /></div>}
                  </td>
                  <td className="px-3 py-2.5 align-top"><QuizStatusBadge status={q.status} /></td>
                  <td className="px-3 py-2.5 align-top text-right tabular-nums">{q.question_count}</td>
                  <td className="px-3 py-2.5 align-top text-right tabular-nums">{q.student_count ?? 0}</td>
                  <td className="px-3 py-2.5 align-top text-right tabular-nums">
                    {q.first_attempt_avg_ratio === null || q.first_attempt_avg_ratio === undefined ? '—' : `${Math.round(q.first_attempt_avg_ratio * 100)}%`}
                  </td>
                  <td className="px-3 py-2.5 align-top whitespace-nowrap text-slate-500">{formatDeadline(q.due_at)}</td>
                  <td className="px-3 py-2.5 align-top">
                    <div className="flex flex-wrap justify-end gap-1">
                      {q.status === 'draft' && (q.attempt_count ?? 0) === 0 && (
                        <button onClick={() => navigate(`${q.id}/edit`)} className={btn.ghost}><Pencil size={13} /> Sửa</button>
                      )}
                      {q.status !== 'draft' && (
                        <button onClick={() => navigate(`/courses/${course.id}/quizzes/${q.id}/take`)} className={btn.ghost} title="Xem như sinh viên"><Eye size={13} /></button>
                      )}
                      <button onClick={() => navigate(`${q.id}/results`)} className={btn.ghost}><BarChart2 size={13} /> Kết quả</button>
                      {canPublish && q.status === 'draft' && (
                        <button onClick={() => setStatus(q, 'published')} className={`${btn.ghost} text-emerald-700`} disabled={q.question_count === 0}>
                          <Send size={13} /> Phát hành
                        </button>
                      )}
                      {canPublish && q.status === 'published' && (
                        <button onClick={() => setStatus(q, 'draft')} className={btn.ghost} title="Gỡ khỏi sinh viên"><Undo2 size={13} /> Gỡ</button>
                      )}
                      {(q.attempt_count ?? 0) === 0 && (
                        <button onClick={() => setDeleting(q)} className={`${btn.ghost} text-rose-700`} title="Xóa quiz"><Trash2 size={13} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleting && (
        <ConfirmDialog
          title="Xóa quiz?"
          message={`"${deleting.title}" chưa có bài làm và sẽ bị xóa.`}
          confirmLabel="Xóa quiz"
          danger
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            const q = deleting;
            setDeleting(null);
            void run(q.title, () => platform.del(`/courses/${course.id}/quizzes/${q.id}`));
          }}
        />
      )}
    </div>
  );
}
