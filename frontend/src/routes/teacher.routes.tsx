import type { RouteObject } from 'react-router-dom'
import { RequireRole } from './guards'
import { lazyPage } from './lazy'

/** Espace enseignant : /teacher/... (l'accueil est le planning) */
export const teacherRoutes: RouteObject = {
  path: 'teacher',
  element: <RequireRole role="TEACHER" />,
  children: [
    { index: true, ...lazyPage(() => import('@/actors/teacher/pages/TeacherPlanningPage'), 'TeacherPlanningPage') },
    { path: 'sessions/:id', ...lazyPage(() => import('@/actors/teacher/pages/TeacherSessionPage'), 'TeacherSessionPage') },
    { path: 'payments', ...lazyPage(() => import('@/actors/teacher/pages/TeacherPaymentsPage'), 'TeacherPaymentsPage') },
    { path: 'exercises', ...lazyPage(() => import('@/actors/teacher/pages/TeacherExercisesPage'), 'TeacherExercisesPage') },
    { path: 'earnings', ...lazyPage(() => import('@/actors/teacher/pages/TeacherEarningsPage'), 'TeacherEarningsPage') },
    { path: 'payments/groups/:id', ...lazyPage(() => import('@/actors/teacher/pages/TeacherGroupPaymentsPage'), 'TeacherGroupPaymentsPage') },
    { path: 'groups',...lazyPage(() => import('@/actors/teacher/pages/TeacherGroupsPage'), 'TeacherGroupsPage') },
    { path: 'groups/:id', ...lazyPage(() => import('@/actors/teacher/pages/TeacherGroupDetailPage'), 'TeacherGroupDetailPage') },
    { path: 'coding', ...lazyPage(() => import('@/actors/teacher/pages/TeacherCodingFollowPage'), 'TeacherCodingFollowPage') },
    { path: 'coding/:id', ...lazyPage(() => import('@/actors/teacher/pages/TeacherCodingStudentPage'), 'TeacherCodingStudentPage') },
  ],
}
