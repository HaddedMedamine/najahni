// Supprime les donnees creees par les tests automatiques.
// Usage : npx tsx scripts/cleanup-test-data.ts <marqueur>
// Le marqueur figure dans le nom de famille / nom des groupes et salles de test.
import 'dotenv/config';
import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const marker = process.argv[2];
if (!marker || marker.length < 4) {
  console.error('Marqueur requis (au moins 4 caracteres)');
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const groups = await prisma.group.findMany({
  where: { name: { contains: marker } },
  select: { id: true },
});
const groupIds = groups.map((g) => g.id);

// Exercices des enseignants de test : fichiers sur le disque puis lignes
const exerciseWhere = { author: { user: { lastName: { contains: marker } } } };
const files = await prisma.attachment.findMany({
  where: { exercise: exerciseWhere },
  select: { storageKey: true },
});
const uploads = resolve(process.env.UPLOAD_DIR ?? 'uploads');
await Promise.all(files.map((f) => rm(resolve(uploads, f.storageKey), { force: true })));

// Ordre impose par les cles etrangeres
await prisma.$transaction([
  prisma.exercise.deleteMany({ where: exerciseWhere }),
  prisma.installment.deleteMany({ where: { groupId: { in: groupIds } } }),
  prisma.session.deleteMany({ where: { groupId: { in: groupIds } } }),
  prisma.billingCycle.deleteMany({ where: { groupId: { in: groupIds } } }),
  prisma.group.deleteMany({ where: { id: { in: groupIds } } }),
  prisma.room.deleteMany({ where: { name: { contains: marker } } }),
  prisma.user.deleteMany({ where: { lastName: { contains: marker } } }),
]);
console.log(`Donnees de test "${marker}" supprimees (${groupIds.length} groupe(s))`);
await prisma.$disconnect();
