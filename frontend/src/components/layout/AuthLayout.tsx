import { CalendarCheck, Languages, Sparkles, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Logo } from '@/components/layout/Sidebar'
import { Button } from '@/components/ui/button'

/** Pages sans connexion (connexion, mot de passe oublie) : presentation a gauche, formulaire a droite. */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const { t, i18n } = useTranslation()
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panneau de presentation */}
      <div className="relative m-4 hidden flex-col justify-between overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary-soft via-card to-sky-soft p-12 lg:flex">
        <Logo className="relative z-10" />
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl leading-tight font-bold">{t('auth.heroTitle')}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{t('auth.heroText')}</p>
          <div className="mt-8 flex gap-3">
            {[
              { Icon: CalendarCheck, tone: 'bg-card text-primary' },
              { Icon: Wallet, tone: 'bg-card text-success' },
              { Icon: Sparkles, tone: 'bg-card text-sky' },
            ].map(({ Icon, tone }, i) => (
              <span key={i} className={`rounded-2xl p-3.5 shadow-soft ${tone}`}>
                <Icon className="size-5" />
              </span>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-sm text-muted-foreground">{t('app.tagline')}</p>
        {/* Bulles decoratives */}
        <div className="absolute -end-24 -bottom-24 size-96 rounded-full bg-card/50" />
        <div className="absolute end-16 top-28 size-24 rounded-full bg-primary/10" />
        <div className="absolute end-44 top-52 size-10 rounded-full bg-primary/15" />
      </div>

      {/* Formulaire */}
      <div className="flex flex-col p-6">
        <div className="flex items-center justify-between">
          <div className="lg:invisible">
            <Logo />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => i18n.changeLanguage(i18n.language === 'ar' ? 'fr' : 'ar')}
          >
            <Languages />
            {t('layout.switchLanguage')}
          </Button>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  )
}
