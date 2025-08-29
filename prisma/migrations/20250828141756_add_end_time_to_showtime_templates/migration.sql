/*
  Warnings:

  - Added the required column `end_time_of_day` to the `ShowtimeTemplates` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."ShowtimeTemplates" ADD COLUMN     "end_time_of_day" TIMESTAMP(3) NOT NULL;
