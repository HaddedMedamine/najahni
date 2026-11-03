import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsUrl,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { DateRangeQuery } from '../../../core/sessions/range.js';

export class CreateSessionDto {
  @ApiProperty()
  @IsUUID()
  groupId: string;

  @ApiProperty({ example: '2026-10-21T17:00:00.000Z' })
  @IsDateString()
  startsAt: string;

  @ApiProperty({ example: '2026-10-21T18:30:00.000Z' })
  @IsDateString()
  endsAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  roomId?: string;

  @ApiPropertyOptional({
    description: "Remplacant ; par defaut l'enseignant du groupe",
  })
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  meetingUrl?: string;

  @ApiPropertyOptional({
    default: 1,
    description:
      'Nombre de semaines (1 = seance unique, 8 = meme creneau pendant 8 semaines)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(40)
  repeatWeeks?: number;
}

/** Deplacement / modification d'une seance planifiee (glisser-deposer). */
export class UpdateSessionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ nullable: true, description: 'null = sans salle' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  roomId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUrl()
  meetingUrl?: string | null;
}

export class ListSessionsQuery extends DateRangeQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  roomId?: string;
}

export class DeleteSessionQuery {
  @ApiPropertyOptional({
    enum: ['one', 'following'],
    default: 'one',
    description: 'following = cette seance et les suivantes de la meme serie',
  })
  @IsOptional()
  @IsIn(['one', 'following'])
  scope?: 'one' | 'following';
}
