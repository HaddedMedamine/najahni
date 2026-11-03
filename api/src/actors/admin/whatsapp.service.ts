import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../core/audit/audit.service.js';
import { skipTake, toPage } from '../../core/common/pagination.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { NotificationsService } from '../../core/notifications/notifications.service.js';
import { testMessage } from '../../core/notifications/templates.js';
import { nextAllowed } from '../../core/notifications/time.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { WhatsappService } from '../../core/whatsapp/whatsapp.service.js';
import type { NotificationsQuery } from './dto/whatsapp.dto.js';

/** Connexion WhatsApp du centre + suivi des messages envoyes. */
@Injectable()
export class AdminWhatsappService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly whatsapp: WhatsappService,
    private readonly notifications: NotificationsService,
  ) {}

  async status() {
    const [whatsapp, pending, failed, sentToday] = await Promise.all([
      this.whatsapp.status(),
      this.prisma.notification.count({ where: { channel: 'WHATSAPP', status: 'PENDING' } }),
      this.prisma.notification.count({ where: { channel: 'WHATSAPP', status: 'FAILED' } }),
      this.notifications.sentToday(),
    ]);
    return {
      ...whatsapp,
      stats: { pending, failed, sentToday, dailyLimit: this.notifications.dailyLimit },
      quietHours: this.notifications.quiet,
    };
  }

  async connect(actorId: string) {
    await this.whatsapp.connect();
    await this.audit.log({ actorId, action: 'whatsapp.connect', entity: 'Whatsapp' });
    return this.status();
  }

  async logout(actorId: string) {
    await this.whatsapp.logout();
    await this.audit.log({ actorId, action: 'whatsapp.logout', entity: 'Whatsapp' });
    return this.status();
  }

  /** Envoie tout de suite un message de test (hors file d'attente). */
  async sendTest(phone: string, actorId: string) {
    const content = testMessage(process.env.CENTER_NAME ?? 'Najahni');
    const base = { channel: 'WHATSAPP' as const, type: 'test', content, phone, recipient: phone, attempts: 1 };
    try {
      await this.whatsapp.sendText(phone, content);
    } catch (e) {
      await this.prisma.notification.create({
        data: { ...base, status: 'FAILED', error: (e as Error).message },
      });
      throw new BadRequestException((e as Error).message);
    }
    await this.prisma.notification.create({ data: { ...base, status: 'SENT', sentAt: new Date() } });
    await this.audit.log({ actorId, action: 'whatsapp.test', entity: 'Whatsapp', metadata: { phone } });
    return { sent: true };
  }

  async list(q: NotificationsQuery) {
    const where: Prisma.NotificationWhereInput = {
      channel: 'WHATSAPP',
      status: q.status,
      type: q.type,
    };
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        select: {
          id: true,
          type: true,
          status: true,
          content: true,
          phone: true,
          recipient: true,
          scheduledAt: true,
          sentAt: true,
          attempts: true,
          error: true,
          createdAt: true,
          student: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        },
        // Les prochains envois d'abord, puis les plus recents
        orderBy: [{ status: 'asc' }, { scheduledAt: 'desc' }],
        ...skipTake(q),
      }),
      this.prisma.notification.count({ where }),
    ]);
    return toPage(items, total, q);
  }

  /** Remet un message echoue ou annule dans la file (respecte les heures de nuit). */
  async retry(id: string, actorId: string) {
    const n = await this.find(id);
    if (n.status !== 'FAILED' && n.status !== 'CANCELLED') {
      throw new BadRequestException('Seuls les messages echoues ou annules peuvent etre renvoyes');
    }
    await this.prisma.notification.update({
      where: { id },
      data: {
        status: 'PENDING',
        attempts: 0,
        error: null,
        scheduledAt: nextAllowed(new Date(), this.notifications.quiet),
      },
    });
    await this.audit.log({ actorId, action: 'notification.retry', entity: 'Notification', entityId: id });
    return { changed: true };
  }

  async cancel(id: string, actorId: string) {
    const n = await this.find(id);
    if (n.status !== 'PENDING') {
      throw new BadRequestException('Seuls les messages en attente peuvent etre annules');
    }
    await this.prisma.notification.update({
      where: { id },
      data: { status: 'CANCELLED', error: "Annule par l'administrateur" },
    });
    await this.audit.log({ actorId, action: 'notification.cancel', entity: 'Notification', entityId: id });
    return { changed: true };
  }

  private async find(id: string) {
    const n = await this.prisma.notification.findFirst({
      where: { id, channel: 'WHATSAPP' },
      select: { status: true },
    });
    if (!n) throw new NotFoundException('Message introuvable');
    return n;
  }
}
