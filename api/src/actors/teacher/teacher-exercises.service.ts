import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../core/audit/audit.service.js';
import { exerciseSelect, flatten } from '../../core/exercises/queries.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import {
  assertAllowed,
  MAX_FILES,
  originalName,
  StorageService,
} from '../../core/storage/storage.service.js';
import type { CreateExerciseDto, UpdateExerciseDto } from './dto/exercises.dto.js';

/** Exercices en fichiers : l'enseignant les publie pour ses groupes d'un niveau. */
@Injectable()
export class TeacherExercisesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
  ) {}

  async list(userId: string) {
    const teacher = await this.teacherOf(userId);
    const items = await this.prisma.exercise.findMany({
      where: { authorId: teacher.id, isArchived: false },
      select: exerciseSelect,
      orderBy: { createdAt: 'desc' },
    });
    return items.map(flatten);
  }

  async create(userId: string, dto: CreateExerciseDto, files: Express.Multer.File[]) {
    const teacher = await this.teacherOf(userId);
    if (files.length === 0) throw new BadRequestException('Ajoutez au moins un fichier');
    if (files.length > MAX_FILES) throw new BadRequestException(`${MAX_FILES} fichiers maximum`);
    files.forEach(assertAllowed);
    const groups = await this.ownGroups(teacher.id, dto.groupIds, dto.level);

    // Fichiers d'abord sur le disque ; s'il y a une erreur en base, on les supprime
    const saved: { key: string; file: Express.Multer.File }[] = [];
    try {
      for (const file of files) saved.push({ key: await this.storage.save(file, 'exercises'), file });
      const exercise = await this.prisma.exercise.create({
        data: {
          authorId: teacher.id,
          title: dto.title.trim(),
          description: dto.description?.trim() || null,
          level: dto.level,
          subject: [...new Set(groups.map((g) => g.subject))].join(', '),
          assignments: {
            create: groups.map((g) => ({ groupId: g.id, assignedById: teacher.id, requiresTeacherValidation: false })),
          },
          attachments: {
            create: saved.map(({ key, file }) => ({
              storageKey: key,
              fileName: originalName(file),
              mimeType: file.mimetype,
              size: file.size,
              uploadedById: userId,
            })),
          },
        },
        select: exerciseSelect,
      });
      await this.audit.log({ actorId: userId, action: 'exercise.create', entity: 'Exercise', entityId: exercise.id });
      return flatten(exercise);
    } catch (e) {
      await Promise.all(saved.map(({ key }) => this.storage.remove(key)));
      throw e;
    }
  }

  /** Modifier le titre, les consignes ou les groupes (meme niveau). */
  async update(userId: string, id: string, dto: UpdateExerciseDto) {
    const teacher = await this.teacherOf(userId);
    const exercise = await this.own(teacher.id, id);
    const groups = dto.groupIds ? await this.ownGroups(teacher.id, dto.groupIds, exercise.level) : null;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (groups) {
        await tx.exerciseAssignment.deleteMany({ where: { exerciseId: id, groupId: { notIn: groups.map((g) => g.id) } } });
        const existing = await tx.exerciseAssignment.findMany({ where: { exerciseId: id }, select: { groupId: true } });
        const have = new Set(existing.map((a) => a.groupId));
        await tx.exerciseAssignment.createMany({
          data: groups
            .filter((g) => !have.has(g.id))
            .map((g) => ({ exerciseId: id, groupId: g.id, assignedById: teacher.id, requiresTeacherValidation: false })),
        });
      }
      return tx.exercise.update({
        where: { id },
        data: {
          title: dto.title?.trim(),
          description: dto.description === undefined ? undefined : dto.description.trim() || null,
          subject: groups ? [...new Set(groups.map((g) => g.subject))].join(', ') : undefined,
        },
        select: exerciseSelect,
      });
    });
    await this.audit.log({ actorId: userId, action: 'exercise.update', entity: 'Exercise', entityId: id });
    return flatten(updated);
  }

  /** Supprime l'exercice et ses fichiers : les eleves ne le voient plus. */
  async remove(userId: string, id: string) {
    const teacher = await this.teacherOf(userId);
    await this.own(teacher.id, id);
    const files = await this.prisma.attachment.findMany({ where: { exerciseId: id }, select: { storageKey: true } });
    await this.prisma.exercise.delete({ where: { id } });
    await Promise.all(files.map((f) => this.storage.remove(f.storageKey)));
    await this.audit.log({ actorId: userId, action: 'exercise.delete', entity: 'Exercise', entityId: id });
    return { deleted: true };
  }

  async file(userId: string, id: string, fileId: string) {
    const teacher = await this.teacherOf(userId);
    await this.own(teacher.id, id);
    const attachment = await this.prisma.attachment.findFirst({ where: { id: fileId, exerciseId: id } });
    if (!attachment) throw new NotFoundException('Fichier introuvable');
    return this.storage.stream(attachment);
  }

  /** Les groupes choisis doivent etre a moi, actifs et du niveau choisi. */
  private async ownGroups(teacherId: string, groupIds: string[], level: string) {
    const ids = [...new Set(groupIds)];
    const groups = await this.prisma.group.findMany({
      where: { id: { in: ids }, teacherId, archivedAt: null },
      select: { id: true, subject: true, level: true },
    });
    if (groups.length !== ids.length) {
      throw new BadRequestException("Un des groupes n'existe pas ou n'est pas a vous");
    }
    if (groups.some((g) => g.level !== level)) {
      throw new BadRequestException(`Tous les groupes doivent etre du niveau ${level}`);
    }
    return groups;
  }

  private async own(teacherId: string, id: string) {
    const exercise = await this.prisma.exercise.findFirst({
      where: { id, authorId: teacherId },
      select: { id: true, level: true },
    });
    if (!exercise) throw new NotFoundException('Exercice introuvable');
    return exercise;
  }

  private teacherOf(userId: string) {
    return this.prisma.teacher.findUniqueOrThrow({ where: { userId }, select: { id: true } });
  }
}
