import { GraduationCap, Presentation, Shield, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation } from 'react-router-dom'
import type { Me, Role } from '@/core/api/types'
import { canEnter, homePathFor } from '@/core/auth/auth.store'
import { cn } from '@/core/lib/utils'
import { NAV_BY_ROLE } from './nav.config'

export function Logo({ className }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_6px_16px_-6px] shadow-primary/60">
        <GraduationCap className="size-5" />
      </span>
      <span className="text-xl font-bold tracking-tight">{t('app.name')}</span>
    </div>
  )
}

export function Sidebar({ user, onNavigate }: { user: Me; onNavigate?: () => void }) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  // Admin qui est aussi le prof : deux espaces, on affiche le menu de celui ou il se trouve
  const both = user.role === 'ADMIN' && canEnter(user, 'TEACHER')
  const role: Role = both && pathname.startsWith('/teacher') ? 'TEACHER' : user.role

  return (
    <div className="flex h-full flex-col gap-5 p-5">
      <Logo className="px-1 pt-1" />

      {both && (
        <div className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
          {(['ADMIN', 'TEACHER'] as const).map((space) => (
            <NavLink
              key={space}
              to={homePathFor(space)}
              onClick={onNavigate}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-semibold transition-colors',
                role === space ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {space === 'ADMIN' ? <Shield className="size-3.5" /> : <Presentation className="size-3.5" />}
              {t(space === 'ADMIN' ? 'layout.adminSpace' : 'layout.teacherSpace')}
            </NavLink>
          ))}
        </div>
      )}

      <nav className="-mx-1 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-1">
        {NAV_BY_ROLE[role].map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-full px-3 py-2 text-sm font-semibold transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-[0_6px_16px_-6px] shadow-primary/60'
                  : 'text-muted-foreground hover:bg-primary-soft hover:text-primary',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'flex size-8 items-center justify-center rounded-full transition-colors',
                    isActive ? 'bg-white/20' : 'bg-muted group-hover:bg-card',
                  )}
                >
                  <Icon className="size-4" />
                </span>
                {t(label)}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Petite carte d'accueil en bas du menu : le menu passe avant sur un ecran bas */}
      <div className="hidden shrink-0 rounded-2xl bg-gradient-to-br from-primary-soft to-sky-soft p-4 [@media(min-height:1000px)]:block">
        <Sparkles className="size-5 text-primary" />
        <p className="mt-2 text-sm font-semibold">{t('app.name')}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t('app.tagline')}</p>
      </div>
    </div>
  )
}
