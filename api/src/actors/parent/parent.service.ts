import { ForbiddenException, Injectable } from '@nestjs/common';
import { publicUserSelect } from '../../core/common/accounts.js';
import { studentPayments } from '../../core/payments/payments.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import {
  studentAttendance,
  studentSessions,
} from '../../core/sessions/queries.js';
import { DateRangeQuery, parseRange } from '../../core/sessions/range.js';

@Injectable()
export class ParentService {
  constructor(private readonly prisma: PrismaService) {}

  async myChildren(userId: string) {
    const parent = await this.parentOf(userId);
    const links = await this.prisma.parentStudent.findMany({
      where: { parentId: parent.id },
      select: {
        relationship: true,
        student: {
          select: {
            id: true,
            level: true,
            section: true,
            archivedAt: true,
            user: { select: { firstName: true, lastName: true } },
            groups: {
              where: { leftAt: null },
              select: {
                group: { select: { id: true, name: true, subject: true } },
              },
            },
          },
        },
      },
    });
    return links.map((l) => ({ ...l.student, relationship: l.relationship }));
  }

  /** Detail d'un enfant : uniquement si le parent y est lie. */
  async child(userId: string, studentId: string) {
    await this.assertOwnChild(userId, studentId);
    return this.prisma.student.findUniqueOrThrow({
      where: { id: studentId },
      include: {
        user: { select: publicUserSelect },
        groups: {
          where: { leftAt: null },
          select: {
            group: {
              select: {
                id: true,
                name: true,
                subject: true,
                teacher: {
                  select: {
                    user: { select: { firstName: true, lastName: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async childSessions(userId: string, studentId: string, q: DateRangeQuery) {
    await this.assertOwnChild(userId, studentId);
    const { from, to } = parseRange(q);
    return studentSessions(this.prisma, studentId, from, to);
  }

  async childAttendance(userId: string, studentId: string) {
    await this.assertOwnChild(userId, studentId);
    return studentAttendance(this.prisma, studentId);
  }

  async childPayments(userId: string, studentId: string) {
    await this.assertOwnChild(userId, studentId);
    return studentPayments(this.prisma, studentId);
  }

  private async assertOwnChild(userId: string, studentId: string) {
    const parent = await this.parentOf(userId);
    const link = await this.prisma.parentStudent.findUnique({
      where: { parentId_studentId: { parentId: parent.id, studentId } },
    });
    if (!link) throw new ForbiddenException();
  }

  private parentOf(userId: string) {
    return this.prisma.parent.findUniqueOrThrow({ where: { userId } });
  }
}
