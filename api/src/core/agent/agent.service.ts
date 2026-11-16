import { createHash, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '../../generated/prisma/client.js';
import { AuditService } from '../audit/audit.service.js';
import { skipTake, toPage } from '../common/pagination.js';
import { normalizePhone, WhatsappService } from '../whatsapp/whatsapp.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AgentLeadDto, AgentLeadsQuery, AgentOrderDto, AgentOrdersQuery } from './agent.dto.js';

/** Un meme contact relance dans ce delai met a jour sa fiche au lieu d'en creer une. */
const REPEAT_WINDOW_MS = 24 * 60 * 60 * 1000;

const digest = (value: string) => createHash('sha256').update(value).digest();

/**
 * Acces de n8n : la cle AGENT_API_KEY dans l'en-tete x-agent-key.
 * Sans cle configuree, tout est refuse.
 */
@Injectable()
export class AgentKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const expected = this.config.get<string>('AGENT_API_KEY');
    const given = context.switchToHttp().getRequest<{ headers: Record<string, unknown> }>().headers['x-agent-key'];
    if (!expected || typeof given !== 'string' || !timingSafeEqual(digest(given), digest(expected))) {
      throw new UnauthorizedException('Cle agent invalide');
    }
    return true;
  }
}

const search = (q: { search?: string }) =>
  q.search
    ? [
        { name: { contains: q.search, mode: 'insensitive' as const } },
        { phone: { contains: q.search } },
      ]
    : undefined;

/** Ce que l'agent telephonique / WhatsApp laisse a l'equipe : rappels et commandes de livres. */
@Injectable()
export class AgentService {
  private readonly fichePath: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly whatsapp: WhatsappService,
    config: ConfigService,
  ) {
    this.fichePath = resolve(config.get('AGENT_FICHE_FILE') ?? '../automation/agent-fiche.md');
  }

  /** La fiche du centre : relue a chaque appel, une correction du fichier compte tout de suite. */
  async fiche() {
    return { content: await readFile(this.fichePath, 'utf8') };
  }

  async reply(to: string, text: string) {
    try {
      await this.whatsapp.reply(to, text);
    } catch (e) {
      throw new ServiceUnavailableException((e as Error).message);
    }
    return { sent: true };
  }

  /** Personne a rappeler. n8n peut rejouer un appel : pas de doublon pour un meme motif. */
  async addLead(dto: AgentLeadDto) {
    const phone = normalizePhone(dto.phone);
    const repeat = await this.prisma.agentLead.findFirst({
      where: {
        phone,
        reason: dto.reason,
        status: 'NEW',
        createdAt: { gte: new Date(Date.now() - REPEAT_WINDOW_MS) },
      },
      select: { id: true },
    });
    const data = { ...dto, phone };
    return repeat
      ? this.prisma.agentLead.update({ where: { id: repeat.id }, data })
      : this.prisma.agentLead.create({ data });
  }

  async addOrder(dto: AgentOrderDto) {
    const phone = normalizePhone(dto.phone);
    const repeat = await this.prisma.agentOrder.findFirst({
      where: {
        phone,
        items: dto.items,
        status: 'NEW',
        createdAt: { gte: new Date(Date.now() - REPEAT_WINDOW_MS) },
      },
      select: { id: true },
    });
    const data = { ...dto, phone };
    return repeat
      ? this.prisma.agentOrder.update({ where: { id: repeat.id }, data })
      : this.prisma.agentOrder.create({ data });
  }

  async leads(q: AgentLeadsQuery) {
    const where: Prisma.AgentLeadWhereInput = { status: q.status, OR: search(q) };
    const [items, total] = await Promise.all([
      this.prisma.agentLead.findMany({ where, orderBy: { createdAt: 'desc' }, ...skipTake(q) }),
      this.prisma.agentLead.count({ where }),
    ]);
    return toPage(items, total, q);
  }

  async orders(q: AgentOrdersQuery) {
    const where: Prisma.AgentOrderWhereInput = { status: q.status, OR: search(q) };
    const [items, total] = await Promise.all([
      this.prisma.agentOrder.findMany({ where, orderBy: { createdAt: 'desc' }, ...skipTake(q) }),
      this.prisma.agentOrder.count({ where }),
    ]);
    return toPage(items, total, q);
  }

  async setLeadStatus(id: string, status: Prisma.AgentLeadUpdateInput['status'], actorId: string) {
    if (!(await this.prisma.agentLead.findUnique({ where: { id }, select: { id: true } }))) {
      throw new NotFoundException('Rappel introuvable');
    }
    const lead = await this.prisma.agentLead.update({ where: { id }, data: { status } });
    await this.audit.log({ actorId, action: 'agent.lead.status', entity: 'AgentLead', entityId: id });
    return lead;
  }

  async setOrderStatus(id: string, status: Prisma.AgentOrderUpdateInput['status'], actorId: string) {
    if (!(await this.prisma.agentOrder.findUnique({ where: { id }, select: { id: true } }))) {
      throw new NotFoundException('Commande introuvable');
    }
    const order = await this.prisma.agentOrder.update({ where: { id }, data: { status } });
    await this.audit.log({ actorId, action: 'agent.order.status', entity: 'AgentOrder', entityId: id });
    return order;
  }
}
