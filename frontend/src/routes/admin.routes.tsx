import type { RouteObject } from 'react-router-dom'
import { RequireRole } from './guards'
import { lazyPage } from './lazy'

/** Espace administrateur : /admin/... */
export const adminRoutes: RouteObject = {
  path: 'admin',
  element: <RequireRole role="ADMIN" />,
  children: [
    { index: true, ...lazyPage(() => import('@/actors/admin/pages/DashboardPage'), 'DashboardPage') },
    { path: 'payments', ...lazyPage(() => import('@/actors/admin/pages/PaymentsPage'), 'PaymentsPage') },
    { path: 'whatsapp', ...lazyPage(() => import('@/actors/admin/pages/WhatsappPage'), 'WhatsappPage') },
    { path: 'agent/leads', ...lazyPage(() => import('@/actors/admin/pages/AgentLeadsPage'), 'AgentLeadsPage') },
    { path: 'agent/orders', ...lazyPage(() => import('@/actors/admin/pages/AgentOrdersPage'), 'AgentOrdersPage') },
    { path: 'earnings', ...lazyPage(() => import('@/actors/admin/pages/EarningsPage'), 'EarningsPage') },
    { path: 'payments/groups/:id', ...lazyPage(() => import('@/actors/admin/pages/GroupPaymentsPage'), 'GroupPaymentsPage') },
    { path: 'planning',...lazyPage(() => import('@/actors/admin/pages/PlanningPage'), 'PlanningPage') },
    { path: 'students',...lazyPage(() => import('@/actors/admin/pages/StudentsPage'), 'StudentsPage') },
    { path: 'students/:id', ...lazyPage(() => import('@/actors/admin/pages/StudentDetailPage'), 'StudentDetailPage') },
    { path: 'groups', ...lazyPage(() => import('@/actors/admin/pages/GroupsPage'), 'GroupsPage') },
    { path: 'groups/:id', ...lazyPage(() => import('@/actors/admin/pages/GroupDetailPage'), 'GroupDetailPage') },
    { path: 'teachers', ...lazyPage(() => import('@/actors/admin/pages/TeachersPage'), 'TeachersPage') },
    { path: 'parents', ...lazyPage(() => import('@/actors/admin/pages/ParentsPage'), 'ParentsPage') },
    { path: 'rooms', ...lazyPage(() => import('@/actors/admin/pages/RoomsPage'), 'RoomsPage') },
    { path: 'coding', ...lazyPage(() => import('@/actors/admin/pages/CodingFollowPage'), 'CodingFollowPage') },
    { path: 'coding/:id', ...lazyPage(() => import('@/actors/admin/pages/CodingStudentPage'), 'CodingStudentPage') },
  ],
}
