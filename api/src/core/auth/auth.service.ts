import { createHash, randomBytes } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Role } from '../../generated/prisma/client.js';
import { AuditService } from '../audit/audit.service.js';
import { MailService } from '../mail/mail.service.js';
import { toLocale } from '../notifications/templates.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { WhatsappService } from '../whatsapp/whatsapp.service.js';
import { hashPassword, verifyPassword } from './password.js';
import { resetHtml, resetMessage } from './reset-messages.js';

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

const newOpaqueToken = () => randomBytes(48).toString('base64url');

const publicUserSelect = {
  id: true,
  email: true,
  phone: true,
  role: true,
  firstName: true,
  lastName: true,
  locale: true,
} as const;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshTtlMs: number;
  /** Adresse du site (pour les liens envoyes) */
  private readonly appUrl: string;
  private readonly center: string;
  // Hash factice pour que la duree de reponse ne revele pas si un compte existe
  private readonly dummyHash = hashPassword(newOpaqueToken());

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
    private readonly mail: MailService,
    private readonly whatsapp: WhatsappService,
    config: ConfigService,
  ) {
    this.refreshTtlMs =
      Number(config.get('JWT_REFRESH_TTL_DAYS', 30)) * 24 * 60 * 60 * 1000;
    this.appUrl = (config.get<string>('APP_URL') ?? 'http://localhost:5173').replace(/\/$/, '');
    this.center = config.get('CENTER_NAME') ?? 'Najahni';
  }

  async login(identifier: string, password: string, meta: RequestMeta) {
    const user = await this.findByIdentifier(identifier);
    const valid = user
      ? await verifyPassword(user.passwordHash, password)
      : await verifyPassword(await this.dummyHash, password).then(() => false);

    if (!user || !valid || !user.isActive) {
      await this.audit.log({
        actorId: user?.id,
        action: 'auth.login_failed',
        entity: 'User',
        entityId: user?.id,
        metadata: { identifier },
        ip: meta.ip,
      });
      throw new UnauthorizedException('Identifiants invalides');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await this.audit.log({
      actorId: user.id,
      action: 'auth.login',
      entity: 'User',
      entityId: user.id,
      ip: meta.ip,
    });

    const tokens = await this.issueTokens(user.id, user.role, meta);
    return { ...tokens, user: await this.me(user.id) };
  }

  /** Rotation : chaque refresh token n'est utilisable qu'une fois. */
  async refresh(refreshToken: string, meta: RequestMeta) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: sha256(refreshToken) },
      include: { user: { select: { id: true, role: true, isActive: true } } },
    });
    if (!stored) throw new UnauthorizedException();

    if (stored.revokedAt) {
      // Un jeton deja utilise est rejoue : probable vol, on coupe toutes les sessions
      await this.revokeAllSessions(stored.userId);
      await this.audit.log({
        actorId: stored.userId,
        action: 'auth.refresh_token_reuse',
        entity: 'User',
        entityId: stored.userId,
        ip: meta.ip,
      });
      throw new UnauthorizedException();
    }
    if (stored.expiresAt < new Date() || !stored.user.isActive) {
      throw new UnauthorizedException();
    }

    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (count === 0) throw new UnauthorizedException();

    return this.issueTokens(stored.user.id, stored.user.role, meta);
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: sha256(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Ne revele jamais si le compte existe. */
  async forgotPassword(identifier: string, meta: RequestMeta) {
    const user = await this.findByIdentifier(identifier);
    if (!user || !user.isActive) return;

    const token = newOpaqueToken();
    const now = new Date();
    // Une seule demande valable a la fois : les anciens liens ne marchent plus
    await this.prisma.$transaction([
      this.prisma.passwordReset.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: now },
      }),
      this.prisma.passwordReset.create({
        data: {
          userId: user.id,
          tokenHash: sha256(token),
          expiresAt: new Date(now.getTime() + PASSWORD_RESET_TTL_MS),
        },
      }),
    ]);

    const channel = await this.sendResetLink(user, token);
    await this.audit.log({
      actorId: user.id,
      action: 'auth.password_reset_requested',
      entity: 'User',
      entityId: user.id,
      metadata: { channel },
      ip: meta.ip,
    });
  }

  /** Email si possible, sinon WhatsApp (comptes avec telephone seulement). */
  private async sendResetLink(
    user: { id: string; email: string | null; phone: string | null; firstName: string; locale: string },
    token: string,
  ) {
    const link = `${this.appUrl}/reset-password?token=${token}`;
    const vars = { firstName: user.firstName, link, minutes: PASSWORD_RESET_TTL_MS / 60_000, center: this.center };
    const locale = toLocale(user.locale);
    const message = resetMessage(locale, vars);

    if (user.email && this.mail.isConfigured) {
      try {
        await this.mail.send(user.email, message.subject, message.text, resetHtml(locale, vars));
        return 'email';
      } catch (e) {
        this.logger.error(`Email de reinitialisation : ${(e as Error).message}`);
      }
    }
    if (user.phone && this.whatsapp.isConnected) {
      try {
        await this.whatsapp.sendText(user.phone, message.text);
        // Historique WhatsApp de l'admin, sans le lien (secret)
        await this.prisma.notification.create({
          data: {
            channel: 'WHATSAPP',
            type: 'password_reset',
            status: 'SENT',
            content: message.text.replace(link, '••••••'),
            phone: user.phone,
            recipient: user.firstName,
            userId: user.id,
            sentAt: new Date(),
            attempts: 1,
          },
        });
        return 'whatsapp';
      } catch (e) {
        this.logger.error(`WhatsApp de reinitialisation : ${(e as Error).message}`);
      }
    }
    // Ni email ni WhatsApp disponibles (developpement) : lien dans les logs du serveur
    this.logger.warn(`Lien de reinitialisation pour ${user.id} (non envoye) : ${link}`);
    return 'none';
  }

  async resetPassword(token: string, password: string, meta: RequestMeta) {
    const reset = await this.prisma.passwordReset.findUnique({
      where: { tokenHash: sha256(token) },
    });
    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
      throw new BadRequestException('Lien invalide ou expire');
    }

    const passwordHash = await hashPassword(password);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: reset.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    await this.audit.log({
      actorId: reset.userId,
      action: 'auth.password_reset',
      entity: 'User',
      entityId: reset.userId,
      ip: meta.ip,
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    meta: RequestMeta,
  ) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    if (!(await verifyPassword(user.passwordHash, currentPassword))) {
      throw new BadRequestException('Mot de passe actuel incorrect');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(newPassword) },
    });
    await this.revokeAllSessions(userId);
    await this.audit.log({
      actorId: userId,
      action: 'auth.password_changed',
      entity: 'User',
      entityId: userId,
      ip: meta.ip,
    });
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...publicUserSelect,
        student: { select: { id: true } },
        parent: { select: { id: true } },
        teacher: { select: { id: true } },
      },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  private findByIdentifier(identifier: string) {
    const value = identifier.trim();
    return this.prisma.user.findFirst({
      where: { OR: [{ email: value.toLowerCase() }, { phone: value }] },
    });
  }

  private async issueTokens(userId: string, role: Role, meta: RequestMeta) {
    const accessToken = await this.jwt.signAsync({ sub: userId, role });
    const refreshToken = newOpaqueToken();
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: sha256(refreshToken),
        expiresAt: new Date(Date.now() + this.refreshTtlMs),
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    });
    return { accessToken, refreshToken };
  }

  private revokeAllSessions(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
