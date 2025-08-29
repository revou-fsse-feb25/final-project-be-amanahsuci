import { Test, TestingModule } from '@nestjs/testing';
import { TheatersService } from './theaters.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('TheatersService', () => {
  let service: TheatersService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TheatersService,
        {
          provide: PrismaService,
          useValue: {
            theaters: {
              findFirst: jest.fn(),
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            cinemas: {
              findFirst: jest.fn(),
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            seats: {
              deleteMany: jest.fn(),
            },
            bookings: {
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<TheatersService>(TheatersService);
    prisma = module.get(PrismaService);
  });

  describe('createTheater', () => {
    it('should create a new theater', async () => {
      prisma.theaters.findFirst.mockResolvedValue(null);
      prisma.theaters.create.mockResolvedValue({ id: 1, name: 'Grand', location: 'City' });

      const result = await service.createTheater({ name: 'Grand', location: 'City' });
      expect(result).toEqual({ id: 1, name: 'Grand', location: 'City' });
    });

    it('should throw ConflictException if theater exists', async () => {
      prisma.theaters.findFirst.mockResolvedValue({ id: 1, name: 'Grand', location: 'City' });
      await expect(service.createTheater({ name: 'Grand', location: 'City' })).rejects.toThrow(ConflictException);
    });
  });

  describe('findAllTheaters', () => {
    it('should throw BadRequestException if page < 1', async () => {
      await expect(service.findAllTheaters(0, 10)).rejects.toThrow(BadRequestException);
    });

    it('should return paginated theaters', async () => {
      prisma.theaters.findMany.mockResolvedValue([{ id: 1, name: 'Grand', location: 'City' }]);
      prisma.theaters.count.mockResolvedValue(1);

      const result = await service.findAllTheaters(1, 10);
      expect(result.meta.total).toBe(1);
      expect(result.data[0].name).toBe('Grand');
    });
  });

  describe('findTheaterById', () => {
    it('should return theater by id', async () => {
      prisma.theaters.findUnique.mockResolvedValue({ id: 1, name: 'Grand', location: 'City' });
      const result = await service.findTheaterById(1);
      expect(result.id).toBe(1);
    });

    it('should throw NotFoundException if not exists', async () => {
      prisma.theaters.findUnique.mockResolvedValue(null);
      await expect(service.findTheaterById(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateTheater', () => {
    it('should update theater', async () => {
      prisma.theaters.findUnique.mockResolvedValue({ id: 1, name: 'Old', location: 'Old City' });
      prisma.theaters.update.mockResolvedValue({ id: 1, name: 'New', location: 'New City' });

      const result = await service.updateTheater(1, { name: 'New', location: 'New City' });
      expect(result.name).toBe('New');
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.theaters.findUnique.mockResolvedValue(null);
      await expect(service.updateTheater(99, { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeTheater', () => {
    it('should delete theater successfully', async () => {
      prisma.theaters.findUnique.mockResolvedValue({ id: 1, _count: { cinemas: 0 } });
      prisma.theaters.delete.mockResolvedValue({ id: 1 });

      const result = await service.removeTheater(1);
      expect(result).toEqual({ message: 'Theater deleted successfully' });
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.theaters.findUnique.mockResolvedValue(null);
      await expect(service.removeTheater(1)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if theater has cinemas', async () => {
      prisma.theaters.findUnique.mockResolvedValue({ id: 1, _count: { cinemas: 2 } });
      await expect(service.removeTheater(1)).rejects.toThrow(BadRequestException);
    });
  });
});
