-- CreateEnum
CREATE TYPE "public"."Unit" AS ENUM ('UN', 'M2', 'KG');

-- CreateEnum
CREATE TYPE "public"."StockMovementType" AS ENUM ('BUY', 'SELL', 'ADJUST_IN', 'ADJUST_OUT', 'RETURN', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "public"."SupplierType" AS ENUM ('CNPJ', 'CPF');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('DRAFT', 'PENDING', 'CONFIRMED', 'COMPLETED', 'SHIPPED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "document" TEXT,
    "phone" TEXT,
    "password" TEXT,
    "role" INTEGER DEFAULT 2,
    "status" INTEGER DEFAULT 3,
    "activationKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "avatarURL" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_document_key" ON "public"."User"("document");

-- CreateIndex
CREATE UNIQUE INDEX "User_activationKey_key" ON "public"."User"("activationKey");
