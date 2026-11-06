import { ValidationPipe } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { CodeAttemptDto } from './coding.dto.js';
import { CODING_PACK } from './content/index.js';

// Memes options que main.ts : une reponse juste doit toujours pouvoir etre enregistree.
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

const doors = CODING_PACK.flatMap((c) => c.levels).flatMap((level) =>
  level.kind === 'GRID' ? [] : [[level.slug, level] as const],
);

describe('essai envoye par le navigateur', () => {
  it.each(doors)('%s : le TDO de la solution est accepte', async (_, level) => {
    const body = {
      code: level.data.algo.solution,
      success: true,
      language: 'ALGO',
      tdo: level.data.algo.tdo,
    };
    await expect(
      pipe.transform(body, { type: 'body', metatype: CodeAttemptDto }),
    ).resolves.toBeInstanceOf(CodeAttemptDto);
  });

  it('refuse un type inconnu', async () => {
    const body = {
      code: 'x',
      success: true,
      language: 'ALGO',
      tdo: [{ name: 'x', type: 'Inconnu' }],
    };
    await expect(
      pipe.transform(body, { type: 'body', metatype: CodeAttemptDto }),
    ).rejects.toThrow();
  });
});
