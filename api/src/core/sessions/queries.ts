import type { AttendanceStatus } from '../../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { overlapping } from './range.js';

// Requetes en lecture partagees par l'espace eleve et l'espace parent

const personName = { select: { firstName: true, lastName: true } } as const;

/** Seances des groupes de l'eleve sur la periode, avec SA presence. */
export async function studentSessions(
  prisma: PrismaService,
  studentId: string,
  from: Date,
  to: Date,
) {
  const sessions = await prisma.session.findMany({
    where: {
      ...overlapping(from, to),
      OR: [
        // groupes actuels
        { group: { students: { some: { studentId, leftAt: null } } } },
        // seances passees ou il a ete note (meme s'il a quitte le groupe)
        { attendances: { some: { studentId } } },
      ],
    },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      status: true,
      isOnline: true,
      meetingUrl: true,
      homework: true,
      group: { select: { id: true, name: true, subject: true } },
      room: { select: { name: true } },
      teacher: { select: { user: personName } },
      attendances: {
        where: { studentId },
        select: { status: true, note: true },
      },
    },
    orderBy: { startsAt: 'asc' },
  });
  return sessions.map(({ attendances, ...s }) => ({
    ...s,
    attendance: attendances[0] ?? null,
  }));
}

/** Historique de presence d'un eleve + totaux par statut. */
export async function studentAttendance(
  prisma: PrismaService,
  studentId: string,
) {
  const records = await prisma.attendance.findMany({
    where: { studentId },
    select: {
      id: true,
      status: true,
      note: true,
      session: {
        select: {
          id: true,
          startsAt: true,
          group: { select: { name: true, subject: true } },
        },
      },
    },
    orderBy: { session: { startsAt: 'desc' } },
    take: 100,
  });

  const stats: Record<AttendanceStatus, number> = {
    PRESENT: 0,
    ABSENT: 0,
    LATE: 0,
    EXCUSED: 0,
  };
  const grouped = await prisma.attendance.groupBy({
    by: ['status'],
    where: { studentId },
    _count: { _all: true },
  });
  for (const g of grouped) stats[g.status] = g._count._all;

  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  // Taux de presence : les absences excusees ne penalisent pas
  const counted = total - stats.EXCUSED;
  const attended = stats.PRESENT + stats.LATE;
  return {
    stats,
    total,
    rate: counted ? Math.round((attended / counted) * 100) : null,
    records,
  };
}
