import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { THROTTLERS } from './throttling.js';

const account = THROTTLERS.find((t) => t.name === 'account')!;
const skip = account.skipIf as (context: ExecutionContext) => boolean;
const context = (body: unknown) =>
  ({ switchToHttp: () => ({ getRequest: () => ({ body }) }) }) as unknown as ExecutionContext;
const tracker = (body: unknown) =>
  (account.getTracker as (request: Record<string, unknown>) => string)({ ip: '1.2.3.4', body });

describe('limite par compte', () => {
  it('compte chaque personne a part sur une meme IP', () => {
    expect(tracker({ identifier: 'a@x.tn' })).not.toBe(tracker({ identifier: 'b@x.tn' }));
  });

  it('ignore la casse et les espaces', () => {
    expect(tracker({ identifier: ' A@x.tn ' })).toBe(tracker({ identifier: 'a@x.tn' }));
  });

  it('ne concerne que les routes qui visent un compte', () => {
    expect(skip(context({ identifier: 'a@x.tn' }))).toBe(false);
    expect(skip(context({ code: 'x' }))).toBe(true);
    expect(skip(context(undefined))).toBe(true);
  });
});
