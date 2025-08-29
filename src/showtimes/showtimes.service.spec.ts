import { Test, TestingModule } from '@nestjs/testing';
import { ShowtimesService } from './showtimes.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateShowtimeDto } from './dto/create-showtime.dto';
import { UpdateShowtimeDto } from './dto/update-showtime.dto';

describe('ShowtimesService', () => {
  let service: ShowtimesService;
  let prisma: PrismaService;

  const mockPrisma = {
    movies: {
      findUnique: jest.fn(),
    },
    cinemas: {
      findUnique: jest.fn(),
    },
    showtimes: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShowtimesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ShowtimesService>(ShowtimesService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a showtime', async () => {
      const dto: CreateShowtimeDto = {
        movie_id: 1,
        cinema_id: 1,
        start_time: '2025-08-29T12:00:00Z', // ISO string
      };

      mockPrisma.movies.findUnique.mockResolvedValue({ id: 1, duration_minutes: 120 });
      mockPrisma.cinemas.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.showtimes.findFirst.mockResolvedValue(null);
      mockPrisma.showtimes.create.mockResolvedValue({
        id: 1,
        movie_id: 1,
        cinema_id: 1,
        start_time: new Date(dto.start_time),
        movie: { title: 'Movie A', duration_minutes: 120 },
        cinema: { theater: { name: 'Grand', location: 'City' } },
      });

      const result = await service.create(dto);
      expect(result).toHaveProperty('id', 1);
      expect(result.start_time.toISOString()).toEqual(dto.start_time);
    });

    it('should throw NotFoundException if movie not found', async () => {
      const dto: CreateShowtimeDto = {
        movie_id: 999,
        cinema_id: 1,
        start_time: '2025-08-29T12:00:00Z',
      };
      mockPrisma.movies.findUnique.mockResolvedValue(null);
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a showtime', async () => {
      const dto: UpdateShowtimeDto = {
        start_time: '2025-08-29T15:00:00Z', // ISO string
      };

      mockPrisma.showtimes.findUnique.mockResolvedValue({
        id: 1,
        start_time: new Date('2025-08-29T12:00:00Z'),
        movie: { duration_minutes: 120 },
        cinema_id: 1,
      });
      mockPrisma.showtimes.findFirst.mockResolvedValue(null);
      mockPrisma.movies.findUnique.mockResolvedValue({ id: 1, duration_minutes: 120 });
      mockPrisma.cinemas.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.showtimes.update.mockResolvedValue({
        id: 1,
        start_time: new Date(dto.start_time),
        movie: { title: 'Movie A' },
        cinema: { theater: { name: 'Grand' } },
      });

      const result = await service.update(1, dto);
      expect(result.start_time.toISOString()).toEqual(dto.start_time);
      expect(result).toHaveProperty('movie');
    });

    it('should throw NotFoundException if showtime not found', async () => {
      const dto: UpdateShowtimeDto = { start_time: '2025-08-29T15:00:00Z' };
      mockPrisma.showtimes.findUnique.mockResolvedValue(null);
      await expect(service.update(1, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return a showtime', async () => {
      const mockShowtime = {
        id: 1,
        movie: {},
        cinema: { theater: {}, seats: [] },
        bookings: [],
      };
      mockPrisma.showtimes.findUnique.mockResolvedValue(mockShowtime);
      const result = await service.findOne(1);
      expect(result).toEqual(mockShowtime);
    });

    it('should throw NotFoundException if showtime not found', async () => {
      mockPrisma.showtimes.findUnique.mockResolvedValue(null);
      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a showtime', async () => {
      mockPrisma.showtimes.findUnique.mockResolvedValue({
        id: 1,
        _count: { bookings: 0 },
      });
      mockPrisma.showtimes.delete.mockResolvedValue({});

      const result = await service.remove(1);
      expect(result).toEqual({ message: 'Showtime deleted successfully' });
    });

    it('should throw BadRequestException if showtime has bookings', async () => {
      mockPrisma.showtimes.findUnique.mockResolvedValue({
        id: 1,
        _count: { bookings: 2 },
      });
      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
    });
  });
});
