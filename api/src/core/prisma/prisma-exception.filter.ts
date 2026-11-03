import {
  ArgumentsHost,
  Catch,
  ConflictException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '../../generated/prisma/client.js';

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
      case 'P2002':
        return new ConflictException('Cette valeur est deja utilisee');
      case 'P2003':
        return new ConflictException(
          "Operation impossible : element lie a d'autres donnees",
        );
      case 'P2025':
        return new NotFoundException('Element introuvable');
    }
  }
}
