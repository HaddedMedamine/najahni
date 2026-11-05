import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { AuditService } from '../../core/audit/audit.service.js';
import { NotificationsService } from '../../core/notifications/notifications.service.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { seriesCompletedBySession } from '../../core/payments/payments.js';
import {
  assertNoConflicts,
  findConflicts,
} from '../../core/sessions/conflicts.js';
import {
  assertRoomFits,
  assertValidSlot,
  weeklySlots,
  withActiveStudents,
} from '../../core/sessions/planning.js';
import {
  DateRangeQuery,
  overlapping,
  parseRange,
} from '../../core/sessions/range.js';
import {
  CreateTeacherSessionDto,
  MarkAttendanceDto,
  SessionNotesDto,
  UpdateTeacherSessionDto,
} from './dto/sessions.dto.js';

/** On peut ouvrir l'appel 30 minutes avant le debut prevu. */
const START_EARLY_MS = 30 * 60 * 1000;

const personName = { select: { firstName: true, lastName: true } } as const;

const sessionListInclude = {
  group: { select: { id: true, name: true, subject: true } },
  room: { select: { id: true, name: true } },
  _count: { select: { attendances: true } },
} satisfies Prisma.SessionInclude;

@Injectable()
export class TeacherSessionsService {
  private readonly logger = new Logger(TeacherSessionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(userId: string, q: DateRangeQuery) {
    const { from, to } = parseRange(q);
    const teacher = await this.teacherOf(userId);
    return this.prisma.session.findMany({
      where: { teacherId: teacher.id, ...overlapping(from, to) },
      include: sessionListInclude,
      orderBy: { startsAt: 'asc' },
    });
  }

  /** Salles actives, pour reserver une salle a mes seances. */
  rooms() {
    return this.prisma.room.findMany({
      where: { isActive: true },
      select: { id: true, name: true, capacity: true },
      orderBy: { name: 'asc' },
    });
  }

  /** Reservations des salles sur la periode (sans le detail des seances des autres). */
  async roomOccupancy(userId: string, q: DateRangeQuery) {
    const { from, to } = parseRange(q);
    const teacher = await this.teacherOf(userId);
    const sessions = await this.prisma.session.findMany({
      where: {
        ...overlapping(from, to),
        roomId: { not: null },
        status: { not: 'CANCELLED' },
      },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        teacherId: true,
        room: { select: { id: true, name: true } },
      },
      orderBy: { startsAt: 'asc' },
    });
    return sessions.map(({ teacherId, ...s }) => ({
      ...s,
      mine: teacherId === teacher.id,
    }));
  }

  /** Pose une seance d'un de mes groupes sur le planning, ou une serie hebdomadaire. */
  async create(userId: string, dto: CreateTeacherSessionDto) {
    const teacher = await this.teacherOf(userId);
    const group = await this.prisma.group.findFirst({
      where: { id: dto.groupId, teacherId: teacher.id, archivedAt: null },
      include: withActiveStudents,
    });
    if (!group) throw new NotFoundException('Groupe introuvable');

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    assertValidSlot(startsAt, endsAt);
    await assertRoomFits(this.prisma, dto.roomId, group._count.students);

    const weeks = dto.repeatWeeks ?? 1;
    const slots = weeklySlots(startsAt, endsAt, weeks);
    const seriesId = weeks > 1 ? randomUUID() : null;

    const created = await this.prisma.$transaction(async (tx) => {
      assertNoConflicts(
        await findConflicts(tx, slots, {
          teacherId: teacher.id,
          groupId: group.id,
          roomId: dto.roomId,
        }),
      );
      await tx.session.createMany({
        data: slots.map((slot) => ({
          ...slot,
          groupId: group.id,
          teacherId: teacher.id,
          roomId: dto.roomId,
          seriesId,
        })),
      });
      return tx.session.findMany({
        where: seriesId ? { seriesId } : { groupId: group.id, startsAt },
        include: sessionListInclude,
        orderBy: { startsAt: 'asc' },
      });
    });

    await this.audit.log({
      actorId: userId,
      action: 'session.create',
      entity: 'Group',
      entityId: group.id,
      metadata: { count: created.length, seriesId, startsAt: dto.startsAt },
    });
    return created;
  }

  /** Deplace, redimensionne ou change la salle d'une de mes seances planifiees. */
  async update(userId: string, id: string, dto: UpdateTeacherSessionDto) {
    const session = await this.ownPlannedSession(userId, id);
    const startsAt = dto.startsAt ? new Date(dto.startsAt) : session.startsAt;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : session.endsAt;
    assertValidSlot(startsAt, endsAt);

    const roomId = dto.roomId === undefined ? session.roomId : dto.roomId;
    if (dto.roomId) {
      const group = await this.prisma.group.findUniqueOrThrow({
        where: { id: session.groupId },
        include: withActiveStudents,
      });
      await assertRoomFits(this.prisma, dto.roomId, group._count.students);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      assertNoConflicts(
        await findConflicts(tx, [{ startsAt, endsAt }], {
          teacherId: session.teacherId,
          groupId: session.groupId,
          roomId,
          excludeId: id,
        }),
      );
      return tx.session.update({
        where: { id },
        data: { startsAt, endsAt, roomId },
        include: sessionListInclude,
      });
    });

    await this.audit.log({
      actorId: userId,
      action: 'session.update',
      entity: 'Session',
      entityId: id,
      metadata: { ...dto },
    });
    return updated;
  }

  /** Retire une de mes seances planifiees (posee par erreur, par exemple). */
  async remove(userId: string, id: string) {
    await this.ownPlannedSession(userId, id);
    await this.prisma.session.delete({ where: { id } });
    await this.audit.log({
      actorId: userId,
      action: 'session.delete',
      entity: 'Session',
      entityId: id,
    });
  }

  /** Detail + feuille d'appel : eleves du groupe avec leur presence. */
  async get(userId: string, id: string) {
    const session = await this.ownSession(userId, id);
    const [members, attendances] = await Promise.all([
      this.prisma.groupStudent.findMany({
        where: { groupId: session.groupId, leftAt: null },
        select: { student: { select: { id: true, user: personName } } },
      }),
      this.prisma.attendance.findMany({
        where: { sessionId: id },
        select: {
          status: true,
          note: true,
          student: { select: { id: true, user: personName } },
        },
      }),
    ]);

    // Eleves actuels + eleves deja notes qui auraient quitte le groupe depuis
    const students = new Map(members.map((m) => [m.student.id, m.student]));
    for (const a of attendances) students.set(a.student.id, a.student);

    const roster = [...students.values()]
      .map((student) => {
        const a = attendances.find((x) => x.student.id === student.id);
        return {
          student,
          attendance: a ? { status: a.status, note: a.note } : null,
        };
      })
      .sort((a, b) =>
        a.student.user.lastName.localeCompare(b.student.user.lastName),
      );

    return { ...session, roster };
  }

  async start(userId: string, id: string) {
    const session = await this.ownSession(userId, id);
    if (session.status !== 'PLANNED') {
      throw new BadRequestException(
        'Cette seance a deja ete demarree ou annulee',
      );
    }
    if (Date.now() < session.startsAt.getTime() - START_EARLY_MS) {
      throw new BadRequestException(
        'La seance ne peut etre demarree que 30 minutes avant son debut',
      );
    }
    // Au demarrage, tous les eleves du groupe sont marques absents :
    // l'enseignant n'a plus qu'a cocher les presents
    const members = await this.prisma.groupStudent.findMany({
      where: { groupId: session.groupId, leftAt: null },
      select: { studentId: true },
    });
    await this.prisma.$transaction([
      this.prisma.session.update({
        where: { id },
        data: { status: 'IN_PROGRESS', startedAt: new Date() },
      }),
      this.prisma.attendance.createMany({
        data: members.map((m) => ({
          sessionId: id,
          studentId: m.studentId,
          status: 'ABSENT' as const,
        })),
        skipDuplicates: true,
      }),
    ]);
    await this.audit.log({
      actorId: userId,
      action: 'session.start',
      entity: 'Session',
      entityId: id,
    });
    return this.get(userId, id);
  }

  /** Enregistre (ou corrige) la presence. Possible pendant et apres la seance. */
  async markAttendance(userId: string, id: string, dto: MarkAttendanceDto) {
    const session = await this.ownSession(userId, id);
    if (session.status !== 'IN_PROGRESS' && session.status !== 'DONE') {
      throw new BadRequestException(
        "Demarrez la seance avant de faire l'appel",
      );
    }

    const studentIds = [...new Set(dto.records.map((r) => r.studentId))];
    const allowed = await this.prisma.groupStudent.count({
      where: { groupId: session.groupId, studentId: { in: studentIds } },
    });
    if (allowed !== studentIds.length) {
      throw new BadRequestException(
        "Un des eleves n'appartient pas a ce groupe",
      );
    }

    await this.prisma.$transaction(
      dto.records.map((r) =>
        this.prisma.attendance.upsert({
          where: {
            sessionId_studentId: { sessionId: id, studentId: r.studentId },
          },
          create: {
            sessionId: id,
            studentId: r.studentId,
            status: r.status,
            note: r.note,
          },
          update: { status: r.status, note: r.note, markedAt: new Date() },
        }),
      ),
    );
    // Appel corrige apres la fin : prevenir les parents des nouveaux absents
    if (session.status === 'DONE') this.queueAbsences(id);
    return this.get(userId, id);
  }

  async saveNotes(userId: string, id: string, dto: SessionNotesDto) {
    const session = await this.ownSession(userId, id);
    if (session.status === 'CANCELLED') {
      throw new BadRequestException('Cette seance est annulee');
    }
    await this.prisma.session.update({
      where: { id },
      data: { contentCovered: dto.contentCovered, homework: dto.homework },
    });
    return this.get(userId, id);
  }

  /**
   * Termine la seance : tous les eleves doivent avoir une presence.
   * Les presents avancent dans leur serie ; on renvoie ceux qui viennent de la terminer.
   */
  async complete(userId: string, id: string) {
    const session = await this.ownSession(userId, id);
    if (session.status !== 'IN_PROGRESS') {
      throw new BadRequestException("La seance n'est pas en cours");
    }

    const missing = await this.prisma.groupStudent.count({
      where: {
        groupId: session.groupId,
        leftAt: null,
        student: { attendances: { none: { sessionId: id } } },
      },
    });
    if (missing > 0) {
      throw new BadRequestException(
        `${missing} eleve(s) sans presence : terminez l'appel`,
      );
    }

    const { count } = await this.prisma.session.updateMany({
      where: { id, status: 'IN_PROGRESS' },
      data: { status: 'DONE', endedAt: new Date() },
    });
    if (count === 0) {
      throw new BadRequestException("La seance n'est pas en cours");
    }

    const completedSeries = await seriesCompletedBySession(this.prisma, id);
    this.queueAbsences(id);
    await this.audit.log({
      actorId: userId,
      action: 'session.complete',
      entity: 'Session',
      entityId: id,
    });
    return { session: await this.get(userId, id), completedSeries };
  }

  private async ownSession(userId: string, id: string) {
    const teacher = await this.teacherOf(userId);
    const session = await this.prisma.session.findFirst({
      where: { id, teacherId: teacher.id },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            subject: true,
            level: true,
            section: true,
          },
        },
        room: { select: { id: true, name: true } },
      },
    });
    if (!session) throw new NotFoundException('Seance introuvable');
    return session;
  }

  private async ownPlannedSession(userId: string, id: string) {
    const session = await this.ownSession(userId, id);
    if (session.status !== 'PLANNED') {
      throw new BadRequestException(
        'Seule une seance planifiee peut etre modifiee',
      );
    }
    return session;
  }

  /** Message WhatsApp aux parents des absents (une erreur ici ne bloque jamais l'appel). */
  private queueAbsences(sessionId: string) {
    this.notifications
      .queueAbsences(sessionId)
      .catch((e) => this.logger.error(`Absences ${sessionId} : ${(e as Error).message}`));
  }

  private teacherOf(userId: string) {
    return this.prisma.teacher.findUniqueOrThrow({ where: { userId } });
  }
}
