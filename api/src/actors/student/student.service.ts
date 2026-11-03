import { Injectable, NotFoundException } from '@nestjs/common';
import { publicUserSelect } from '../../core/common/accounts.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { StorageService } from '../../core/storage/storage.service.js';
import { exerciseSelect, flatten } from '../../core/exercises/queries.js';
import {
  studentAttendance,
  studentSessions,
} from '../../core/sessions/queries.js';
import { DateRangeQuery, parseRange } from '../../core/sessions/range.js';

@Injectable()
export class StudentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  profile(userId: string) {
    return this.prisma.student.findUniqueOrThrow({
      where: { userId },
      include: { user: { select: publicUserSelect } },
    });
  }

  async myGroups(userId: string) {
    const student = await this.prisma.student.findUniqueOrThrow({
      where: { userId },
    });
    const memberships = await this.prisma.groupStudent.findMany({
      where: { studentId: student.id, leftAt: null },
      select: {
        joinedAt: true,
        group: {
          select: {
            id: true,
            name: true,
            subject: true,
            teacher: {
              select: { user: { select: { firstName: true, lastName: true } } },
            },
          },
        },
      },
    });
    return memberships.map((m) => ({ ...m.group, joinedAt: m.joinedAt }));
  }

  async sessions(userId: string, q: DateRangeQuery) {
    const { from, to } = parseRange(q);
    return studentSessions(this.prisma, await this.studentId(userId), from, to);
  }

  async attendance(userId: string) {
    return studentAttendance(this.prisma, await this.studentId(userId));
  }

  /** Exercices publies pour mes groupes actuels (le plus recent d'abord). */
  async exercises(userId: string) {
    const items = await this.prisma.exercise.findMany({
      where: { isArchived: false, ...(await this.visibleTo(userId)) },
      select: exerciseSelect,
      orderBy: { createdAt: 'desc' },
    });
    const groupIds = new Set(await this.myGroupIds(userId));
    // On ne montre que mes groupes, pas les autres groupes qui ont recu le meme exercice
    return items.map(flatten).map((e) => ({ ...e, groups: e.groups.filter((g) => groupIds.has(g.id)) }));
  }

  async exerciseFile(userId: string, id: string, fileId: string) {
    const attachment = await this.prisma.attachment.findFirst({
      where: { id: fileId, exercise: { id, isArchived: false, ...(await this.visibleTo(userId)) } },
    });
    if (!attachment) throw new NotFoundException('Fichier introuvable');
    return this.storage.stream(attachment);
  }

  private async visibleTo(userId: string) {
    return { assignments: { some: { groupId: { in: await this.myGroupIds(userId) } } } };
  }

  private async myGroupIds(userId: string) {
    const memberships = await this.prisma.groupStudent.findMany({
      where: { student: { userId }, leftAt: null },
      select: { groupId: true },
    });
    return memberships.map((m) => m.groupId);
  }

  private async studentId(userId: string) {
    const student = await this.prisma.student.findUniqueOrThrow({
      where: { userId },
      select: { id: true },
    });
    return student.id;
  }
}
