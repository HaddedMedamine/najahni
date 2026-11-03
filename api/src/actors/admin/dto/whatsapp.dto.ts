import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';
import { PaginationQuery } from '../../../core/common/pagination.js';

export const NOTIFICATION_STATUSES = ['PENDING', 'SENT', 'FAILED', 'CANCELLED'] as const;
export const NOTIFICATION_TYPES = ['absence', 'payment_reminder', 'password_reset', 'test'] as const;

export class NotificationsQuery extends PaginationQuery {
  @ApiPropertyOptional({ enum: NOTIFICATION_STATUSES })
  @IsOptional()
  @IsIn(NOTIFICATION_STATUSES)
  status?: (typeof NOTIFICATION_STATUSES)[number];

  @ApiPropertyOptional({ enum: NOTIFICATION_TYPES })
  @IsOptional()
  @IsIn(NOTIFICATION_TYPES)
  type?: (typeof NOTIFICATION_TYPES)[number];
}

export class WhatsappTestDto {
  @ApiProperty({ example: '+21695123456' })
  @IsString()
  @Matches(/^\+?[\d\s]{8,16}$/, { message: 'Numero de telephone invalide' })
  phone!: string;
}
