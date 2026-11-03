import { randomInt } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { Role } from '../../generated/prisma/client.js';
import { hashPassword } from '../auth/password.js';

/** Champs communs a la creation de tout compte (eleve, parent, enseignant). */
export class AccountDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+21698123456' })
  @IsOptional()
  @Matches(/^\+?[0-9]{8,15}$/, { message: 'Numero de telephone invalide' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Si absent, un mot de passe temporaire est genere',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;

  @ApiPropertyOptional({ enum: ['fr', 'ar'] })
  @IsOptional()
  @IsIn(['fr', 'ar'])
  locale?: string;
}

const PASSWORD_ALPHABET =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

export const generateTemporaryPassword = () =>
  Array.from(
    { length: 10 },
    () => PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)],
  ).join('');

/**
 * Prepare les donnees d'un nouvel utilisateur.
 * `temporaryPassword` n'est renvoye qu'une fois, a communiquer a l'utilisateur.
 */
export async function newUserData(input: AccountDto, role: Role) {
  if (!input.email && !input.phone) {
    throw new BadRequestException('Email ou telephone requis');
  }
  const temporaryPassword = input.password
    ? undefined
    : generateTemporaryPassword();

  return {
    user: {
      role,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email?.trim().toLowerCase() ?? null,
      phone: input.phone ?? null,
      locale: input.locale ?? 'fr',
      passwordHash: await hashPassword(input.password ?? temporaryPassword!),
    },
    temporaryPassword,
  };
}

/** Champs utilisateur modifiables (mise a jour partielle). */
export const userUpdateData = (input: Partial<AccountDto>) => ({
  firstName: input.firstName?.trim(),
  lastName: input.lastName?.trim(),
  email: input.email?.trim().toLowerCase(),
  phone: input.phone,
  locale: input.locale,
});

export const publicUserSelect = {
  id: true,
  email: true,
  phone: true,
  firstName: true,
  lastName: true,
  locale: true,
  isActive: true,
  lastLoginAt: true,
} as const;
