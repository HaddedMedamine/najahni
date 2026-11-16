import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { CodingService } from './coding.service.js';

const ordered = [
  { id: 'l1', chapterId: 'c1' },
  { id: 'l2', chapterId: 'c1' },
];

function service(done: string[]) {
  const upsert = vi.fn().mockResolvedValue({ stars: 3, attempts: 1 });
  const prisma = {
    codeProgress: { findUnique: vi.fn().mockResolvedValue(null), upsert },
  } as unknown as PrismaService;
  const coding = new CodingService(prisma);
  Object.assign(coding, {
    studentTrack: () => Promise.resolve({ student: { id: 's1' }, track: 'BAC_INFO' }),
    levelInTrack: () =>
      Promise.resolve({
        level: { id: 'l2', kind: 'PYTHON', chapterId: 'c1', data: {} },
        ordered,
      }),
    progressByLevel: () =>
      Promise.resolve(new Map(done.map((id) => [id, { completedAt: new Date() }]))),
  });
  return { coding, upsert };
}

const attempt = { code: 'x', success: true, language: 'PYTHON' as const };

describe("enregistrer l'essai d'une mission", () => {
  it('refuse une mission encore verrouillee', async () => {
    const { coding, upsert } = service([]);
    await expect(coding.recordAttempt('u1', 'l2', attempt)).rejects.toThrow(ForbiddenException);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('enregistre une fois la mission precedente reussie', async () => {
    const { coding, upsert } = service(['l1']);
    await expect(coding.recordAttempt('u1', 'l2', attempt)).resolves.toMatchObject({ success: true });
    expect(upsert).toHaveBeenCalledOnce();
  });
});
