import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
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
