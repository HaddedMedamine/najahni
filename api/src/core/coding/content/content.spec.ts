import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { codeLines } from '../rules.js';
import type { PackLevel, TdoRow } from '../types.js';
import { CODING_PACK } from './index.js';

// Chaque niveau est rejoue avec le vrai moteur du frontend (Pyodide) et le vrai
// traducteur d'algorithmes : la solution doit reussir, le code de depart ne doit pas suffire.
const frontend = new URL('../../../../../frontend/', import.meta.url);
const pyodideDir = fileURLToPath(new URL('public/pyodide/', frontend));
const ready = existsSync(pyodideDir);

interface Engine {
  runGrid(
    code: string,
    worlds: unknown[],
  ): Promise<{ success: boolean; worlds: { outcome: string }[] }>;
  runTests(
    code: string,
    tests: unknown[],
  ): Promise<{ ok: boolean; got?: string; error: unknown }[]>;
}
type Transpile = (
  source: string,
  tdo: TdoRow[] | null,
) => { python: string; errors: { line: number | null; message: string }[] };
type DoorLevel = Extract<PackLevel, { kind: 'PYTHON' }>;

const levels: PackLevel[] = CODING_PACK.flatMap((c) => c.levels);
const doors = levels.filter((l): l is DoorLevel => l.kind === 'PYTHON');
const named = <T extends PackLevel>(list: T[]) =>
  list.map((l) => [l.slug, l] as const);
const fromFrontend = (path: string) =>
  import(pathToFileURL(fileURLToPath(new URL(path, frontend))).href);

/** Lignes de la reponse qui ne sont pas deja dans le code de depart. */
const answerLines = (level: PackLevel) => {
  const given = new Set(
    (level.kind === 'PYTHON'
      ? `${level.starterCode}\n${level.data.algo.starter}`
      : level.starterCode
    )
      .split('\n')
      .map((l) => l.trim()),
  );
  const answer =
    level.kind === 'PYTHON'
      ? `${level.solution}\n${level.data.algo.solution}`
      : level.solution;
  return (
    answer
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length >= 8 && !given.has(l))
      // Une instruction seule (avancer()) n'est pas la reponse : Bitou doit la presenter
      .filter((l) => level.kind === 'PYTHON' || !/^\w+\(\)$/.test(l))
  );
};

describe('contenu Coder', () => {
  it('a des identifiants uniques', () => {
    const slugs = [
      ...CODING_PACK.map((c) => c.slug),
      ...levels.map((l) => l.slug),
    ];
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('range chaque niveau dans le jeu de son chapitre', () => {
    for (const chapter of CODING_PACK) {
      for (const level of chapter.levels) expect(level.kind).toBe(chapter.kind);
    }
  });

  it.each(named(levels))(
    '%s : ni Bitou ni les indices ne donnent la reponse',
    (_, level) => {
      const help = [level.bitou, level.statement, ...level.hints].join('\n');
      for (const line of answerLines(level)) expect(help).not.toContain(line);
      expect(level.hints.length).toBeGreaterThan(0);
    },
  );

  describe.skipIf(!ready)('avec Python (frontend/public/pyodide)', () => {
    let engine: Engine;
    let transpile: Transpile;

    beforeAll(async () => {
      const { loadPyodide } = (await import(
        new URL('node_modules/pyodide/pyodide.mjs', frontend).href
      )) as { loadPyodide: (o: { indexURL: string }) => Promise<unknown> };
      const { createEngine } = (await fromFrontend(
        'src/core/python/engine.ts',
      )) as { createEngine: (py: unknown) => Promise<Engine> };
      ({ transpile } = (await fromFrontend('src/core/algo/transpile.ts')) as {
        transpile: Transpile;
      });
      engine = await createEngine(await loadPyodide({ indexURL: pyodideDir }));
    }, 120_000);

    const passes = async (level: DoorLevel, python: string) =>
      (await engine.runTests(python, level.data.tests)).every((r) => r.ok);

    it.each(
      named(levels.filter((l) => l.kind === 'GRID')) as [
        string,
        Extract<PackLevel, { kind: 'GRID' }>,
      ][],
    )('%s : la solution reussit avec 3 etoiles', async (_, level) => {
      const run = await engine.runGrid(level.solution, level.data.worlds);
      expect(run.success, JSON.stringify(run.worlds)).toBe(true);
      expect(codeLines(level.solution)).toBeLessThanOrEqual(
        level.data.stars[0],
      );
      const start = await engine.runGrid(level.starterCode, level.data.worlds);
      expect(start.success).toBe(false);
    });

    it.each(named(doors))(
      '%s : la solution Python reussit, le code de depart non',
      async (_, level) => {
        const results = await engine.runTests(level.solution, level.data.tests);
        expect(
          results.every((r) => r.ok),
          JSON.stringify(results),
        ).toBe(true);
        expect(await passes(level, level.starterCode)).toBe(false);
      },
    );

    it.each(named(doors))(
      '%s : la solution algorithmique (avec TDO) reussit',
      async (_, level) => {
        const { algo } = level.data;
        const { python, errors } = transpile(algo.solution, algo.tdo);
        expect(errors).toEqual([]);
        const results = await engine.runTests(python, level.data.tests);
        expect(
          results.every((r) => r.ok),
          python + JSON.stringify(results),
        ).toBe(true);
        // Le squelette de depart, sans TDO, ne suffit pas
        const start = transpile(algo.starter, []);
        expect(
          start.errors.length > 0 || !(await passes(level, start.python)),
        ).toBe(true);
      },
    );
  });
});
