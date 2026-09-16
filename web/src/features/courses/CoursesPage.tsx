import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { platform } from '../../lib/api';
import { useCurrentUser } from '../../lib/auth';
import type { Course } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';
import { CourseCard } from '../../components/CourseCard';
import { Empty, ErrorState, Loading } from '../../components/StateViews';
import { inputClass } from '../../components/styles';

export function CoursesPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { data: courses, error, loading, reload } = useAsync(() => platform.get<Course[]>('/courses/'), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (courses ?? []).filter((c) => !q || `${c.code} ${c.name} ${c.term} ${c.instructor_name ?? ''}`.toLowerCase().includes(q));
  }, [courses, query]);

  return (
    <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
      <div className="pb-1 mb-3">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Hi, {user.name.toUpperCase()}! 👋</h1>
        <h2 className="text-base sm:text-lg font-semibold text-slate-700 mt-0.5">
          {user.role === 'admin' ? 'Tất cả khóa học' : 'Course overview'}
        </h2>
      </div>
      <hr className="border-slate-200 mb-6" />

      <div className="flex items-center gap-3 mb-6 max-w-xl">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo mã, tên khóa học, giảng viên"
          className={inputClass}
        />
      </div>

      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {courses && filtered.length === 0 && (
        <Empty title={courses.length === 0 ? 'Bạn chưa được phân công khóa học nào' : 'Không có khóa học phù hợp'}>
          {courses.length === 0 && 'CECS admin phân công sinh viên và giảng viên vào khóa học.'}
        </Empty>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onSelect={() => navigate(`/courses/${course.id}`)}
            footer={
              course.my_role && course.my_role !== 'student' ? (
                <span className="self-start text-[10px] font-bold uppercase tracking-wider text-[#C8232C] bg-[#FDF2F2] border border-red-100 rounded px-1.5 py-0.5">
                  {course.my_role}
                </span>
              ) : undefined
            }
          />
        ))}
      </div>
    </main>
  );
}
