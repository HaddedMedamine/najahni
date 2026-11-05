-- Les niveaux "grille" (souris guidee par avancer / tourner) sont retires
DELETE FROM "code_levels" WHERE "kind" = 'GRID';

-- CreateEnum
CREATE TYPE "CodeLanguage" AS ENUM ('PYTHON', 'ALGO');

-- AlterEnum
BEGIN;
CREATE TYPE "CodeLevelKind_new" AS ENUM ('PYTHON');
ALTER TABLE "code_levels" ALTER COLUMN "kind" TYPE "CodeLevelKind_new" USING ("kind"::text::"CodeLevelKind_new");
ALTER TYPE "CodeLevelKind" RENAME TO "CodeLevelKind_old";
ALTER TYPE "CodeLevelKind_new" RENAME TO "CodeLevelKind";
DROP TYPE "CodeLevelKind_old";
COMMIT;

-- AlterTable
ALTER TABLE "code_progress" ADD COLUMN     "language" "CodeLanguage" NOT NULL DEFAULT 'PYTHON',
ADD COLUMN     "tdo" JSONB;

