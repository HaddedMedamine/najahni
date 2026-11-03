import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { AuditService } from '../../core/audit/audit.service.js';
import { publicUserSelect } from '../../core/common/accounts.js';
import { skipTake, toPage } from '../../core/common/pagination.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import {
  CreateGroupDto,
  ListGroupsQuery,
  UpdateGroupDto,
} from './dto/groups.dto.js';

const activeMembers = { where: { leftAt: null } } as const;

/**
 * Inscrit des eleves dans un groupe en respectant sa capacite.
 * A appeler dans une transaction : la ligne du groupe est verrouillee.
 */
export async function enrollStudents(
  tx: Prisma.TransactionClient,
  groupId: string,
  studentIds: string[],
): Promise<number> {
  await tx.$queryRaw`SELECT id FROM groups WHERE id = ${groupId} FOR UPDATE`;
  const group = await tx.group.findUnique({ where: { id: groupId } });
  if (!group) throw new NotFoundException('Groupe introuvable');
  if (group.archivedAt) {
    throw new BadRequestException(`Le groupe "${group.name}" est archive`);
  }

  const ids = [...new Set(studentIds)];
  const alreadyIn = await tx.groupStudent.findMany({
    where: { groupId, studentId: { in: ids }, leftAt: null },
    select: { studentId: true },
  });
  const newcomers = ids.filter(
    (id) => !alreadyIn.some((m) => m.studentId === id),
  );
  if (newcomers.length === 0) return 0;

  const validStudents = await tx.student.count({
    where: { id: { in: newcomers }, archivedAt: null },
  });
  if (validStudents !== newcomers.length) {
    throw new BadRequestException('Eleve introuvable ou archive');
  }

  const active = await tx.groupStudent.count({
    where: { groupId, leftAt: null },
  });
  if (active + newcomers.length > group.capacity) {
    throw new BadRequestException(
      `Capacite du groupe "${group.name}" depassee (${active}/${group.capacity})`,
    );
  }

  for (const studentId of newcomers) {
    await tx.groupStudent.upsert({
      where: { groupId_studentId: { groupId, studentId } },
      create: { groupId, studentId },
      update: { leftAt: null, joinedAt: new Date() },
    });
  }
  // Pas de paiement a creer ici : chaque eleve demarre sa propre serie de presences
  return newcomers.length;
}

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(q: ListGroupsQuery) {
    const where: Prisma.GroupWhereInput = {
      archivedAt: q.archived ? { not: null } : null,
      level: q.level,
      section: q.section,
      teacherId: q.teacherId,
      name: q.search
        ? { contains: q.search.trim(), mode: 'insensitive' }
        : undefined,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.group.findMany({
        where,
        include: {
          teacher: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
          _count: { select: { students: activeMembers } },
        },
        orderBy: { name: 'asc' },
        ...skipTake(q),
      }),
      this.prisma.group.count({ where }),
    ]);
    return toPage(items, total, q);
  }

  get(id: string) {
    return this.prisma.group.findUniqueOrThrow({
      where: { id },
      include: {
        teacher: { select: { id: true, user: { select: publicUserSelect } } },
        students: {
          ...activeMembers,
          orderBy: { joinedAt: 'asc' },
          select: {
            joinedAt: true,
            student: {
              select: {
                id: true,
                level: true,
                section: true,
                user: { select: publicUserSelect },
              },
            },
          },
        },
        _count: { select: { sessions: { where: { status: 'DONE' } } } },
      },
    });
  }

  async create(dto: CreateGroupDto, actorId: string) {
    const group = await this.prisma.group.create({ data: dto });
    await this.audit.log({
      actorId,
      action: 'group.create',
      entity: 'Group',
      entityId: group.id,
    });
    return this.get(group.id);
  }

  async update(id: string, dto: UpdateGroupDto, actorId: string) {
    if (dto.capacity !== undefined) {
      const active = await this.prisma.groupStudent.count({
        where: { groupId: id, leftAt: null },
      });
      if (dto.capacity < active) {
        throw new BadRequestException(
          `Capacite inferieure au nombre d'eleves inscrits (${active})`,
        );
      }
    }
    await this.prisma.group.update({ where: { id }, data: dto });
    await this.audit.log({
      actorId,
      action: 'group.update',
      entity: 'Group',
      entityId: id,
      metadata: { ...dto },
    });
    return this.get(id);
  }

  async setArchived(id: string, archived: boolean, actorId: string) {
    await this.prisma.group.update({
      where: { id },
      data: { archivedAt: archived ? new Date() : null },
    });
    await this.audit.log({
      actorId,
      action: archived ? 'group.archive' : 'group.restore',
      entity: 'Group',
      entityId: id,
    });
  }

  async remove(id: string, actorId: string) {
    const group = await this.prisma.group.findUniqueOrThrow({
      where: { id },
      include: { _count: { select: { sessions: true, installments: true } } },
    });
    if (group._count.sessions > 0 || group._count.installments > 0) {
      throw new ConflictException(
        'Ce groupe a un historique (seances, paiements) : archivez-le plutot',
      );
    }
    await this.prisma.group.delete({ where: { id } });
    await this.audit.log({
      actorId,
      action: 'group.delete',
      entity: 'Group',
      entityId: id,
      metadata: { name: group.name },
    });
  }

  async addStudents(id: string, studentIds: string[], actorId: string) {
    const added = await this.prisma.$transaction((tx) =>
      enrollStudents(tx, id, studentIds),
    );
    await this.audit.log({
      actorId,
      action: 'group.add_students',
      entity: 'Group',
      entityId: id,
      metadata: { studentIds },
    });
    return { added };
  }

  /** Retire l'eleve du groupe en gardant l'historique (leftAt). */
  async removeStudent(id: string, studentId: string, actorId: string) {
    const { count } = await this.prisma.groupStudent.updateMany({
      where: { groupId: id, studentId, leftAt: null },
      data: { leftAt: new Date() },
    });
    if (count === 0) {
      throw new NotFoundException("Cet eleve n'est pas dans le groupe");
    }
    await this.audit.log({
      actorId,
      action: 'group.remove_student',
      entity: 'Group',
      entityId: id,
      metadata: { studentId },
    });
  }
}
