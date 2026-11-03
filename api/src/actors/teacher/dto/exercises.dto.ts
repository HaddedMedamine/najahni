import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** En multipart, une liste arrive en texte ("a" ou "a,b") ou en tableau. */
const toList = ({ value }: { value: unknown }) =>
  Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',').map((v) => v.trim()).filter(Boolean)
      : value;

export class CreateExerciseDto {
  @ApiProperty({ example: 'Série 3 : les suites' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  title!: string;

  @ApiPropertyOptional({ example: 'Exercices 1 à 4 pour la séance de mardi' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: 'Bac', description: 'Niveau : seuls mes groupes de ce niveau peuvent etre choisis' })
  @IsString()
  @MinLength(1)
  level!: string;

  @ApiProperty({ type: [String], description: 'Groupes qui recoivent l exercice' })
  @Transform(toList)
  @IsArray()
  @ArrayMinSize(1, { message: 'Choisissez au moins un groupe' })
  @IsUUID('all', { each: true })
  groupIds!: string[];
  // Les fichiers ("files") arrivent par @UploadedFiles(), pas dans le corps
}

export class UpdateExerciseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Transform(toList)
  @IsArray()
  @ArrayMinSize(1, { message: 'Choisissez au moins un groupe' })
  @IsUUID('all', { each: true })
  groupIds?: string[];
}
