import { BadRequestException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

const MAX_RANGE_DAYS = 62;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Periode demandee par un calendrier : ?from=...&to=... (ISO 8601). */
export class DateRangeQuery {
  @ApiProperty({ example: '2026-10-19T00:00:00.000Z' })
  @IsDateString()
  from: string;

  @ApiProperty({ example: '2026-10-26T00:00:00.000Z' })
  @IsDateString()
  to: string;
}

export function parseRange(q: DateRangeQuery) {
  const from = new Date(q.from);
  const to = new Date(q.to);
  if (to <= from) {
    throw new BadRequestException(
      'La date de fin doit suivre la date de debut',
    );
  }
  if (to.getTime() - from.getTime() > MAX_RANGE_DAYS * DAY_MS) {
    throw new BadRequestException(`Periode limitee a ${MAX_RANGE_DAYS} jours`);
  }
  return { from, to };
}

/** Seances qui chevauchent [from, to[ */
export const overlapping = (from: Date, to: Date) => ({
  startsAt: { lt: to },
  endsAt: { gt: from },
});

export const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * DAY_MS);

const TIMEZONE = process.env.APP_TIMEZONE ?? 'Africa/Tunis';

/** Date lisible pour les messages d'erreur (heure de Tunis). */
export const formatSlot = (date: Date) =>
  date.toLocaleString('fr-TN', {
    timeZone: TIMEZONE,
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
