/// <reference types="multer" />
import { randomUUID } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import {
  BadRequestException,
  Global,
  Injectable,
  Module,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Fichiers envoyes (exercices...) : enregistres sur le disque du serveur, dans UPLOAD_DIR.
// En base, seule la cle (nom du fichier sur le disque) est gardee dans Attachment.storageKey.

/** Types acceptes : PDF, images, Word. */
export const ALLOWED_FILES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_FILES = 10;

/** Multer decode le nom du fichier en latin1 : on le remet en UTF-8 (accents, arabe). */
export const originalName = (file: Express.Multer.File) =>
  Buffer.from(file.originalname, 'latin1').toString('utf8');

export function assertAllowed(file: Express.Multer.File) {
  const ext = extname(originalName(file)).toLowerCase();
  if (!ALLOWED_FILES[file.mimetype]?.includes(ext)) {
    throw new BadRequestException(
      `Type de fichier non accepte : ${originalName(file)} (PDF, images ou Word seulement)`,
    );
  }
}

@Injectable()
export class StorageService {
  private readonly root: string;

  constructor(config: ConfigService) {
    this.root = resolve(config.get('UPLOAD_DIR') ?? 'uploads');
  }

  /** Enregistre le fichier et renvoie sa cle. */
  async save(file: Express.Multer.File, folder: string) {
    const key = `${folder}/${randomUUID()}${extname(originalName(file)).toLowerCase()}`;
    await mkdir(resolve(this.root, folder), { recursive: true });
    await writeFile(this.path(key), file.buffer);
    return key;
  }

  async remove(key: string) {
    await rm(this.path(key), { force: true });
  }

  /** Reponse de telechargement : affiche dans le navigateur (PDF, images) ou telecharge. */
  stream(attachment: { storageKey: string; fileName: string; mimeType: string }) {
    const path = this.path(attachment.storageKey);
    if (!existsSync(path)) throw new NotFoundException('Fichier introuvable');
    const inline = attachment.mimeType === 'application/pdf' || attachment.mimeType.startsWith('image/');
    return new StreamableFile(createReadStream(path), {
      type: attachment.mimeType,
      disposition: `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`,
    });
  }

  private path(key: string) {
    const full = resolve(this.root, key);
    // Securite : jamais en dehors du dossier des fichiers
    if (!full.startsWith(this.root + sep)) throw new BadRequestException('Chemin invalide');
    return full;
  }
}

@Global()
@Module({ providers: [StorageService], exports: [StorageService] })
export class StorageModule {}
