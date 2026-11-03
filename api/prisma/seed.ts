import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { hashPassword } from '../src/core/auth/password.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL et SEED_ADMIN_PASSWORD sont requis');
  }

  // Ne modifie pas un admin existant (son mot de passe a pu etre change)
  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: await hashPassword(password),
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'Najahni',
    },
  });
  console.log(`Administrateur pret : ${admin.email}`);
}

await main().finally(() => prisma.$disconnect());
