/*
  Warnings:

  - The values [PJ,PF] on the enum `SupplierType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."SupplierType_new" AS ENUM ('CNPJ', 'CPF');
ALTER TABLE "public"."Supplier" ALTER COLUMN "type" TYPE "public"."SupplierType_new" USING ("type"::text::"public"."SupplierType_new");
ALTER TYPE "public"."SupplierType" RENAME TO "SupplierType_old";
ALTER TYPE "public"."SupplierType_new" RENAME TO "SupplierType";
DROP TYPE "public"."SupplierType_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."Supplier" ADD COLUMN     "fantasyName" TEXT;
