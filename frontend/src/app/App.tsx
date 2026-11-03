import { QueryClientProvider } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { queryClient } from '@/core/api/query-client'
import { useThemeStore } from '@/core/theme/theme.store'
import { router } from '@/routes'

export function App() {
  const theme = useThemeStore((s) => s.theme)
  const { i18n } = useTranslation()

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        richColors
        closeButton
        theme={theme}
        dir={i18n.dir()}
        position={i18n.dir() === 'rtl' ? 'top-left' : 'top-right'}
      />
    </QueryClientProvider>
  )
}
