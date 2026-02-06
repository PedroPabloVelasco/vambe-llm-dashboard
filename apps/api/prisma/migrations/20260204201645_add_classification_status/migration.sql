-- AlterTable
ALTER TABLE "Meeting"
    ADD COLUMN "classificationStatus" TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN "classificationError" TEXT;
