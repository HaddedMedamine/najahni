import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
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

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, clear } = useAuthStore.getState()
  if (!refreshToken) return null
  try {
    const { data } = await axios.post<Tokens>('/api/auth/refresh', {
      refreshToken,
    })
    setTokens(data)
    return data.accessToken
  } catch {
    clear()
    return null
  }
}

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
    refreshing ??= refreshAccessToken().finally(() => {
      refreshing = null
    })
    const token = await refreshing
    if (!token) throw error

    original.headers.Authorization = `Bearer ${token}`
    return api(original)
  },
)
