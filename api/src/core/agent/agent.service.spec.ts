import type { ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import { AgentKeyGuard } from './agent.service.js';

const guard = (key?: string) =>
  new AgentKeyGuard({ get: () => key } as unknown as ConfigService);

const request = (key?: unknown) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ headers: { 'x-agent-key': key } }),
    }),
  }) as unknown as ExecutionContext;

describe('cle de n8n', () => {
  it('laisse passer la bonne cle', () => {
    expect(guard('secret').canActivate(request('secret'))).toBe(true);
  });

  it('refuse une mauvaise cle ou une cle absente', () => {
    expect(() => guard('secret').canActivate(request('autre'))).toThrow();
    expect(() => guard('secret').canActivate(request())).toThrow();
  });

  it('refuse tout quand aucune cle n\'est configuree', () => {
    expect(() => guard(undefined).canActivate(request(''))).toThrow();
    expect(() => guard('').canActivate(request(''))).toThrow();
  });
});
