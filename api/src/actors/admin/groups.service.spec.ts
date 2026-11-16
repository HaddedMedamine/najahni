import { describe, expect, it, vi } from 'vitest';
import type { AuditService } from '../../core/audit/audit.service.js';
import type { PrismaService } from '../../core/prisma/prisma.service.js';
import { GroupsService } from './groups.service.js';

function setup(monthlySessions: number, sessions: number, installments: number) {
  const prisma = {
    group: {
      findUniqueOrThrow: vi
        .fn()
        .mockResolvedValue({ monthlySessions, _count: { sessions, installments } }),
      update: vi.fn(),
    },
  };
  const service = new GroupsService(
    prisma as unknown as PrismaService,
    { log: vi.fn() } as unknown as AuditService,
  );
  return { prisma, service };
}

describe('seances par serie', () => {
  it("se changent tant que le groupe n'a pas commence", async () => {
    const { prisma, service } = setup(4, 0, 0);
    await service.update('g1', { monthlySessions: 6 }, 'admin');
    expect(prisma.group.update).toHaveBeenCalledOnce();
  });

  it.each([
    [1, 0],
    [0, 1],
  ])('sont bloquees apres %i seance(s) et %i paiement(s)', async (sessions, installments) => {
    const { prisma, service } = setup(4, sessions, installments);
    await expect(service.update('g1', { monthlySessions: 2 }, 'admin')).rejects.toMatchObject({
      response: { errors: { monthlySessions: expect.any(String) } },
    });
    expect(prisma.group.update).not.toHaveBeenCalled();
  });

  it('ne bloquent pas un enregistrement avec la meme valeur', async () => {
    const { prisma, service } = setup(4, 3, 2);
    await service.update('g1', { monthlySessions: 4 }, 'admin');
    expect(prisma.group.update).toHaveBeenCalledOnce();
  });
});
