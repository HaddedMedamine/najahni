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
  CreateParentDto,
  LinkChildDto,
  UpdateParentDto,
} from '../../actors/admin/dto/parents.dto.js';
import { ParentsService } from '../../actors/admin/parents.service.js';
import {
  type AuthUser,
  CurrentUser,
  Roles,
} from '../../core/auth/decorators.js';
import { PaginationQuery } from '../../core/common/pagination.js';

@ApiTags('admin / parents')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/parents')
export class AdminParentsController {
  constructor(private readonly parents: ParentsService) {}

  @Get()
  list(@Query() query: PaginationQuery) {
    return this.parents.list(query);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.parents.get(id);
  }

  @Post()
  create(@Body() dto: CreateParentDto, @CurrentUser() user: AuthUser) {
    return this.parents.create(dto, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateParentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.parents.update(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.parents.remove(id, user.id);
  }

  @Post(':id/children')
  linkChild(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LinkChildDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.parents.linkChild(id, dto, user.id);
  }

  @Delete(':id/children/:studentId')
  @HttpCode(204)
  unlinkChild(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.parents.unlinkChild(id, studentId, user.id);
  }
}
