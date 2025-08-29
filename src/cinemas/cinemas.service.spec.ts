import { Test, TestingModule } from '@nestjs/testing';
import { CinemasService } from './cinemas.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CinemaType } from '@prisma/client';

describe('CinemasService', () => {
  let service: CinemasService;
  let prisma: PrismaService;

  const mockPrisma = {
    theaters: {
      findUnique: jest.fn(),
    },
    cinemas: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    seats: {
      deleteMany: jest.fn(),
    },
    bookings: {
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    showtimes: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CinemasService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CinemasService>(CinemasService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a cinema', async () => {
      const dto = { theater_id: 1, type: CinemaType.Reguler, total_seats: 50, price: 50000 };
      mockPrisma.theaters.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.cinemas.findFirst.mockResolvedValue(null);
      mockPrisma.cinemas.create.mockResolvedValue({ id: 1, ...dto, theater: { name: 'A', location: 'B' } });

      const result = await service.create(dto);
      expect(result.id).toBe(1);
      expect(mockPrisma.cinemas.create).toHaveBeenCalledWith(expect.objectContaining({
        data: dto,
      }));
    });

    it('should throw NotFoundException if theater not found', async () => {
      const dto = { theater_id: 1, type: CinemaType.Reguler, total_seats: 50, price: 50000 };
      mockPrisma.theaters.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if cinema type exists', async () => {
      const dto = { theater_id: 1, type: CinemaType.Reguler, total_seats: 50, price: 50000 };
      mockPrisma.theaters.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.cinemas.findFirst.mockResolvedValue({ id: 1 });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated cinemas', async () => {
      mockPrisma.cinemas.findMany.mockResolvedValue([{ id: 1 }]);
      mockPrisma.cinemas.count.mockResolvedValue(1);

      const result = await service.findAll(1, 10);
      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
    });

    it('should throw BadRequestException for invalid page', async () => {
      await expect(service.findAll(0, 10)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return cinema', async () => {
      mockPrisma.cinemas.findUnique.mockResolvedValue({ id: 1 });
      const result = await service.findOne(1);
      expect(result.id).toBe(1);
    });

    it('should throw NotFoundException if cinema not found', async () => {
      mockPrisma.cinemas.findUnique.mockResolvedValue(null);
      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update cinema', async () => {
      mockPrisma.cinemas.findUnique.mockResolvedValue({ id: 1, theater_id: 1, type: CinemaType.Reguler });
      mockPrisma.cinemas.findFirst.mockResolvedValue(null);
      mockPrisma.cinemas.update.mockResolvedValue({ id: 1, type: CinemaType.Premier });

      const result = await service.update(1, { type: CinemaType.Premier });
      expect(result.type).toBe(CinemaType.Premier);
    });

    it('should throw NotFoundException if cinema not found', async () => {
      mockPrisma.cinemas.findUnique.mockResolvedValue(null);
      await expect(service.update(1, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove cinema', async () => {
      mockPrisma.cinemas.findUnique.mockResolvedValue({ id: 1, _count: { showtimes: 0, seats: 0 } });
      mockPrisma.seats.deleteMany.mockResolvedValue({});
      mockPrisma.cinemas.delete.mockResolvedValue({});

      const result = await service.remove(1);
      expect(result.message).toBe('Cinema deleted successfully');
    });

    it('should throw BadRequestException if cinema has showtimes', async () => {
      mockPrisma.cinemas.findUnique.mockResolvedValue({ id: 1, _count: { showtimes: 2, seats: 0 } });
      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if cinema not found', async () => {
      mockPrisma.cinemas.findUnique.mockResolvedValue(null);
      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
    });
  });
});
