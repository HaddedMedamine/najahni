import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class PaySeriesDto {
  @ApiProperty({ example: 1, description: "Numero de la serie affichee a l'ecran" })
  @IsInt()
  @Min(1)
  series!: number;
}
