-- Paiement par serie de l'eleve (N presences) au lieu du "mois du groupe".
-- Les echeances non payees de l'ancien modele sont supprimees (le "a payer" est
-- desormais calcule a partir des presences) ; les series deja payees sont conservees.

-- DropForeignKey
ALTER TABLE "installments" DROP CONSTRAINT "installments_cycleId_fkey";

-- DropIndex
DROP INDEX "installments_status_dueDate_idx";

-- DropIndex
DROP INDEX "installments_studentId_cycleId_key";

-- Ancien modele : seules les echeances payees restent
DELETE FROM "installments" WHERE "status" <> 'PAID';

-- AlterTable
ALTER TABLE "installments" ADD COLUMN "number" INTEGER,
ALTER COLUMN "cycleId" DROP NOT NULL,
ALTER COLUMN "dueDate" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PAID';

-- Les series payees existantes deviennent 1, 2, 3... par eleve et par groupe
UPDATE "installments" i SET "number" = numbered.rn
FROM (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "studentId", "groupId" ORDER BY "createdAt") AS rn
  FROM "installments"
) numbered
WHERE i."id" = numbered."id";

ALTER TABLE "installments" ALTER COLUMN "number" SET NOT NULL;

-- CreateIndex
CREATE INDEX "installments_groupId_idx" ON "installments"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "installments_studentId_groupId_number_key" ON "installments"("studentId", "groupId", "number");

-- AddForeignKey
ALTER TABLE "installments" ADD CONSTRAINT "installments_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "billing_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;