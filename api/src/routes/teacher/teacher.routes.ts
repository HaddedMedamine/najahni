import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TeacherService } from '../../actors/teacher/teacher.service.js';
import {
  type AuthUser,
  CurrentUser,
  Roles,
} from '../../core/auth/decorators.js';

@ApiTags('enseignant')
@ApiBearerAuth()
@Roles('TEACHER')
@Controller('teacher')
export class TeacherController {
  constructor(private readonly teacher: TeacherService) {}

  @Get('profile')
  profile(@CurrentUser() user: AuthUser) {
    return this.teacher.profile(user.id);
  }

  @Get('groups')
  myGroups(@CurrentUser() user: AuthUser) {
    return this.teacher.myGroups(user.id);
  }

  @Get('groups/:id')
  myGroup(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.teacher.myGroup(user.id, id);
  }
}
