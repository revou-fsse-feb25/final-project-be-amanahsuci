import { Test, TestingModule } from '@nestjs/testing';
import { MoviesService } from './movies.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

describe('MoviesService', () => {
  let service: MoviesService;
  let prisma: {
    movies: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
      groupBy: jest.Mock;
    };
    showtimes: {
      count: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      movies: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      showtimes: {
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
  });

  describe('create', () => {
    it('should create a new movie if title is unique', async () => {
      prisma.movies.findFirst.mockResolvedValue(null);
      prisma.movies.create.mockResolvedValue({ id: 1, title: 'Movie A' });

      const result = await service.create({
        title: 'Movie A',
        description: 'desc',
        genre: 'Action',
        duration_minutes: 120,
        poster_url: '',
      } as any);

      expect(prisma.movies.create).toHaveBeenCalled();
      expect(result).toEqual({ id: 1, title: 'Movie A' });
    });

    it('should throw ConflictException if movie already exists', async () => {
      prisma.movies.findFirst.mockResolvedValue({ id: 1, title: 'Movie A' });

      await expect(
        service.create({
          title: 'Movie A',
          description: 'desc',
          genre: 'Action',
          duration_minutes: 120,
          poster_url: '',
        } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should throw BadRequestException for invalid pagination', async () => {
      await expect(service.findAll(0, 10)).rejects.toThrow(BadRequestException);
      await expect(service.findAll(1, 0)).rejects.toThrow(BadRequestException);
      await expect(service.findAll(1, 101)).rejects.toThrow(BadRequestException);
    });

    it('should return paginated movies', async () => {
      prisma.movies.findMany.mockResolvedValue([{ id: 1, title: 'Movie A' }]);
      prisma.movies.count.mockResolvedValue(1);

      const result = await service.findAll(1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a movie if found', async () => {
      prisma.movies.findUnique.mockResolvedValue({ id: 1, title: 'Movie A' });

      const result = await service.findOne(1);
      expect(result).toEqual({ id: 1, title: 'Movie A' });
    });

    it('should throw NotFoundException if movie not found', async () => {
      prisma.movies.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByTitle', () => {
    it('should return a movie if found by title', async () => {
      prisma.movies.findFirst.mockResolvedValue({ id: 1, title: 'Movie A' });

      const result = await service.findByTitle('Movie A');
      expect(result).toEqual({ id: 1, title: 'Movie A' });
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.movies.findFirst.mockResolvedValue(null);

      await expect(service.findByTitle('Unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a movie if exists', async () => {
      prisma.movies.findUnique.mockResolvedValue({ id: 1, title: 'Movie A' });
      prisma.movies.update.mockResolvedValue({ id: 1, title: 'Updated' });

      const result = await service.update(1, { title: 'Updated' } as any);
      expect(result).toEqual({ id: 1, title: 'Updated' });
    });

    it('should throw NotFoundException if movie not found', async () => {
      prisma.movies.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { title: 'X' } as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new title already exists', async () => {
      prisma.movies.findUnique.mockResolvedValue({ id: 1, title: 'Old' });
      prisma.movies.findFirst.mockResolvedValue({ id: 2, title: 'Duplicate' });

      await expect(service.update(1, { title: 'Duplicate' } as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a movie if no showtimes exist', async () => {
      prisma.movies.findUnique.mockResolvedValue({ id: 1 });
      prisma.showtimes.count.mockResolvedValue(0);
      prisma.movies.delete.mockResolvedValue({ id: 1 });

      const result = await service.remove(1);
      expect(result).toEqual({ message: 'Movie deleted successfully' });
    });

    it('should throw NotFoundException if movie not found', async () => {
      prisma.movies.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if movie has showtimes', async () => {
      prisma.movies.findUnique.mockResolvedValue({ id: 1 });
      prisma.showtimes.count.mockResolvedValue(2);

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getNowShowing', () => {
    it('should return movies now showing', async () => {
      prisma.movies.findMany.mockResolvedValue([{ id: 1, title: 'Now Showing' }]);

      const result = await service.getNowShowing();
      expect(result).toHaveLength(1);
    });
  });

  describe('getComingSoon', () => {
    it('should return coming soon movies', async () => {
      prisma.movies.findMany.mockResolvedValue([{ id: 1, title: 'Coming Soon' }]);

      const result = await service.getComingSoon();
      expect(result).toHaveLength(1);
    });
  });

  describe('getGenres', () => {
    it('should return genres with counts', async () => {
      prisma.movies.groupBy.mockResolvedValue([
        { genre: 'Action', _count: { id: 2 } },
        { genre: 'Drama', _count: { id: 1 } },
      ]);

      const result = await service.getGenres();
      expect(result).toEqual([
        { name: 'Action', count: 2 },
        { name: 'Drama', count: 1 },
      ]);
    });
  });
});
