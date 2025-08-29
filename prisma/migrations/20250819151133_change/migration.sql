/*
  Warnings:

  - You are about to drop the `booking_seats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `bookings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cinemas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `movies` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `points_transactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `seats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `showtimes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `theaters` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."booking_seats" DROP CONSTRAINT "booking_seats_booking_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."booking_seats" DROP CONSTRAINT "booking_seats_seat_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."bookings" DROP CONSTRAINT "bookings_showtime_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."bookings" DROP CONSTRAINT "bookings_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."cinemas" DROP CONSTRAINT "cinemas_theater_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_booking_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."points_transactions" DROP CONSTRAINT "points_transactions_booking_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."points_transactions" DROP CONSTRAINT "points_transactions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."seats" DROP CONSTRAINT "seats_cinema_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."showtimes" DROP CONSTRAINT "showtimes_cinema_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."showtimes" DROP CONSTRAINT "showtimes_movie_id_fkey";

-- DropTable
DROP TABLE "public"."booking_seats";

-- DropTable
DROP TABLE "public"."bookings";

-- DropTable
DROP TABLE "public"."cinemas";

-- DropTable
DROP TABLE "public"."movies";

-- DropTable
DROP TABLE "public"."payments";

-- DropTable
DROP TABLE "public"."points_transactions";

-- DropTable
DROP TABLE "public"."seats";

-- DropTable
DROP TABLE "public"."showtimes";

-- DropTable
DROP TABLE "public"."theaters";

-- DropTable
DROP TABLE "public"."users";

-- CreateTable
CREATE TABLE "public"."Users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Movies" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "poster_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Movies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Theaters" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Theaters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Cinemas" (
    "id" SERIAL NOT NULL,
    "theater_id" INTEGER NOT NULL,
    "type" "public"."CinemaType" NOT NULL,
    "total_seats" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "Cinemas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Showtimes" (
    "id" SERIAL NOT NULL,
    "movie_id" INTEGER NOT NULL,
    "cinema_id" INTEGER NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Showtimes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Seats" (
    "id" SERIAL NOT NULL,
    "cinema_id" INTEGER NOT NULL,
    "seat_number" TEXT NOT NULL,

    CONSTRAINT "Seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Bookings" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "showtime_id" INTEGER NOT NULL,
    "total_price" INTEGER NOT NULL,
    "payment_status" "public"."Status" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Booking_Seats" (
    "booking_id" INTEGER NOT NULL,
    "seat_id" INTEGER NOT NULL,
    "status" "public"."SeatStatus" NOT NULL,

    CONSTRAINT "Booking_Seats_pkey" PRIMARY KEY ("booking_id","seat_id")
);

-- CreateTable
CREATE TABLE "public"."Payments" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "method" "public"."PaymentMethod" NOT NULL,
    "status" "public"."Status" NOT NULL,
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "Payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Points_Transactions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "type" "public"."PointType" NOT NULL,
    "points" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Points_Transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "public"."Users"("email");

-- AddForeignKey
ALTER TABLE "public"."Cinemas" ADD CONSTRAINT "Cinemas_theater_id_fkey" FOREIGN KEY ("theater_id") REFERENCES "public"."Theaters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Showtimes" ADD CONSTRAINT "Showtimes_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "public"."Movies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Showtimes" ADD CONSTRAINT "Showtimes_cinema_id_fkey" FOREIGN KEY ("cinema_id") REFERENCES "public"."Cinemas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Seats" ADD CONSTRAINT "Seats_cinema_id_fkey" FOREIGN KEY ("cinema_id") REFERENCES "public"."Cinemas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bookings" ADD CONSTRAINT "Bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bookings" ADD CONSTRAINT "Bookings_showtime_id_fkey" FOREIGN KEY ("showtime_id") REFERENCES "public"."Showtimes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking_Seats" ADD CONSTRAINT "Booking_Seats_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."Bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking_Seats" ADD CONSTRAINT "Booking_Seats_seat_id_fkey" FOREIGN KEY ("seat_id") REFERENCES "public"."Seats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payments" ADD CONSTRAINT "Payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."Bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Points_Transactions" ADD CONSTRAINT "Points_Transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Points_Transactions" ADD CONSTRAINT "Points_Transactions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."Bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
