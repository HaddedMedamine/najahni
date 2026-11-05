import { MutationCache, QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage, getErrorStatus, getFieldErrors } from './errors'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Inutile de reessayer une erreur client (401, 403, 404...)
      retry: (count, error) => (getErrorStatus(error) ?? 500) >= 500 && count < 2,
    },
  },
  // Toute mutation en echec affiche le message de l'API (sauf `meta: { silent: true }`).
  // Les erreurs par champ sont affichees sous les champs par le formulaire (voir `serverErrors`).
  mutationCache: new MutationCache({
    onError: (error, _variables, _result, mutation) => {
      if (mutation.meta?.silent || getFieldErrors(error)) return
      toast.error(getErrorMessage(error))
    },
  }),
})
