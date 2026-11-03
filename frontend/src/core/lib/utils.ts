import { clsx, type ClassValue } from 'clsx'
import { useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'

/** Combine des classes Tailwind en resolvant les conflits. */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

/** Retourne la valeur apres `delay` ms sans changement (pour la recherche). */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

/** Supprime les champs vides ('' ou undefined) avant envoi a l'API. */
export function compact<T extends Record<string, unknown>>(values: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(values).filter(([, v]) => v !== '' && v !== undefined),
  ) as Partial<T>
}

export const fullName = (user: { firstName: string; lastName: string }) =>
  `${user.firstName} ${user.lastName}`

export const initials = (user: { firstName: string; lastName: string }) =>
  `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
