import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useMe } from '@/core/auth/auth.api'
import { useAuthStore } from '@/core/auth/auth.store'
import { cn } from '@/core/lib/utils'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

/** Structure commune des pages connectees : menu lateral + barre du haut + contenu. */
export function AppLayout() {
  const user = useAuthStore((s) => s.user)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  useMe()

  useEffect(() => setMobileOpen(false), [location.pathname])

  if (!user) return null

  return (
    <div className="min-h-screen">
      {/* Menu fixe sur grand ecran */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-72 p-3 lg:block">
        <div className="h-full rounded-3xl border border-border/70 bg-card shadow-soft">
          <Sidebar user={user} />
        </div>
      </aside>

      {/* Menu en tiroir sur mobile */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-[#10243e]/25 backdrop-blur-sm transition-opacity lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setMobileOpen(false)}
      />
      <aside
        className={cn(
          'fixed inset-y-0 start-0 z-50 w-72 rounded-e-3xl bg-card shadow-2xl transition-transform lg:hidden',
          mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full rtl:translate-x-full',
        )}
      >
        <Sidebar user={user} onNavigate={() => setMobileOpen(false)} />
      </aside>

      <div className="lg:ps-72">
        <Topbar user={user} onMenu={() => setMobileOpen(true)} />
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
