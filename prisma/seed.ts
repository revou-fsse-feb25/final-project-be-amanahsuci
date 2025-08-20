import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

type CinemaType = 'Reguler' | 'IMAX' | 'Premier';

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = await Promise.all([
        prisma.users.create({
            data: {
                name: 'John Doe',
                email: 'john@example.com',
                phone: '081234567890',
                password: hashedPassword,
                role: 'customer',
                points: 1000,
            },
        }),
        prisma.users.create({
            data: {
                name: 'Jane Smith',
                email: 'jane@example.com',
                phone: '081234567891',
                password: hashedPassword,
                role: 'customer',
                points: 500,
            },
        }),
        prisma.users.create({
            data: {
                name: 'Admin User',
                email: 'admin@example.com',
                phone: '081234567892',
                password: hashedPassword,
                role: 'admin',
                points: 0,
            },
        }),
        prisma.users.create({
            data: {
                name: 'Alice Johnson',
                email: 'alice@example.com',
                phone: '081234567893',
                password: hashedPassword,
                role: 'customer',
                points: 750,
            },
        }),
    ]);

    const movies = await Promise.all([
        prisma.movies.create({
            data: {
                title: 'Avengers: Endgame',
                description:
                'The Avengers assemble once more to reverse the damage caused by Thanos in Infinity War.',
                genre: 'Adventure, Drama',
                rating: '13+',
                duration_minutes: 181,
                poster_url: '/images/NowShowing/Avengers_poster.jpg',
            },
        }),
        prisma.movies.create({
            data: {
                title: 'Ballerina',
                description:
                'A young ballerina discovers a conspiracy that threatens everything she holds dear.',
                genre: 'Action, Criminal',
                rating: '17+',
                duration_minutes: 125,
                poster_url: '/images/NowShowing/Ballerina_poster.jpg',
            },
        }),
        prisma.movies.create({
            data: {
                title: 'The Conjuring',
                description:
                'Paranormal investigators help a family terrorized by a dark presence in their farmhouse.',
                genre: 'Horror, Thriller',
                rating: '17+',
                duration_minutes: 125,
                poster_url: '/images/NowShowing/Conjuring_poster.jpg',
            },
        }),
        prisma.movies.create({
            data: {
                title: 'Drifting Home',
                description:
                'Sixth-graders Kosuke and Natsume grew up in the same apartment building as childhood friends.',
                genre: 'Adventure, Drama',
                rating: '13+',
                duration_minutes: 120,
                poster_url: '/images/NowShowing/Drifting_Home_Poster.jpg',
            },
        }),
        prisma.movies.create({
            data: {
                title: 'John Wick',
                description:
                'An ex-hitman comes out of retirement to track down the gangsters that took everything from him.',
                genre: 'Action, Thriller',
                rating: '17+',
                duration_minutes: 101,
                poster_url: '/images/NowShowing/John_wick_poster.jpg',
            },
        }),
        prisma.movies.create({
            data: {
                title: '5 CM',
                description:
                'Five friends embark on a journey to climb Mount Semeru, the highest peak in Java.',
                genre: 'Adventure, Drama',
                rating: '13+',
                duration_minutes: 125,
                poster_url: '/images/NowShowing/Lima_cm_poster.jpg',
            },
        }),
        prisma.movies.create({
            data: {
                title: 'Mufasa: The Lion King',
                description:
                'A young lion prince flees his kingdom only to learn the true meaning of responsibility and bravery.',
                genre: 'Adventure, Animation, Musical',
                rating: 'G',
                duration_minutes: 118,
                poster_url: '/images/NowShowing/Mufasa_poster.jpg',
            },
        }),
        prisma.movies.create({
            data: {
                title: 'Paranormal Activity',
                description:
                'A young couple is haunted by a supernatural presence in their home.',
                genre: 'Horror, Thriller',
                rating: '17+',
                duration_minutes: 86,
                poster_url: '/images/NowShowing/Paranormal_activity_poster.jpg',
            },
        }),
        prisma.movies.create({
            data: {
                title: 'Pengabdi Setan',
                description:
                'A family is haunted by the death of their mother, who was involved in black magic.',
                genre: 'Horror, Thriller',
                rating: '17+',
                duration_minutes: 107,
                poster_url: '/images/NowShowing/Pengabdi_Setan_poster.jpg',
            },
        }),
        prisma.movies.create({
            data: {
                title: 'Spy X Family Code: White',
                description:
                'The Forger family goes on a vacation, but their peaceful trip takes an unexpected turn.',
                genre: 'Action, Animation, Comedy',
                rating: '11+',
                duration_minutes: 110,
                poster_url: '/images/NowShowing/Spy_X_Family_poster.png',
            },
        }),
        prisma.movies.create({
            data: {
                title: 'One Piece: Stampede',
                description:
                "The Straw Hat Pirates attend the Pirates Festival, the world's greatest exposition of pirates.",
                genre: 'Adventure, Animation, Drama',
                rating: '14+',
                duration_minutes: 101,
                poster_url: '/images/NowShowing/Stampede_poster.jpg',
            },
        }),
        prisma.movies.create({
            data: {
                title: 'Terrifier 3',
                description:
                'Art the Clown returns for another night of terror on Halloween night.',
                genre: 'Horror, Thriller',
                rating: '21+',
                duration_minutes: 125,
                poster_url: '/images/NowShowing/Terrifier_poster.jpg',
            },
        }),
    ]);

    const theaters = await Promise.all([
        prisma.theaters.create({
            data: {
                name: 'CinemaXX Padang',
                location: 'Plaza Andalas',
            },
        }),
        prisma.theaters.create({
            data: {
                name: 'Cineklex Padang', 
                location: 'BASKO Mall',
            },
        }),
    ]);

    const cinemaTypeConfigs: Array<{
        type: CinemaType;
        price: number;
        rows: number;
        seatsPerRow: number;
    }> = [
        { type: 'Reguler', rows: 10, seatsPerRow: 12, price: 45_000 },
        { type: 'IMAX', rows: 8, seatsPerRow: 10, price: 65_000 },
        { type: 'Premier', rows: 6, seatsPerRow: 6, price: 85_000 },
    ];

    const cinemas: Array<{
        id: number;
        type: CinemaType;
        theater_id: number;
        total_seats: number;
        price: number;
        rows: number;
        seatsPerRow: number;
    }> = [];

    for (const theater of theaters) {
        for (const config of cinemaTypeConfigs) {
            const totalSeats = config.rows * config.seatsPerRow; 
            const cinema = await prisma.cinemas.create({
                data: {
                    theater_id: theater.id,
                    type: config.type,
                    total_seats: totalSeats,
                    price: config.price,
                },
            });

            cinemas.push({
                id: cinema.id,
                type: cinema.type as CinemaType,
                theater_id: cinema.theater_id,
                total_seats: cinema.total_seats,
                price: cinema.price,
                rows: config.rows,
                seatsPerRow: config.seatsPerRow,
            });
        }
    }

    for (const cinema of cinemas) {
        const seats: { cinema_id: number; seat_number: string }[] = [];

        for (let row = 0; row < cinema.rows; row++) {
            const rowLetter = String.fromCharCode(65 + row);
            for (let seatNum = 1; seatNum <= cinema.seatsPerRow; seatNum++) {
                seats.push({
                    cinema_id: cinema.id,
                    seat_number: `${rowLetter}${seatNum}`,
                });
            }
        }

        await prisma.seats.createMany({
            data: seats,
            skipDuplicates: true, 
        });
    }

    const showtimeConfigs: Record<CinemaType, string[]> = {
        Reguler: ['10:00', '13:00', '16:00', '19:00', '22:00'],
        IMAX: ['11:00', '14:00', '17:00', '20:00'],
        Premier: ['12:00', '15:00', '18:00', '21:00'],
    };

    const showtimes: Array<{ id: number; cinema_id: number }> = [];
    const today = new Date();

    for (let day = 0; day < 7; day++) {
        const showDate = new Date(today);
        showDate.setDate(today.getDate() + day);

        for (const movie of movies) {
            for (const cinema of cinemas) {
                const timeSlots = showtimeConfigs[cinema.type];

                for (const timeSlot of timeSlots) {
                    const [hours, minutes] = timeSlot.split(':');
                    const startTime = new Date(showDate);
                    startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                    const showtime = await prisma.showtimes.create({
                        data: {
                            movie_id: movie.id,
                            cinema_id: cinema.id,
                            start_time: startTime,
                        },
                        select: { id: true, cinema_id: true },
                    });

                    showtimes.push(showtime);
                }
            }
        }
    }

    const sampleBookings: Array<{ id: number; showtime_id: number; payment_status: 'pending' | 'complete' | 'cancelled'; created_at: Date }> = [];

    for (let i = 0; i < 15; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomShowtime = showtimes[Math.floor(Math.random() * showtimes.length)];

        const cinema = cinemas.find((c) => c.id === randomShowtime.cinema_id);
        if (!cinema) continue;

        const numSeats = Math.floor(Math.random() * 4) + 1;
        const totalPrice = cinema.price * numSeats;

        const r = Math.random();
        const paymentStatus = r > 0.2 ? 'complete' : r > 0.1 ? 'pending' : 'cancelled';

        const booking = await prisma.bookings.create({
            data: {
                user_id: randomUser.id,
                showtime_id: randomShowtime.id,
                total_price: totalPrice,
                payment_status: paymentStatus,
                created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            },
            select: { id: true, showtime_id: true, payment_status: true, created_at: true },
        });
        sampleBookings.push(booking);

        const totalSeatsInCinema = cinema.rows * cinema.seatsPerRow;
        const randomStart = Math.max(0, Math.floor(Math.random() * Math.max(1, totalSeatsInCinema - numSeats)));

        let seatsBatch = await prisma.seats.findMany({
            where: { cinema_id: randomShowtime.cinema_id },
            orderBy: { id: 'asc' },
            skip: randomStart,
            take: numSeats,
        });

        if (seatsBatch.length < numSeats) {
            const needed = numSeats - seatsBatch.length;
            const extra = await prisma.seats.findMany({
                where: { cinema_id: randomShowtime.cinema_id },
                orderBy: { id: 'asc' },
                take: needed,
            });
            seatsBatch = seatsBatch.concat(extra);
        }

        for (const seat of seatsBatch) {
            await prisma.booking_Seats.create({
                data: {
                    booking_id: booking.id,
                    seat_id: seat.id,
                    status: booking.payment_status === 'complete' ? 'booked' : 'selected',
                },
            });
        }

        const paymentMethods = ['qris', 'e_wallet', 'bank_transfer'] as const;
        await prisma.payments.create({
            data: {
                booking_id: booking.id,
                method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
                status: booking.payment_status,
                paid_at: booking.payment_status === 'complete' ? booking.created_at : null,
            },
        });

        if (booking.payment_status === 'complete') {
            const pointsEarned = Math.floor(totalPrice / 1000);
            
            await prisma.points_Transactions.create({
                data: {
                    user_id: randomUser.id,
                    booking_id: booking.id,
                    type: 'earn',
                    points: pointsEarned,
                },
            });

            await prisma.users.update({
                where: { id: randomUser.id },
                data: { points: { increment: pointsEarned } },
            });
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
