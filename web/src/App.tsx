import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { isStaff } from './lib/roles';
import { AppShell } from './components/AppShell';
import { Loading } from './components/StateViews';
import { LoginPage } from './features/auth/LoginPage';
import { CoursesPage } from './features/courses/CoursesPage';
import { CourseLayout } from './features/courses/CourseLayout';
import { CourseHome } from './features/courses/CourseHome';
import { CourseQuizzes } from './features/courses/CourseQuizzes';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { HelpPage } from './features/help/HelpPage';
import { AccountPage } from './features/account/AccountPage';
import { QuizExamPage } from './features/quiz/QuizExamPage';
import { MaterialWorkspace } from './features/study/MaterialWorkspace';
import { StudentNotes } from './features/student/StudentNotes';
import { FeedbackTab } from './features/student/FeedbackTab';
import { QuizEditor } from './features/instructor/QuizEditor';
import { QuizResults } from './features/instructor/QuizResults';
import { StudentsTab } from './features/instructor/StudentsTab';
import { MembersTab } from './features/admin/MembersTab';
import { FeedbackInbox } from './features/admin/FeedbackInbox';
import { AdminPage } from './features/admin/AdminPage';
import { NotFound } from './features/NotFound';

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loading label="Đang khôi phục phiên đăng nhập…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

function RequireRole({ allow, children }: { allow: (role: string) => boolean; children: ReactNode }) {
  const { user } = useAuth();
  if (!user || !allow(user.role)) return <NotFound denied />;
  return <>{children}</>;
}

const staffOnly = (role: string) => isStaff(role as never);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/courses" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="courses/:courseId/quizzes/:quizId/take" element={<QuizExamPage />} />
            <Route path="courses/:courseId/materials/:materialId" element={<MaterialWorkspace />} />
            <Route path="courses/:courseId" element={<CourseLayout />}>
              <Route index element={<CourseHome />} />
              <Route path="quizzes" element={<CourseQuizzes />} />
              <Route path="quizzes/new" element={<RequireRole allow={staffOnly}><QuizEditor /></RequireRole>} />
              <Route path="quizzes/:quizId/edit" element={<RequireRole allow={staffOnly}><QuizEditor /></RequireRole>} />
              <Route path="quizzes/:quizId/results" element={<RequireRole allow={staffOnly}><QuizResults /></RequireRole>} />
              <Route path="notes" element={<RequireRole allow={(r) => r === 'student'}><StudentNotes /></RequireRole>} />
              <Route path="feedback" element={<RequireRole allow={(r) => r === 'student'}><FeedbackTab /></RequireRole>} />
              <Route path="students" element={<RequireRole allow={staffOnly}><StudentsTab /></RequireRole>} />
              <Route path="members" element={<RequireRole allow={(r) => r === 'admin'}><MembersTab /></RequireRole>} />
              <Route path="feedback-inbox" element={<RequireRole allow={(r) => r === 'admin'}><FeedbackInbox /></RequireRole>} />
            </Route>
            <Route path="admin" element={<RequireRole allow={(r) => r === 'admin'}><AdminPage /></RequireRole>} />
            <Route path="help" element={<HelpPage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
