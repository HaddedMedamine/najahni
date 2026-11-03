import { useMutation, useQueryClient } from '@tanstack/react-query'

/** Prefixe de toutes les requetes admin : une mutation rafraichit tout l'espace admin. */
export const ADMIN_KEY = 'admin'

/** Mutation admin : invalide le cache admin apres succes (listes, compteurs, details). */
export function useAdminMutation<TVariables, TData = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ADMIN_KEY] }),
  })
}
