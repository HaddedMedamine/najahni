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
  CreateSessionDto,
  DeleteSessionQuery,
  ListSessionsQuery,
  UpdateSessionDto,
} from '../../actors/admin/dto/sessions.dto.js';
import { SessionsService } from '../../actors/admin/sessions.service.js';
import {
  type AuthUser,
  CurrentUser,
  Roles,
} from '../../core/auth/decorators.js';

@ApiTags('admin / planning')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/sessions')
export class AdminSessionsController {
  constructor(private readonly sessions: SessionsService) {}

  /** Seances d'une periode (calendrier), filtrables par groupe, enseignant, salle. */
  @Get()
  list(@Query() query: ListSessionsQuery) {
    return this.sessions.list(query);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.sessions.get(id);
  }

  /** Cree une seance ou une serie hebdomadaire. 409 en cas de conflit. */
  @Post()
  create(@Body() dto: CreateSessionDto, @CurrentUser() user: AuthUser) {
    return this.sessions.create(dto, user.id);
  }

  /** Deplacer / redimensionner / changer de salle. 409 en cas de conflit. */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSessionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.sessions.update(id, dto, user.id);
  }

  @Post(':id/cancel')
  @HttpCode(204)
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.sessions.cancel(id, user.id);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteSessionQuery,
    @CurrentUser() user: AuthUser,
  ) {
    return this.sessions.remove(id, query, user.id);
  }
}
