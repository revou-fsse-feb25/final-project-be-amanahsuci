/*
  Warnings:

  - You are about to drop the `ShowtimeTemplates` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ShowtimeTemplates" DROP CONSTRAINT "ShowtimeTemplates_cinema_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."ShowtimeTemplates" DROP CONSTRAINT "ShowtimeTemplates_movie_id_fkey";

-- DropTable
DROP TABLE "public"."ShowtimeTemplates";
