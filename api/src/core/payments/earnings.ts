import type { Prisma } from '../../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';

// Gains = argent encaisse (paiements en especes recus), groupes par mois
// selon la date du paiement, a l'heure de Tunis.

const TIME_ZONE = 'Africa/Tunis';
const DAY = 24 * 60 * 60 * 1000;
/** Nombre de mois affiches dans l'historique (mois choisi inclus). */
const HISTORY_MONTHS = 12;

const monthParts = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
});

/** "2026-10" : mois de la date a Tunis. */
export function monthKey(date: Date) {
  const parts = monthParts.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get('year')}-${get('month')}`;
}

/** Decale un mois "AAAA-MM" de `delta` mois. */
function shiftMonth(key: string, delta: number) {
  const [year, month] = key.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

const monthStartUtc = (key: string) => {
  const [year, month] = key.split('-').map(Number);
  return Date.UTC(year, month - 1, 1);
};

const money = (value: Prisma.Decimal) =>
  Math.round(Number(value.toString()) * 1000) / 1000;

const round3 = (n: number) => Math.round(n * 1000) / 1000;

const personName = { select: { firstName: true, lastName: true } } as const;

interface Bucket<T> {
  key: string;
  info: T;
  total: number;
  count: number;
}

function addTo<T>(map: Map<string, Bucket<T>>, key: string, info: T, amount: number) {
  const bucket = map.get(key) ?? { key, info, total: 0, count: 0 };
  bucket.total += amount;
  bucket.count += 1;
  map.set(key, bucket);
}

/**
 * Argent encaisse pendant un mois (par defaut le mois en cours) :
 * total, detail par groupe / enseignant, liste des paiements,
 * et les 12 derniers mois pour comparer.
 */
export async function monthlyEarnings(
  prisma: PrismaService,
  options: { month?: string; teacherId?: string },
) {
  const month = options.month ?? monthKey(new Date());
  const months = Array.from({ length: HISTORY_MONTHS }, (_, i) =>
    shiftMonth(month, i - HISTORY_MONTHS + 1),
  );

  // Marge d'un jour de chaque cote pour le fuseau, puis tri exact par monthKey
  const payments = await prisma.payment.findMany({
    where: {
      paidAt: {
        gte: new Date(monthStartUtc(months[0]) - DAY),
        lt: new Date(monthStartUtc(shiftMonth(month, 1)) + DAY),
      },
      installment: { group: { teacherId: options.teacherId } },
    },
    select: {
      id: true,
      amount: true,
      paidAt: true,
      receiptNumber: true,
      receivedBy: personName,
      installment: {
        select: {
          number: true,
          student: { select: { id: true, user: personName } },
          group: {
            select: {
              id: true,
              name: true,
              subject: true,
              teacher: { select: { id: true, user: personName } },
            },
          },
        },
      },
    },
    orderBy: { paidAt: 'desc' },
  });

  const perMonth = new Map(months.map((m) => [m, { total: 0, count: 0 }]));
  const byGroup = new Map<string, Bucket<(typeof payments)[number]['installment']['group']>>();
  const byTeacher = new Map<string, Bucket<(typeof payments)[number]['installment']['group']['teacher']>>();
  const list: {
    id: string;
    amount: number;
    paidAt: Date;
    receiptNumber: number;
    receivedBy: { firstName: string; lastName: string } | null;
    series: number;
    student: (typeof payments)[number]['installment']['student'];
    group: { id: string; name: string; subject: string };
  }[] = [];

  for (const p of payments) {
    const key = monthKey(p.paidAt);
    const bucket = perMonth.get(key);
    if (!bucket) continue;
    const amount = money(p.amount);
    bucket.total += amount;
    bucket.count += 1;
    if (key !== month) continue;

    const { group, student, number } = p.installment;
    addTo(byGroup, group.id, group, amount);
    addTo(byTeacher, group.teacher.id, group.teacher, amount);
    list.push({
      id: p.id,
      amount,
      paidAt: p.paidAt,
      receiptNumber: p.receiptNumber,
      receivedBy: p.receivedBy,
      series: number,
      student,
      group: { id: group.id, name: group.name, subject: group.subject },
    });
  }

  const current = perMonth.get(month)!;
  const previous = perMonth.get(months[HISTORY_MONTHS - 2]);
  const sorted = <T>(map: Map<string, Bucket<T>>) =>
    [...map.values()].sort((a, b) => b.total - a.total);

  return {
    month,
    total: round3(current.total),
    count: current.count,
    previousTotal: round3(previous?.total ?? 0),
    months: months.map((m) => ({
      month: m,
      total: round3(perMonth.get(m)!.total),
      count: perMonth.get(m)!.count,
    })),
    byGroup: sorted(byGroup).map(({ info, total, count }) => {
      const { teacher, ...group } = info;
      return { group, teacher, total: round3(total), count };
    }),
    byTeacher: sorted(byTeacher).map(({ info, total, count }) => ({
      teacher: info,
      total: round3(total),
      count,
    })),
    payments: list,
  };
}
