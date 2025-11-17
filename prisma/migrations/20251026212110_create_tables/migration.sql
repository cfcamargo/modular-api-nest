/*
  Warnings:

  - The primary key for the `Movement` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `MovementItem` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "public"."MovementItem" DROP CONSTRAINT "MovementItem_movementId_fkey";

-- AlterTable
ALTER TABLE "public"."Movement" DROP CONSTRAINT "Movement_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Movement_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Movement_id_seq";

-- AlterTable
ALTER TABLE "public"."MovementItem" DROP CONSTRAINT "MovementItem_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "movementId" SET DATA TYPE TEXT,
ADD CONSTRAINT "MovementItem_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "MovementItem_id_seq";

-- AddForeignKey
ALTER TABLE "public"."MovementItem" ADD CONSTRAINT "MovementItem_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "public"."Movement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
