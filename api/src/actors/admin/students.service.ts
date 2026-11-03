import { ConflictException, Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { AuditService } from '../../core/audit/audit.service.js';
import {
  newUserData,
  publicUserSelect,
  userUpdateData,
} from '../../core/common/accounts.js';
import { skipTake, toPage, userSearch } from '../../core/common/pagination.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import {
  CreateStudentDto,
  ListStudentsQuery,
  UpdateStudentDto,
} from './dto/students.dto.js';
import { enrollStudents } from './groups.service.js';

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(q: ListStudentsQuery) {
    const where: Prisma.StudentWhereInput = {
      archivedAt: q.archived ? { not: null } : null,
      level: q.level,
      section: q.section,
      user: userSearch(q.search),
      groups: q.groupId
        ? { some: { groupId: q.groupId, leftAt: null } }
        : undefined,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.student.findMany({
        where,
        include: {
          user: { select: publicUserSelect },
          groups: {
            where: { leftAt: null },
            select: { group: { select: { id: true, name: true } } },
          },
        },
        orderBy: [
          { user: { lastName: 'asc' } },
          { user: { firstName: 'asc' } },
        ],
        ...skipTake(q),
      }),
      this.prisma.student.count({ where }),
    ]);
    return toPage(items, total, q);
  }

  get(id: string) {
    return this.prisma.student.findUniqueOrThrow({
      where: { id },
      include: {
        user: { select: publicUserSelect },
        parents: {
          select: {
            relationship: true,
            parent: {
              select: { id: true, user: { select: publicUserSelect } },
            },
          },
        },
        groups: {
          where: { leftAt: null },
          select: {
            joinedAt: true,
            group: {
              select: { id: true, name: true, subject: true, monthlyFee: true },
            },
          },
        },
      },
    });
  }

  async create(dto: CreateStudentDto, actorId: string) {
    const { user, temporaryPassword } = await newUserData(dto, 'STUDENT');

    const studentId = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          ...user,
          student: {
            create: {
              level: dto.level,
              section: dto.section,
              parentPhone: dto.parentPhone,
              monthlyFee: dto.monthlyFee,
              birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
              parents: dto.parentIds?.length
                ? { create: dto.parentIds.map((parentId) => ({ parentId })) }
                : undefined,
            },
          },
        },
        select: { student: { select: { id: true } } },
      });
      const id = created.student!.id;
      for (const groupId of new Set(dto.groupIds ?? [])) {
        await enrollStudents(tx, groupId, [id]);
      }
      return id;
    });

    await this.audit.log({
      actorId,
      action: 'student.create',
      entity: 'Student',
      entityId: studentId,
    });
    return { ...(await this.get(studentId)), temporaryPassword };
  }

  async update(id: string, dto: UpdateStudentDto, actorId: string) {
    await this.prisma.student.update({
      where: { id },
      data: {
        level: dto.level,
        section: dto.section,
        parentPhone: dto.parentPhone,
        monthlyFee: dto.monthlyFee,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        user: { update: userUpdateData(dto) },
      },
    });
    await this.audit.log({
      actorId,
      action: 'student.update',
      entity: 'Student',
      entityId: id,
    });
    return this.get(id);
  }

  /** Archive : desactive le compte, retire des groupes, coupe les sessions. */
  async archive(id: string, actorId: string) {
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      const student = await tx.student.update({
        where: { id },
        data: { archivedAt: now, user: { update: { isActive: false } } },
      });
      await tx.groupStudent.updateMany({
        where: { studentId: id, leftAt: null },
        data: { leftAt: now },
      });
      await tx.refreshToken.updateMany({
        where: { userId: student.userId, revokedAt: null },
        data: { revokedAt: now },
      });
    });
    await this.audit.log({
      actorId,
      action: 'student.archive',
      entity: 'Student',
      entityId: id,
    });
  }

  async restore(id: string, actorId: string) {
    await this.prisma.student.update({
      where: { id },
      data: { archivedAt: null, user: { update: { isActive: true } } },
    });
    await this.audit.log({
      actorId,
      action: 'student.restore',
      entity: 'Student',
      entityId: id,
    });
  }

  async remove(id: string, actorId: string) {
    const student = await this.prisma.student.findUniqueOrThrow({
      where: { id },
      include: { _count: { select: { installments: true } } },
    });
    if (student._count.installments > 0) {
      throw new ConflictException(
        'Cet eleve a un historique de paiements : archivez-le plutot',
      );
    }
    await this.prisma.user.delete({ where: { id: student.userId } });
    await this.audit.log({
      actorId,
      action: 'student.delete',
      entity: 'Student',
      entityId: id,
    });
  }
}
