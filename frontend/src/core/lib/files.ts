import { api } from '@/core/api/client'
import i18n from '@/core/i18n'

/** Fichiers acceptes pour les exercices (meme liste que l'API). */
export const ACCEPTED_FILES = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx'
const ACCEPTED_EXT = ACCEPTED_FILES.split(',')
export const MAX_FILE_SIZE = 10 * 1024 * 1024
export const MAX_FILES = 10

export const isAccepted = (file: File) =>
  ACCEPTED_EXT.some((ext) => file.name.toLowerCase().endsWith(ext)) && file.size <= MAX_FILE_SIZE

export const fileKind = (mimeType: string) =>
  mimeType === 'application/pdf' ? 'pdf' : mimeType.startsWith('image/') ? 'image' : 'word'

/** 2,4 Mo / 350 Ko */
export function formatSize(bytes: number) {
  const fmt = (n: number) => new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-TN' : 'fr-TN', { maximumFractionDigits: 1 }).format(n)
  return bytes >= 1024 * 1024 ? `${fmt(bytes / 1024 / 1024)} Mo` : `${fmt(Math.max(1, bytes / 1024))} Ko`
}

/**
 * Ouvre un fichier protege (le jeton est envoye par axios) :
 * PDF et images dans un nouvel onglet, Word en telechargement.
 */
export async function openFile(url: string, file: { fileName: string; mimeType: string }) {
  // Onglet ouvert tout de suite (sinon bloque par le navigateur apres l'attente)
  const tab = fileKind(file.mimeType) === 'word' ? null : window.open('', '_blank')
  try {
    const { data } = await api.get<Blob>(url, { responseType: 'blob' })
    const href = URL.createObjectURL(new Blob([data], { type: file.mimeType }))
    if (tab) {
      tab.location.href = href
    } else {
      const a = document.createElement('a')
      a.href = href
      a.download = file.fileName
      a.click()
    }
    setTimeout(() => URL.revokeObjectURL(href), 60_000)
  } catch (e) {
    tab?.close()
    throw e
  }
}
