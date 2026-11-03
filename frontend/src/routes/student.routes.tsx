import type { RouteObject } from 'react-router-dom'
import { RequireRole } from './guards'
import { lazyPage } from './lazy'

/** Espace eleve : /student/... */
export const studentRoutes: RouteObject = {
  path: 'student',
  element: <RequireRole role="STUDENT" />,
  children: [
    { index: true, ...lazyPage(() => import('@/actors/student/pages/StudentHomePage'), 'StudentHomePage') },
    { path: 'planning', ...lazyPage(() => import('@/actors/student/pages/StudentPlanningPage'), 'StudentPlanningPage') },
    { path: 'exercises', ...lazyPage(() => import('@/actors/student/pages/StudentExercisesPage'), 'StudentExercisesPage') },
  ],
}
