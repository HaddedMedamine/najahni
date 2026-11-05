import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CreateTeacherSessionDto,
  MarkAttendanceDto,
  SessionNotesDto,
  UpdateTeacherSessionDto,
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

  /** Pose une seance d'un de mes groupes (glisser-deposer sur le planning). */
  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateTeacherSessionDto,
  ) {
    return this.sessions.create(user.id, dto);
  }

  /** Deplacement, duree ou salle d'une seance planifiee. */
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTeacherSessionDto,
  ) {
    return this.sessions.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.sessions.remove(user.id, id);
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

@ApiTags('enseignant / salles')
@ApiBearerAuth()
@Roles('TEACHER')
@Controller('teacher/rooms')
export class TeacherRoomsController {
  constructor(private readonly sessions: TeacherSessionsService) {}

  @Get()
  list() {
    return this.sessions.rooms();
  }

  /** Creneaux deja reserves dans les salles sur une periode. */
  @Get('occupancy')
  occupancy(@CurrentUser() user: AuthUser, @Query() query: DateRangeQuery) {
    return this.sessions.roomOccupancy(user.id, query);
  }
}
