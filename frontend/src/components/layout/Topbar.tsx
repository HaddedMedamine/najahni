import { Languages, LogOut, Menu, Moon, Sun, UserCog } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/shared/Misc'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Me } from '@/core/api/types'
import { logout } from '@/core/auth/auth.api'
import { fullName } from '@/core/lib/utils'
import { useThemeStore } from '@/core/theme/theme.store'

export function Topbar({ user, onMenu }: { user: Me; onMenu: () => void }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { theme, toggle } = useThemeStore()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 flex h-18 items-center gap-2 bg-background/70 px-4 backdrop-blur-md lg:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenu}
        aria-label={t('layout.menu')}
      >
        <Menu />
      </Button>

      <div className="ms-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => i18n.changeLanguage(i18n.language === 'ar' ? 'fr' : 'ar')}
        >
          <Languages />
          {t('layout.switchLanguage')}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={theme === 'dark' ? t('layout.lightMode') : t('layout.darkMode')}
        >
          {theme === 'dark' ? <Sun /> : <Moon />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ms-1 flex items-center gap-2.5 rounded-2xl border border-border/70 bg-card p-1.5 pe-3 shadow-soft transition-colors hover:border-primary/30">
              <Avatar user={user} />
              <span className="hidden text-start text-sm leading-tight sm:block">
                <span className="block font-medium">{fullName(user)}</span>
                <span className="block text-xs text-muted-foreground">
                  {t(`roles.${user.role}`)}
                </span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel className="text-muted-foreground">
              {user.email ?? user.phone}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate('/profile')}>
              <UserCog />
              {t('nav.profile')}
            </DropdownMenuItem>
            <DropdownMenuItem destructive onSelect={handleLogout}>
              <LogOut />
              {t('auth.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
