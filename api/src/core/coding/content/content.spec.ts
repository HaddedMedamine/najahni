import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { codeLines } from '../rules.js';
import type { PackLevel, TdoRow, TraceEvent } from '../types.js';
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
  ): Promise<
    { ok: boolean; got?: string; error: unknown; trace?: TraceEvent[] }[]
  >;
}
type Transpile = (
  source: string,
  tdo: TdoRow[] | null,
) => { python: string; errors: { line: number | null; message: string }[] };
type DoorLevel = Exclude<PackLevel, { kind: 'GRID' }>;
type StoryLevel = Extract<PackLevel, { kind: 'STORY' }>;
interface Folds {
  foldPenguins(
    initial: number[],
    events: TraceEvent[],
  ): { array: number[]; place: (number | null)[] };
  foldShop(
    start: Record<string, string[]>,
    events: TraceEvent[],
  ): { bags: { name: string; items: string[]; mode: string | null }[] };
  foldCards(events: TraceEvent[]): {
    cards: { fields: Record<string, unknown> }[];
  };
  foldCinema(rows: number[][], events: TraceEvent[]): number[][];
  isSorted(array: number[], target: 'asc' | 'desc'): boolean;
}

const levels: PackLevel[] = CODING_PACK.flatMap((c) => c.levels);
const doors = levels.filter((l): l is DoorLevel => l.kind !== 'GRID');
const stories = levels.filter((l): l is StoryLevel => l.kind === 'STORY');
/** Mission resolue : le programme est donne, il n'y a rien a cacher. */
const isSolved = (l: PackLevel) => l.kind === 'STORY' && !!l.data.story.solved;
const named = <T extends PackLevel>(list: T[]) =>
  list.map((l) => [l.slug, l] as const);
const fromFrontend = (path: string) =>
  import(pathToFileURL(fileURLToPath(new URL(path, frontend))).href);

/** Lignes de la reponse qui ne sont pas deja dans le code de depart. */
const answerLines = (level: PackLevel) => {
  const given = new Set(
    (level.kind === 'GRID'
      ? level.starterCode
      : `${level.starterCode}\n${level.data.algo.starter}`
    )
      .split('\n')
      .map((l) => l.trim()),
  );
  const answer =
    level.kind === 'GRID'
      ? level.solution
      : `${level.solution}\n${level.data.algo.solution}`;
  return (
    answer
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length >= 8 && !given.has(l))
      // Un import est du cours (Bitou le presente), pas la reponse
      .filter((l) => !/^from \w+ import /.test(l))
      // Une instruction seule (avancer()) n'est pas la reponse : Bitou doit la presenter
      .filter((l) => level.kind !== 'GRID' || !/^\w+\(\)$/.test(l))
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

  it("commence chaque chapitre de l'Aventure Bac par une mission resolue", () => {
    for (const chapter of CODING_PACK.filter((c) => c.kind === 'STORY')) {
      const [first, ...others] = chapter.levels;
      expect(isSolved(first), first.slug).toBe(true);
      for (const level of others)
        expect(isSolved(level), level.slug).toBe(false);
    }
  });

  it.each(named(stories.filter(isSolved)))(
    '%s : le corrige de la mission resolue est le bon programme',
    (_, level) => {
      const { algo, story } = level.data;
      expect(story.solved?.python).toBe(level.solution);
      expect(story.solved?.algo).toBe(algo.solution);
      expect(story.solved?.tdo).toEqual(algo.tdo);
      for (const note of story.solved?.notes ?? [])
        expect(algo.solution).toContain(note.code);
    },
  );

  it.each(named(levels))(
    "%s : le code de depart ne contient que le squelette, l'eleve ecrit tout",
    (_, level) => {
      const starts =
        level.kind === 'GRID'
          ? level.starterCode
          : `${level.starterCode}\n${level.data.algo.starter}`;
      const skeleton =
        /^(#|ALGORITHME\b|DEBUT$|FIN$|Début$|Fin$|Fonction\b|Proc[ée]dure\b|def\b|pass$)/i;
      for (const line of starts.split('\n').map((l) => l.trim()))
        if (line) expect(line).toMatch(skeleton);
    },
  );

  it.each(named(levels.filter((l) => !isSolved(l))))(
    '%s : ni Bitou ni les indices ne donnent la reponse',
    (_, level) => {
      const story = level.kind === 'STORY' ? level.data.story : null;
      const help = [
        level.bitou,
        level.statement,
        ...level.hints,
        ...(story ? [story.objective, ...story.principle] : []),
        ...(story?.intro.map((step) => step.say) ?? []),
      ].join('\n');
      for (const line of answerLines(level)) expect(help).not.toContain(line);
      expect(level.hints.length).toBeGreaterThan(0);
    },
  );

  describe.skipIf(!ready)('avec Python (frontend/public/pyodide)', () => {
    let engine: Engine;
    let transpile: Transpile;
    let folds: Folds;

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
      folds = (await fromFrontend(
        'src/components/shared/coding/story/trace.ts',
      )) as Folds;
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

    it.each(named(stories))(
      '%s : la scene rejoue le programme, en Python et en algorithme',
      async (_, level) => {
        const { algo, story, tests } = level.data;
        const { stage } = story;
        const programs = [
          level.solution,
          transpile(algo.solution, algo.tdo).python,
        ];
        for (const program of programs) {
          const [first] = await engine.runTests(program, tests);
          const trace = first.trace ?? [];
          expect(trace.length).toBeGreaterThan(0);
          expect(trace.every((e) => 'line' in e)).toBe(true);
          if (stage.type === 'penguins') {
            const end = folds.foldPenguins(stage.values, trace);
            expect(folds.isSorted(end.array, stage.target)).toBe(true);
            expect(end.place).not.toContain(null);
          } else if (stage.type === 'shop' || stage.type === 'archive') {
            const start = stage.type === 'shop' ? stage.bags : stage.drawers;
            const end = folds.foldShop(start, trace);
            expect(end.bags.every((b) => b.mode === null)).toBe(true);
          } else if (stage.type === 'cards') {
            // Chaque carte du premier test se remplit, avec les champs du decor
            const { cards } = folds.foldCards(trace);
            expect(cards).toHaveLength(stage.count);
            for (const card of cards)
              expect(Object.keys(card.fields).sort()).toEqual(
                [...stage.fields].sort(),
              );
          }
        }
      },
    );

    it.each(named(stories))(
      "%s : la scene et l'introduction partent du premier test",
      (_, level) => {
        const { story, tests } = level.data;
        const { stage } = story;
        const intro = story.intro.flatMap((step) => step.events);
        expect(story.intro.length).toBeGreaterThan(0);
        if (stage.type === 'penguins') {
          expect(tests[0].setup).toContain(stage.values.join(', '));
          const end = folds.foldPenguins(stage.values, intro);
          expect(folds.isSorted(end.array, stage.target)).toBe(true);
          expect(end.place).not.toContain(null);
        } else if (stage.type === 'cinema') {
          expect(tests[0].setup).toContain(JSON.stringify(stage.rows));
          expect(folds.foldCinema(stage.rows, intro)).toHaveLength(
            stage.rows.length,
          );
        } else if (stage.type === 'cards') {
          expect(folds.foldCards(intro).cards.length).toBe(stage.count);
        } else if (stage.type === 'shop') {
          const files = tests[0].files ?? {};
          for (const [name, items] of Object.entries(stage.bags))
            expect((files[name] ?? '').split('\n').filter(Boolean)).toEqual(
              items,
            );
        }
      },
    );
  });
});
