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
  CreateTeacherDto,
  SelfTeacherDto,
  UpdateTeacherDto,
} from '../../actors/admin/dto/teachers.dto.js';
import { TeachersService } from '../../actors/admin/teachers.service.js';
import {
  type AuthUser,
  CurrentUser,
  Roles,
} from '../../core/auth/decorators.js';
import { PaginationQuery } from '../../core/common/pagination.js';

@ApiTags('admin / enseignants')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/teachers')
export class AdminTeachersController {
  constructor(private readonly teachers: TeachersService) {}

  @Get()
  list(@Query() query: PaginationQuery) {
    return this.teachers.list(query);
  }

  /** Je suis aussi enseignant : active l'espace enseignant sur mon compte admin. */
  @Post('me')
  enableSelf(@Body() dto: SelfTeacherDto, @CurrentUser() user: AuthUser) {
    return this.teachers.enableSelf(dto, user.id);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.teachers.get(id);
  }

  @Post()
  create(@Body() dto: CreateTeacherDto, @CurrentUser() user: AuthUser) {
    return this.teachers.create(dto, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTeacherDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.teachers.update(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.teachers.remove(id, user.id);
  }
}
