import { useMutation } from '@tanstack/react-query'
import { api } from '@/core/api/client'

/** Genere un mot de passe temporaire pour n'importe quel compte (userId). */
export const useResetPassword = () =>
  useMutation({
    mutationFn: (userId: string) =>
      api
        .post<{ temporaryPassword: string }>(`/admin/accounts/${userId}/reset-password`)
        .then((r) => r.data),
  })
