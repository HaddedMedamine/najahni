import type { RouteObject } from 'react-router-dom'
import { RequireRole } from './guards'
import { lazyPage } from './lazy'

/** Espace parent : /parent/... */
export const parentRoutes: RouteObject = {
  path: 'parent',
  element: <RequireRole role="PARENT" />,
  children: [
    { index: true, ...lazyPage(() => import('@/actors/parent/pages/ParentChildrenPage'), 'ParentChildrenPage') },
    { path: 'children/:id', ...lazyPage(() => import('@/actors/parent/pages/ParentChildDetailPage'), 'ParentChildDetailPage') },
  ],
}
