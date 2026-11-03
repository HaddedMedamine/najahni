import 'i18next'
import type { Translation } from './locales/fr'

// Verifie les cles de traduction a la compilation : t('students.titre') -> erreur
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: Translation }
  }
}
