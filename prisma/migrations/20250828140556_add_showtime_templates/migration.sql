/*
  Warnings:

  - Changed the type of `start_time_of_day` on the `ShowtimeTemplates` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."ShowtimeTemplates" DROP COLUMN "start_time_of_day",
ADD COLUMN     "start_time_of_day" TIMESTAMP(3) NOT NULL;
