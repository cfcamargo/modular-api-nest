/*
  Warnings:

  - A unique constraint covering the columns `[activationKey]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activationKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_activationKey_key" ON "User"("activationKey");
