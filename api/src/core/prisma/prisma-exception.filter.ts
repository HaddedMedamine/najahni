import {
  ArgumentsHost,
  Catch,
  ConflictException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '../../generated/prisma/client.js';
import { fieldError, TAKEN_MESSAGES } from '../common/field-errors.js';

/** Traduit les erreurs Prisma courantes en reponses HTTP claires. */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(error: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    super.catch(this.toHttp(error) ?? error, host);
  }

  private toHttp(
    error: Prisma.PrismaClientKnownRequestError,
  ): HttpException | undefined {
    switch (error.code) {
      case 'P2002': {
        const field = uniqueField(error.meta);
        return field && TAKEN_MESSAGES[field]
          ? fieldError(field, TAKEN_MESSAGES[field], HttpStatus.CONFLICT)
          : new ConflictException('Cette valeur est deja utilisee');
      }
      case 'P2003':
        return new ConflictException(
          "Operation impossible : element lie a d'autres donnees",
        );
      case 'P2025':
        return new NotFoundException('Element introuvable');
    }
  }
}

interface UniqueMeta {
  target?: string | string[];
  driverAdapterError?: {
    cause?: { constraint?: { fields?: string[]; index?: string } };
  };
}

/** Champ unique en conflit (contrainte sur une seule colonne), sinon undefined. */
export function uniqueField(meta: unknown) {
  const { target, driverAdapterError } = (meta ?? {}) as UniqueMeta;
  const constraint = driverAdapterError?.cause?.constraint;
  const fields = constraint?.fields ?? (Array.isArray(target) ? target : undefined);
  if (fields) return fields.length === 1 ? fields[0].replaceAll('"', '') : undefined;
  // Nom d'index Postgres : `User_email_key`
  const index = constraint?.index ?? (typeof target === 'string' ? target : undefined);
  return index?.match(/^[A-Za-z]+_([A-Za-z]+)_key$/)?.[1];
}
