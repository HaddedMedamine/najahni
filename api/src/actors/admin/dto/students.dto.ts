import {
  ApiPropertyOptional,
  ApiProperty,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';
import { AccountDto } from '../../../core/common/accounts.js';
import { ArchivablePaginationQuery } from '../../../core/common/pagination.js';

export class CreateStudentDto extends AccountDto {
  @ApiProperty({ example: 'Bac' })
  @IsString()
  @IsNotEmpty()
  level: string;

  @ApiProperty({ example: 'Info' })
  @IsString()
  @IsNotEmpty()
  section: string;

  @ApiPropertyOptional({ example: '+21698123456' })
  @IsOptional()
  @Matches(/^\+?[0-9]{8,15}$/, { message: 'Numero de telephone invalide' })
  parentPhone?: string;

  @ApiPropertyOptional({
    description: 'Tarif mensuel negocie (TND), sinon celui du groupe',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  monthlyFee?: number;

  @ApiPropertyOptional({ example: '2008-05-14' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ type: [String], description: 'Groupes a rejoindre' })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  groupIds?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Parents a lier' })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  parentIds?: string[];
}

export class UpdateStudentDto extends PartialType(
  OmitType(CreateStudentDto, ['password', 'groupIds', 'parentIds'] as const),
) {}

export class ListStudentsQuery extends ArchivablePaginationQuery {
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
  groupId?: string;
}
