-- CreateEnum
CREATE TYPE "public"."Unit" AS ENUM ('UN', 'M2', 'KG');

-- CreateEnum
CREATE TYPE "public"."StockMovementType" AS ENUM ('BUY', 'SELL', 'ADJUST_IN', 'ADJUST_OUT', 'RETURN', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "public"."SupplierType" AS ENUM ('CNPJ', 'CPF');

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

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "unit" "public"."Unit" NOT NULL,
    "description" TEXT,
    "status" INTEGER NOT NULL,
    "marginPercent" DECIMAL(5,2),
    "stockOnHand" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "avgUnitCost" DECIMAL(14,6) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Supplier" (
    "id" TEXT NOT NULL,
    "type" "public"."SupplierType" NOT NULL DEFAULT 'CNPJ',
    "name" TEXT NOT NULL,
    "fantasyName" TEXT,
    "document" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Movement" (
    "id" SERIAL NOT NULL,
    "type" "public"."StockMovementType" NOT NULL,
    "movementDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "supplierId" TEXT,
    "notes" TEXT,

    CONSTRAINT "Movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MovementItem" (
    "id" SERIAL NOT NULL,
    "movementId" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(10,4) NOT NULL,
    "costPrice" DECIMAL(10,2),
    "salePrice" DECIMAL(10,2),

    CONSTRAINT "MovementItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_document_key" ON "public"."User"("document");

-- CreateIndex
CREATE UNIQUE INDEX "User_activationKey_key" ON "public"."User"("activationKey");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_document_key" ON "public"."Supplier"("document");

-- CreateIndex
CREATE INDEX "Movement_type_movementDate_idx" ON "public"."Movement"("type", "movementDate");

-- CreateIndex
CREATE INDEX "MovementItem_productId_idx" ON "public"."MovementItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "MovementItem_movementId_productId_key" ON "public"."MovementItem"("movementId", "productId");

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Movement" ADD CONSTRAINT "Movement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Movement" ADD CONSTRAINT "Movement_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MovementItem" ADD CONSTRAINT "MovementItem_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "public"."Movement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MovementItem" ADD CONSTRAINT "MovementItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
