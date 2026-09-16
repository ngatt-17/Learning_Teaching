import type { Role } from './types';

export const STAFF_ROLES: Role[] = ['instructor', 'ta', 'admin'];

export const isStaff = (role: Role) => STAFF_ROLES.includes(role);

export const ROLE_LABEL: Record<Role, string> = {
  student: 'Student',
  instructor: 'Instructor',
  ta: 'Teaching Assistant',
  admin: 'CECS Admin',
};
