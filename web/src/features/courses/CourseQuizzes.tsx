import { useCurrentUser } from '../../lib/auth';
import { isStaff } from '../../lib/roles';
import { StudentQuizList } from '../student/StudentQuizList';
import { QuizManager } from '../instructor/QuizManager';

export function CourseQuizzes() {
  const user = useCurrentUser();
  return isStaff(user.role) ? <QuizManager /> : <StudentQuizList />;
}
