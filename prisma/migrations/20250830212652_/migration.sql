/*
  Warnings:

  - The values [ENTRY,EXIT,ADJUSTMENT] on the enum `StockMovementType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."StockMovementType_new" AS ENUM ('PURCHASE', 'SALE', 'ADJUST_IN', 'ADJUST_OUT', 'RETURN_TO_SUPPLIER', 'RETURN_FROM_CLIENT', 'TRANSFER_OUT', 'TRANSFER_IN');
ALTER TABLE "public"."StockMovement" ALTER COLUMN "type" TYPE "public"."StockMovementType_new" USING ("type"::text::"public"."StockMovementType_new");
ALTER TYPE "public"."StockMovementType" RENAME TO "StockMovementType_old";
ALTER TYPE "public"."StockMovementType_new" RENAME TO "StockMovementType";
DROP TYPE "public"."StockMovementType_old";
COMMIT;
