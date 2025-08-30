/*
  Warnings:

  - The values [complete] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."Status_new" AS ENUM ('pending', 'completed', 'cancelled');
ALTER TABLE "public"."Bookings" ALTER COLUMN "payment_status" TYPE "public"."Status_new" USING ("payment_status"::text::"public"."Status_new");
ALTER TABLE "public"."Payments" ALTER COLUMN "status" TYPE "public"."Status_new" USING ("status"::text::"public"."Status_new");
ALTER TYPE "public"."Status" RENAME TO "Status_old";
ALTER TYPE "public"."Status_new" RENAME TO "Status";
DROP TYPE "public"."Status_old";
COMMIT;
