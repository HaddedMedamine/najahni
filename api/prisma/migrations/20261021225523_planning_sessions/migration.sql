/*
  Warnings:

  - Added the required column `sessionsTarget` to the `billing_cycles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "billing_cycles" ADD COLUMN     "sessionsTarget" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "seriesId" TEXT;

-- CreateIndex
CREATE INDEX "sessions_seriesId_idx" ON "sessions"("seriesId");
