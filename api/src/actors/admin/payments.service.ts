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

/** Paiements de tous les groupes (l'admin peut aussi corriger). */
@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  overview(teacherId?: string) {
    return paymentsOverview(this.prisma, teacherId);
  }

  /** Argent encaisse par le centre pendant un mois (filtrable par enseignant). */
  earnings(month?: string, teacherId?: string) {
    return monthlyEarnings(this.prisma, { month, teacherId });
  }

  group(groupId: string) {
    return groupPayments(this.prisma, groupId);
  }

  async markPaid(
    groupId: string,
    studentId: string,
    series: number,
    actorId: string,
  ) {
    const result = await markSeriesPaid(
      this.prisma,
      groupId,
      studentId,
      series,
      actorId,
    );
    if (result.changed) {
      await this.audit.log({
        actorId,
        action: 'payment.mark_paid',
        entity: 'Student',
        entityId: studentId,
        metadata: { groupId, series: result.number },
      });
    }
    return result;
  }

  async cancel(groupId: string, studentId: string, actorId: string) {
    const result = await cancelLastPayment(this.prisma, groupId, studentId);
    await this.audit.log({
      actorId,
      action: 'payment.cancel',
      entity: 'Student',
      entityId: studentId,
      metadata: { groupId, series: result.number },
    });
    return result;
  }
}
