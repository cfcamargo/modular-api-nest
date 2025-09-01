/*
  Warnings:

  - Added the required column `type` to the `Supplier` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."SupplierType" AS ENUM ('PJ', 'PF');

-- AlterTable
ALTER TABLE "public"."Supplier" ADD COLUMN     "type" "public"."SupplierType" NOT NULL;
