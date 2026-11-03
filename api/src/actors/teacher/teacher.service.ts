import { Injectable, NotFoundException } from '@nestjs/common';
import { publicUserSelect } from '../../core/common/accounts.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';

@Injectable()
export class TeacherService {
  constructor(private readonly prisma: PrismaService) {}

  async myGroups(userId: string) {
    const teacher = await this.teacherOf(userId);
    return this.prisma.group.findMany({
      where: { teacherId: teacher.id, archivedAt: null },
      include: {
        _count: { select: { students: { where: { leftAt: null } } } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async myGroup(userId: string, groupId: string) {
    const teacher = await this.teacherOf(userId);
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, teacherId: teacher.id },
      include: {
        students: {
          where: { leftAt: null },
          select: {
            student: {
              select: {
                id: true,
                level: true,
                section: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });
    if (!group) throw new NotFoundException('Groupe introuvable');
    return group;
  }

  async profile(userId: string) {
    return this.prisma.teacher.findUniqueOrThrow({
      where: { userId },
      include: { user: { select: publicUserSelect } },
    });
  }

  private teacherOf(userId: string) {
    return this.prisma.teacher.findUniqueOrThrow({ where: { userId } });
  }
}
