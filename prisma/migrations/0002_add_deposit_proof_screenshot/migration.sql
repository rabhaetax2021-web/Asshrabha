-- AlterTable
ALTER TABLE "DepositRequest"
ADD COLUMN IF NOT EXISTS "proofScreenshot" TEXT;
