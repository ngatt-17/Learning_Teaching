import type { ReactNode } from 'react';
import { NavLink, Outlet, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, FolderOpen, HelpCircle, Home, Inbox, Lock, MessageSquare, Users, UserCog } from 'lucide-react';
import { platform } from '../../lib/api';
import { useCurrentUser } from '../../lib/auth';
import { isStaff } from '../../lib/roles';
import type { Course } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';
import { ErrorState, Loading } from '../../components/StateViews';

interface CourseContext {
  course: Course;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCourse(): Course {
  return useOutletContext<CourseContext>().course;
}

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

export function CourseLayout() {
  const { courseId = '' } = useParams();
  const user = useCurrentUser();
  const navigate = useNavigate();
  const { data: course, error, loading, reload } = useAsync(
    () => platform.get<Course>(`/courses/${courseId}`),
    [courseId],
  );

  const nav: NavItem[] = isStaff(user.role)
    ? [
        { to: '', label: 'Materials', icon: <FolderOpen size={18} />, end: true },
        { to: 'quizzes', label: 'Quizzes', icon: <HelpCircle size={18} /> },
        { to: 'students', label: 'Students', icon: <Users size={18} /> },
        ...(user.role === 'admin'
          ? [
              { to: 'members', label: 'Members', icon: <UserCog size={18} /> },
              { to: 'feedback-inbox', label: 'Feedback', icon: <Inbox size={18} /> },
            ]
          : []),
      ]
    : [
        { to: '', label: 'Home', icon: <Home size={18} />, end: true },
        { to: 'quizzes', label: 'Quizzes', icon: <HelpCircle size={18} /> },
        { to: 'notes', label: 'My Notes', icon: <Lock size={18} /> },
        { to: 'feedback', label: 'Feedback', icon: <MessageSquare size={18} /> },
      ];

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <div className="bg-white text-slate-800 py-4 px-6 shrink-0 flex items-center justify-between border-b border-slate-200 shadow-xs">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => navigate('/courses')}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 text-sm font-medium transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          {course && (
            <div className="min-w-0">
              <span className="text-xs font-bold text-[#C8232C] uppercase tracking-wider">
                {course.code} • {course.term}
              </span>
              <h1 className="text-xl font-extrabold text-slate-900 leading-tight truncate">{course.name}</h1>
            </div>
          )}
        </div>
        {course?.instructor_name && (
          <span className="hidden md:block text-xs text-slate-500">Giảng viên: {course.instructor_name}</span>
        )}
      </div>

      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {course && (
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
          <aside className="w-full md:w-56 bg-white border border-slate-200 rounded-xl p-2 shrink-0 shadow-xs h-fit">
            <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase border-b border-slate-100 mb-2">Course Menu</div>
            <nav className="space-y-1">
              {nav.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive ? 'bg-slate-100 text-[#1E3A6E] font-semibold border-l-4 border-[#C8232C]' : 'text-slate-600 hover:bg-slate-50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={isActive ? 'text-[#C8232C]' : 'text-slate-400'}>{item.icon}</span>
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </aside>
          <main className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl p-6 shadow-xs overflow-y-auto">
            <Outlet context={{ course } satisfies CourseContext} />
          </main>
        </div>
      )}
    </div>
  );
}
