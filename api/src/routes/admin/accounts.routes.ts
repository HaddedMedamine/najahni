import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccountsService } from '../../actors/admin/accounts.service.js';
import {
  type AuthUser,
  CurrentUser,
  Roles,
} from '../../core/auth/decorators.js';

@ApiTags('admin / comptes')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/accounts')
export class AdminAccountsController {
  constructor(private readonly accounts: AccountsService) {}

  /** Genere un nouveau mot de passe temporaire pour n'importe quel utilisateur. */
  @Post(':userId/reset-password')
  resetPassword(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.accounts.resetPassword(userId, user.id);
  }
}
