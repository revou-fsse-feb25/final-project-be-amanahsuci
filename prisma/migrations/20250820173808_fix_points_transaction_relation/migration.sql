-- DropForeignKey
ALTER TABLE "public"."Points_Transactions" DROP CONSTRAINT "Points_Transactions_booking_id_fkey";

-- AlterTable
ALTER TABLE "public"."Points_Transactions" ADD COLUMN     "is_voided" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "void_reason" TEXT,
ADD COLUMN     "voided_at" TIMESTAMP(3),
ALTER COLUMN "booking_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Points_Transactions" ADD CONSTRAINT "Points_Transactions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."Bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
