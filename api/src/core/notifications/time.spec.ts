import { describe, expect, it } from 'vitest';
import { isQuiet, nextAllowed, tunisDate, tunisDayStart, tunisParts } from './time.js';

const q = { nightStart: 21, morning: 8 };
// Tunis = UTC+1 toute l'annee
const tunis = (iso: string) => new Date(`${iso}+01:00`);

describe('heures de Tunis', () => {
  it('convertit une heure murale de Tunis', () => {
    expect(tunisDate(2026, 10, 22, 8).toISOString()).toBe('2026-10-22T07:00:00.000Z');
    expect(tunisParts(new Date('2026-10-22T23:30:00Z'))).toMatchObject({ day: 23, hour: 0, minute: 30 });
  });

  it('gere le debordement de jour et de mois', () => {
    expect(tunisDate(2026, 10, 32, 8).toISOString()).toBe('2026-11-01T07:00:00.000Z');
    expect(tunisDayStart(tunis('2026-12-31T15:00:00'), 1).toISOString()).toBe('2026-12-31T23:00:00.000Z');
  });
});

describe('pas de message la nuit', () => {
  it('le jour : envoi immediat', () => {
    const d = tunis('2026-10-22T18:05:00');
    expect(isQuiet(d, q)).toBe(false);
    expect(nextAllowed(d, q)).toEqual(d);
  });

  it('apres 21h : le lendemain a 8h', () => {
    const d = tunis('2026-10-22T21:35:00');
    expect(isQuiet(d, q)).toBe(true);
    expect(nextAllowed(d, q)).toEqual(tunis('2026-10-23T08:00:00'));
  });

  it('avant 8h : le jour meme a 8h', () => {
    expect(nextAllowed(tunis('2026-10-23T06:10:00'), q)).toEqual(tunis('2026-10-23T08:00:00'));
  });

  it('20h59 reste autorise, 8h00 aussi', () => {
    expect(isQuiet(tunis('2026-10-22T20:59:00'), q)).toBe(false);
    expect(isQuiet(tunis('2026-10-23T08:00:00'), q)).toBe(false);
  });
});
