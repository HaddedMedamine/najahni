-- CreateEnum
CREATE TYPE "CodeTrack" AS ENUM ('BASES', 'TROIS_SI', 'BAC_INFO', 'BAC_ECO');

-- CreateEnum
CREATE TYPE "CodeLevelKind" AS ENUM ('GRID', 'PYTHON');

-- CreateTable
CREATE TABLE "code_chapters" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "track" "CodeTrack" NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "code_chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "code_levels" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "kind" "CodeLevelKind" NOT NULL,
    "title" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "bitou" TEXT NOT NULL,
    "algorithm" TEXT,
    "starterCode" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "hints" TEXT[],
    "data" JSONB NOT NULL,
    "builtIn" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "code_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "code_progress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "lastCode" TEXT NOT NULL DEFAULT '',
    "bestCode" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "code_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "code_chapters_slug_key" ON "code_chapters"("slug");

-- CreateIndex
CREATE INDEX "code_chapters_track_order_idx" ON "code_chapters"("track", "order");

-- CreateIndex
CREATE UNIQUE INDEX "code_levels_slug_key" ON "code_levels"("slug");

-- CreateIndex
CREATE INDEX "code_levels_chapterId_order_idx" ON "code_levels"("chapterId", "order");

-- CreateIndex
CREATE INDEX "code_progress_levelId_idx" ON "code_progress"("levelId");

-- CreateIndex
CREATE UNIQUE INDEX "code_progress_studentId_levelId_key" ON "code_progress"("studentId", "levelId");

-- AddForeignKey
ALTER TABLE "code_levels" ADD CONSTRAINT "code_levels_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "code_chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code_progress" ADD CONSTRAINT "code_progress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code_progress" ADD CONSTRAINT "code_progress_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "code_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
