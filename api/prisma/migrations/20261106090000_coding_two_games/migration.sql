-- AlterEnum
ALTER TYPE "CodeLevelKind" ADD VALUE 'GRID';

-- AlterTable
ALTER TABLE "code_chapters" ADD COLUMN     "kind" "CodeLevelKind" NOT NULL DEFAULT 'PYTHON',
ALTER COLUMN "track" DROP NOT NULL;

-- AlterTable
ALTER TABLE "code_levels" DROP COLUMN "algorithm";
