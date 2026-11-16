import {
  ForbiddenException,
  Global,
  Injectable,
  Logger,
  Module,
  NotFoundException,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import {
  type CodeLanguage,
  type CodeLevelKind,
  type CodeTrack,
  Prisma,
} from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CODING_PACK } from './content/index.js';
import { starsFor, trackOf } from './rules.js';
import type { DoorData, TdoRow } from './types.js';

const personName = { select: { firstName: true, lastName: true } } as const;

/** Chapitres d'un parcours (ceux sans parcours sont communs a tous). */
const trackChapters = (track: CodeTrack, kind?: CodeLevelKind) =>
  ({
    isActive: true,
    kind,
    OR: [{ track }, { track: null }],
  }) satisfies Prisma.CodeChapterWhereInput;

/** Niveaux actifs d'un parcours, pour un jeu ou pour les deux. */
const trackLevels = (track: CodeTrack, kind?: CodeLevelKind) =>
  ({
    isActive: true,
    chapter: trackChapters(track, kind),
  }) satisfies Prisma.CodeLevelWhereInput;

const levelOrder = [
  { chapter: { order: 'asc' } },
  { order: 'asc' },
] satisfies Prisma.CodeLevelOrderByWithRelationInput[];

/**
 * Partie "Coder" : contenu, deblocage des niveaux, etoiles et suivi.
 * Le code de l'eleve s'execute dans son navigateur (Pyodide) ; l'API enregistre
 * les essais et calcule les etoiles.
 */
@Injectable()
export class CodingService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CodingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Au demarrage : recopie le contenu fourni avec l'application. Un echec (migration
   * pas encore appliquee...) est journalise sans empecher l'API de demarrer.
   */
  async onApplicationBootstrap() {
    try {
      await this.syncPack();
    } catch (error) {
      this.logger.error(
        `Contenu Coder non synchronise : ${(error as Error).message}. Lancez "npx prisma migrate deploy" puis redemarrez l'API.`,
      );
    }
  }

  /** Upsert par slug des chapitres et niveaux du contenu fourni. */
  private async syncPack() {
    const levelSlugs: string[] = [];
    for (const [chapterOrder, chapter] of CODING_PACK.entries()) {
      const { levels, ...fields } = chapter;
      const saved = await this.prisma.codeChapter.upsert({
        where: { slug: chapter.slug },
        create: { ...fields, order: chapterOrder, isActive: true },
        update: { ...fields, order: chapterOrder, isActive: true },
      });
      for (const [order, level] of levels.entries()) {
        levelSlugs.push(level.slug);
        const data = {
          ...level,
          data: level.data as unknown as Prisma.InputJsonValue,
          chapterId: saved.id,
          order,
          builtIn: true,
          isActive: true,
        };
        await this.prisma.codeLevel.upsert({
          where: { slug: level.slug },
          create: data,
          update: data,
        });
      }
    }
    // Niveau retire du contenu : masque (la progression des eleves est gardee)
    await this.prisma.codeLevel.updateMany({
      where: { builtIn: true, slug: { notIn: levelSlugs } },
      data: { isActive: false },
    });
    await this.prisma.codeChapter.updateMany({
      where: { slug: { notIn: CODING_PACK.map((c) => c.slug) } },
      data: { isActive: false },
    });
    this.logger.log(`Contenu Coder synchronise (${levelSlugs.length} niveaux)`);
  }

  /** Les deux jeux de l'eleve : chapitres, niveaux, etoiles et verrous. */
  async studentMap(userId: string) {
    const { student, track } = await this.studentTrack(userId);
    if (!track)
      return { track: null, games: { GRID: [], PYTHON: [], STORY: [] } };
    const progress = await this.progressByLevel(student.id);
    const [GRID, PYTHON, STORY] = await Promise.all([
      this.gameChapters(track, 'GRID', progress),
      this.gameChapters(track, 'PYTHON', progress),
      this.gameChapters(track, 'STORY', progress),
    ]);
    return { track, games: { GRID, PYTHON, STORY } };
  }

  /** Chapitres d'un jeu : chaque niveau s'ouvre quand le precedent du jeu est reussi. */
  private async gameChapters(
    track: CodeTrack,
    kind: CodeLevelKind,
    progress: Awaited<ReturnType<CodingService['progressByLevel']>>,
  ) {
    const chapters = await this.prisma.codeChapter.findMany({
      where: trackChapters(track, kind),
      orderBy: { order: 'asc' },
      include: {
        levels: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          select: { id: true, slug: true, title: true, data: true },
        },
      },
    });

    let previousDone = true;
    return chapters.map(({ levels, ...chapter }) => ({
      ...chapter,
      levels: levels.map(({ data, ...level }, index) => {
        const p = progress.get(level.id);
        const unlocked =
          allUnlocked() ||
          previousDone ||
          Boolean(p?.completedAt) ||
          (index === 0 && opensChapters(kind));
        previousDone = Boolean(p?.completedAt);
        return {
          ...level,
          scene: kind === 'GRID' ? null : (data as unknown as DoorData).scene,
          unlocked,
          stars: p?.stars ?? 0,
          attempts: p?.attempts ?? 0,
          completed: Boolean(p?.completedAt),
        };
      }),
    }));
  }

  /** Un niveau ne s'ouvre, et ne s'enregistre, qu'apres la reussite du precedent. */
  private assertUnlocked(
    level: { id: string; kind: CodeLevelKind; chapterId: string },
    ordered: { id: string; chapterId: string }[],
    progress: Awaited<ReturnType<CodingService['progressByLevel']>>,
  ) {
    const previous = ordered[ordered.findIndex((l) => l.id === level.id) - 1];
    const opensChapter =
      opensChapters(level.kind) && previous?.chapterId !== level.chapterId;
    if (
      previous &&
      !allUnlocked() &&
      !opensChapter &&
      !progress.get(previous.id)?.completedAt
    ) {
      throw new ForbiddenException(
        'Reussissez le niveau precedent pour ouvrir celui-ci',
      );
    }
  }

  /** Un niveau ouvert, sans les solutions (Python, algorithme et TDO). */
  async studentLevel(userId: string, levelId: string) {
    const { student, track } = await this.studentTrack(userId);
    const { level, ordered } = await this.levelInTrack(levelId, track);
    const progress = await this.progressByLevel(student.id);
    this.assertUnlocked(level, ordered, progress);
    const index = ordered.findIndex((l) => l.id === levelId);
    const { solution: _solution, data, ...visible } = level;
    const p = progress.get(levelId);
    return {
      ...visible,
      data: level.kind === 'GRID' ? data : hideAlgoSolution(data),
      progress: {
        stars: p?.stars ?? 0,
        attempts: p?.attempts ?? 0,
        completed: Boolean(p?.completedAt),
        lastCode: p?.lastCode || null,
        language: p?.language ?? 'PYTHON',
        tdo: (p?.tdo as TdoRow[] | null) ?? null,
      },
      nextLevelId: ordered[index + 1]?.id ?? null,
    };
  }

  /**
   * Enregistre un essai. `success` est determine par le navigateur, qui a execute
   * le code ; les etoiles sont calculees ici (on garde le meilleur resultat).
   */
  async recordAttempt(
    userId: string,
    levelId: string,
    attempt: {
      code: string;
      success: boolean;
      language: CodeLanguage;
      tdo?: TdoRow[];
    },
  ) {
    const { code, success, language } = attempt;
    const tdo =
      language === 'ALGO' && attempt.tdo
        ? (attempt.tdo as unknown as Prisma.InputJsonValue)
        : undefined;
    const { student, track } = await this.studentTrack(userId);
    const { level, ordered } = await this.levelInTrack(levelId, track);
    this.assertUnlocked(level, ordered, await this.progressByLevel(student.id));
    const before = await this.prisma.codeProgress.findUnique({
      where: { studentId_levelId: { studentId: student.id, levelId } },
    });
    const attempts = (before?.attempts ?? 0) + 1;
    const stars = success
      ? starsFor(level.kind, level.data, code, attempts)
      : 0;
    const improved = stars > (before?.stars ?? 0);

    const saved = await this.prisma.codeProgress.upsert({
      where: { studentId_levelId: { studentId: student.id, levelId } },
      create: {
        studentId: student.id,
        levelId,
        attempts,
        stars,
        lastCode: code,
        language,
        tdo,
        bestCode: success ? code : null,
        completedAt: success ? new Date() : null,
      },
      update: {
        attempts,
        lastCode: code,
        language,
        tdo: tdo ?? Prisma.DbNull,
        ...(improved && { stars, bestCode: code }),
        ...(success && !before?.completedAt && { completedAt: new Date() }),
      },
    });
    return {
      success,
      stars,
      bestStars: saved.stars,
      firstSuccess: success && !before?.completedAt,
      attempts: saved.attempts,
    };
  }

  /**
   * Suivi : eleves (tous, ou ceux de l'enseignant) avec leur avancement.
   * `studentIds` undefined = tous les eleves actifs.
   */
  async progressOverview(studentIds?: string[]) {
    const students = await this.prisma.student.findMany({
      where: { archivedAt: null, id: studentIds && { in: studentIds } },
      select: {
        id: true,
        level: true,
        section: true,
        user: { select: { ...personName.select, lastLoginAt: true } },
        codeProgress: {
          where: { level: { isActive: true } },
          select: { stars: true, completedAt: true, updatedAt: true },
        },
      },
      orderBy: { user: { lastName: 'asc' } },
    });
    const totals = await this.levelCountByTrack();

    return students.flatMap(({ codeProgress, ...s }) => {
      const track = trackOf(s.level, s.section);
      if (!track) return [];
      const done = codeProgress.filter((p) => p.completedAt);
      return [
        {
          ...s,
          track,
          totalLevels: (totals.get(track) ?? 0) + (totals.get(null) ?? 0),
          completed: done.length,
          stars: done.reduce((sum, p) => sum + p.stars, 0),
          lastActivity:
            codeProgress
              .map((p) => p.updatedAt)
              .sort((a, b) => b.getTime() - a.getTime())[0] ?? null,
        },
      ];
    });
  }

  /** Detail d'un eleve : chaque niveau de son parcours, avec son dernier code. */
  async studentDetail(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, level: true, section: true, user: personName },
    });
    if (!student) throw new NotFoundException('Eleve introuvable');
    const track = trackOf(student.level, student.section);
    if (!track) return { student, track: null, levels: [] };

    const [levels, progress] = await Promise.all([
      this.prisma.codeLevel.findMany({
        where: trackLevels(track),
        orderBy: levelOrder,
        select: {
          id: true,
          title: true,
          kind: true,
          solution: true,
          chapter: { select: { title: true } },
        },
      }),
      this.progressByLevel(studentId),
    ]);
    return {
      student,
      track,
      levels: levels.map((level) => {
        const p = progress.get(level.id);
        return {
          ...level,
          stars: p?.stars ?? 0,
          attempts: p?.attempts ?? 0,
          completedAt: p?.completedAt ?? null,
          lastCode: p?.lastCode || null,
          language: p?.language ?? 'PYTHON',
          tdo: p?.tdo ?? null,
          bestCode: p?.bestCode ?? null,
          updatedAt: p?.updatedAt ?? null,
        };
      }),
    };
  }

  /** Eleves actuels des groupes d'un enseignant. */
  async teacherStudentIds(userId: string) {
    const rows = await this.prisma.groupStudent.findMany({
      where: { leftAt: null, group: { teacher: { userId } } },
      select: { studentId: true },
      distinct: ['studentId'],
    });
    return rows.map((r) => r.studentId);
  }

  private async studentTrack(userId: string) {
    const student = await this.prisma.student.findUniqueOrThrow({
      where: { userId },
    });
    return { student, track: trackOf(student.level, student.section) };
  }

  private async levelInTrack(levelId: string, track: CodeTrack | null) {
    if (!track) throw new NotFoundException('Niveau introuvable');
    const level = await this.prisma.codeLevel.findFirst({
      where: { id: levelId, ...trackLevels(track) },
      include: { chapter: { select: { id: true, title: true } } },
    });
    if (!level) throw new NotFoundException('Niveau introuvable');
    const ordered = await this.prisma.codeLevel.findMany({
      where: trackLevels(track, level.kind),
      orderBy: levelOrder,
      select: { id: true, chapterId: true },
    });
    return { level, ordered };
  }

  private async progressByLevel(studentId: string) {
    const rows = await this.prisma.codeProgress.findMany({
      where: { studentId },
    });
    return new Map(rows.map((r) => [r.levelId, r]));
  }

  private async levelCountByTrack() {
    const levels = await this.prisma.codeLevel.findMany({
      where: { isActive: true, chapter: { isActive: true } },
      select: { chapter: { select: { track: true } } },
    });
    // Cle null : les chapitres communs a tous les parcours
    const counts = new Map<CodeTrack | null, number>();
    for (const l of levels)
      counts.set(l.chapter.track, (counts.get(l.chapter.track) ?? 0) + 1);
    return counts;
  }
}

/** Pour essayer le contenu : CODING_UNLOCK_ALL=true dans .env ouvre toutes les missions. */
const allUnlocked = () => process.env.CODING_UNLOCK_ALL === 'true';

/** Aventure Bac : la premiere mission de chaque chapitre est toujours ouverte. */
const opensChapters = (kind: CodeLevelKind) => kind === 'STORY';

/** L'eleve recoit le squelette de l'algorithme, jamais la solution ni le TDO. */
function hideAlgoSolution(data: unknown) {
  const { algo, ...rest } = data as unknown as DoorData;
  return { ...rest, algo: { starter: algo.starter } };
}

@Global()
@Module({
  providers: [CodingService],
  exports: [CodingService],
})
export class CodingModule {}
