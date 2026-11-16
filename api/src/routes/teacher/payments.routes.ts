import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';
import { TeacherPaymentsService } from '../../actors/teacher/teacher-payments.service.js';
import {
  type AuthUser,
  CurrentUser,
  Roles,
} from '../../core/auth/decorators.js';
import { PaySeriesDto } from '../../core/payments/pay.dto.js';

class EarningsQuery {
  @ApiPropertyOptional({ example: '2026-10', description: 'Mois AAAA-MM (defaut : mois en cours)' })
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'month doit etre au format AAAA-MM' })
  month?: string;
}

@ApiTags('enseignant / paiements')
@ApiBearerAuth()
@Roles('TEACHER')
@Controller('teacher/payments')
export class TeacherPaymentsController {
  constructor(private readonly payments: TeacherPaymentsService) {}

  /** Tableau de bord : mes groupes (payes, a payer, en cours). */
  @Get()
  overview(@CurrentUser() user: AuthUser) {
    return this.payments.overview(user.id);
  }

  /** Mes gains : argent encaisse pendant un mois, par groupe. */
  @Get('earnings')
  earnings(@CurrentUser() user: AuthUser, @Query() query: EarningsQuery) {
    return this.payments.earnings(user.id, query.month);
  }

  /** Eleves d'un de mes groupes : serie, presences, etat du paiement. */
  @Get('groups/:groupId')
  group(
    @CurrentUser() user: AuthUser,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ) {
    return this.payments.group(user.id, groupId);
  }

  /** Dates de presence des eleves d'un de mes groupes, payees ou non, pour un mois ou depuis le debut. */
  @Get('groups/:groupId/sheet')
  sheet(
    @CurrentUser() user: AuthUser,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query() query: EarningsQuery,
  ) {
    return this.payments.sheet(user.id, groupId, query.month);
  }

  /** L'eleve remet son paiement en especes (serie a payer, ou serie en cours a l'avance). */
  @Post('groups/:groupId/students/:studentId/pay')
  markPaid(
    @CurrentUser() user: AuthUser,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Body() dto: PaySeriesDto,
  ) {
    return this.payments.markPaid(user.id, groupId, studentId, dto.series);
  }

  /** Annuler le dernier paiement de l'eleve (erreur de saisie). */
  @Delete('groups/:groupId/students/:studentId/pay')
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.payments.cancel(user.id, groupId, studentId);
  }
}
