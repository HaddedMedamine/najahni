import type { ComponentType } from 'react'

/**
 * Page chargee a la demande (code splitting) :
 *   { path: 'students', ...lazyPage(() => import('...'), 'StudentsPage') }
 */
export const lazyPage = <M>(load: () => Promise<M>, name: keyof M) => ({
  lazy: async () => ({ Component: (await load())[name] as ComponentType }),
})
