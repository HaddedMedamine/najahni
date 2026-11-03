import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import type { Role } from '../../generated/prisma/client.js';

export interface AuthUser {
  id: string;
  role: Role;
}

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

/** Route accessible sans jeton. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Restreint la route aux roles donnes. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/** Injecte l'utilisateur authentifie (issu du JWT). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser =>
    ctx.switchToHttp().getRequest<{ user: AuthUser }>().user,
);
