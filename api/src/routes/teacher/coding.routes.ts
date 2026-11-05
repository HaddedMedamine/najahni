import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  type AuthUser,
  CurrentUser,
  Roles,
} from '../../core/auth/decorators.js';
import { CodingService } from '../../core/coding/coding.service.js';

@ApiTags('enseignant / coder')
@ApiBearerAuth()
@Roles('TEACHER')
@Controller('teacher/coding')
export class TeacherCodingController {
  constructor(private readonly coding: CodingService) {}

  /** Avancement des eleves de mes groupes. */
  @Get('students')
  async students(@CurrentUser() user: AuthUser) {
    return this.coding.progressOverview(
      await this.coding.teacherStudentIds(user.id),
    );
  }

  @Get('students/:id')
  async student(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const mine = await this.coding.teacherStudentIds(user.id);
    if (!mine.includes(id)) throw new NotFoundException('Eleve introuvable');
    return this.coding.studentDetail(id);
  }
}
