import axios, { AxiosError, isAxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/core/auth/auth.store'
import type { Tokens } from './types'

/** Client HTTP unique de l'application. `/api` est redirige vers NestJS par Vite. */
export const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Routes ou un 401 ne doit pas declencher de renouvellement
const NO_REFRESH = ['/auth/login', '/auth/refresh', '/auth/logout']

// Un seul renouvellement a la fois, partage par toutes les requetes en echec
let refreshing: Promise<string | null> | null = null

/** Jetons a jour, meme si un autre onglet vient de les changer. */
async function latestTokens() {
  await useAuthStore.persist.rehydrate()
  return useAuthStore.getState()
}

async function refreshTokens(failedToken?: string): Promise<string | null> {
  const { accessToken, refreshToken, setTokens, clear } = await latestTokens()
  // Un autre onglet a deja renouvele : un refresh token ne sert qu'une fois
  if (accessToken && accessToken !== failedToken) return accessToken
  if (!refreshToken) return null
  try {
    const { data } = await axios.post<Tokens>('/api/auth/refresh', {
      refreshToken,
    })
    setTokens(data)
    return data.accessToken
  } catch (error) {
    const latest = await latestTokens()
    if (latest.refreshToken && latest.refreshToken !== refreshToken) return latest.accessToken
    // Reseau coupe ou serveur indisponible : la session reste valable
    if (isAxiosError(error) && error.response?.status === 401) clear()
    return null
  }
}

/** Le verrou fait passer les onglets un par un (absent hors HTTPS : le serveur tolere alors la course). */
const refreshAccessToken = (failedToken?: string) =>
  navigator.locks
    ? navigator.locks.request('najahni-refresh', () => refreshTokens(failedToken))
    : refreshTokens(failedToken)

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined

    if (
      error.response?.status !== 401 ||
      !original ||
      original._retried ||
      NO_REFRESH.includes(original.url ?? '')
    ) {
      throw error
    }

    original._retried = true
    const failedToken = String(original.headers.Authorization ?? '').replace('Bearer ', '')
    refreshing ??= refreshAccessToken(failedToken).finally(() => {
      refreshing = null
    })
    const token = await refreshing
    if (!token) throw error

    original.headers.Authorization = `Bearer ${token}`
    return api(original)
  },
)
