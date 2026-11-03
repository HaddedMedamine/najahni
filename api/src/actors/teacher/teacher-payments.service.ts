import { Injectable } from '@nestjs/common';
import { AuditService } from '../../core/audit/audit.service.js';
import { monthlyEarnings } from '../../core/payments/earnings.js';
import {
  cancelLastPayment,
  groupPayments,
  markSeriesPaid,
  paymentsOverview,
} from '../../core/payments/payments.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';

/** Paiements des groupes de l'enseignant connecte. */
@Injectable()
export class TeacherPaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async overview(userId: string) {
    return paymentsOverview(this.prisma, await this.teacherId(userId));
  }

  /** Argent que j'ai encaisse pendant un mois ("AAAA-MM"). */
  async earnings(userId: string, month?: string) {
    return monthlyEarnings(this.prisma, {
      month,
      teacherId: await this.teacherId(userId),
    });
  }

  async group(userId: string, groupId: string) {
    return groupPayments(this.prisma, groupId, await this.teacherId(userId));
  }

  async markPaid(userId: string, groupId: string, studentId: string) {
    const result = await markSeriesPaid(
      this.prisma,
      groupId,
      studentId,
      userId,
      await this.teacherId(userId),
    );
    if (result.changed) {
      await this.log(
        userId,
        'payment.mark_paid',
        studentId,
        groupId,
        result.number,
      );
    }
    return result;
  }

  async cancel(userId: string, groupId: string, studentId: string) {
    const result = await cancelLastPayment(
      this.prisma,
      groupId,
      studentId,
      await this.teacherId(userId),
    );
    await this.log(userId, 'payment.cancel', studentId, groupId, result.number);
    return result;
  }

  private log(
    userId: string,
    action: string,
    studentId: string,
    groupId: string,
    series: number | null,
  ) {
    return this.audit.log({
      actorId: userId,
      action,
      entity: 'Student',
      entityId: studentId,
      metadata: { groupId, series },
    });
  }

  private async teacherId(userId: string) {
    const teacher = await this.prisma.teacher.findUniqueOrThrow({
      where: { userId },
      select: { id: true },
    });
    return teacher.id;
  }
}
