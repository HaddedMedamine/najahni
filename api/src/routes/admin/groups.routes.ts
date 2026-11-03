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
  AddStudentsDto,
  CreateGroupDto,
  ListGroupsQuery,
  UpdateGroupDto,
} from '../../actors/admin/dto/groups.dto.js';
import { GroupsService } from '../../actors/admin/groups.service.js';
import {
  type AuthUser,
  CurrentUser,
  Roles,
} from '../../core/auth/decorators.js';

@ApiTags('admin / groupes')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/groups')
export class AdminGroupsController {
  constructor(private readonly groups: GroupsService) {}

  @Get()
  list(@Query() query: ListGroupsQuery) {
    return this.groups.list(query);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.groups.get(id);
  }

  @Post()
  create(@Body() dto: CreateGroupDto, @CurrentUser() user: AuthUser) {
    return this.groups.create(dto, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGroupDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.groups.update(id, dto, user.id);
  }

  @Post(':id/archive')
  @HttpCode(204)
  archive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.groups.setArchived(id, true, user.id);
  }

  @Post(':id/restore')
  @HttpCode(204)
  restore(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.groups.setArchived(id, false, user.id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.groups.remove(id, user.id);
  }

  @Post(':id/students')
  addStudents(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddStudentsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.groups.addStudents(id, dto.studentIds, user.id);
  }

  @Delete(':id/students/:studentId')
  @HttpCode(204)
  removeStudent(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.groups.removeStudent(id, studentId, user.id);
  }
}
