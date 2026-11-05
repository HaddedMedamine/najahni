import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  type AuthUser,
  CurrentUser,
  Roles,
} from '../../core/auth/decorators.js';
import { CodeAttemptDto } from '../../core/coding/coding.dto.js';
import { CodingService } from '../../core/coding/coding.service.js';

@ApiTags('eleve / coder')
@ApiBearerAuth()
@Roles('STUDENT')
@Controller('student/coding')
export class StudentCodingController {
  constructor(private readonly coding: CodingService) {}

  /** Mon parcours : chapitres, niveaux, etoiles, niveaux ouverts. */
  @Get()
  map(@CurrentUser() user: AuthUser) {
    return this.coding.studentMap(user.id);
  }

  @Get('levels/:id')
  level(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.coding.studentLevel(user.id, id);
  }

  /** Essai d'un niveau (le code a ete execute dans le navigateur). */
  @Post('levels/:id/attempts')
  attempt(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CodeAttemptDto,
  ) {
    return this.coding.recordAttempt(user.id, id, dto);
  }
}
