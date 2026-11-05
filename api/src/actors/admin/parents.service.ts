import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { AuditService } from '../../core/audit/audit.service.js';
import {
  assertAccountAvailable,
  newUserData,
  publicUserSelect,
  userUpdateData,
} from '../../core/common/accounts.js';
import {
  PaginationQuery,
  skipTake,
  toPage,
  userSearch,
} from '../../core/common/pagination.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import {
  CreateParentDto,
  LinkChildDto,
  UpdateParentDto,
} from './dto/parents.dto.js';

const childrenSelect = {
  select: {
    relationship: true,
    student: {
      select: {
        id: true,
        level: true,
        section: true,
        user: { select: { firstName: true, lastName: true } },
      },
    },
  },
} as const;

@Injectable()
export class ParentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(q: PaginationQuery) {
    const where: Prisma.ParentWhereInput = { user: userSearch(q.search) };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.parent.findMany({
        where,
        include: {
          user: { select: publicUserSelect },
          children: childrenSelect,
        },
        orderBy: [
          { user: { lastName: 'asc' } },
          { user: { firstName: 'asc' } },
        ],
        ...skipTake(q),
      }),
      this.prisma.parent.count({ where }),
    ]);
    return toPage(items, total, q);
  }

  get(id: string) {
    return this.prisma.parent.findUniqueOrThrow({
      where: { id },
      include: { user: { select: publicUserSelect }, children: childrenSelect },
    });
  }

  async create(dto: CreateParentDto, actorId: string) {
    await assertAccountAvailable(this.prisma, dto);
    const { user, temporaryPassword } = await newUserData(dto, 'PARENT');
    const created = await this.prisma.user.create({
      data: {
        ...user,
        parent: {
          create: {
            children: dto.studentIds?.length
              ? { create: dto.studentIds.map((studentId) => ({ studentId })) }
              : undefined,
          },
        },
      },
      select: { parent: { select: { id: true } } },
    });
    const id = created.parent!.id;
    await this.audit.log({
      actorId,
      action: 'parent.create',
      entity: 'Parent',
      entityId: id,
    });
    return { ...(await this.get(id)), temporaryPassword };
  }

  async update(id: string, dto: UpdateParentDto, actorId: string) {
    await assertAccountAvailable(this.prisma, dto, { parent: { id } });
    const parent = await this.prisma.parent.update({
      where: { id },
      data: {
        user: { update: { ...userUpdateData(dto), isActive: dto.isActive } },
      },
    });
    if (dto.isActive === false) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: parent.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    await this.audit.log({
      actorId,
      action: 'parent.update',
      entity: 'Parent',
      entityId: id,
    });
    return this.get(id);
  }

  async remove(id: string, actorId: string) {
    const parent = await this.prisma.parent.findUniqueOrThrow({
      where: { id },
    });
    await this.prisma.user.delete({ where: { id: parent.userId } });
    await this.audit.log({
      actorId,
      action: 'parent.delete',
      entity: 'Parent',
      entityId: id,
    });
  }

  async linkChild(id: string, dto: LinkChildDto, actorId: string) {
    await this.prisma.parentStudent.upsert({
      where: { parentId_studentId: { parentId: id, studentId: dto.studentId } },
      create: {
        parentId: id,
        studentId: dto.studentId,
        relationship: dto.relationship,
      },
      update: { relationship: dto.relationship },
    });
    await this.audit.log({
      actorId,
      action: 'parent.link_child',
      entity: 'Parent',
      entityId: id,
      metadata: { studentId: dto.studentId },
    });
    return this.get(id);
  }

  async unlinkChild(id: string, studentId: string, actorId: string) {
    await this.prisma.parentStudent.delete({
      where: { parentId_studentId: { parentId: id, studentId } },
    });
    await this.audit.log({
      actorId,
      action: 'parent.unlink_child',
      entity: 'Parent',
      entityId: id,
      metadata: { studentId },
    });
  }
}
