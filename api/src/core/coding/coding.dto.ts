import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Ligne du TDO envoyee avec un algorithme. */
export class TdoRowDto {
  @ApiProperty()
  @IsString()
  @MaxLength(40)
  name: string;

  /** Type du programme, ou nouveau type declare par l'eleve dans le bloc Type. */
  @ApiProperty()
  @IsString()
  @MaxLength(40)
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  elem?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  size?: number;

  /** Matrice : nombre de colonnes (`size` = nombre de lignes). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  cols?: number;
}

export class CodeAttemptDto {
  @ApiProperty({ description: "Code de l'eleve (Python ou algorithme)" })
  @IsString()
  @MaxLength(20_000)
  code: string;

  @ApiProperty({
    description:
      "Resultat de l'execution dans le navigateur (tous les tests reussis)",
  })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ enum: ['PYTHON', 'ALGO'] })
  @IsIn(['PYTHON', 'ALGO'])
  language: 'PYTHON' | 'ALGO';

  @ApiPropertyOptional({ type: [TdoRowDto], description: 'TDO (algorithme)' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => TdoRowDto)
  tdo?: TdoRowDto[];
}
