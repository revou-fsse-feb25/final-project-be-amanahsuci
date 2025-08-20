import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShowtimeDto } from './dto/create-showtime.dto';
import { UpdateShowtimeDto } from './dto/update-showtime.dto';

@Injectable()
export class ShowtimesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createShowtimeDto: CreateShowtimeDto) {
    const { movie_id, cinema_id, start_time } = createShowtimeDto;

    const movie = await this.prisma.movies.findUnique({
      where: { id: movie_id },
    });
    if (!movie) throw new NotFoundException('Movie not found');

    const cinema = await this.prisma.cinemas.findUnique({
      where: { id: cinema_id },
    });
    if (!cinema) throw new NotFoundException('Cinema not found');

    const startTime = new Date(start_time);
    const endTime = new Date(startTime.getTime() + movie.duration_minutes * 60000);

    const conflictingShowtime = await this.prisma.showtimes.findFirst({
      where: {
        cinema_id,
        OR: [
          {
            start_time: {
              lt: endTime,
              gt: startTime,
            },
          },
          {
            start_time: {
              equals: startTime,
            },
          },
        ],
      },
    });

    if (conflictingShowtime) {
      throw new ConflictException('Time conflict with existing showtime in this cinema');
    }

    const showtime = await this.prisma.showtimes.create({
      data: {
        movie_id,
        cinema_id,
        start_time: startTime,
      },
      include: {
        movie: {
          select: {
            title: true,
            duration_minutes: true,
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
    });

    return showtime;
  }

  async findAll(page: number = 1, limit: number = 10, movieId?: number, cinemaId?: number, date?: string) {
    if (page < 1) throw new BadRequestException('Page must be greater than 0');
    if (limit < 1) throw new BadRequestException('Limit must be greater than 0');
    if (limit > 100) throw new BadRequestException('Limit cannot exceed 100');

    const skip = (page - 1) * limit;
    
    const whereCondition: any = {};

    if (movieId) whereCondition.movie_id = movieId;
    if (cinemaId) whereCondition.cinema_id = cinemaId;

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);

      whereCondition.start_time = {
        gte: startDate,
        lt: endDate,
      };
    } else {
      whereCondition.start_time = {
        gte: new Date(),
      };
    }

    const [showtimes, total] = await Promise.all([
      this.prisma.showtimes.findMany({
        where: whereCondition,
        skip,
        take: limit,
        include: {
          movie: {
            select: {
              title: true,
              genre: true,
              rating: true,
              duration_minutes: true,
              poster_url: true,
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
          bookings: {
            select: {
              id: true,
              payment_status: true,
            },
          },
        },
        orderBy: { start_time: 'asc' },
      }),
      this.prisma.showtimes.count({ where: whereCondition }),
    ]);

    return {
      data: showtimes,
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
    const showtime = await this.prisma.showtimes.findUnique({
      where: { id },
      include: {
        movie: true,
        cinema: {
          include: {
            theater: true,
            seats: {
              select: {
                id: true,
                seat_number: true,
              },
              orderBy: { seat_number: 'asc' },
            },
          },
        },
        bookings: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            booking_seats: {
              include: {
                seat: true,
              },
            },
          },
        },
      },
    });

    if (!showtime) {
      throw new NotFoundException('Showtime not found');
    }

    return showtime;
  }

  async update(id: number, updateShowtimeDto: UpdateShowtimeDto) {
    const existingShowtime = await this.prisma.showtimes.findUnique({
      where: { id },
      include: {
        movie: true,
      },
    });

    if (!existingShowtime) {
      throw new NotFoundException('Showtime not found');
    }

    if (updateShowtimeDto.movie_id) {
      const movie = await this.prisma.movies.findUnique({
        where: { id: updateShowtimeDto.movie_id },
      });
      if (!movie) throw new NotFoundException('Movie not found');
    }

    if (updateShowtimeDto.cinema_id) {
      const cinema = await this.prisma.cinemas.findUnique({
        where: { id: updateShowtimeDto.cinema_id },
      });
      if (!cinema) throw new NotFoundException('Cinema not found');
    }

    let startTime = existingShowtime.start_time;
    let movieDuration = existingShowtime.movie.duration_minutes;

    if (updateShowtimeDto.start_time) {
      startTime = new Date(updateShowtimeDto.start_time);
    }

    if (updateShowtimeDto.movie_id) {
      const movie = await this.prisma.movies.findUnique({
        where: { id: updateShowtimeDto.movie_id },
      });
      if (movie) movieDuration = movie.duration_minutes;
    }

    const endTime = new Date(startTime.getTime() + movieDuration * 60000);
    const cinemaId = updateShowtimeDto.cinema_id || existingShowtime.cinema_id;

    const conflictingShowtime = await this.prisma.showtimes.findFirst({
      where: {
        cinema_id: cinemaId,
        NOT: { id },
        OR: [
          {
            start_time: {
              lt: endTime,
              gt: startTime,
            },
          },
          {
            start_time: {
              equals: startTime,
            },
          },
        ],
      },
    });

    if (conflictingShowtime) {
      throw new ConflictException('Time conflict with existing showtime in this cinema');
    }

    try {
      const updatedShowtime = await this.prisma.showtimes.update({
        where: { id },
        data: updateShowtimeDto,
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
      });

      return updatedShowtime;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Showtime not found');
      }
      throw error;
    }
  }

  async remove(id: number) {
    const showtime = await this.prisma.showtimes.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    if (!showtime) {
      throw new NotFoundException('Showtime not found');
    }

    if (showtime._count.bookings > 0) {
      throw new BadRequestException('Cannot delete showtime with existing bookings');
    }

    try {
      await this.prisma.showtimes.delete({
        where: { id },
      });

      return { message: 'Showtime deleted successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Showtime not found');
      }
      throw error;
    }
  }

  async getShowtimesByMovie(movieId: number, date?: string) {
    const movie = await this.prisma.movies.findUnique({
      where: { id: movieId },
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    const whereCondition: any = {
      movie_id: movieId,
      start_time: {
        gte: new Date(),
      },
    };

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);

      whereCondition.start_time = {
        gte: startDate,
        lt: endDate,
      };
    }

    const showtimes = await this.prisma.showtimes.findMany({
      where: whereCondition,
      include: {
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
        bookings: {
          select: {
            id: true,
            payment_status: true,
          },
        },
      },
      orderBy: { start_time: 'asc' },
    });

    return {
      movie,
      showtimes,
    };
  }

  async getShowtimesByCinema(cinemaId: number, date?: string) {
    const cinema = await this.prisma.cinemas.findUnique({
      where: { id: cinemaId },
      include: {
        theater: true,
      },
    });

    if (!cinema) {
      throw new NotFoundException('Cinema not found');
    }

    const whereCondition: any = {
      cinema_id: cinemaId,
    };

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);

      whereCondition.start_time = {
        gte: startDate,
        lt: endDate,
      };
    } else {
      whereCondition.start_time = {
        gte: new Date(),
      };
    }

    const showtimes = await this.prisma.showtimes.findMany({
      where: whereCondition,
      include: {
        movie: {
          select: {
            title: true,
            genre: true,
            rating: true,
            duration_minutes: true,
          },
        },
        bookings: {
          select: {
            id: true,
            payment_status: true,
          },
        },
      },
      orderBy: { start_time: 'asc' },
    });

    return {
      cinema,
      showtimes,
    };
  }
}