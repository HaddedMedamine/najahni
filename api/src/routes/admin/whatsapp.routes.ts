import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationsQuery, WhatsappTestDto } from '../../actors/admin/dto/whatsapp.dto.js';
import { AdminWhatsappService } from '../../actors/admin/whatsapp.service.js';
import {
  type AuthUser,
  CurrentUser,
  Roles,
} from '../../core/auth/decorators.js';

@ApiTags('admin / whatsapp')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/whatsapp')
export class AdminWhatsappController {
  constructor(private readonly whatsapp: AdminWhatsappService) {}

  /** Etat de la connexion (QR code a scanner si besoin) + compteurs. */
  @Get()
  status() {
    return this.whatsapp.status();
  }

  /** Lier le telephone : genere un QR code. */
  @Post('connect')
  @HttpCode(200)
  connect(@CurrentUser() user: AuthUser) {
    return this.whatsapp.connect(user.id);
  }

  @Post('logout')
  @HttpCode(200)
  logout(@CurrentUser() user: AuthUser) {
    return this.whatsapp.logout(user.id);
  }

  @Post('test')
  @HttpCode(200)
  test(@Body() dto: WhatsappTestDto, @CurrentUser() user: AuthUser) {
    return this.whatsapp.sendTest(dto.phone, user.id);
  }

  /** Historique des messages (en attente, envoyes, echoues, annules). */
  @Get('messages')
  list(@Query() query: NotificationsQuery) {
    return this.whatsapp.list(query);
  }

  @Post('messages/:id/retry')
  @HttpCode(200)
  retry(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.whatsapp.retry(id, user.id);
  }

  @Post('messages/:id/cancel')
  @HttpCode(200)
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.whatsapp.cancel(id, user.id);
  }
}
