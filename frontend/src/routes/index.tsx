import { createBrowserRouter } from 'react-router-dom'
import { LoginPage } from '@/actors/common/pages/LoginPage'
import { NotFoundPage } from '@/actors/common/pages/NotFoundPage'
import { AppLayout } from '@/components/layout/AppLayout'
import { adminRoutes } from './admin.routes'
import { GuestOnly, HomeRedirect, RequireAuth } from './guards'
import { lazyPage } from './lazy'
import { parentRoutes } from './parent.routes'
import { studentRoutes } from './student.routes'
import { teacherRoutes } from './teacher.routes'

/**
 * Carte complete des URL de l'application.
 *   /login                  public
 *   /forgot-password        public (lien par email ou WhatsApp)
 *   /reset-password?token=  public
 *   /admin, /teacher, ...   un fichier par acteur dans ce dossier
 */
export const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/forgot-password', ...lazyPage(() => import('@/actors/common/pages/ForgotPasswordPage'), 'ForgotPasswordPage') },
    ],
  },
  // Lien recu par email / WhatsApp : ouvert meme si quelqu'un est deja connecte
  { path: '/reset-password', ...lazyPage(() => import('@/actors/common/pages/ResetPasswordPage'), 'ResetPasswordPage') },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <HomeRedirect /> },
          { path: '/profile', ...lazyPage(() => import('@/actors/common/pages/ProfilePage'), 'ProfilePage') },
          adminRoutes,
          teacherRoutes,
          studentRoutes,
          parentRoutes,
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
