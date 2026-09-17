import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { platform } from '../../lib/api';
import type { QuizSummary } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';
import { formatDeadline, formatScore } from '../../lib/format';
import { useCourse } from '../courses/CourseLayout';
import { Empty, ErrorState, Loading } from '../../components/StateViews';
import { btn } from '../../components/styles';
import { ComprehensiveBuilder } from './ComprehensiveBuilder';

type QuizFilter = 'all' | 'instructor' | 'student';

export function StudentQuizList() {
  const course = useCourse();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<QuizFilter>('all');

  // Trạng thái đóng/mở của 2 thanh theo yêu cầu: mặc định ẩn đi, bấm vào mới hiện ra
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);

  const { data: quizzes, error, loading, reload } = useAsync(
    () => platform.get<QuizSummary[]>(`/courses/${course.id}/quizzes/`),
    [course.id],
  );

  const take = (q: QuizSummary, review = false) =>
    navigate(`/courses/${course.id}/quizzes/${q.id}/take${review ? '?review=latest' : ''}`);

  // Sắp xếp theo thời gian mới nhất lên trên
  const filteredAndSortedQuizzes = useMemo(() => {
    if (!quizzes) return [];

    const filtered = quizzes.filter((q) => {
      if (filter === 'instructor') return q.quiz_type === 'lesson';
      if (filter === 'student') return q.quiz_type === 'comprehensive';
      return true;
    });

    return [...filtered].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [quizzes, filter]);

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const allQuizzes = quizzes || [];
  const instructorCount = allQuizzes.filter((q) => q.quiz_type === 'lesson').length;
  const studentCount = allQuizzes.filter((q) => q.quiz_type === 'comprehensive').length;

  return (
    <div className="space-y-4">
      {/* ─────────────────────────────────────────────────────────────
          1. THANH TẠO QUIZ TỔNG HỢP (Ẩn/Hiện khi bấm)
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
                Tạo đề ôn tập
              </span>
              <h3 className="font-bold text-base text-slate-900">Quiz tổng hợp theo chủ đề</h3>
            </div>
            <p className="text-xs text-slate-500">
              Chọn linh hoạt theo Module & Slide bài giảng đã học • Có gợi ý thông minh từ AI
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
              quizzes={allQuizzes}
              compact
              onCreated={(quizId) => navigate(`/courses/${course.id}/quizzes/${quizId}/take`)}
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
                Bài thi môn học
              </span>
              <h3 className="font-bold text-base text-slate-900">Danh sách bài Quiz</h3>
              <span className="text-xs font-semibold text-[#1E3A6E] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {allQuizzes.length} bài
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Bao gồm quiz giảng viên phát hành ({instructorCount}) và quiz do bạn tự tạo ({studentCount}) • Sắp xếp mới nhất
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 shrink-0">
            {isListOpen ? 'Thu gọn ▲' : 'Bấm để xem danh sách ▼'}
          </span>
        </button>

        {isListOpen && (
          <div className="p-5 border-t border-slate-200 space-y-4">
            {/* Bộ lọc: Tất cả / Quiz do giảng viên duyệt / Quiz do sinh viên tạo */}
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
                  Tất cả ({allQuizzes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('instructor')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    filter === 'instructor'
                      ? 'bg-white text-[#1E3A6E] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Quiz do giảng viên duyệt ({instructorCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('student')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    filter === 'student'
                      ? 'bg-white text-[#1E3A6E] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Quiz do sinh viên tạo ({studentCount})
                </button>
              </div>
            </div>

            {filteredAndSortedQuizzes.length === 0 ? (
              <Empty
                title={
                  filter === 'student'
                    ? 'Bạn chưa tạo bài quiz tổng hợp nào'
                    : filter === 'instructor'
                    ? 'Chưa có quiz nào từ giảng viên'
                    : 'Chưa có bài quiz nào'
                }
              />
            ) : (
              <div className="space-y-3">
                {filteredAndSortedQuizzes.map((q) => {
                  const isStudentCreated = q.quiz_type === 'comprehensive';

                  return (
                    <div
                      key={q.id}
                      className="p-4 border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors bg-white"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Badge nguồn gốc quiz */}
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                              isStudentCreated
                                ? 'bg-blue-100 text-[#1E3A6E] border border-blue-200'
                                : 'bg-[#1E3A6E] text-white'
                            }`}
                          >
                            {isStudentCreated ? 'Quiz do sinh viên tạo' : 'Quiz do giảng viên duyệt'}
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
                        </div>

                        <h4 className="font-bold text-slate-900 text-base">{q.title}</h4>

                        <p className="text-xs text-slate-500">
                          Hạn nộp: {formatDeadline(q.due_at)} • Điểm tối đa: {q.max_score}
                          {q.my_attempts
                            ? ` • Đã làm ${q.my_attempts} lần, cao nhất ${formatScore(q.my_best_score ?? 0)}`
                            : ''}
                        </p>
                      </div>

                      {/* Nút hành động */}
                      <div className="flex items-center gap-2 shrink-0">
                        {q.my_attempts ? (
                          <>
                            <button
                              type="button"
                              onClick={() => take(q, true)}
                              className={btn.secondary}
                            >
                              Xem kết quả
                            </button>
                            <button
                              type="button"
                              onClick={() => take(q)}
                              className={btn.primary}
                            >
                              Làm lại
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => take(q)}
                            className={`${btn.primary} px-5 py-2.5`}
                          >
                            Vào làm bài
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
