import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { AuditService } from '../../core/audit/audit.service.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';
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
import { overlapping, parseRange } from '../../core/sessions/range.js';
import {
  CreateSessionDto,
  DeleteSessionQuery,
  ListSessionsQuery,
  UpdateSessionDto,
} from './dto/sessions.dto.js';

const personName = { select: { firstName: true, lastName: true } } as const;

const sessionInclude = {
  group: {
    select: { id: true, name: true, subject: true, level: true, section: true },
  },
  teacher: { select: { id: true, user: personName } },
  room: { select: { id: true, name: true } },
  _count: { select: { attendances: true } },
} satisfies Prisma.SessionInclude;

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(q: ListSessionsQuery) {
    const { from, to } = parseRange(q);
    return this.prisma.session.findMany({
      where: {
        ...overlapping(from, to),
        groupId: q.groupId,
        teacherId: q.teacherId,
        roomId: q.roomId,
      },
      include: sessionInclude,
      orderBy: { startsAt: 'asc' },
    });
  }

  get(id: string) {
    return this.prisma.session.findUniqueOrThrow({
      where: { id },
      include: {
        ...sessionInclude,
        attendances: {
          select: {
            status: true,
            note: true,
            student: { select: { id: true, user: personName } },
          },
          orderBy: { student: { user: { lastName: 'asc' } } },
        },
      },
    });
  }

  /** Cree une seance, ou une serie hebdomadaire (repeatWeeks > 1). */
  async create(dto: CreateSessionDto, actorId: string) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    assertValidSlot(startsAt, endsAt);

    const group = await this.prisma.group.findUniqueOrThrow({
      where: { id: dto.groupId },
      include: withActiveStudents,
    });
    if (group.archivedAt)
      throw new BadRequestException('Ce groupe est archive');

    const teacherId = dto.teacherId ?? group.teacherId;
    await assertRoomFits(this.prisma, dto.roomId, group._count.students);

    const weeks = dto.repeatWeeks ?? 1;
    const slots = weeklySlots(startsAt, endsAt, weeks);
    const seriesId = weeks > 1 ? randomUUID() : null;

    const created = await this.prisma.$transaction(async (tx) => {
      assertNoConflicts(
        await findConflicts(tx, slots, {
          teacherId,
          groupId: group.id,
          roomId: dto.roomId,
        }),
      );
      await tx.session.createMany({
        data: slots.map((slot) => ({
          ...slot,
          groupId: group.id,
          teacherId,
          roomId: dto.roomId,
          isOnline: dto.isOnline ?? false,
          meetingUrl: dto.meetingUrl,
          seriesId,
        })),
      });
      return tx.session.findMany({
        where: seriesId ? { seriesId } : { groupId: group.id, startsAt },
        include: sessionInclude,
        orderBy: { startsAt: 'asc' },
      });
    });

    await this.audit.log({
      actorId,
      action: 'session.create',
      entity: 'Group',
      entityId: group.id,
      metadata: { count: created.length, seriesId, startsAt: dto.startsAt },
    });
    return created;
  }

  /** Deplacement ou modification : seulement les seances encore planifiees. */
  async update(id: string, dto: UpdateSessionDto, actorId: string) {
    const session = await this.prisma.session.findUniqueOrThrow({
      where: { id },
      include: { group: { include: withActiveStudents } },
    });
    if (session.status !== 'PLANNED') {
      throw new BadRequestException(
        'Seule une seance planifiee peut etre modifiee',
      );
    }

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : session.startsAt;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : session.endsAt;
    assertValidSlot(startsAt, endsAt);

    const roomId = dto.roomId === undefined ? session.roomId : dto.roomId;
    const teacherId = dto.teacherId ?? session.teacherId;
    if (dto.roomId)
      await assertRoomFits(
        this.prisma,
        dto.roomId,
        session.group._count.students,
      );

    const updated = await this.prisma.$transaction(async (tx) => {
      assertNoConflicts(
        await findConflicts(tx, [{ startsAt, endsAt }], {
          teacherId,
          roomId,
          groupId: session.groupId,
          excludeId: id,
        }),
      );
      return tx.session.update({
        where: { id },
        data: {
          startsAt,
          endsAt,
          roomId,
          teacherId,
          isOnline: dto.isOnline,
          meetingUrl: dto.meetingUrl,
        },
        include: sessionInclude,
      });
    });

    await this.audit.log({
      actorId,
      action: 'session.update',
      entity: 'Session',
      entityId: id,
      metadata: { ...dto },
    });
    return updated;
  }

  async cancel(id: string, actorId: string) {
    const { count } = await this.prisma.session.updateMany({
      where: { id, status: 'PLANNED' },
      data: { status: 'CANCELLED' },
    });
    if (count === 0) {
      throw new BadRequestException(
        'Seule une seance planifiee peut etre annulee',
      );
    }
    await this.audit.log({
      actorId,
      action: 'session.cancel',
      entity: 'Session',
      entityId: id,
    });
  }

  /** Supprime une seance planifiee (ou annulee), ou la suite de sa serie. */
  async remove(id: string, q: DeleteSessionQuery, actorId: string) {
    const session = await this.prisma.session.findUniqueOrThrow({
      where: { id },
    });
    if (session.status !== 'PLANNED' && session.status !== 'CANCELLED') {
      throw new BadRequestException(
        'Une seance commencee ou terminee ne peut pas etre supprimee',
      );
    }

    const where: Prisma.SessionWhereInput =
      q.scope === 'following' && session.seriesId
        ? {
            seriesId: session.seriesId,
            startsAt: { gte: session.startsAt },
            status: { in: ['PLANNED', 'CANCELLED'] },
          }
        : { id };

    const { count } = await this.prisma.session.deleteMany({ where });
    await this.audit.log({
      actorId,
      action: 'session.delete',
      entity: 'Session',
      entityId: id,
      metadata: { scope: q.scope ?? 'one', count },
    });
    return { deleted: count };
  }
}
