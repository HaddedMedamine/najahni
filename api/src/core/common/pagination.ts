import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import type { Prisma } from '../../generated/prisma/client.js';

export class PaginationQuery {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;

  @ApiPropertyOptional({ description: 'Recherche nom, email, telephone' })
  @IsOptional()
  @IsString()
  search?: string;
}

/** Ajoute le filtre ?archived=true (par defaut : elements actifs seulement). */
export class ArchivablePaginationQuery extends PaginationQuery {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  archived: boolean = false;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const skipTake = (q: PaginationQuery) => ({
  skip: (q.page - 1) * q.pageSize,
  take: q.pageSize,
});

export const toPage = <T>(
  items: T[],
  total: number,
  q: PaginationQuery,
): Page<T> => ({ items, total, page: q.page, pageSize: q.pageSize });

/** Filtre de recherche texte sur un utilisateur. */
export const userSearch = (
  search?: string,
): Prisma.UserWhereInput | undefined => {
  const value = search?.trim();
  if (!value) return undefined;
  const contains = { contains: value, mode: 'insensitive' as const };
  return {
    OR: [
      { firstName: contains },
      { lastName: contains },
      { email: contains },
      { phone: { contains: value } },
    ],
  };
};
