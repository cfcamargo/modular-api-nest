-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "avgUnitCost" DECIMAL(14,6) NOT NULL DEFAULT 0,
ADD COLUMN     "stockOnHand" DECIMAL(14,4) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."StockMovement" ADD COLUMN     "marginPct" DECIMAL(7,4),
ADD COLUMN     "originId" TEXT,
ADD COLUMN     "originType" TEXT,
ADD COLUMN     "reversedAt" TIMESTAMP(3),
ADD COLUMN     "reversedById" TEXT,
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "unitCost" SET DATA TYPE DECIMAL(14,6),
ALTER COLUMN "unitSalePrice" SET DATA TYPE DECIMAL(14,6),
ALTER COLUMN "totalCost" SET DATA TYPE DECIMAL(18,6),
ALTER COLUMN "totalRevenue" SET DATA TYPE DECIMAL(18,6);

-- CreateIndex
CREATE INDEX "StockMovement_productId_createdAt_idx" ON "public"."StockMovement"("productId", "createdAt");
