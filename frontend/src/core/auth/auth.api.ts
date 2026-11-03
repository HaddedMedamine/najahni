import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '@/core/api/client'
import { queryClient } from '@/core/api/query-client'
import type { Me, Tokens } from '@/core/api/types'
import { homePathFor, useAuthStore } from './auth.store'

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession)
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (input: { identifier: string; password: string }) =>
      api
        .post<Tokens & { user: Me }>('/auth/login', input)
        .then((r) => r.data),
    // Le message d'erreur est affiche dans le formulaire, pas en toast
    meta: { silent: true },
    onSuccess: (session) => {
      setSession(session)
      navigate(homePathFor(session.user.role), { replace: true })
    },
  })
}

/** Rafraichit le profil au chargement (le role ou le nom ont pu changer). */
export function useMe() {
  const setUser = useAuthStore((s) => s.setUser)
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await api.get<Me>('/auth/me')
      setUser(data)
      return data
    },
  })
}

export async function logout() {
  const { refreshToken, clear } = useAuthStore.getState()
  if (refreshToken) {
    await api.post('/auth/logout', { refreshToken }).catch(() => undefined)
  }
  clear()
  queryClient.clear()
}

/** Les erreurs s'affichent dans la page (pas en toast). */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (identifier: string) => api.post('/auth/forgot-password', { identifier }),
    meta: { silent: true },
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: { token: string; password: string }) => api.post('/auth/reset-password', input),
    meta: { silent: true },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      api.post('/auth/change-password', input),
  })
}
