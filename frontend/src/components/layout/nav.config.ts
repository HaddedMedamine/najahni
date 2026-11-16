import {
  Baby,
  Banknote,
  BookOpen,
  CalendarDays,
  Code2,
  Coins,
  DoorOpen,
  FileText,
  GraduationCap,
  Home,
  LayoutDashboard,
  type LucideIcon,
  MessageCircle,
  PhoneForwarded,
  UserRound,
  Users,
  UsersRound,
} from 'lucide-react'
import type { Role } from '@/core/api/types'
import type { Translation } from '@/core/i18n/locales/fr'

export interface NavItem {
  to: string
  label: `nav.${keyof Translation['nav']}`
  icon: LucideIcon
  /** Actif uniquement sur l'URL exacte (pages d'accueil). */
  end?: boolean
}

/** Menu lateral de chaque acteur : ajoutez ici les nouvelles pages. */
export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  ADMIN: [
    { to: '/admin', label: 'nav.dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/planning', label: 'nav.planning', icon: CalendarDays },
    { to: '/admin/payments', label: 'nav.payments', icon: Banknote },
    { to: '/admin/earnings', label: 'nav.revenue', icon: Coins },
    { to: '/admin/students', label: 'nav.students', icon: GraduationCap },
    { to: '/admin/groups', label: 'nav.groups', icon: UsersRound },
    { to: '/admin/teachers', label: 'nav.teachers', icon: UserRound },
    { to: '/admin/parents', label: 'nav.parents', icon: Users },
    { to: '/admin/rooms', label: 'nav.rooms', icon: DoorOpen },
    { to: '/admin/coding', label: 'nav.coding', icon: Code2 },
    { to: '/admin/whatsapp', label: 'nav.whatsapp', icon: MessageCircle },
    { to: '/admin/agent/leads', label: 'nav.agentLeads', icon: PhoneForwarded },
    { to: '/admin/agent/orders', label: 'nav.agentOrders', icon: BookOpen },
  ],
  TEACHER: [
    { to: '/teacher', label: 'nav.planning', icon: CalendarDays, end: true },
    { to: '/teacher/payments', label: 'nav.payments', icon: Banknote },
    { to: '/teacher/earnings', label: 'nav.earnings', icon: Coins },
    { to: '/teacher/exercises', label: 'nav.exercises', icon: FileText },
    { to: '/teacher/groups', label: 'nav.myGroups', icon: UsersRound },
    { to: '/teacher/coding', label: 'nav.coding', icon: Code2 },
  ],
  STUDENT: [
    { to: '/student', label: 'nav.home', icon: Home, end: true },
    { to: '/student/planning', label: 'nav.planning', icon: CalendarDays },
    { to: '/student/exercises', label: 'nav.exercises', icon: FileText },
    { to: '/student/coding', label: 'nav.coding', icon: Code2 },
  ],
  PARENT: [{ to: '/parent', label: 'nav.myChildren', icon: Baby, end: true }],
}
