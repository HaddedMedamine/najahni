import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { Role } from '@/core/api/types'
import { canEnter, homePathFor, useAuthStore } from '@/core/auth/auth.store'

/** Redirige vers /login si personne n'est connecte. */
export function RequireAuth() {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

/** Reserve un espace a un role : les autres sont renvoyes vers leur accueil. */
export function RequireRole({ role }: { role: Role }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (!canEnter(user, role)) return <Navigate to={homePathFor(user.role)} replace />
  return <Outlet />
}

/** Page de connexion : inutile si deja connecte. */
export function GuestOnly() {
  const user = useAuthStore((s) => s.user)
  if (user) return <Navigate to={homePathFor(user.role)} replace />
  return <Outlet />
}

/** "/" envoie chaque utilisateur vers l'accueil de son role. */
export function HomeRedirect() {
  const user = useAuthStore((s) => s.user)
  return <Navigate to={user ? homePathFor(user.role) : '/login'} replace />
}
