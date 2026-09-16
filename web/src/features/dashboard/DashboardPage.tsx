import { Link, useNavigate } from 'react-router-dom';
import { Flame, Trophy } from 'lucide-react';
import { platform } from '../../lib/api';
import { useCurrentUser } from '../../lib/auth';
import { isStaff } from '../../lib/roles';
import type { Course, MyScore, QuizSummary, Readiness } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';
import { formatDeadline, formatScore } from '../../lib/format';
import { Empty, ErrorState, Loading } from '../../components/StateViews';

export function DashboardPage() {
  const user = useCurrentUser();
  return (
    <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600 mt-0.5">
          {isStaff(user.role)
            ? 'Mức sẵn sàng của khóa học: tài liệu, quiz và góp ý. Số liệu tổng hợp — không bao gồm ghi chú riêng tư.'
            : 'Tiến độ học tập của bạn theo từng khóa học.'}
        </p>
      </div>
      {isStaff(user.role) ? <StaffDashboard /> : <StudentDashboard />}
    </main>
  );
}

interface StudentCourseSummary {
  course: Course;
  score: MyScore;
  open: QuizSummary[];
}

function StudentDashboard() {
  const navigate = useNavigate();
  const { data, error, loading, reload } = useAsync(async () => {
    const courses = await platform.get<Course[]>('/courses/');
    return Promise.all(
      courses.map(async (course): Promise<StudentCourseSummary> => {
        const [score, quizzes] = await Promise.all([
          platform.get<MyScore>(`/courses/${course.id}/scores/my-score`),
          platform.get<QuizSummary[]>(`/courses/${course.id}/quizzes/`),
        ]);
        return { course, score, open: quizzes.filter((q) => q.quiz_type === 'lesson' && !q.my_attempts) };
      }),
    );
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (data!.length === 0) return <Empty title="Bạn chưa được phân công khóa học nào" />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {data!.map(({ course, score, open }) => (
        <section key={course.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold text-[#C8232C] uppercase tracking-wider">{course.code}</p>
              <h2 className="font-bold text-slate-900">{course.name}</h2>
            </div>
            <Link to={`/courses/${course.id}`} className="text-xs font-semibold text-[#1E3A6E] hover:underline shrink-0">Mở khóa học</Link>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-amber-50 border border-amber-200 py-2">
              <Flame size={16} className="mx-auto text-amber-600" />
              <p className="text-lg font-black text-amber-900 tabular-nums">{score.streak_days}</p>
              <p className="text-[10px] text-amber-800">ngày liên tiếp</p>
            </div>
            <div className="rounded-lg bg-[#EDF2FA] border border-[#1E3A6E]/15 py-2">
              <p className="text-lg font-black text-[#1E3A6E] tabular-nums mt-4">{formatScore(score.quiz_score + score.comprehensive_score)}</p>
              <p className="text-[10px] text-slate-600">điểm quiz</p>
            </div>
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 py-2">
              <Trophy size={16} className="mx-auto text-emerald-600" />
              <p className="text-lg font-black text-emerald-900 tabular-nums">{formatScore(score.total_score)}</p>
              <p className="text-[10px] text-emerald-800">tổng điểm</p>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Quiz chưa làm</p>
            {open.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Không còn quiz nào đang chờ.</p>
            ) : (
              <ul className="space-y-1">
                {open.map((q) => (
                  <li key={q.id}>
                    <button onClick={() => navigate(`/courses/${course.id}/quizzes/${q.id}/take`)} className="w-full text-left text-xs flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer">
                      <span className="font-medium text-slate-800 truncate">{q.title}</span>
                      <span className="text-slate-500 shrink-0">Hạn: {formatDeadline(q.due_at)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

function StaffDashboard() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const { data: rows, error, loading, reload } = useAsync(() => platform.get<Readiness[]>('/courses/readiness'), []);

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (rows!.length === 0) return <Empty title="Chưa có khóa học" />;

  const status = (r: Readiness) =>
    r.materials_failed > 0
      ? { label: 'Có tài liệu lỗi', cls: 'bg-rose-50 text-rose-800 border-rose-200' }
      : r.materials_approved === 0 || r.quizzes_published === 0
        ? { label: 'Chưa sẵn sàng', cls: 'bg-amber-50 text-amber-800 border-amber-200' }
        : r.materials_pending > 0 || r.quizzes_draft > 0
          ? { label: 'Cần duyệt', cls: 'bg-blue-50 text-blue-800 border-blue-200' }
          : { label: 'Sẵn sàng', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' };

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
          <tr>
            <th className="text-left px-3 py-2">Khóa học</th>
            <th className="text-left px-3 py-2">Trạng thái</th>
            <th className="text-right px-3 py-2">Sinh viên</th>
            <th className="text-right px-3 py-2">Tài liệu duyệt / tổng</th>
            <th className="text-right px-3 py-2">Chờ duyệt</th>
            <th className="text-right px-3 py-2">Lỗi</th>
            <th className="text-right px-3 py-2">Quiz phát hành</th>
            <th className="text-right px-3 py-2">Quiz nháp</th>
            {user.role === 'admin' && <th className="text-right px-3 py-2">Góp ý</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows!.map((r) => {
            const s = status(r);
            return (
              <tr key={r.id} onClick={() => navigate(`/courses/${r.id}`)} className="hover:bg-slate-50 cursor-pointer">
                <td className="px-3 py-2.5">
                  <p className="font-semibold text-slate-900">{r.code} — {r.name}</p>
                  <p className="text-[11px] text-slate-500">{r.term}{r.instructor_name ? ` • ${r.instructor_name}` : ''}</p>
                </td>
                <td className="px-3 py-2.5"><span className={`inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${s.cls}`}>{s.label}</span></td>
                <td className="px-3 py-2.5 text-right tabular-nums">{r.students}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{r.materials_approved} / {r.materials_total}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{r.materials_pending}</td>
                <td className={`px-3 py-2.5 text-right tabular-nums ${r.materials_failed ? 'text-rose-700 font-bold' : ''}`}>{r.materials_failed}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{r.quizzes_published}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{r.quizzes_draft}</td>
                {user.role === 'admin' && <td className="px-3 py-2.5 text-right tabular-nums">{r.feedback_count}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
