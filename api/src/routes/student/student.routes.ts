import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StudentService } from '../../actors/student/student.service.js';
import {
  type AuthUser,
  CurrentUser,
  Roles,
} from '../../core/auth/decorators.js';
import { DateRangeQuery } from '../../core/sessions/range.js';

@ApiTags('eleve')
@ApiBearerAuth()
@Roles('STUDENT')
@Controller('student')
export class StudentController {
  constructor(private readonly student: StudentService) {}

  @Get('profile')
  profile(@CurrentUser() user: AuthUser) {
    return this.student.profile(user.id);
  }

  @Get('groups')
  myGroups(@CurrentUser() user: AuthUser) {
    return this.student.myGroups(user.id);
  }

  /** Mon planning (avec ma presence pour les seances passees). */
  @Get('sessions')
  sessions(@CurrentUser() user: AuthUser, @Query() query: DateRangeQuery) {
    return this.student.sessions(user.id, query);
  }

  /** Exercices publies par mes enseignants pour mes groupes. */
  @Get('exercises')
  exercises(@CurrentUser() user: AuthUser) {
    return this.student.exercises(user.id);
  }

  @Get('exercises/:id/files/:fileId')
  exerciseFile(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ) {
    return this.student.exerciseFile(user.id, id, fileId);
  }

  /** Mon historique de presence + statistiques. */
  @Get('attendance')
  attendance(@CurrentUser() user: AuthUser) {
    return this.student.attendance(user.id);
  }
}
