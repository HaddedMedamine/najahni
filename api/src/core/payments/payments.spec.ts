import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { groupSheet, markSeriesPaid, presenceSeries, seriesStatus } from './payments.js';

describe('serie de chaque presence', () => {
  const dates = ['a', 'b', 'c', 'd', 'e', 'f'];

  it('coupe les presences par series de N', () => {
    expect(presenceSeries(dates, 4, []).map((p) => p.series)).toEqual([1, 1, 1, 1, 2, 2]);
  });

  it('marque seulement les series payees', () => {
    expect(presenceSeries(dates, 4, [2]).map((p) => p.paid)).toEqual([false, false, false, false, true, true]);
  });

  it('garde le meme compte que seriesStatus', () => {
    const status = seriesStatus(dates.length, 4, [1]);
    const last = presenceSeries(dates, 4, [1]).at(-1)!;
    expect(last.series).toBe(status.series);
    expect(status.dueSeries).toEqual([]);
  });
});

const at = (day: string) => new Date(`${day}T17:00:00.000Z`);

function prisma(group: unknown) {
  const person = (id: string, lastName: string, leftAt: Date | null = null) => ({
    leftAt,
    student: { id, user: { firstName: 'X', lastName } },
  });
  const presence = (studentId: string, day: string) => ({
    studentId,
    session: { id: `${studentId}-${day}`, startsAt: at(day) },
  });
  return {
    group: {
      findFirst: vi.fn().mockResolvedValue(
        group && {
          id: 'g1',
          name: 'Groupe 1',
          subject: 'Info',
          monthlySessions: 2,
          students: [person('s2', 'Zouari'), person('s1', 'Ammar'), person('s3', 'Parti', at('2026-10-20'))],
        },
      ),
    },
    attendance: {
      findMany: vi
        .fn()
        .mockResolvedValue([
          presence('s1', '2026-09-30'),
          presence('s1', '2026-10-01'),
          presence('s3', '2026-10-02'),
          presence('s1', '2026-11-02'),
        ]),
    },
    installment: { findMany: vi.fn().mockResolvedValue([{ studentId: 's1', number: 1 }]) },
  } as unknown as PrismaService;
}

describe('feuille du groupe', () => {
  it('donne toutes les seances et les mois disponibles', async () => {
    const sheet = await groupSheet(prisma(true), 'g1', 't1');
    expect(sheet.months).toEqual(['2026-09', '2026-10', '2026-11']);
    expect(sheet.rows.map((r) => r.student.id)).toEqual(['s1', 's3', 's2']);
    expect(sheet.rows[0].presences.map((p) => p.paid)).toEqual([true, true, false]);
  });

  it('garde la serie reelle quand on filtre un mois', async () => {
    const sheet = await groupSheet(prisma(true), 'g1', 't1', '2026-11');
    expect(sheet.rows[0].presences).toMatchObject([{ series: 2, paid: false }]);
  });

  it("cache un eleve parti les mois ou il n'est pas venu", async () => {
    const october = await groupSheet(prisma(true), 'g1', 't1', '2026-10');
    const november = await groupSheet(prisma(true), 'g1', 't1', '2026-11');
    expect(october.rows.find((r) => r.student.id === 's3')?.left).toBe(true);
    expect(november.rows.some((r) => r.student.id === 's3')).toBe(false);
  });

  it("garde un eleve actif sans seance ce mois-la", async () => {
    const sheet = await groupSheet(prisma(true), 'g1', 't1', '2026-11');
    expect(sheet.rows.find((r) => r.student.id === 's2')?.presences).toEqual([]);
  });

  it('refuse le groupe d un autre enseignant', async () => {
    const db = prisma(null);
    await expect(groupSheet(db, 'g1', 't2')).rejects.toThrow(NotFoundException);
    expect(db.group.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'g1', teacherId: 't2' } }),
    );
  });
});

describe('marquer une serie payee', () => {
  function payable(installments: { studentId: string; number: number; payments: never[] }[] = []) {
    const create = vi.fn().mockResolvedValue({});
    const db = {
      group: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'g1',
          monthlySessions: 4,
          monthlyFee: { toString: () => '60' },
          students: [{ student: { id: 's1', monthlyFee: null, user: { firstName: 'X', lastName: 'Y' } } }],
        }),
      },
      attendance: { groupBy: vi.fn().mockResolvedValue([{ studentId: 's1', _count: { _all: 5 } }]) },
      installment: { findMany: vi.fn().mockResolvedValue(installments), create },
      payment: { aggregate: vi.fn().mockResolvedValue({ _sum: { amount: null } }) },
    };
    return { db: db as unknown as PrismaService, create };
  }

  it('paie la serie affichee', async () => {
    const { db, create } = payable();
    await expect(markSeriesPaid(db, 'g1', 's1', 1, 'u1')).resolves.toEqual({ changed: true, number: 1 });
    expect(create).toHaveBeenCalledOnce();
  });

  it('ne paie pas la serie suivante sur un double clic', async () => {
    const { db, create } = payable([{ studentId: 's1', number: 1, payments: [] }]);
    await expect(markSeriesPaid(db, 'g1', 's1', 1, 'u1')).resolves.toEqual({ changed: false, number: null });
    expect(create).not.toHaveBeenCalled();
  });

  it('garde un seul paiement quand deux requetes arrivent ensemble', async () => {
    const { db, create } = payable();
    create.mockRejectedValue(Object.assign(new Error('unique'), { code: 'P2002' }));
    await expect(markSeriesPaid(db, 'g1', 's1', 1, 'u1')).resolves.toEqual({ changed: false, number: null });
  });

  it('laisse passer les autres erreurs de la base', async () => {
    const { db, create } = payable();
    create.mockRejectedValue(new Error('base coupee'));
    await expect(markSeriesPaid(db, 'g1', 's1', 1, 'u1')).rejects.toThrow('base coupee');
  });
});
