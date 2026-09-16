import { useCurrentUser } from '../../lib/auth';
import { isStaff } from '../../lib/roles';
import { StudentHome } from '../student/StudentHome';
import { MaterialsManager } from '../instructor/MaterialsManager';

export function CourseHome() {
  const user = useCurrentUser();
  return isStaff(user.role) ? <MaterialsManager /> : <StudentHome />;
}
