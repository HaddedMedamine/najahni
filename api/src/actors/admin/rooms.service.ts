import { Injectable } from '@nestjs/common';
import { AuditService } from '../../core/audit/audit.service.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { CreateRoomDto, UpdateRoomDto } from './dto/rooms.dto.js';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list() {
    return this.prisma.room.findMany({ orderBy: { name: 'asc' } });
  }

  async create(dto: CreateRoomDto, actorId: string) {
    const room = await this.prisma.room.create({ data: dto });
    await this.audit.log({
      actorId,
      action: 'room.create',
      entity: 'Room',
      entityId: room.id,
    });
    return room;
  }

  async update(id: string, dto: UpdateRoomDto, actorId: string) {
    const room = await this.prisma.room.update({ where: { id }, data: dto });
    await this.audit.log({
      actorId,
      action: 'room.update',
      entity: 'Room',
      entityId: id,
    });
    return room;
  }

  async remove(id: string, actorId: string) {
    await this.prisma.room.delete({ where: { id } });
    await this.audit.log({
      actorId,
      action: 'room.delete',
      entity: 'Room',
      entityId: id,
    });
  }
}
