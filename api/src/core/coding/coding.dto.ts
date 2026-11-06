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

const TYPES = ['Entier', 'Réel', 'Booléen', 'Caractère', 'Chaîne'] as const;

/** Ligne du TDO envoyee avec un algorithme. */
export class TdoRowDto {
  @ApiProperty()
  @IsString()
  @MaxLength(40)
  name: string;

  @ApiProperty({ enum: [...TYPES, 'Tableau', 'Fichier'] })
  @IsIn([...TYPES, 'Tableau', 'Fichier'])
  type: (typeof TYPES)[number] | 'Tableau' | 'Fichier';

  @ApiPropertyOptional({ enum: TYPES })
  @IsOptional()
  @IsIn(TYPES)
  elem?: (typeof TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  size?: number;
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
