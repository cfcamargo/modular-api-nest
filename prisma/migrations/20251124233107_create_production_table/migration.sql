-- CreateEnum
CREATE TYPE "public"."ProductionStatus" AS ENUM ('PENDING', 'IN_PRODUCTION', 'CONFERENCE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."ProductionOrder" (
    "id" TEXT NOT NULL,
    "code" SERIAL NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "public"."ProductionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionOrder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."ProductionOrder" ADD CONSTRAINT "ProductionOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
