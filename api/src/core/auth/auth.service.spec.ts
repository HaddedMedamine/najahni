import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuditService } from '../audit/audit.service.js';
import type { MailService } from '../mail/mail.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { WhatsappService } from '../whatsapp/whatsapp.service.js';
import { AuthService } from './auth.service.js';

const user = { id: 'u1', role: 'PARENT', isActive: true };
const account = { ...user, email: null, phone: '21695123456', firstName: 'Sami', locale: 'fr' };

function setup() {
  const prisma = {
    refreshToken: {
      findUnique: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      create: vi.fn(),
    },
    user: { findFirst: vi.fn().mockResolvedValue(account) },
    passwordReset: {
      findFirst: vi.fn().mockResolvedValue(null),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    notification: { create: vi.fn() },
    $transaction: vi.fn().mockResolvedValue([]),
  };
  const whatsapp = { isConnected: true, sendText: vi.fn().mockResolvedValue(undefined) };
  const audit = { log: vi.fn() };
  const service = new AuthService(
    prisma as unknown as PrismaService,
    { signAsync: vi.fn().mockResolvedValue('access') } as unknown as JwtService,
    audit as unknown as AuditService,
    { isConfigured: false } as unknown as MailService,
    whatsapp as unknown as WhatsappService,
    { get: (_key: string, fallback?: unknown) => fallback } as unknown as ConfigService,
  );
  return { prisma, whatsapp, audit, service };
}

const stored = (revokedAgoMs: number | null) => ({
  id: 't1',
  userId: user.id,
  user,
  expiresAt: new Date(Date.now() + 60_000),
  revokedAt: revokedAgoMs === null ? null : new Date(Date.now() - revokedAgoMs),
});

describe('refresh token', () => {
  let t: ReturnType<typeof setup>;
  beforeEach(() => {
    t = setup();
  });

  it('donne de nouveaux jetons et retire le jeton utilise', async () => {
    t.prisma.refreshToken.findUnique.mockResolvedValue(stored(null));
    await expect(t.service.refresh('jeton', {})).resolves.toMatchObject({ accessToken: 'access' });
    expect(t.prisma.refreshToken.updateMany).toHaveBeenCalledOnce();
  });

  it('refuse un second onglet sans couper les sessions', async () => {
    t.prisma.refreshToken.findUnique.mockResolvedValue(stored(2_000));
    await expect(t.service.refresh('jeton', {})).rejects.toThrow(UnauthorizedException);
    expect(t.prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    expect(t.audit.log).not.toHaveBeenCalled();
  });

  it('coupe toutes les sessions pour un jeton ancien rejoue', async () => {
    t.prisma.refreshToken.findUnique.mockResolvedValue(stored(60_000));
    await expect(t.service.refresh('jeton', {})).rejects.toThrow(UnauthorizedException);
    expect(t.prisma.refreshToken.updateMany).toHaveBeenCalledOnce();
    expect(t.audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'auth.refresh_token_reuse' }),
    );
  });
});

describe('mot de passe oublie', () => {
  it('envoie un seul message pendant le delai', async () => {
    const t = setup();
    await t.service.forgotPassword('21695123456', {});
    expect(t.whatsapp.sendText).toHaveBeenCalledOnce();

    t.prisma.passwordReset.findFirst.mockResolvedValue({ id: 'r1' });
    await t.service.forgotPassword('21695123456', {});
    expect(t.whatsapp.sendText).toHaveBeenCalledOnce();
  });

  it("n'envoie rien pour un compte inconnu", async () => {
    const t = setup();
    t.prisma.user.findFirst.mockResolvedValue(null);
    await t.service.forgotPassword('00000000', {});
    expect(t.whatsapp.sendText).not.toHaveBeenCalled();
  });

  it("n'attend pas l'envoi et garde les erreurs dans le serveur", async () => {
    const t = setup();
    t.prisma.user.findFirst.mockRejectedValue(new Error('base coupee'));
    expect(t.service.requestPasswordReset('21695123456', {})).toBeUndefined();
    await new Promise((done) => setImmediate(done));
  });
});
