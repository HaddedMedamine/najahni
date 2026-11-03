import { BadRequestException, Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { AuditService } from '../../core/audit/audit.service.js';
import {
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
  CreateTeacherDto,
  SelfTeacherDto,
  UpdateTeacherDto,
} from './dto/teachers.dto.js';

@Injectable()
export class TeachersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(q: PaginationQuery) {
    const where: Prisma.TeacherWhereInput = { user: userSearch(q.search) };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.teacher.findMany({
        where,
        include: {
          user: { select: publicUserSelect },
          _count: { select: { groups: { where: { archivedAt: null } } } },
        },
        orderBy: [
          { user: { lastName: 'asc' } },
          { user: { firstName: 'asc' } },
        ],
        ...skipTake(q),
      }),
      this.prisma.teacher.count({ where }),
    ]);
    return toPage(items, total, q);
  }

  get(id: string) {
    return this.prisma.teacher.findUniqueOrThrow({
      where: { id },
      include: {
        user: { select: publicUserSelect },
        groups: {
          where: { archivedAt: null },
          select: {
            id: true,
            name: true,
            subject: true,
            _count: { select: { students: { where: { leftAt: null } } } },
          },
        },
      },
    });
  }

  async create(dto: CreateTeacherDto, actorId: string) {
    const { user, temporaryPassword } = await newUserData(dto, 'TEACHER');
    const created = await this.prisma.user.create({
      data: { ...user, teacher: { create: { subjects: dto.subjects } } },
      select: { teacher: { select: { id: true } } },
    });
    const id = created.teacher!.id;
    await this.audit.log({
      actorId,
      action: 'teacher.create',
      entity: 'Teacher',
      entityId: id,
    });
    return { ...(await this.get(id)), temporaryPassword };
  }

  /** Centre avec un seul prof : l'admin active son propre espace enseignant. */
  async enableSelf(dto: SelfTeacherDto, actorId: string) {
    const existing = await this.prisma.teacher.findUnique({ where: { userId: actorId } });
    if (existing) {
      throw new BadRequestException('Votre espace enseignant est deja active');
    }
    const teacher = await this.prisma.teacher.create({
      data: { userId: actorId, subjects: dto.subjects },
    });
    await this.audit.log({
      actorId,
      action: 'teacher.enable_self',
      entity: 'Teacher',
      entityId: teacher.id,
    });
    return this.get(teacher.id);
  }

  async update(id: string, dto: UpdateTeacherDto, actorId: string) {
    if (dto.isActive === false && (await this.isAdminProfile(id))) {
      throw new BadRequestException(
        "Impossible de desactiver le compte administrateur",
      );
    }
    const teacher = await this.prisma.teacher.update({
      where: { id },
      data: {
        subjects: dto.subjects,
        user: { update: { ...userUpdateData(dto), isActive: dto.isActive } },
      },
    });
    if (dto.isActive === false) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: teacher.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    await this.audit.log({
      actorId,
      action: 'teacher.update',
      entity: 'Teacher',
      entityId: id,
    });
    return this.get(id);
  }

  /** Echoue (409) si l'enseignant a des groupes, seances ou exercices : desactivez-le plutot. */
  async remove(id: string, actorId: string) {
    const teacher = await this.prisma.teacher.findUniqueOrThrow({
      where: { id },
      select: { userId: true, user: { select: { role: true } } },
    });
    // Profil enseignant de l'admin : on retire le profil, jamais le compte admin
    if (teacher.user.role === 'ADMIN') {
      await this.prisma.teacher.delete({ where: { id } });
    } else {
      await this.prisma.user.delete({ where: { id: teacher.userId } });
    }
    await this.audit.log({
      actorId,
      action: 'teacher.delete',
      entity: 'Teacher',
      entityId: id,
    });
  }

  private async isAdminProfile(id: string) {
    const t = await this.prisma.teacher.findUnique({
      where: { id },
      select: { user: { select: { role: true } } },
    });
    return t?.user.role === 'ADMIN';
  }
}
