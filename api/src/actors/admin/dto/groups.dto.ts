import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ArchivablePaginationQuery } from '../../../core/common/pagination.js';

export class CreateGroupDto {
  @ApiProperty({ example: 'Bac Info - Groupe A' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Bac' })
  @IsString()
  @IsNotEmpty()
  level: string;

  @ApiProperty({ example: 'Info' })
  @IsString()
  @IsNotEmpty()
  section: string;

  @ApiProperty({ example: 'Algorithmique' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty()
  @IsUUID()
  teacherId: string;

  @ApiProperty({ example: 8, description: 'Seances par cycle (mois)' })
  @IsInt()
  @Min(1)
  @Max(31)
  monthlySessions: number;

  @ApiProperty({ example: 60, description: 'Prix mensuel en TND' })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  monthlyFee: number;

  @ApiProperty({ example: 15 })
  @IsInt()
  @Min(1)
  capacity: number;
}

export class UpdateGroupDto extends PartialType(CreateGroupDto) {}

export class ListGroupsQuery extends ArchivablePaginationQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  section?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  teacherId?: string;
}

export class AddStudentsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  studentIds: string[];
}
