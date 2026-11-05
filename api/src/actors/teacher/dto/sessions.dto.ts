import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

// Le centre ne gere que present / absent (LATE et EXCUSED restent dans la base pour l'historique)
export const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT'] as const;

export class AttendanceRecordDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty({ enum: ATTENDANCE_STATUSES })
  @IsIn(ATTENDANCE_STATUSES)
  status: (typeof ATTENDANCE_STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}

export class MarkAttendanceDto {
  @ApiProperty({ type: [AttendanceRecordDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records: AttendanceRecordDto[];
}

export class SessionNotesDto {
  @ApiPropertyOptional({ description: 'Contenu traite pendant la seance' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  contentCovered?: string;

  @ApiPropertyOptional({ description: 'Devoirs donnes' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  homework?: string;
}

/** Seance posee sur le planning (glisser un groupe sur un creneau). */
export class CreateTeacherSessionDto {
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
    default: 1,
    description: 'Nombre de semaines (1 = seance unique)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(40)
  repeatWeeks?: number;
}

/** Deplacement, duree ou salle d'une de mes seances planifiees. */
export class UpdateTeacherSessionDto {
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
}
