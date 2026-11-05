import type { Prisma } from '../../generated/prisma/client.js';
import { fieldError } from '../common/field-errors.js';
import type { Slot } from './conflicts.js';
import { addDays } from './range.js';

const MAX_DURATION_MS = 6 * 60 * 60 * 1000;

/** Regles communes admin / enseignant pour placer une seance. */
export function assertValidSlot(startsAt: Date, endsAt: Date) {
  if (endsAt <= startsAt) {
    throw fieldError(
      'endsAt',
      "L'heure de fin doit suivre l'heure de debut",
    );
  }
  if (endsAt.getTime() - startsAt.getTime() > MAX_DURATION_MS) {
    throw fieldError('endsAt', 'Une seance ne peut pas depasser 6 heures');
  }
}

/** La salle doit etre active et assez grande pour le groupe. */
export async function assertRoomFits(
  db: Prisma.TransactionClient,
  roomId: string | undefined | null,
  students: number,
) {
  if (!roomId) return;
  const room = await db.room.findUniqueOrThrow({ where: { id: roomId } });
  if (!room.isActive)
    throw fieldError('roomId', `La salle "${room.name}" est desactivee`);
  if (room.capacity < students) {
    throw fieldError(
      'roomId',
      `La salle "${room.name}" (${room.capacity} places) est trop petite pour ce groupe (${students} eleves)`,
    );
  }
}

/** Meme creneau chaque semaine pendant `weeks` semaines (1 = seance unique). */
export const weeklySlots = (
  startsAt: Date,
  endsAt: Date,
  weeks: number,
): Slot[] =>
  Array.from({ length: weeks }, (_, i) => ({
    startsAt: addDays(startsAt, 7 * i),
    endsAt: addDays(endsAt, 7 * i),
  }));

/** Groupe avec son nombre d'eleves actuels (pour verifier la salle). */
export const withActiveStudents = {
  _count: { select: { students: { where: { leftAt: null } } } },
} satisfies Prisma.GroupInclude;
