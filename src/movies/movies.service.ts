import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

@Injectable()
export class MoviesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createMovieDto: CreateMovieDto) {
    const { title, description, genre, rating, duration_minutes, poster_url } = createMovieDto;

    // Check if movie with same title already exists
    const existingMovie = await this.prisma.movies.findFirst({
      where: { title },
    });

    if (existingMovie) {
      throw new ConflictException('Movie with this title already exists');
    }

    const movie = await this.prisma.movies.create({
      data: {
        title,
        description,
        genre,
        rating,
        duration_minutes,
        poster_url: poster_url || '/images/default-movie-poster.jpg',
      },
    });

    return movie;
  }

  async findAll(page: number = 1, limit: number = 10, search?: string, genre?: string) {
    if (page < 1) throw new BadRequestException('Page must be greater than 0');
    if (limit < 1) throw new BadRequestException('Limit must be greater than 0');
    if (limit > 100) throw new BadRequestException('Limit cannot exceed 100');

    const skip = (page - 1) * limit;
    
    const whereCondition: any = {};

    if (search) {
      whereCondition.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { genre: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (genre) {
      whereCondition.genre = { contains: genre, mode: 'insensitive' };
    }

    const [movies, total] = await Promise.all([
      this.prisma.movies.findMany({
        where: whereCondition,
        skip,
        take: limit,
        include: {
          showtimes: {
            select: {
              id: true,
              start_time: true,
              cinema: {
                select: {
                  type: true,
                  theater: {
                    select: {
                      name: true,
                      location: true,
                    },
                  },
                },
              },
            },
            where: {
              start_time: {
                gte: new Date(), // Only future showtimes
              },
            },
            orderBy: { start_time: 'asc' },
            take: 5,
          },
        },
        orderBy: { title: 'asc' },
      }),
      this.prisma.movies.count({ where: whereCondition }),
    ]);

    return {
      data: movies,
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
    const movie = await this.prisma.movies.findUnique({
      where: { id },
      include: {
        showtimes: {
          include: {
            cinema: {
              include: {
                theater: true,
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
        },
      },
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    return movie;
  }

  async findByTitle(title: string) {
    const movie = await this.prisma.movies.findFirst({
      where: { 
        title: { contains: title, mode: 'insensitive' } 
      },
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    return movie;
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    const existingMovie = await this.prisma.movies.findUnique({
      where: { id },
    });

    if (!existingMovie) {
      throw new NotFoundException('Movie not found');
    }

    // Check if title is being changed to an existing title
    if (updateMovieDto.title && updateMovieDto.title !== existingMovie.title) {
      const movieWithTitle = await this.prisma.movies.findFirst({
        where: { title: updateMovieDto.title },
      });

      if (movieWithTitle) {
        throw new ConflictException('Movie with this title already exists');
      }
    }

    try {
      const updatedMovie = await this.prisma.movies.update({
        where: { id },
        data: {
          ...updateMovieDto,
          updated_at: new Date(),
        },
      });

      return updatedMovie;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Movie not found');
      }
      throw error;
    }
  }

  async remove(id: number) {
    const movie = await this.prisma.movies.findUnique({
      where: { id },
    });

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    // Check if movie has showtimes
    const showtimesCount = await this.prisma.showtimes.count({
      where: { movie_id: id },
    });

    if (showtimesCount > 0) {
      throw new BadRequestException('Cannot delete movie with active showtimes');
    }

    try {
      await this.prisma.movies.delete({
        where: { id },
      });

      return { message: 'Movie deleted successfully' };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Movie not found');
      }
      throw error;
    }
  }

  async getNowShowing() {
    const now = new Date();
    const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    const movies = await this.prisma.movies.findMany({
      where: {
        showtimes: {
          some: {
            start_time: {
              gte: now,
              lte: threeHoursFromNow,
            },
          },
        },
      },
      include: {
        showtimes: {
          where: {
            start_time: {
              gte: now,
              lte: threeHoursFromNow,
            },
          },
          include: {
            cinema: {
              include: {
                theater: true,
              },
            },
          },
          orderBy: { start_time: 'asc' },
        },
      },
      orderBy: { title: 'asc' },
    });

    return movies;
  }

  async getComingSoon() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const nextWeek = new Date(tomorrow);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const movies = await this.prisma.movies.findMany({
      where: {
        showtimes: {
          some: {
            start_time: {
              gte: tomorrow,
              lte: nextWeek,
            },
          },
        },
      },
      include: {
        showtimes: {
          where: {
            start_time: {
              gte: tomorrow,
              lte: nextWeek,
            },
          },
          include: {
            cinema: {
              include: {
                theater: true,
              },
            },
          },
          orderBy: { start_time: 'asc' },
          take: 3,
        },
      },
      orderBy: { title: 'asc' },
    });

    return movies;
  }

  async getGenres() {
    const genres = await this.prisma.movies.groupBy({
      by: ['genre'],
      _count: {
        id: true,
      },
    });

    return genres.map(genre => ({
      name: genre.genre,
      count: genre._count.id,
    }));
  }
}