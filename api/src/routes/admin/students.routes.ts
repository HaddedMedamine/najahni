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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CreateStudentDto,
  ListStudentsQuery,
  UpdateStudentDto,
} from '../../actors/admin/dto/students.dto.js';
import { StudentsService } from '../../actors/admin/students.service.js';
import {
  type AuthUser,
  CurrentUser,
  Roles,
} from '../../core/auth/decorators.js';

@ApiTags('admin / eleves')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/students')
export class AdminStudentsController {
  constructor(private readonly students: StudentsService) {}

  @Get()
  list(@Query() query: ListStudentsQuery) {
    return this.students.list(query);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.students.get(id);
  }

  @Post()
  create(@Body() dto: CreateStudentDto, @CurrentUser() user: AuthUser) {
    return this.students.create(dto, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStudentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.students.update(id, dto, user.id);
  }

  @Post(':id/archive')
  @HttpCode(204)
  archive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.students.archive(id, user.id);
  }

  @Post(':id/restore')
  @HttpCode(204)
  restore(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.students.restore(id, user.id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.students.remove(id, user.id);
  }
}
