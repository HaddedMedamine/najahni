import { Injectable } from '@nestjs/common';
import { AuditService } from '../../core/audit/audit.service.js';
import { hashPassword } from '../../core/auth/password.js';
import { generateTemporaryPassword } from '../../core/common/accounts.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';

/** Actions de l'admin valables pour tout type de compte. */
@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Genere un mot de passe temporaire et deconnecte toutes les sessions. */
  async resetPassword(userId: string, actorId: string) {
    const temporaryPassword = generateTemporaryPassword();
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: await hashPassword(temporaryPassword) },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    await this.audit.log({
      actorId,
      action: 'account.reset_password',
      entity: 'User',
      entityId: userId,
    });
    return { temporaryPassword };
  }
}
