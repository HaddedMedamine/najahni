import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../core/audit/audit.service.js';
import { NotificationsService } from '../../core/notifications/notifications.service.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { seriesCompletedBySession } from '../../core/payments/payments.js';
import {
  DateRangeQuery,
  overlapping,
  parseRange,
} from '../../core/sessions/range.js';
import { MarkAttendanceDto, SessionNotesDto } from './dto/sessions.dto.js';

/** On peut ouvrir l'appel 30 minutes avant le debut prevu. */
const START_EARLY_MS = 30 * 60 * 1000;

const personName = { select: { firstName: true, lastName: true } } as const;

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
      include: {
        group: { select: { id: true, name: true, subject: true } },
        room: { select: { id: true, name: true } },
        _count: { select: { attendances: true } },
      },
      orderBy: { startsAt: 'asc' },
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
