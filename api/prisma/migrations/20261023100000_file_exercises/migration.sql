-- AlterTable
ALTER TABLE "exercises" ADD COLUMN     "description" TEXT,
ALTER COLUMN "section" DROP NOT NULL,
ALTER COLUMN "statement" DROP NOT NULL,
ALTER COLUMN "totalPoints" DROP NOT NULL;

