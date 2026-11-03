import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { readStorage, writeStorage } from '@/core/lib/storage'
import { ar } from './locales/ar'
import { fr } from './locales/fr'

export type Language = 'fr' | 'ar'

const STORAGE_KEY = 'najahni-lang'

/** Applique la langue au document : `dir="rtl"` pour l'arabe. */
const applyLanguage = (lng: string) => {
  document.documentElement.lang = lng
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr'
}

void i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, ar: { translation: ar } },
  lng: readStorage(STORAGE_KEY) === 'ar' ? 'ar' : 'fr',
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
})

applyLanguage(i18n.language)
i18n.on('languageChanged', (lng) => {
  applyLanguage(lng)
  writeStorage(STORAGE_KEY, lng)
})

export default i18n
