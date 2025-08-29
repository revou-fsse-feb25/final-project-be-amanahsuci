/*
  Warnings:

  - Changed the type of `payment_status` on the `bookings` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `payments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('pending', 'complete', 'cancel');

-- AlterTable
ALTER TABLE "public"."bookings" DROP COLUMN "payment_status",
ADD COLUMN     "payment_status" "public"."Status" NOT NULL;

-- AlterTable
ALTER TABLE "public"."payments" DROP COLUMN "status",
ADD COLUMN     "status" "public"."Status" NOT NULL;

-- DropEnum
DROP TYPE "public"."PaymentStatus";
