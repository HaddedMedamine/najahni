import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AccountDto } from '../../../core/common/accounts.js';

export class CreateParentDto extends AccountDto {
  @ApiPropertyOptional({ type: [String], description: 'Enfants a lier' })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  studentIds?: string[];
}

export class UpdateParentDto extends PartialType(
  OmitType(CreateParentDto, ['password', 'studentIds'] as const),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class LinkChildDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiPropertyOptional({ example: 'mere' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  relationship?: string;
}
