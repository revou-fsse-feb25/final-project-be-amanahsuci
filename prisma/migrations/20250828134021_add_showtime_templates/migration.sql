-- CreateTable
CREATE TABLE "public"."ShowtimeTemplates" (
    "id" SERIAL NOT NULL,
    "movie_id" INTEGER NOT NULL,
    "cinema_id" INTEGER NOT NULL,
    "start_time_of_day" TIME NOT NULL,

    CONSTRAINT "ShowtimeTemplates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShowtimeTemplates_movie_id_cinema_id_idx" ON "public"."ShowtimeTemplates"("movie_id", "cinema_id");

-- AddForeignKey
ALTER TABLE "public"."ShowtimeTemplates" ADD CONSTRAINT "ShowtimeTemplates_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "public"."Movies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShowtimeTemplates" ADD CONSTRAINT "ShowtimeTemplates_cinema_id_fkey" FOREIGN KEY ("cinema_id") REFERENCES "public"."Cinemas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
