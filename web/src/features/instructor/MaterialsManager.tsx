import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, ChevronDown, ChevronRight, HelpCircle,
  Paperclip, Plus, RefreshCw, Trash2, Upload, UploadCloud, X,
} from 'lucide-react';
import { platform } from '../../lib/api';
import type { Material, MaterialStatus, QuizStatus, QuizSummary } from '../../lib/types';
import { errorMessage, useAsync } from '../../lib/useAsync';
import { formatDeadline } from '../../lib/format';
import { useCourse } from '../courses/CourseLayout';
import { Empty, ErrorState, InlineError, Loading } from '../../components/StateViews';
import { ConfirmDialog } from '../../components/Dialog';
import { btn } from '../../components/styles';
import { UploadMaterialDialog } from './UploadMaterialDialog';

interface WeekModule {
  key: string;
  week: number | null;
  title: string;
  materials: Material[];
  quizzes: QuizSummary[];
}

function groupMaterialsAndQuizzesByWeek(materials: Material[], quizzes: QuizSummary[]): WeekModule[] {
  const weeks = new Map<string, WeekModule>();

  const moduleFor = (week: number | null, lesson?: string | null) => {
    const key = week === null ? 'none' : String(week);
    if (!weeks.has(key)) {
      weeks.set(key, {
        key,
        week,
        title: week === null ? 'Tổng hợp' : `Week ${String(week).padStart(2, '0')}${lesson ? ` - ${lesson}` : ''}`,
        materials: [],
        quizzes: [],
      });
    }
    const mod = weeks.get(key)!;
    if (lesson && !mod.title.includes(lesson)) {
      mod.title = week === null ? 'Tổng hợp' : `Week ${String(week).padStart(2, '0')} - ${lesson}`;
    }
    return mod;
  };

  materials.forEach((m) => moduleFor(m.week_number, m.lesson_title).materials.push(m));
  quizzes.forEach((q) => moduleFor(q.week_number).quizzes.push(q));
  return [...weeks.values()].sort((a, b) => (a.week ?? 999) - (b.week ?? 999));
}

export function MaterialsManager() {
  const course = useCourse();
  const navigate = useNavigate();

  const { data, error, loading, reload } = useAsync(
    () =>
      Promise.all([
        platform.get<Material[]>(`/courses/${course.id}/materials/manage`),
        platform.get<QuizSummary[]>(`/courses/${course.id}/quizzes/manage/all`),
      ]),
    [course.id],
  );

  const [materials, rawQuizzes] = data ?? [[], []];
  const quizzes = useMemo(() => (rawQuizzes ?? []).filter((q) => q.status !== 'archived'), [rawQuizzes]);

  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState<Material | null>(null);
  const [removingQuiz, setRemovingQuiz] = useState<QuizSummary | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const act = async (material: Material, action: () => Promise<unknown>) => {
    setBusyId(material.id);
    setActionError(null);
    try {
      await action();
      reload();
    } catch (err) {
      setActionError(`${material.title}: ${errorMessage(err)}`);
    } finally {
      setBusyId(null);
    }
  };

  const setStatus = (m: Material, status: MaterialStatus) =>
    act(m, () => platform.patch(`/courses/${course.id}/materials/${m.id}/status`, { status }));

  const setQuizStatus = async (quiz: QuizSummary, status: QuizStatus) => {
    setActionError(null);
    try {
      await platform.patch(`/courses/${course.id}/quizzes/${quiz.id}/status`, { status });
      reload();
    } catch (err) {
      setActionError(`${quiz.title}: ${errorMessage(err)}`);
    }
  };

  const modules = useMemo(() => groupMaterialsAndQuizzesByWeek(materials, quizzes), [materials, quizzes]);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const list = materials ?? [];

  return (
    <div className="space-y-4">
      {/* ── Top Header Bar (Minimalist) ───────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <h2 className="text-xl font-bold text-slate-800">Tài liệu khóa học</h2>
        <button
          type="button"
          onClick={() => setUploading(true)}
          className={btn.primary}
        >
          <Upload size={14} />
          <span>Tải tài liệu lên</span>
        </button>
      </div>

      <InlineError message={actionError} />

      {list.length === 0 && (
        <Empty title="Chưa có tài liệu nào">
          Tải lên slide bài giảng hoặc tài liệu môn học để bắt đầu.
        </Empty>
      )}

      {/* ── Module - Slide List (Đồng bộ chuẩn giao diện Student) ── */}
      {modules.map((mod) => {
        const isCollapsed = Boolean(collapsed[mod.key]);
        const approvedCount = mod.materials.filter((m) => m.status === 'approved').length;

        return (
          <div
            key={mod.key}
            className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs"
          >
            {/* Header Module */}
            <button
              type="button"
              onClick={() => toggleCollapse(mod.key)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-100/90 hover:bg-slate-200/70 text-slate-800 text-sm font-semibold transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                {isCollapsed ? (
                  <ChevronRight size={18} className="text-slate-600 shrink-0" />
                ) : (
                  <ChevronDown size={18} className="text-slate-600 shrink-0" />
                )}
                <span className="truncate">{mod.title}</span>
              </div>
              <span className="text-xs text-slate-500 font-normal shrink-0 ml-2">
                {approvedCount}/{mod.materials.length} Published
              </span>
            </button>

            {/* Danh sách Slide bên trong Module */}
            {!isCollapsed && (
              <>
                <div className="bg-white divide-y divide-slate-100">
                {mod.materials.map((m) => {
                  const isPublished = m.status === 'approved';
                  const isBusy = busyId === m.id;

                  return (
                    <div
                      key={m.id}
                      onClick={() => navigate(`/courses/${course.id}/materials/${m.id}`)}
                      style={{ borderLeft: isPublished ? '4px solid #059669' : '4px solid #94a3b8' }}
                      className={`w-full text-left flex items-center justify-between gap-3.5 px-4 py-3 hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        isBusy ? 'opacity-50' : ''
                      }`}
                      title="Bấm để xem nội dung slide"
                    >
                      {/* Left: Paperclip Icon + Title & details (khớp Student) */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <Paperclip size={18} className="text-slate-500 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800 leading-snug truncate">
                            {m.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {m.page_count} trang • Học cùng ghi chú riêng & Trợ giảng AI
                            {m.uploaded_by_name ? ` • Tải lên bởi ${m.uploaded_by_name}` : ''}
                          </p>
                          {m.processing_error && (
                            <p className="text-xs text-rose-600 mt-0.5">{m.processing_error}</p>
                          )}
                        </div>
                      </div>

                      {/* Right: Thao tác của Instructor (Published/Unpublished, Gỡ) */}
                      <div
                        className="flex items-center gap-2 shrink-0 ml-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Publish / Unpublished Button */}
                        {isPublished ? (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => setStatus(m, 'draft')}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 group/pub"
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
                            disabled={isBusy || m.page_count === 0 || m.status === 'failed'}
                            onClick={() => setStatus(m, 'approved')}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 bg-slate-100 text-slate-700 border-slate-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                            title={
                              m.page_count === 0
                                ? 'Tài liệu chưa có trang nội dung'
                                : 'Đang Unpublished — Bấm để Publish cho sinh viên'
                            }
                          >
                            <UploadCloud size={13} />
                            <span>Publish</span>
                          </button>
                        )}

                        {/* Reprocess if failed */}
                        {m.status === 'failed' && m.has_file && (
                          <button
                            type="button"
                            onClick={() => act(m, () => platform.post(`/courses/${course.id}/materials/${m.id}/reprocess`))}
                            className="px-2 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg flex items-center gap-1 cursor-pointer"
                            title="Thử trích xuất lại"
                          >
                            <RefreshCw size={12} />
                            <span>Thử lại</span>
                          </button>
                        )}

                        {/* Nút Gỡ */}
                        <button
                          type="button"
                          onClick={() => setRemoving(m)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                          title="Gỡ tài liệu này"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── QUIZZES SECTION (Tối giản, đồng bộ format với Slide) ── */}
              {mod.quizzes.length > 0 && (
                <div className="divide-y divide-slate-100 border-t border-slate-200">
                  {mod.quizzes.map((quiz) => {
                    const isPublished = quiz.status === 'published';

                    return (
                      <div
                        key={quiz.id}
                        style={{ borderLeft: isPublished ? '4px solid #059669' : '4px solid #94a3b8' }}
                        className="w-full text-left flex items-center justify-between gap-3.5 px-4 py-3 hover:bg-slate-50/80 transition-colors"
                      >
                        {/* Left: HelpCircle Icon + Title & clean details */}
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <HelpCircle size={18} className="text-slate-500 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-800 leading-snug truncate">
                              {quiz.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                              {quiz.due_at ? `Hạn nộp: ${formatDeadline(quiz.due_at)}` : 'Bài tập Quiz'}
                            </p>
                          </div>
                        </div>

                        {/* Right: Buttons (Xem báo cáo, Sửa, và nút Published y hệt Slide) */}
                        <div className="flex items-center gap-2 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => navigate(`/courses/${course.id}/quizzes/${quiz.id}/results`)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                          >
                            Xem báo cáo
                          </button>

                          {quiz.status === 'draft' && (
                            <button
                              type="button"
                              onClick={() => navigate(`/courses/${course.id}/quizzes/${quiz.id}/edit`)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                            >
                              Sửa
                            </button>
                          )}

                          {/* Nút Published giống hệt slide bài giảng */}
                          {isPublished ? (
                            <button
                              type="button"
                              onClick={() => setQuizStatus(quiz, 'draft')}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 group/pub"
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
                              onClick={() => setQuizStatus(quiz, 'published')}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 bg-slate-100 text-slate-700 border-slate-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 shadow-2xs"
                              title="Đang Unpublished — Bấm để Publish cho sinh viên"
                            >
                              <UploadCloud size={13} />
                              <span>Publish</span>
                            </button>
                          )}

                          {/* Nút Gỡ quiz */}
                          <button
                            type="button"
                            onClick={() => setRemovingQuiz(quiz)}
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

              {/* ACTION BUTTON: TẠO THÊM QUIZ DƯỚI MỖI MODULE (Tối giản, không icon linh tinh) */}
              <div className="p-3 bg-slate-50/70 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => navigate(`/courses/${course.id}/quizzes/new?week=${mod.week ?? ''}`)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-[#1E3A6E] border border-slate-200 hover:border-slate-300 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus size={14} />
                  <span>Tạo thêm quiz</span>
                </button>
              </div>
            </>
          )}
          </div>
        );
      })}

      {uploading && (
        <UploadMaterialDialog
          courseId={course.id}
          onClose={() => setUploading(false)}
          onUploaded={() => {
            setUploading(false);
            reload();
          }}
        />
      )}

      {removing && (
        <ConfirmDialog
          title="Gỡ tài liệu?"
          message={`"${removing.title}" và toàn bộ nội dung trích xuất sẽ bị gỡ bỏ khỏi môn học. Các câu hỏi Quiz đã tạo vẫn được bảo lưu.`}
          confirmLabel="Gỡ tài liệu"
          danger
          onCancel={() => setRemoving(null)}
          onConfirm={() => {
            const m = removing;
            setRemoving(null);
            void act(m, () => platform.del(`/courses/${course.id}/materials/${m.id}`));
          }}
        />
      )}

      {removingQuiz && (
        <ConfirmDialog
          title="Gỡ bài Quiz?"
          message={`Bài quiz "${removingQuiz.title}" sẽ được gỡ khỏi môn học.`}
          confirmLabel="Gỡ quiz"
          danger
          onCancel={() => setRemovingQuiz(null)}
          onConfirm={async () => {
            const q = removingQuiz;
            setRemovingQuiz(null);
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
