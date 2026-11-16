import type { ExecutionContext } from '@nestjs/common';
import type { ThrottlerOptions } from '@nestjs/throttler';

type AuthRequest = { ip?: string; body?: { identifier?: unknown } };

/** Compte vise par une demande de connexion ou de mot de passe oublie. */
function identifierOf(request: AuthRequest) {
  const value = request.body?.identifier;
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

/**
 * default : limite par IP et par route.
 * account : 5 essais par minute pour un compte depuis une IP. Ainsi une classe sur le
 * meme Wi-Fi se connecte sans se bloquer, et deviner un mot de passe reste lent.
 */
export const THROTTLERS: ThrottlerOptions[] = [
  { name: 'default', ttl: 60_000, limit: 100 },
  {
    name: 'account',
    ttl: 60_000,
    limit: 5,
    skipIf: (context: ExecutionContext) =>
      !identifierOf(context.switchToHttp().getRequest<AuthRequest>()),
    getTracker: (request: Record<string, unknown>) =>
      `${String(request.ip)}:${identifierOf(request as AuthRequest)}`,
  },
];
