import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Me, Role, Tokens } from '@/core/api/types'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: Me | null
  setSession: (session: Tokens & { user: Me }) => void
  setTokens: (tokens: Tokens) => void
  setUser: (user: Me) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: ({ accessToken, refreshToken, user }) =>
        set({ accessToken, refreshToken, user }),
      setTokens: ({ accessToken, refreshToken }) =>
        set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: 'najahni-auth',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

/** L'utilisateur peut-il entrer dans l'espace de ce role ? (admin + profil enseignant = les deux) */
export const canEnter = (user: Pick<Me, 'role' | 'teacher'>, role: Role) =>
  user.role === role || (role === 'TEACHER' && user.role === 'ADMIN' && user.teacher !== null)

/** Page d'accueil de chaque role. */
export const homePathFor = (role: Role) =>
  ({
    ADMIN: '/admin',
    TEACHER: '/teacher',
    STUDENT: '/student',
    PARENT: '/parent',
  })[role]
