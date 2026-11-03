import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';

// Paiements du centre (especes uniquement).
// Chaque eleve a SA serie de N presences dans un groupe (N = group.monthlySessions) :
// - seules les presences (seances terminees) font avancer son compteur, pas les absences ;
// - serie terminee et non payee = "a payer" ; la serie suivante commence aussitot ;
// - il peut payer avant (pendant la serie) ou apres : l'enseignant marque "paye".
// Une ligne Installment n'existe que pour une serie payee.

/** Statuts comptes comme presence (LATE = ancien statut, garde pour l'historique). */
const COUNTED: ('PRESENT' | 'LATE')[] = ['PRESENT', 'LATE'];

export type SeriesState = 'PAID' | 'DUE' | 'PENDING';

const money = (value: Prisma.Decimal | null | undefined) =>
  value ? Math.round(Number(value.toString()) * 1000) / 1000 : 0;

const round3 = (n: number) => Math.round(n * 1000) / 1000;

const personName = { select: { firstName: true, lastName: true } } as const;

const startOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

/** Ou en est l'eleve : serie en cours, progression, series terminees non payees. */
export function seriesStatus(
  presences: number,
  size: number,
  paidNumbers: number[],
) {
  const n = Math.max(1, size);
  const completed = Math.floor(presences / n);
  const current = completed + 1;
  const paid = new Set(paidNumbers);
  const dueSeries = Array.from({ length: completed }, (_, i) => i + 1).filter(
    (s) => !paid.has(s),
  );
  const currentPaid = paid.has(current);
  const state: SeriesState = dueSeries.length
    ? 'DUE'
    : currentPaid
      ? 'PAID'
      : 'PENDING';
  return {
    series: current,
    progress: presences % n,
    size: n,
    presences,
    dueSeries,
    state,
    /** La serie en cours est deja payee (paiement a l'avance). */
    currentPaid,
    /** Serie que le prochain paiement reglera (la plus ancienne non payee). */
    nextToPay: dueSeries[0] ?? (currentPaid ? null : current),
  };
}

/** Nombre de presences par eleve dans un groupe (seances terminees uniquement). */
async function presenceCounts(
  prisma: PrismaService,
  groupId: string,
  studentIds: string[],
) {
  if (studentIds.length === 0) return new Map<string, number>();
  const rows = await prisma.attendance.groupBy({
    by: ['studentId'],
    where: {
      studentId: { in: studentIds },
      status: { in: COUNTED },
      session: { groupId, status: 'DONE' },
    },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.studentId, r._count._all]));
}

/** Calcule l'etat des paiements de tous les eleves (actifs) d'un groupe. */
async function computeGroup(
  prisma: PrismaService,
  groupId: string,
  teacherId?: string,
) {
  const group = await prisma.group.findFirst({
    where: { id: groupId, teacherId },
    select: {
      id: true,
      name: true,
      subject: true,
      level: true,
      section: true,
      monthlySessions: true,
      monthlyFee: true,
      teacher: { select: { id: true, user: personName } },
      students: {
        where: { leftAt: null },
        select: {
          student: { select: { id: true, monthlyFee: true, user: personName } },
        },
      },
    },
  });
  if (!group) throw new NotFoundException('Groupe introuvable');

  const studentIds = group.students.map((m) => m.student.id);
  const [counts, installments, monthPayments] = await Promise.all([
    presenceCounts(prisma, groupId, studentIds),
    prisma.installment.findMany({
      where: { groupId, studentId: { in: studentIds } },
      select: {
        studentId: true,
        number: true,
        payments: {
          orderBy: { paidAt: 'desc' },
          take: 1,
          select: {
            paidAt: true,
            receiptNumber: true,
            receivedBy: { select: personName.select },
          },
        },
      },
      orderBy: { number: 'desc' },
    }),
    prisma.payment.aggregate({
      where: { installment: { groupId }, paidAt: { gte: startOfMonth() } },
      _sum: { amount: true },
    }),
  ]);

  const groupFee = money(group.monthlyFee);
  const rows = group.students
    .map(({ student }) => {
      const own = installments.filter((i) => i.studentId === student.id);
      const fee = student.monthlyFee ? money(student.monthlyFee) : groupFee;
      const status = seriesStatus(
        counts.get(student.id) ?? 0,
        group.monthlySessions,
        own.map((i) => i.number),
      );
      const last = own[0];
      return {
        student: { id: student.id, user: student.user },
        fee,
        ...status,
        dueAmount: round3(status.dueSeries.length * fee),
        lastPayment: last?.payments[0]
          ? { number: last.number, ...last.payments[0] }
          : null,
      };
    })
    .sort((a, b) =>
      a.student.user.lastName.localeCompare(b.student.user.lastName),
    );

  const { students: _members, monthlyFee: _fee, ...groupInfo } = group;
  return {
    group: { ...groupInfo, monthlyFee: groupFee },
    summary: {
      students: rows.length,
      paid: rows.filter((r) => r.state === 'PAID').length,
      due: rows.filter((r) => r.state === 'DUE').length,
      pending: rows.filter((r) => r.state === 'PENDING').length,
      dueAmount: round3(rows.reduce((s, r) => s + r.dueAmount, 0)),
      collectedThisMonth: money(monthPayments._sum.amount),
    },
    rows,
  };
}

/** Detail d'un groupe : un eleve par ligne avec sa serie et son etat. */
export function groupPayments(
  prisma: PrismaService,
  groupId: string,
  teacherId?: string,
) {
  return computeGroup(prisma, groupId, teacherId);
}

/** Tableau de bord : un resume par groupe (filtre par enseignant si donne). */
export async function paymentsOverview(
  prisma: PrismaService,
  teacherId?: string,
) {
  const groups = await prisma.group.findMany({
    where: { archivedAt: null, teacherId },
    select: { id: true },
    orderBy: { name: 'asc' },
  });
  const items = await Promise.all(
    groups.map(async ({ id }) => {
      const { group, summary } = await computeGroup(prisma, id);
      return { group, ...summary };
    }),
  );
  const sum = (key: 'students' | 'paid' | 'due' | 'pending') =>
    items.reduce((s, i) => s + i[key], 0);
  return {
    totals: {
      groups: items.length,
      students: sum('students'),
      paid: sum('paid'),
      due: sum('due'),
      pending: sum('pending'),
      dueAmount: round3(items.reduce((s, i) => s + i.dueAmount, 0)),
      collectedThisMonth: round3(
        items.reduce((s, i) => s + i.collectedThisMonth, 0),
      ),
    },
    items,
  };
}

/** Espace parent : etat de l'enfant dans chacun de ses groupes + series payees. */
export async function studentPayments(
  prisma: PrismaService,
  studentId: string,
) {
  const memberships = await prisma.groupStudent.findMany({
    where: { studentId, leftAt: null },
    select: { groupId: true },
  });
  const groups = await Promise.all(
    memberships.map(async ({ groupId }) => {
      const { group, rows } = await computeGroup(prisma, groupId);
      const row = rows.find((r) => r.student.id === studentId);
      return row
        ? {
            group: { id: group.id, name: group.name, subject: group.subject },
            ...row,
          }
        : null;
    }),
  );
  const history = await prisma.installment.findMany({
    where: { studentId },
    select: {
      id: true,
      number: true,
      amountPaid: true,
      group: { select: { id: true, name: true, subject: true } },
      payments: {
        orderBy: { paidAt: 'desc' },
        take: 1,
        select: { paidAt: true, receiptNumber: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return {
    groups: groups.filter((g) => g !== null),
    history: history.map(({ payments, amountPaid, ...h }) => ({
      ...h,
      amount: money(amountPaid),
      payment: payments[0] ?? null,
    })),
  };
}

/**
 * L'eleve remet son paiement : regle la plus ancienne serie non payee
 * (serie terminee "a payer", sinon la serie en cours = paiement a l'avance).
 */
export async function markSeriesPaid(
  prisma: PrismaService,
  groupId: string,
  studentId: string,
  receivedByUserId: string,
  teacherId?: string,
) {
  const { rows } = await computeGroup(prisma, groupId, teacherId);
  const row = rows.find((r) => r.student.id === studentId);
  if (!row) throw new NotFoundException("Cet eleve n'est pas dans le groupe");
  if (row.nextToPay === null) return { changed: false, number: null };

  await prisma.installment.create({
    data: {
      studentId,
      groupId,
      number: row.nextToPay,
      amountDue: row.fee,
      amountPaid: row.fee,
      status: 'PAID',
      payments: {
        create: {
          amount: row.fee,
          method: 'CASH',
          receivedById: receivedByUserId,
        },
      },
    },
  });
  return { changed: true, number: row.nextToPay };
}

/** Annule le dernier paiement de l'eleve (erreur de saisie). */
export async function cancelLastPayment(
  prisma: PrismaService,
  groupId: string,
  studentId: string,
  teacherId?: string,
) {
  const last = await prisma.installment.findFirst({
    where: { groupId, studentId, group: { teacherId } },
    orderBy: { number: 'desc' },
    select: { id: true, number: true },
  });
  if (!last) throw new BadRequestException('Aucun paiement a annuler');
  await prisma.installment.delete({ where: { id: last.id } });
  return { changed: true, number: last.number };
}

/** Apres une seance terminee : eleves presents qui viennent de finir une serie. */
export async function seriesCompletedBySession(
  prisma: PrismaService,
  sessionId: string,
) {
  const session = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    select: {
      groupId: true,
      group: { select: { monthlySessions: true } },
      attendances: {
        where: { status: { in: COUNTED } },
        select: { student: { select: { id: true, user: personName } } },
      },
    },
  });
  const present = session.attendances.map((a) => a.student);
  const counts = await presenceCounts(
    prisma,
    session.groupId,
    present.map((s) => s.id),
  );
  const size = Math.max(1, session.group.monthlySessions);
  return present
    .filter((s) => {
      const count = counts.get(s.id) ?? 0;
      return count > 0 && count % size === 0;
    })
    .map((s) => ({ student: s, number: (counts.get(s.id) ?? 0) / size }));
}
