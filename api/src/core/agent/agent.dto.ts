import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { PaginationQuery } from '../common/pagination.js';

const CHANNELS = ['WHATSAPP', 'PHONE'] as const;
const LEAD_REASONS = ['QUESTION', 'ABSENCE', 'PAYMENT'] as const;
export const LEAD_STATUSES = ['NEW', 'CALLED', 'DONE'] as const;
export const ORDER_STATUSES = ['NEW', 'CONFIRMED', 'DELIVERED', 'CANCELLED'] as const;

class AgentContactDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ example: '+21695123456' })
  @IsString()
  @Matches(/^\+?[\d\s]{8,16}$/, { message: 'Numero de telephone invalide' })
  phone!: string;

  @ApiProperty({ enum: CHANNELS })
  @IsIn(CHANNELS)
  channel!: (typeof CHANNELS)[number];
}

/** Personne a rappeler : question sans reponse, absence ou paiement. */
export class AgentLeadDto extends AgentContactDto {
  @ApiProperty({ enum: LEAD_REASONS })
  @IsIn(LEAD_REASONS)
  reason!: (typeof LEAD_REASONS)[number];

  @ApiProperty({ description: 'Ce que la personne a demande' })
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  question!: string;
}

/** Commande de livres prise par l'agent, confirmee par le client. */
export class AgentOrderDto extends AgentContactDto {
  @ApiProperty({ description: 'Adresse de livraison' })
  @IsString()
  @MinLength(2)
  @MaxLength(300)
  location!: string;

  @ApiProperty({ description: 'Livres commandes' })
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  items!: string;
}

/** Reponse de l'agent, a l'adresse WhatsApp recue avec le message. */
export class AgentReplyDto {
  @ApiProperty({ example: '21695123456@s.whatsapp.net' })
  @IsString()
  @Matches(/^\d+(:\d+)?@(s\.whatsapp\.net|lid)$/, { message: 'Adresse WhatsApp invalide' })
  to!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  text!: string;
}

export class AgentLeadsQuery extends PaginationQuery {
  @ApiPropertyOptional({ enum: LEAD_STATUSES })
  @IsOptional()
  @IsIn(LEAD_STATUSES)
  status?: (typeof LEAD_STATUSES)[number];
}

export class AgentOrdersQuery extends PaginationQuery {
  @ApiPropertyOptional({ enum: ORDER_STATUSES })
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: (typeof ORDER_STATUSES)[number];
}

export class AgentLeadStatusDto {
  @ApiProperty({ enum: LEAD_STATUSES })
  @IsIn(LEAD_STATUSES)
  status!: (typeof LEAD_STATUSES)[number];
}

export class AgentOrderStatusDto {
  @ApiProperty({ enum: ORDER_STATUSES })
  @IsIn(ORDER_STATUSES)
  status!: (typeof ORDER_STATUSES)[number];
}
