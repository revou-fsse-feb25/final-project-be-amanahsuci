import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Status, SeatStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBookingDto: CreateBookingDto) {
    const { user_id, showtime_id, seats } = createBookingDto;

    const user = await this.prisma.users.findUnique({
      where: { id: user_id },
    });
    if (!user) throw new NotFoundException('User not found');

    const showtime = await this.prisma.showtimes.findUnique({
      where: { id: showtime_id },
      include: {
        cinema: true,
        movie: true,
      },
    });
    if (!showtime) throw new NotFoundException('Showtime not found');

    if (new Date(showtime.start_time) < new Date()) {
      throw new BadRequestException('Cannot book for past showtime');
    }

    if (!seats || seats.length === 0) {
      throw new BadRequestException('At least one seat must be selected');
    }

    const seatIds = seats.map(seat => seat.seat_id);

    const validSeats = await this.prisma.seats.findMany({
      where: {
        id: { in: seatIds },
        cinema_id: showtime.cinema_id,
      },
    });

    if (validSeats.length !== seatIds.length) {
      throw new BadRequestException('Invalid seat selection for this cinema');
    }

    const existingBookings = await this.prisma.bookings.findMany({
      where: {
        showtime_id,
        payment_status: 'complete',
      },
      include: {
        booking_seats: {
          where: {
            seat_id: { in: seatIds },
          },
        },
      },
    });

    const bookedSeats = existingBookings.flatMap(booking =>
      booking.booking_seats.map(bs => bs.seat_id)
    );

    if (bookedSeats.length > 0) {
      throw new ConflictException('Some seats are already booked');
    }

    const totalPrice = showtime.cinema.price * seatIds.length;

    return await this.prisma.$transaction(async (prisma) => {
      const booking = await prisma.bookings.create({
        data: {
          user_id,
          showtime_id,
          total_price: totalPrice,
          payment_status: 'pending',
        },
      });

      await prisma.booking_Seats.createMany({
        data: seatIds.map(seat_id => ({
          booking_id: booking.id,
          seat_id,
          status: 'selected',
        })),
      });

      return await prisma.bookings.findUnique({
        where: { id: booking.id },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          showtime: {
            include: {
              movie: {
                select: {
                  title: true,
                },
              },
              cinema: {
                include: {
                  theater: {
                    select: {
                      name: true,
                      location: true,
                    },
                  },
                },
              },
            },
          },
          booking_seats: {
            include: {
              seat: true,
            },
          },
        },
      });
    });
  }

  async findAll(page: number = 1, limit: number = 10, userId?: number, status?: Status) {
    if (page < 1) throw new BadRequestException('Page must be greater than 0');
    if (limit < 1) throw new BadRequestException('Limit must be greater than 0');
    if (limit > 100) throw new BadRequestException('Limit cannot exceed 100');

    const skip = (page - 1) * limit;
    
    const whereCondition: any = {};

    if (userId) whereCondition.user_id = userId;
    if (status) whereCondition.payment_status = status;

    const [bookings, total] = await Promise.all([
      this.prisma.bookings.findMany({
        where: whereCondition,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          showtime: {
            include: {
              movie: {
                select: {
                  title: true,
                },
              },
              cinema: {
                include: {
                  theater: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          booking_seats: {
            include: {
              seat: true,
            },
          },
          payments: {
            select: {
              method: true,
              status: true,
              paid_at: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.bookings.count({ where: whereCondition }),
    ]);

    return {
      data: bookings,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: number) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        showtime: {
          include: {
            movie: true,
            cinema: {
              include: {
                theater: true,
              },
            },
          },
        },
        booking_seats: {
          include: {
            seat: true,
          },
        },
        payments: true,
        points_transactions: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async findByUser(userId: number, page: number = 1, limit: number = 10) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.findAll(page, limit, userId);
  }

  async update(id: number, updateBookingDto: UpdateBookingDto) {
    const existingBooking = await this.prisma.bookings.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      throw new NotFoundException('Booking not found');
    }

    try {
      const updatedBooking = await this.prisma.bookings.update({
        where: { id },
        data: updateBookingDto,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          showtime: {
            include: {
              movie: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      });

      return updatedBooking;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Booking not found');
      }
      throw error;
    }
  }

  async cancelBooking(id: number) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id },
      include: {
        showtime: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (new Date(booking.showtime.start_time) < new Date()) {
      throw new BadRequestException('Cannot cancel booking for past showtime');
    }

    if (booking.payment_status === 'complete') {
      throw new BadRequestException('Cannot cancel completed booking');
    }

    try {
      const cancelledBooking = await this.prisma.bookings.update({
        where: { id },
        data: {
          payment_status: 'cancelled',
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          showtime: {
            include: {
              movie: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      });

      await this.prisma.booking_Seats.deleteMany({
        where: { booking_id: id },
      });

      return cancelledBooking;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Booking not found');
      }
      throw error;
    }
  }

  async confirmPayment(bookingId: number) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: {
        showtime: true,
        user: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.payment_status !== 'pending') {
      throw new BadRequestException('Booking is not in pending status');
    }

    return await this.prisma.$transaction(async (prisma) => {
      const updatedBooking = await prisma.bookings.update({
        where: { id: bookingId },
        data: {
          payment_status: 'complete',
        },
      });

      await prisma.booking_Seats.updateMany({
        where: { booking_id: bookingId },
        data: { status: 'booked' },
      });

      const pointsEarned = Math.floor(booking.total_price / 1000);

      await prisma.points_Transactions.create({
        data: {
          user_id: booking.user_id,
          booking_id: bookingId,
          type: 'earn',
          points: pointsEarned,
        },
      });

      await prisma.users.update({
        where: { id: booking.user_id },
        data: {
          points: {
            increment: pointsEarned,
          },
        },
      });

      return await prisma.bookings.findUnique({
        where: { id: bookingId },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              points: true,
            },
          },
          showtime: {
            include: {
              movie: {
                select: {
                  title: true,
                },
              },
              cinema: {
                include: {
                  theater: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          booking_seats: {
            include: {
              seat: true,
            },
          },
          points_transactions: {
            where: {
              booking_id: bookingId,
            },
          },
        },
      });
    });
  }

  async getBookingStats(userId?: number) {
    const whereCondition = userId ? { user_id: userId } : {};

    const [totalBookings, completedBookings, pendingBookings, cancelledBookings, totalRevenue] = await Promise.all([
      this.prisma.bookings.count({ where: whereCondition }),
      this.prisma.bookings.count({
        where: {
          ...whereCondition,
          payment_status: 'complete',
        },
      }),
      this.prisma.bookings.count({
        where: {
          ...whereCondition,
          payment_status: 'pending',
        },
      }),
      this.prisma.bookings.count({
        where: {
          ...whereCondition,
          payment_status: 'cancelled',
        },
      }),
      this.prisma.bookings.aggregate({
        where: {
          ...whereCondition,
          payment_status: 'complete',
        },
        _sum: {
          total_price: true,
        },
      }),
    ]);

    return {
      total_bookings: totalBookings,
      completed_bookings: completedBookings,
      pending_bookings: pendingBookings,
      cancelled_bookings: cancelledBookings,
      completion_rate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
      total_revenue: totalRevenue._sum.total_price || 0,
    };
  }
}