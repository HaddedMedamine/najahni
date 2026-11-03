import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import type { Prisma } from '../../generated/prisma/client.js';
import { groupPayments } from '../payments/payments.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  normalizePhone,
  WhatsappRecipientError,
  WhatsappService,
} from '../whatsapp/whatsapp.service.js';
import {
  absenceMessage,
  type Locale,
  paymentParentMessage,
  paymentStudentMessage,
  toLocale,
} from './templates.js';
import {
  isQuiet,
  nextAllowed,
  type QuietHours,
  tunisDayStart,
  tunisParts,
} from './time.js';

// Notifications WhatsApp automatiques :
// - absence : au parent, 5 min apres la fin de la seance ;
// - paiement : au parent ET a l'eleve, a 8h la veille de la seance qui terminera
//   sa serie (si elle n'est pas deja payee) ; renvoye avant chaque seance finale.
// Jamais la nuit : ce qui tombe la nuit part le matin.
// Chaque message est d'abord enregistre (file d'attente), puis envoye un par un,
// espace de quelques secondes, et re-verifie juste avant l'envoi.

const ABSENCE_DELAY_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5 * 60 * 1000;
/** Quand il n'y a rien a envoyer, on revérifie toutes les 30 secondes. */
const IDLE_POLL_MS = 30_000;

interface Recipient {
  phone: string;
  name: string | null;
  label: string;
  userId: string | null;
  locale: Locale;
}

const personName = { select: { firstName: true, lastName: true } } as const;
const fullName = (u: { firstName: string; lastName: string }) => `${u.firstName} ${u.lastName}`;

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  readonly quiet: QuietHours;
  readonly dailyLimit: number;
  private readonly center: string;
  private readonly minDelayMs: number;
  private readonly maxDelayMs: number;
  private timer: NodeJS.Timeout | null = null;
  private stopped = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappService,
    config: ConfigService,
  ) {
    const num = (key: string, fallback: number) => Number(config.get(key) ?? fallback);
    this.quiet = { nightStart: num('NOTIFY_NIGHT_START', 21), morning: num('NOTIFY_MORNING_HOUR', 8) };
    this.dailyLimit = num('WHATSAPP_DAILY_LIMIT', 150);
    this.minDelayMs = num('WHATSAPP_MIN_DELAY_SECONDS', 15) * 1000;
    this.maxDelayMs = num('WHATSAPP_MAX_DELAY_SECONDS', 30) * 1000;
    this.center = config.get('CENTER_NAME') ?? 'Najahni';
  }

  onModuleInit() {
    this.loop(5_000);
    this.planPaymentReminders().catch((e) =>
      this.logger.error(`Rappels de paiement : ${(e as Error).message}`),
    );
  }

  onModuleDestroy() {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
  }

  // ------------------------------------------------------------------
  // Absences
  // ------------------------------------------------------------------

  /** Seance terminee (ou appel corrige) : un message par parent de chaque absent. */
  async queueAbsences(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        startsAt: true,
        status: true,
        group: { select: { subject: true } },
        attendances: {
          where: { status: 'ABSENT' },
          select: { studentId: true },
        },
      },
    });
    if (!session || session.status !== 'DONE') return 0;

    const scheduledAt = nextAllowed(new Date(Date.now() + ABSENCE_DELAY_MS), this.quiet);
    let queued = 0;
    for (const { studentId } of session.attendances) {
      const student = await this.studentInfo(studentId);
      if (!student) continue;
      for (const r of await this.parentRecipients(studentId)) {
        queued += await this.enqueue({
          type: 'absence',
          dedupeKey: `absence:${session.id}:${studentId}:${r.phone}`,
          recipient: r,
          studentId,
          sessionId: session.id,
          scheduledAt,
          content: absenceMessage(r.locale, {
            recipientName: r.name,
            studentName: student.name,
            subject: session.group.subject,
            startsAt: session.startsAt,
            center: this.center,
          }),
        });
      }
    }
    return queued;
  }

  // ------------------------------------------------------------------
  // Rappels de paiement
  // ------------------------------------------------------------------

  /**
   * Cherche les eleves dont la seance de DEMAIN terminera la serie non payee.
   * Lance toutes les 10 minutes : les doublons sont evites par dedupeKey.
   */
  @Interval(10 * 60 * 1000)
  async planPaymentReminders(now = new Date()) {
    // Le soir (apres 21h) on ne planifie plus : le message partirait le jour meme de la seance
    if (tunisParts(now).hour >= this.quiet.nightStart) return 0;

    const tomorrow = { gte: tunisDayStart(now, 1), lt: tunisDayStart(now, 2) };
    const groups = await this.prisma.session.findMany({
      where: { status: 'PLANNED', startsAt: tomorrow, group: { archivedAt: null } },
      select: { groupId: true },
      distinct: ['groupId'],
    });

    let queued = 0;
    for (const { groupId } of groups) {
      try {
        queued += await this.planGroup(groupId, now, tomorrow);
      } catch (e) {
        this.logger.error(`Rappels du groupe ${groupId} : ${(e as Error).message}`);
      }
    }
    return queued;
  }

  private async planGroup(groupId: string, now: Date, tomorrow: { gte: Date; lt: Date }) {
    const { group, rows } = await groupPayments(this.prisma, groupId);
    const upcoming = await this.prisma.session.findMany({
      where: { groupId, status: { in: ['PLANNED', 'IN_PROGRESS'] }, startsAt: { gte: now } },
      orderBy: { startsAt: 'asc' },
      take: Math.max(1, group.monthlySessions),
      select: { id: true, startsAt: true },
    });
    const scheduledAt = nextAllowed(now, this.quiet);

    let queued = 0;
    for (const row of rows) {
      if (row.currentPaid) continue;
      // Si l'eleve est present a toutes les prochaines seances, laquelle termine sa serie ?
      const final = upcoming[row.size - row.progress - 1];
      if (!final || final.startsAt < tomorrow.gte || final.startsAt >= tomorrow.lt) continue;

      const studentName = fullName(row.student.user);
      const vars = {
        studentName,
        subject: group.subject,
        startsAt: final.startsAt,
        series: row.series,
        amount: row.fee,
        center: this.center,
      };
      const data = { series: row.series, groupId };
      const recipients: [Recipient, (l: Locale) => string][] = (
        await this.parentRecipients(row.student.id)
      ).map((r) => [r, (l) => paymentParentMessage(l, { ...vars, recipientName: r.name })]);
      const self = await this.studentRecipient(row.student.id);
      if (self) {
        recipients.push([self, (l) => paymentStudentMessage(l, { ...vars, recipientName: self.name })]);
      }

      for (const [r, text] of recipients) {
        queued += await this.enqueue({
          type: 'payment_reminder',
          dedupeKey: `payment:${final.id}:${row.student.id}:${r.phone}`,
          recipient: r,
          studentId: row.student.id,
          sessionId: final.id,
          scheduledAt,
          content: text(r.locale),
          data,
        });
      }
    }
    return queued;
  }

  // ------------------------------------------------------------------
  // File d'attente et envoi
  // ------------------------------------------------------------------

  private async enqueue(n: {
    type: string;
    dedupeKey: string;
    recipient: Recipient;
    studentId: string;
    sessionId: string;
    scheduledAt: Date;
    content: string;
    data?: Prisma.InputJsonValue;
  }) {
    const existing = await this.prisma.notification.findUnique({
      where: { dedupeKey: n.dedupeKey },
      select: { id: true, status: true },
    });
    if (existing) {
      // Annule auparavant (ex. eleve remis present puis de nouveau absent) : on le relance
      if (existing.status !== 'CANCELLED') return 0;
      await this.prisma.notification.update({
        where: { id: existing.id },
        data: { status: 'PENDING', scheduledAt: n.scheduledAt, content: n.content, attempts: 0, error: null },
      });
      return 1;
    }
    await this.prisma.notification.create({
      data: {
        channel: 'WHATSAPP',
        type: n.type,
        content: n.content,
        data: n.data,
        phone: n.recipient.phone,
        recipient: n.recipient.label,
        userId: n.recipient.userId,
        studentId: n.studentId,
        sessionId: n.sessionId,
        dedupeKey: n.dedupeKey,
        scheduledAt: n.scheduledAt,
      },
    });
    return 1;
  }

  /** Boucle d'envoi : un message a la fois, puis une pause aleatoire. */
  private loop(delayMs: number) {
    if (this.stopped) return;
    this.timer = setTimeout(async () => {
      let sent = false;
      try {
        sent = await this.sendNext();
      } catch (e) {
        this.logger.error(`Envoi WhatsApp : ${(e as Error).message}`);
      }
      const pause = sent
        ? this.minDelayMs + Math.random() * (this.maxDelayMs - this.minDelayMs)
        : IDLE_POLL_MS;
      this.loop(pause);
    }, delayMs);
  }

  /** Envoie le prochain message du. Renvoie true si un envoi a ete tente. */
  async sendNext(now = new Date()) {
    if (!this.whatsapp.isConnected || isQuiet(now, this.quiet)) return false;
    if ((await this.sentToday()) >= this.dailyLimit) return false;

    const next = await this.prisma.notification.findFirst({
      where: { channel: 'WHATSAPP', status: 'PENDING', scheduledAt: { lte: now } },
      orderBy: { scheduledAt: 'asc' },
    });
    if (!next) return false;

    const reason = await this.obsolete(next);
    if (reason) {
      await this.prisma.notification.update({
        where: { id: next.id },
        data: { status: 'CANCELLED', error: reason },
      });
      return false;
    }

    try {
      await this.whatsapp.sendText(next.phone ?? '', next.content);
      await this.prisma.notification.update({
        where: { id: next.id },
        data: { status: 'SENT', sentAt: new Date(), attempts: { increment: 1 }, error: null },
      });
    } catch (e) {
      const attempts = next.attempts + 1;
      const final = e instanceof WhatsappRecipientError || attempts >= MAX_ATTEMPTS;
      await this.prisma.notification.update({
        where: { id: next.id },
        data: {
          attempts,
          error: (e as Error).message,
          status: final ? 'FAILED' : 'PENDING',
          scheduledAt: final ? undefined : nextAllowed(new Date(Date.now() + RETRY_DELAY_MS), this.quiet),
        },
      });
    }
    return true;
  }

  /** Juste avant l'envoi : le message est-il toujours utile ? (sinon : raison) */
  private async obsolete(n: { type: string; sessionId: string | null; studentId: string | null; data: Prisma.JsonValue }) {
    if (!n.sessionId || !n.studentId) return null;
    if (n.type === 'absence') {
      const a = await this.prisma.attendance.findUnique({
        where: { sessionId_studentId: { sessionId: n.sessionId, studentId: n.studentId } },
        select: { status: true },
      });
      return a?.status === 'ABSENT' ? null : "L'eleve a finalement ete marque present";
    }
    if (n.type === 'payment_reminder') {
      const session = await this.prisma.session.findUnique({
        where: { id: n.sessionId },
        select: { status: true, startsAt: true, groupId: true },
      });
      if (!session || session.status !== 'PLANNED' || session.startsAt < new Date()) {
        return "La seance n'est plus prevue";
      }
      const { rows } = await groupPayments(this.prisma, session.groupId);
      const row = rows.find((r) => r.student.id === n.studentId);
      const series = (n.data as { series?: number } | null)?.series;
      if (!row) return "L'eleve n'est plus dans le groupe";
      if (row.currentPaid || row.series !== series) return 'La serie a deja ete payee';
    }
    return null;
  }

  async sentToday() {
    return this.prisma.notification.count({
      where: { channel: 'WHATSAPP', status: 'SENT', sentAt: { gte: tunisDayStart(new Date()) } },
    });
  }

  // ------------------------------------------------------------------
  // Destinataires
  // ------------------------------------------------------------------

  private async studentInfo(studentId: string) {
    const s = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { user: personName },
    });
    return s ? { name: fullName(s.user) } : null;
  }

  /** Parents avec un compte ; sinon le "telephone du parent" de la fiche eleve. */
  private async parentRecipients(studentId: string): Promise<Recipient[]> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: {
        parentPhone: true,
        user: { select: { locale: true } },
        parents: {
          select: {
            parent: {
              select: {
                user: { select: { id: true, phone: true, firstName: true, lastName: true, locale: true, isActive: true } },
              },
            },
          },
        },
      },
    });
    if (!student) return [];

    const list: Recipient[] = student.parents
      .map((p) => p.parent.user)
      .filter((u) => u.isActive && u.phone)
      .map((u) => ({
        phone: u.phone!,
        name: u.firstName,
        label: `${fullName(u)} (parent)`,
        userId: u.id,
        locale: toLocale(u.locale),
      }));
    if (list.length === 0 && student.parentPhone) {
      list.push({
        phone: student.parentPhone,
        name: null,
        label: `${student.parentPhone} (parent)`,
        userId: null,
        locale: toLocale(student.user.locale),
      });
    }
    // Un seul message par numero
    const seen = new Set<string>();
    return list.filter((r) => {
      const key = normalizePhone(r.phone);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private async studentRecipient(studentId: string): Promise<Recipient | null> {
    const s = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { user: { select: { id: true, phone: true, firstName: true, lastName: true, locale: true, isActive: true } } },
    });
    if (!s?.user.phone || !s.user.isActive) return null;
    return {
      phone: s.user.phone,
      name: s.user.firstName,
      label: `${fullName(s.user)} (élève)`,
      userId: s.user.id,
      locale: toLocale(s.user.locale),
    };
  }
}
