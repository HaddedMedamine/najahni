import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';
import { AccountDto } from '../../../core/common/accounts.js';

export class CreateTeacherDto extends AccountDto {
  @ApiProperty({ type: [String], example: ['Informatique', 'Mathematiques'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  subjects: string[];
}

/** L'admin devient aussi enseignant (meme compte). */
export class SelfTeacherDto {
  @ApiProperty({ type: [String], example: ['Mathematiques'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  subjects: string[];
}

export class UpdateTeacherDto extends PartialType(
  OmitType(CreateTeacherDto, ['password'] as const),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
