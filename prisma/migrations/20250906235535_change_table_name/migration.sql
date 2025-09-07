/*
  Warnings:

  - You are about to drop the column `socialName` on the `Supplier` table. All the data in the column will be lost.
  - Added the required column `name` to the `Supplier` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Supplier" DROP COLUMN "socialName",
ADD COLUMN     "name" TEXT NOT NULL;
