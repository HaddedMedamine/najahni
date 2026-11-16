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
import { IsOptional, IsUUID, Matches } from 'class-validator';
import { PaymentsService } from '../../actors/admin/payments.service.js';
import {
  type AuthUser,
  CurrentUser,
  Roles,
} from '../../core/auth/decorators.js';
import { PaySeriesDto } from '../../core/payments/pay.dto.js';

class PaymentsOverviewQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  teacherId?: string;
}

class EarningsQuery extends PaymentsOverviewQuery {
  @ApiPropertyOptional({ example: '2026-10', description: 'Mois AAAA-MM (defaut : mois en cours)' })
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'month doit etre au format AAAA-MM' })
  month?: string;
}

@ApiTags('admin / paiements')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  /** Tableau de bord : tous les groupes (filtrable par enseignant). */
  @Get()
  overview(@Query() query: PaymentsOverviewQuery) {
    return this.payments.overview(query.teacherId);
  }

  /** Argent encaisse pendant un mois : total, par groupe, par enseignant. */
  @Get('earnings')
  earnings(@Query() query: EarningsQuery) {
    return this.payments.earnings(query.month, query.teacherId);
  }

  @Get('groups/:groupId')
  group(@Param('groupId', ParseUUIDPipe) groupId: string) {
    return this.payments.group(groupId);
  }

  @Post('groups/:groupId/students/:studentId/pay')
  markPaid(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Body() dto: PaySeriesDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.payments.markPaid(groupId, studentId, dto.series, user.id);
  }

  @Delete('groups/:groupId/students/:studentId/pay')
  cancel(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.payments.cancel(groupId, studentId, user.id);
  }
}
