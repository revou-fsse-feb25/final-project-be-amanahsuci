import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCinemaDto } from './dto/create-cinema.dto';
import { UpdateCinemaDto } from './dto/update-cinema.dto';
import { CinemaType } from '@prisma/client';

@Injectable()
export class CinemasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCinemaDto: CreateCinemaDto) {
    const { theater_id, type, total_seats, price } = createCinemaDto;

    const theater = await this.prisma.theaters.findUnique({
      where: { id: theater_id },
    });

    if (!theater) {
      throw new NotFoundException('Theater not found');
    }

    const existingCinema = await this.prisma.cinemas.findFirst({
      where: {
        theater_id,
        type,
      },
    });

    if (existingCinema) {
      throw new ConflictException(`Cinema with type ${type} already exists in this theater`);
    }

    const cinema = await this.prisma.cinemas.create({
      data: {
        theater_id,
        type,
        total_seats,
        price,
      },
      include: {
        theater: {
          select: {
            name: true,
            location: true,
          },
        },
      },
    });

    return cinema;
  }

  async findAll(page: number = 1, limit: number = 10, theaterId?: number, cinemaType?: CinemaType) {
    if (page < 1) throw new BadRequestException('Page must be greater than 0');
    if (limit < 1) throw new BadRequestException('Limit must be greater than 0');
    if (limit > 100) throw new BadRequestException('Limit cannot exceed 100');

    const skip = (page - 1) * limit;
    
    const whereCondition: any = {};

    if (theaterId) {
      whereCondition.theater_id = theaterId;
    }

    if (cinemaType) {
      whereCondition.type = cinemaType;
    }

    const [cinemas, total] = await Promise.all([
      this.prisma.cinemas.findMany({
        where: whereCondition,
        skip,
        take: limit,
        include: {
          theater: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
          showtimes: {
            select: {
              id: true,
              start_time: true,
              movie: {
                select: {
                  title: true,
                },
              },
            },
            where: {
              start_time: {
                gte: new Date(),
              },
            },
            orderBy: { start_time: 'asc' },
            take: 3,
          },
          _count: {
            select: {
              showtimes: true,
              seats: true,
            },
          },
        },
        orderBy: [{ theater_id: 'asc' }, { type: 'asc' }],
      }),
      this.prisma.cinemas.count({ where: whereCondition }),
    ]);

    return {
      data: cinemas,
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
    const cinema = await this.prisma.cinemas.findUnique({
      where: { id },
      include: {
        theater: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        seats: {
          select: {
            id: true,
            seat_number: true,
          },
          orderBy: { seat_number: 'asc' },
        },
        showtimes: {
          include: {
            movie: {
              select: {
                id: true,
                title: true,
                duration_minutes: true,
                poster_url: true,
              },
            },
            bookings: {
              select: {
                id: true,
                payment_status: true,
              },
            },
          },
          where: {
            start_time: {
              gte: new Date(),
            },
          },
          orderBy: { start_time: 'asc' },
        },
      },
    });

    if (!cinema) {
      throw new NotFoundException('Cinema not found');
    }

    return cinema;
  }

  async findByTheater(theaterId: number) {
    const theater = await this.prisma.theaters.findUnique({
      where: { id: theaterId },
    });

    if (!theater) {
      throw new NotFoundException('Theater not found');
    }

    const cinemas = await this.prisma.cinemas.findMany({
      where: { theater_id: theaterId },
      include: {
        showtimes: {
          include: {
            movie: {
              select: {
                title: true,
              },
            },
          },
          where: {
            start_time: {
              gte: new Date(),
            },
          },
          orderBy: { start_time: 'asc' },
          take: 2,
        },
        _count: {
          select: {
            seats: true,
          },
        },
      },
      orderBy: { type: 'asc' },
    });

    return {
      theater,
      cinemas,
    };
  }

  async update(id: number, updateCinemaDto: UpdateCinemaDto) {
    const existingCinema = await this.prisma.cinemas.findUnique({
      where: { id },
    });

    if (!existingCinema) {
      throw new NotFoundException('Cinema not found');
    }

    if (updateCinemaDto.theater_id) {
      const theater = await this.prisma.theaters.findUnique({
        where: { id: updateCinemaDto.theater_id },
      });

      if (!theater) {
        throw new NotFoundException('Theater not found');
      }
    }

    if (updateCinemaDto.type && (updateCinemaDto.theater_id || existingCinema.theater_id)) {
      const theaterId = updateCinemaDto.theater_id || existingCinema.theater_id;
      const cinemaWithSameType = await this.prisma.cinemas.findFirst({
        where: {
          theater_id: theaterId,
          type: updateCinemaDto.type,
          NOT: { id },
        },
      });

      if (cinemaWithSameType) {
        throw new ConflictException(`Cinema with type ${updateCinemaDto.type} already exists in this theater`);
      }
    }

    try {
      const updatedCinema = await this.prisma.cinemas.update({
        where: { id },
        data: updateCinemaDto,
        include: {
          theater: {
            select: {
              name: true,
              location: true,
            },
          },
        },
      });

      return updatedCinema;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Cinema not found');
      }
      throw error;
    }
  }

  async remove(id: number) {
    const cinema = await this.prisma.cinemas.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            showtimes: true,
            seats: true,
          },
        },
      },
    });

    if (!cinema) {
      throw new NotFoundException('Cinema not found');
    }

    if (cinema._count.showtimes > 0) {
      throw new BadRequestException('Cannot delete cinema with active showtimes');
    }

    try {
      await this.prisma.seats.deleteMany({
        where: { cinema_id: id },
      });

      await this.prisma.cinemas.delete({
        where: { id },
      });

      return { message: 'Cinema deleted successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Cinema not found');
      }
      throw error;
    }
  }

  async getAvailableSeats(cinemaId: number, showtimeId?: number) {
    const cinema = await this.prisma.cinemas.findUnique({
      where: { id: cinemaId },
      include: {
        seats: {
          select: {
            id: true,
            seat_number: true,
          },
          orderBy: { seat_number: 'asc' },
        },
      },
    });

    if (!cinema) {
      throw new NotFoundException('Cinema not found');
    }

    let bookedSeats: number[] = [];

    if (showtimeId) {
      const bookings = await this.prisma.bookings.findMany({
        where: {
          showtime_id: showtimeId,
          payment_status: 'completed',
        },
        include: {
          booking_seats: {
            select: {
              seat_id: true,
            },
          },
        },
      });

      bookedSeats = bookings.flatMap(booking => 
        booking.booking_seats.map(bs => bs.seat_id)
      );
    }

    const availableSeats = cinema.seats.map(seat => ({
      id: seat.id,
      seat_number: seat.seat_number,
      is_available: !bookedSeats.includes(seat.id),
    }));

    return {
      cinema: {
        id: cinema.id,
        type: cinema.type,
        total_seats: cinema.total_seats,
      },
      available_seats: availableSeats,
      total_available: availableSeats.filter(seat => seat.is_available).length,
    };
  }

  async getCinemaStats(cinemaId: number) {
    const cinema = await this.prisma.cinemas.findUnique({
      where: { id: cinemaId },
      include: {
        theater: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!cinema) {
      throw new NotFoundException('Cinema not found');
    }

    const [totalShowtimes, upcomingShowtimes, totalBookings, revenue] = await Promise.all([
      this.prisma.showtimes.count({
        where: { cinema_id: cinemaId },
      }),
      this.prisma.showtimes.count({
        where: {
          cinema_id: cinemaId,
          start_time: {
            gte: new Date(),
          },
        },
      }),
      this.prisma.bookings.count({
        where: {
          showtime: {
            cinema_id: cinemaId,
          },
          payment_status: 'completed',
        },
      }),
      this.prisma.bookings.aggregate({
        where: {
          showtime: {
            cinema_id: cinemaId,
          },
          payment_status: 'completed',
        },
        _sum: {
          total_price: true,
        },
      }),
    ]);

    return {
      cinema: {
        id: cinema.id,
        type: cinema.type,
        theater: cinema.theater.name,
      },
      stats: {
        total_showtimes: totalShowtimes,
        upcoming_showtimes: upcomingShowtimes,
        total_bookings: totalBookings,
        total_revenue: revenue._sum.total_price || 0,
        occupancy_rate: totalShowtimes > 0 ? (totalBookings / (cinema.total_seats * totalShowtimes)) * 100 : 0,
      },
    };
  }
}