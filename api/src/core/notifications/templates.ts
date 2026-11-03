import { TIME_ZONE } from './time.js';

// Textes des messages WhatsApp, en francais et en arabe (langue du destinataire).

export type Locale = 'fr' | 'ar';

export const toLocale = (value?: string | null): Locale => (value === 'ar' ? 'ar' : 'fr');

const intl = (locale: Locale) => (locale === 'ar' ? 'ar-TN' : 'fr-TN');

export const formatDay = (date: Date, locale: Locale) =>
  new Intl.DateTimeFormat(intl(locale), {
    timeZone: TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);

export const formatHour = (date: Date, locale: Locale) =>
  new Intl.DateTimeFormat(intl(locale), {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);

const money = (amount: number, locale: Locale) =>
  new Intl.NumberFormat(intl(locale), { style: 'currency', currency: 'TND' }).format(amount);

/** "Bonjour Mohamed," / "Bonjour," quand on ne connait pas le nom. */
const hello = (locale: Locale, name?: string | null) =>
  locale === 'ar' ? `مرحبًا${name ? ` ${name}` : ''}،` : `Bonjour${name ? ` ${name}` : ''},`;

const signature = (locale: Locale, center: string) =>
  locale === 'ar' ? `— مركز ${center}` : `— Centre ${center}`;

export interface AbsenceVars {
  recipientName?: string | null;
  studentName: string;
  subject: string;
  startsAt: Date;
  center: string;
}

export function absenceMessage(locale: Locale, v: AbsenceVars) {
  const day = formatDay(v.startsAt, locale);
  const hour = formatHour(v.startsAt, locale);
  return locale === 'ar'
    ? `${hello(locale, v.recipientName)}\nنعلمكم أن ${v.studentName} كان(ت) غائبًا(ة) عن حصة ${v.subject} يوم ${day} على الساعة ${hour}.\n${signature(locale, v.center)}`
    : `${hello(locale, v.recipientName)}\nNous vous informons que ${v.studentName} était absent(e) à la séance de ${v.subject} du ${day} à ${hour}.\n${signature(locale, v.center)}`;
}

export interface PaymentVars {
  recipientName?: string | null;
  studentName: string;
  subject: string;
  startsAt: Date;
  series: number;
  amount: number;
  center: string;
}

/** Rappel au parent : la seance de demain termine la serie de son enfant. */
export function paymentParentMessage(locale: Locale, v: PaymentVars) {
  const day = formatDay(v.startsAt, locale);
  const hour = formatHour(v.startsAt, locale);
  const amount = money(v.amount, locale);
  return locale === 'ar'
    ? `${hello(locale, v.recipientName)}\nحصة ${v.subject} غدًا (${day} على الساعة ${hour}) هي آخر حصة في السلسلة ${v.series} لـ ${v.studentName}.\nنرجو تحضير مبلغ ${amount}.\n${signature(locale, v.center)}`
    : `${hello(locale, v.recipientName)}\nLa séance de ${v.subject} de demain (${day} à ${hour}) est la dernière de la série ${v.series} de ${v.studentName}.\nMerci de prévoir le paiement de ${amount}.\n${signature(locale, v.center)}`;
}

/** Rappel a l'eleve lui-meme. */
export function paymentStudentMessage(locale: Locale, v: PaymentVars) {
  const day = formatDay(v.startsAt, locale);
  const hour = formatHour(v.startsAt, locale);
  const amount = money(v.amount, locale);
  return locale === 'ar'
    ? `${hello(locale, v.recipientName)}\nحصة ${v.subject} غدًا (${day} على الساعة ${hour}) هي آخر حصة في سلسلتك ${v.series}.\nلا تنسَ دفع ${amount}.\n${signature(locale, v.center)}`
    : `${hello(locale, v.recipientName)}\nTa séance de ${v.subject} de demain (${day} à ${hour}) est la dernière de ta série ${v.series}.\nPense au paiement de ${amount}.\n${signature(locale, v.center)}`;
}

export const testMessage = (center: string) =>
  `✅ Test Najahni : les notifications WhatsApp du centre ${center} fonctionnent.`;
