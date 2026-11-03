import { ConflictException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { formatSlot, overlapping } from './range.js';

export interface Slot {
  startsAt: Date;
  endsAt: Date;
}

export type ConflictReason = 'TEACHER' | 'ROOM' | 'GROUP';

export interface PlanningConflict {
  sessionId: string;
  startsAt: Date;
  endsAt: Date;
  groupName: string;
  reasons: ConflictReason[];
}

interface Resources {
  teacherId: string;
  groupId: string;
  roomId?: string | null;
  /** Seance a ignorer (celle qu'on deplace). */
  excludeId?: string;
}

/**
 * Seances non annulees qui chevauchent l'un des creneaux et utilisent
 * le meme enseignant, la meme salle ou le meme groupe.
 */
export async function findConflicts(
  db: Prisma.TransactionClient,
  slots: Slot[],
  { teacherId, groupId, roomId, excludeId }: Resources,
): Promise<PlanningConflict[]> {
  if (slots.length === 0) return [];

  const sessions = await db.session.findMany({
    where: {
      id: excludeId ? { not: excludeId } : undefined,
      status: { not: 'CANCELLED' },
      OR: slots.map((s) => overlapping(s.startsAt, s.endsAt)),
      AND: {
        OR: [{ teacherId }, { groupId }, ...(roomId ? [{ roomId }] : [])],
      },
    },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      teacherId: true,
      groupId: true,
      roomId: true,
      group: { select: { name: true } },
    },
    orderBy: { startsAt: 'asc' },
  });

  return sessions.map((s) => ({
    sessionId: s.id,
    startsAt: s.startsAt,
    endsAt: s.endsAt,
    groupName: s.group.name,
    reasons: [
      ...(s.teacherId === teacherId ? (['TEACHER'] as const) : []),
      ...(roomId && s.roomId === roomId ? (['ROOM'] as const) : []),
      ...(s.groupId === groupId ? (['GROUP'] as const) : []),
    ],
  }));
}

const REASON_LABELS: Record<ConflictReason, string> = {
  TEACHER: "l'enseignant est deja occupe",
  ROOM: 'la salle est deja occupee',
  GROUP: 'le groupe a deja une seance',
};

/** 409 avec un message lisible et la liste complete des conflits. */
export function assertNoConflicts(conflicts: PlanningConflict[]) {
  if (conflicts.length === 0) return;
  const first = conflicts[0];
  const reasons = first.reasons.map((r) => REASON_LABELS[r]).join(', ');
  const more =
    conflicts.length > 1
      ? ` (+${conflicts.length - 1} autre(s) conflit(s))`
      : '';
  throw new ConflictException({
    statusCode: 409,
    message: `Conflit de planning le ${formatSlot(first.startsAt)} : ${reasons} (${first.groupName})${more}`,
    conflicts,
  });
}
