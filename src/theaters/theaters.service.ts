import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTheaterDto } from './dto/create-theater.dto';
import { UpdateTheaterDto } from './dto/update-theater.dto';
import { CreateCinemaDto } from '../cinemas/dto/create-cinema.dto';
import { UpdateCinemaDto } from '../cinemas/dto/update-cinema.dto';
import { CinemaType } from '@prisma/client';

@Injectable()
export class TheatersService {
  constructor(private readonly prisma: PrismaService) {}

  async createTheater(createTheaterDto: CreateTheaterDto) {
    const { name, location } = createTheaterDto;

    const existingTheater = await this.prisma.theaters.findFirst({
      where: {
        name,
        location,
      },
    });

    if (existingTheater) {
      throw new ConflictException('Theater with this name and location already exists');
    }

    const theater = await this.prisma.theaters.create({
      data: {
        name,
        location,
      },
    });

    return theater;
  }

  async findAllTheaters(page: number = 1, limit: number = 10, search?: string) {
    if (page < 1) throw new BadRequestException('Page must be greater than 0');
    if (limit < 1) throw new BadRequestException('Limit must be greater than 0');
    if (limit > 100) throw new BadRequestException('Limit cannot exceed 100');

    const skip = (page - 1) * limit;
    
    const whereCondition = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { location: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {};

    const [theaters, total] = await Promise.all([
      this.prisma.theaters.findMany({
        where: whereCondition,
        skip,
        take: limit,
        include: {
          cinemas: {
            select: {
              id: true,
              type: true,
              total_seats: true,
              price: true,
            },
          },
          _count: {
            select: {
              cinemas: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.theaters.count({ where: whereCondition }),
    ]);

    return {
      data: theaters,
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

  async findTheaterById(id: number) {
    const theater = await this.prisma.theaters.findUnique({
      where: { id },
      include: {
        cinemas: {
          include: {
            showtimes: {
              include: {
                movie: {
                  select: {
                    id: true,
                    title: true,
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
              where: {
                start_time: {
                  gte: new Date(),
                },
              },
              orderBy: { start_time: 'asc' },
            },
            seats: {
              select: {
                id: true,
                seat_number: true,
              },
              orderBy: { seat_number: 'asc' },
            },
          },
        },
      },
    });

    if (!theater) {
      throw new NotFoundException('Theater not found');
    }

    return theater;
  }

  async updateTheater(id: number, updateTheaterDto: UpdateTheaterDto) {
    const existingTheater = await this.prisma.theaters.findUnique({
      where: { id },
    });

    if (!existingTheater) {
      throw new NotFoundException('Theater not found');
    }

    if (updateTheaterDto.name && updateTheaterDto.location) {
      const theaterWithSameDetails = await this.prisma.theaters.findFirst({
        where: {
          name: updateTheaterDto.name,
          location: updateTheaterDto.location,
          NOT: { id },
        },
      });

      if (theaterWithSameDetails) {
        throw new ConflictException('Theater with this name and location already exists');
      }
    }

    try {
      const updatedTheater = await this.prisma.theaters.update({
        where: { id },
        data: updateTheaterDto,
      });

      return updatedTheater;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Theater not found');
      }
      throw error;
    }
  }

  async removeTheater(id: number) {
    const theater = await this.prisma.theaters.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            cinemas: true,
          },
        },
      },
    });

    if (!theater) {
      throw new NotFoundException('Theater not found');
    }

    if (theater._count.cinemas > 0) {
      throw new BadRequestException('Cannot delete theater with existing cinemas');
    }

    try {
      await this.prisma.theaters.delete({
        where: { id },
      });

      return { message: 'Theater deleted successfully' };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Theater not found');
      }
      throw error;
    }
  }

  async createCinema(createCinemaDto: CreateCinemaDto) {
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
    });

    return cinema;
  }

  async findAllCinemas(page: number = 1, limit: number = 10, theaterId?: number, type?: CinemaType) {
    if (page < 1) throw new BadRequestException('Page must be greater than 0');
    if (limit < 1) throw new BadRequestException('Limit must be greater than 0');
    if (limit > 100) throw new BadRequestException('Limit cannot exceed 100');

    const skip = (page - 1) * limit;
    
    const whereCondition: any = {};

    if (theaterId) {
      whereCondition.theater_id = theaterId;
    }

    if (type) {
      whereCondition.type = type;
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

  async findCinemaById(id: number) {
    const cinema = await this.prisma.cinemas.findUnique({
      where: { id },
      include: {
        theater: true,
        seats: {
          orderBy: { seat_number: 'asc' },
        },
        showtimes: {
          include: {
            movie: true,
            bookings: {
              select: {
                id: true,
                payment_status: true,
                created_at: true,
              },
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

  async updateCinema(id: number, updateCinemaDto: UpdateCinemaDto) {
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
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Cinema not found');
      }
      throw error;
    }
  }

  async removeCinema(id: number) {
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

    // Check for bookings through showtimes
    const bookingsCount = await this.prisma.bookings.count({
      where: {
        showtime: {
          cinema_id: id,
        },
      },
    });

    if (bookingsCount > 0) {
      throw new BadRequestException('Cannot delete cinema with existing bookings');
    }

    try {
      await this.prisma.seats.deleteMany({
        where: { cinema_id: id },
      });

      await this.prisma.cinemas.delete({
        where: { id },
      });

      return { message: 'Cinema deleted successfully' };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Cinema not found');
      }
      throw error;
    }
  }

  async getTheatersWithShowtimes(movieId?: number) {
    const whereCondition: any = {
      cinemas: {
        some: {
          showtimes: {
            some: {
              start_time: {
                gte: new Date(),
              },
              ...(movieId && { movie_id: movieId }),
            },
          },
        },
      },
    };

    const theaters = await this.prisma.theaters.findMany({
      where: whereCondition,
      include: {
        cinemas: {
          include: {
            showtimes: {
              where: {
                start_time: {
                  gte: new Date(),
                },
                ...(movieId && { movie_id: movieId }),
              },
              include: {
                movie: {
                  select: {
                    id: true,
                    title: true,
                    duration_minutes: true,
                  },
                },
              },
              orderBy: { start_time: 'asc' },
            },
          },
          where: {
            showtimes: {
              some: {
                start_time: {
                  gte: new Date(),
                },
                ...(movieId && { movie_id: movieId }),
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return theaters;
  }
}