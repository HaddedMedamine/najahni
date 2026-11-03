import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ParentService } from '../../actors/parent/parent.service.js';
import {
  type AuthUser,
  CurrentUser,
  Roles,
} from '../../core/auth/decorators.js';
import { DateRangeQuery } from '../../core/sessions/range.js';

@ApiTags('parent')
@ApiBearerAuth()
@Roles('PARENT')
@Controller('parent')
export class ParentController {
  constructor(private readonly parent: ParentService) {}

  @Get('children')
  myChildren(@CurrentUser() user: AuthUser) {
    return this.parent.myChildren(user.id);
  }

  @Get('children/:studentId')
  child(
    @CurrentUser() user: AuthUser,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.parent.child(user.id, studentId);
  }

  /** Planning de l'enfant (avec sa presence). */
  @Get('children/:studentId/sessions')
  childSessions(
    @CurrentUser() user: AuthUser,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query() query: DateRangeQuery,
  ) {
    return this.parent.childSessions(user.id, studentId, query);
  }

  /** Paiements de l'enfant, mois par mois. */
  @Get('children/:studentId/payments')
  childPayments(
    @CurrentUser() user: AuthUser,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.parent.childPayments(user.id, studentId);
  }

  /** Historique de presence de l'enfant + statistiques. */
  @Get('children/:studentId/attendance')
  childAttendance(
    @CurrentUser() user: AuthUser,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.parent.childAttendance(user.id, studentId);
  }
}
