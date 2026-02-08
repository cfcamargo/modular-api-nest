-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "ie" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "installmentPrice" DECIMAL(10,2) NOT NULL DEFAULT 0;
