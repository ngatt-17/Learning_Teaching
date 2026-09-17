import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Plus, Trash2, UploadCloud, X } from 'lucide-react';
import { platform } from '../../lib/api';
import type { QuizStatus, QuizSummary } from '../../lib/types';
import { errorMessage, useAsync } from '../../lib/useAsync';
import { formatDeadline } from '../../lib/format';
import { useCourse } from '../courses/CourseLayout';
import { Empty, ErrorState, InlineError, Loading } from '../../components/StateViews';
import { AiDraftBadge } from '../../components/Badges';
import { ConfirmDialog } from '../../components/Dialog';
import { btn } from '../../components/styles';
import { ComprehensiveBuilder } from '../student/ComprehensiveBuilder';

type QuizFilter = 'all' | 'published' | 'draft';

export function QuizManager() {
  const course = useCourse();
  const navigate = useNavigate();

  // Trạng thái đóng/mở của 2 thanh theo yêu cầu: mặc định ẩn đi, bấm vào mới hiện ra
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);

  const [filter, setFilter] = useState<QuizFilter>('all');
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<QuizSummary | null>(null);

  const { data: rawQuizzes, error, loading, reload } = useAsync(
    () => platform.get<QuizSummary[]>(`/courses/${course.id}/quizzes/manage/all`),
    [course.id],
  );

  const setStatus = async (q: QuizSummary, status: QuizStatus) => {
    setActionError(null);
    try {
      await platform.patch(`/courses/${course.id}/quizzes/${q.id}/status`, { status });
      reload();
    } catch (err) {
      setActionError(`${q.title}: ${errorMessage(err)}`);
    }
  };

  // Lọc bỏ bài quiz đã lưu trữ (archived)
  const activeQuizzes = useMemo(() => {
    return (rawQuizzes ?? []).filter((q) => q.status !== 'archived');
  }, [rawQuizzes]);

  // Sắp xếp theo thời gian tạo mới nhất lên trên & theo bộ lọc
  const filteredAndSortedQuizzes = useMemo(() => {
    const filtered = activeQuizzes.filter((q) => {
      if (filter === 'published') return q.status === 'published';
      if (filter === 'draft') return q.status === 'draft';
      return true;
    });

    return [...filtered].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [activeQuizzes, filter]);

  if (loading && !rawQuizzes) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const publishedCount = activeQuizzes.filter((q) => q.status === 'published').length;
  const draftCount = activeQuizzes.filter((q) => q.status === 'draft').length;

  return (
    <div className="space-y-4">
      {/* ── Top Header Bar ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quiz & ngân hàng câu hỏi</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {draftCount} quiz nháp chờ duyệt • Quản lý trạng thái phát hành, xem báo cáo và tạo quiz môn học.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('new')}
          className={btn.primary}
        >
          <Plus size={14} />
          <span>Tạo quiz</span>
        </button>
      </div>

      <InlineError message={actionError} />

      {/* ─────────────────────────────────────────────────────────────
          1. THANH TẠO QUIZ TỔNG HỢP THEO CHỦ ĐỀ (Ẩn/Hiện khi bấm)
      ───────────────────────────────────────────────────────────── */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs transition-all">
        <button
          type="button"
          onClick={() => setIsBuilderOpen(!isBuilderOpen)}
          className="w-full p-4 bg-white hover:bg-slate-50/90 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer select-none"
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A6E] bg-blue-100 px-2 py-0.5 rounded">
                Tạo đề tổng hợp
              </span>
              <h3 className="font-bold text-base text-slate-900">Quiz tổng hợp theo chủ đề</h3>
            </div>
            <p className="text-xs text-slate-500">
              Chọn linh hoạt theo Module & Slide bài giảng • Hỗ trợ AI gợi ý tạo đề kiểm tra đa chủ đề
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 shrink-0">
            {isBuilderOpen ? 'Thu gọn ▲' : 'Bấm để tạo đề ▼'}
          </span>
        </button>

        {isBuilderOpen && (
          <div className="p-5 border-t border-slate-200 bg-slate-50/30">
            <ComprehensiveBuilder
              courseId={course.id}
              quizzes={activeQuizzes}
              compact
              onCreated={(quizId) => {
                reload();
                navigate(`/courses/${course.id}/quizzes/${quizId}/edit`);
              }}
            />
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. THANH DANH SÁCH BÀI QUIZ (Ẩn/Hiện khi bấm)
      ───────────────────────────────────────────────────────────── */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs transition-all">
        <button
          type="button"
          onClick={() => setIsListOpen(!isListOpen)}
          className="w-full p-4 bg-white hover:bg-slate-50/90 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer select-none"
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                Ngân hàng đề thi
              </span>
              <h3 className="font-bold text-base text-slate-900">Danh sách bài Quiz</h3>
              <span className="text-xs font-semibold text-[#1E3A6E] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {activeQuizzes.length} bài
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Bao gồm quiz bài học và quiz tổng hợp ({publishedCount} đã phát hành, {draftCount} nháp) • Sắp xếp mới nhất
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 shrink-0">
            {isListOpen ? 'Thu gọn ▲' : 'Bấm để xem danh sách ▼'}
          </span>
        </button>

        {isListOpen && (
          <div className="p-5 border-t border-slate-200 space-y-4">
            {/* Bộ lọc: Tất cả / Đã phát hành / Bản nháp */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Lọc bài thi:
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    filter === 'all'
                      ? 'bg-white text-[#1E3A6E] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({activeQuizzes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('published')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    filter === 'published'
                      ? 'bg-white text-[#1E3A6E] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Đã phát hành ({publishedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('draft')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    filter === 'draft'
                      ? 'bg-white text-[#1E3A6E] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bản nháp ({draftCount})
                </button>
              </div>
            </div>

            {filteredAndSortedQuizzes.length === 0 ? (
              <Empty
                title={
                  filter === 'draft'
                    ? 'Không có bài quiz nháp nào'
                    : filter === 'published'
                    ? 'Chưa có bài quiz nào được phát hành'
                    : 'Chưa có bài quiz nào'
                }
              />
            ) : (
              <div className="space-y-3">
                {filteredAndSortedQuizzes.map((q) => {
                  const isPublished = q.status === 'published';
                  const isDraft = q.status === 'draft';
                  const isComprehensive = q.quiz_type === 'comprehensive';

                  return (
                    <div
                      key={q.id}
                      className="p-4 border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors bg-white"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Badge loại quiz */}
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                              isComprehensive
                                ? 'bg-blue-100 text-[#1E3A6E] border border-blue-200'
                                : 'bg-[#1E3A6E] text-white'
                            }`}
                          >
                            {isComprehensive ? 'Quiz tổng hợp' : 'Quiz bài giảng'}
                          </span>

                          {/* Tuần bài học nếu có */}
                          {q.week_number && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded border border-slate-200">
                              Tuần {q.week_number}
                            </span>
                          )}

                          {/* Thời gian & số câu */}
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded border border-slate-200">
                            {q.time_limit_seconds
                              ? `${Math.round(q.time_limit_seconds / 60)} Phút`
                              : 'Không giới hạn thời gian'}{' '}
                            • {q.question_count} Câu hỏi
                          </span>

                          {/* AI draft badge nếu có */}
                          {q.source === 'ai_draft' && <AiDraftBadge />}
                        </div>

                        <h4 className="font-bold text-slate-900 text-base">{q.title}</h4>

                        <p className="text-xs text-slate-500">
                          Hạn nộp: {formatDeadline(q.due_at)} • Điểm tối đa: {q.max_score}
                          {q.student_count
                            ? ` • ${q.student_count} SV đã nộp bài, TB lần 1: ${
                                q.first_attempt_avg_ratio != null
                                  ? `${Math.round(q.first_attempt_avg_ratio * 100)}%`
                                  : '—'
                              }`
                            : ' • Chưa có sinh viên nộp bài'}
                        </p>
                      </div>

                      {/* Instructor Action buttons: Báo cáo / Sửa / Published / Gỡ */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Nút Báo cáo */}
                        <button
                          type="button"
                          onClick={() => navigate(`/courses/${course.id}/quizzes/${q.id}/results`)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                        >
                          Báo cáo
                        </button>

                        {/* Nút Sửa (nếu là bản nháp) */}
                        {isDraft && (
                          <button
                            type="button"
                            onClick={() => navigate(`/courses/${course.id}/quizzes/${q.id}/edit`)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                          >
                            Sửa
                          </button>
                        )}

                        {/* Nút Published giống hệt slide bài giảng */}
                        {isPublished ? (
                          <button
                            type="button"
                            onClick={() => setStatus(q, 'draft')}
                            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 group/pub"
                            title="Đang Published — Bấm để chuyển sang Unpublished"
                          >
                            <CheckCircle2 size={13} className="text-emerald-600 group-hover/pub:hidden" />
                            <X size={13} className="text-rose-600 hidden group-hover/pub:inline" />
                            <span className="group-hover/pub:hidden">Published</span>
                            <span className="hidden group-hover/pub:inline">Unpublish</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setStatus(q, 'published')}
                            disabled={q.question_count === 0}
                            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 bg-slate-100 text-slate-700 border-slate-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 shadow-2xs disabled:opacity-50"
                            title={
                              q.question_count === 0
                                ? 'Quiz chưa có câu hỏi nào để phát hành'
                                : 'Đang Unpublished — Bấm để Publish cho sinh viên'
                            }
                          >
                            <UploadCloud size={13} />
                            <span>Publish</span>
                          </button>
                        )}

                        {/* Nút Gỡ quiz */}
                        <button
                          type="button"
                          onClick={() => setDeleting(q)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                          title="Gỡ bài quiz này"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal xác nhận gỡ bài Quiz */}
      {deleting && (
        <ConfirmDialog
          title="Gỡ bài Quiz?"
          message={`Bài quiz "${deleting.title}" sẽ được gỡ khỏi môn học.`}
          confirmLabel="Gỡ quiz"
          danger
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            const q = deleting;
            setDeleting(null);
            try {
              await platform.del(`/courses/${course.id}/quizzes/${q.id}`);
            } catch {
              await platform.patch(`/courses/${course.id}/quizzes/${q.id}/status`, { status: 'archived' });
            }
            reload();
          }}
        />
      )}
    </div>
  );
}
