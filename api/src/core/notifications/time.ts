// Heures a Tunis pour les notifications (pas de message la nuit).

export const TIME_ZONE = 'Africa/Tunis';

const partsFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** Date et heure "murales" a Tunis. */
export function tunisParts(date: Date) {
  const parts = Object.fromEntries(
    partsFormat.formatToParts(date).map((p) => [p.type, p.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

/** Instant correspondant a une heure donnee a Tunis (le jour peut deborder : day + 1). */
export function tunisDate(year: number, month: number, day: number, hour = 0, minute = 0) {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const p = tunisParts(new Date(guess));
  const offset = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - guess;
  return new Date(guess - offset);
}

export interface QuietHours {
  /** Debut de la nuit (21 = 21h00) */
  nightStart: number;
  /** Heure d'envoi du matin (8 = 8h00) */
  morning: number;
}

export const isQuiet = (date: Date, q: QuietHours) => {
  const { hour } = tunisParts(date);
  return hour >= q.nightStart || hour < q.morning;
};

/** Premier instant autorise a partir de `date` : la nuit, on attend le matin. */
export function nextAllowed(date: Date, q: QuietHours) {
  const p = tunisParts(date);
  if (p.hour < q.morning) return tunisDate(p.year, p.month, p.day, q.morning);
  if (p.hour >= q.nightStart) return tunisDate(p.year, p.month, p.day + 1, q.morning);
  return date;
}

/** Debut (minuit, Tunis) du jour de `date` decale de `days` jours. */
export function tunisDayStart(date: Date, days = 0) {
  const p = tunisParts(date);
  return tunisDate(p.year, p.month, p.day + days);
}
