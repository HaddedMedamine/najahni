import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  MarkAttendanceDto,
  SessionNotesDto,
} from '../../actors/teacher/dto/sessions.dto.js';
import { TeacherSessionsService } from '../../actors/teacher/teacher-sessions.service.js';
import {
  type AuthUser,
  CurrentUser,
  Roles,
} from '../../core/auth/decorators.js';
import { DateRangeQuery } from '../../core/sessions/range.js';

@ApiTags('enseignant / seances')
@ApiBearerAuth()
@Roles('TEACHER')
@Controller('teacher/sessions')
export class TeacherSessionsController {
  constructor(private readonly sessions: TeacherSessionsService) {}

  /** Mon planning sur une periode. */
  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: DateRangeQuery) {
    return this.sessions.list(user.id, query);
  }

  /** Detail + feuille d'appel. */
  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.sessions.get(user.id, id);
  }

  @Post(':id/start')
  start(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.sessions.start(user.id, id);
  }

  @Put(':id/attendance')
  markAttendance(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MarkAttendanceDto,
  ) {
    return this.sessions.markAttendance(user.id, id, dto);
  }

  @Patch(':id/notes')
  saveNotes(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SessionNotesDto,
  ) {
    return this.sessions.saveNotes(user.id, id, dto);
  }

  /** Termine la seance ; renvoie les eleves qui viennent de finir leur serie. */
  @Post(':id/complete')
  complete(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.sessions.complete(user.id, id);
  }
}
