import { Test, TestingModule } from '@nestjs/testing';
import { PointsTransactionsService } from './points_transaction.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreatePointsTransactionDto } from './dto/create-points_transaction.dto';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { PointType } from '@prisma/client';

describe('PointsTransactionsService', () => {
  let service: PointsTransactionsService;
  let prisma: PrismaService;

  const mockPrisma = {
    users: { findUnique: jest.fn(), update: jest.fn(), count: jest.fn(), aggregate: jest.fn(), findMany: jest.fn() },
    bookings: { findUnique: jest.fn() },
    points_Transactions: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      aggregate: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointsTransactionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PointsTransactionsService>(PointsTransactionsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create points transaction successfully', async () => {
      const dto: CreatePointsTransactionDto = {
        user_id: 1,
        booking_id: 1,
        type: PointType.earn,
        points: 100,
        created_at: new Date(), // ✅ gunakan Date object
      };

      mockPrisma.users.findUnique.mockResolvedValue({ id: 1, points: 200 });
      mockPrisma.bookings.findUnique.mockResolvedValue({ id: 1, user_id: 1 });
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        return await fn(mockPrisma);
      });
      mockPrisma.points_Transactions.create.mockResolvedValue({
        id: 1,
        ...dto,
        user: { name: 'User', email: 'user@mail.com' },
        booking: { id: 1 },
      });
      mockPrisma.users.update.mockResolvedValue({ id: 1, points: 300 });

      const result = await service.create(dto);
      expect(result).toHaveProperty('id', 1);
      expect(result.user.name).toBe('User');
      expect(result.points).toBe(dto.points);
    });

    it('should throw NotFoundException if user not found', async () => {
      const dto: CreatePointsTransactionDto = {
        user_id: 999,
        type: PointType.earn,
        points: 50,
        created_at: new Date(),
      };
      mockPrisma.users.findUnique.mockResolvedValue(null);
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if points <= 0', async () => {
      const dto: CreatePointsTransactionDto = {
        user_id: 1,
        type: PointType.earn,
        points: 0,
        created_at: new Date(),
      };
      mockPrisma.users.findUnique.mockResolvedValue({ id: 1, points: 100 });
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('earnPoints', () => {
    it('should call create with type earn', async () => {
      const spyCreate = jest.spyOn(service, 'create').mockResolvedValue({ id: 1 } as any);
      mockPrisma.users.findUnique.mockResolvedValue({ id: 1, points: 50 });
      const result = await service.earnPoints(1, 100);
      expect(spyCreate).toHaveBeenCalledWith(expect.objectContaining({ type: PointType.earn, points: 100 }));
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('redeemPoints', () => {
    it('should call create with type redeem', async () => {
      const dto: RedeemPointsDto = { points: 50, booking_id: 1 };
      mockPrisma.users.findUnique.mockResolvedValue({ id: 1, points: 100 });
      mockPrisma.bookings.findUnique.mockResolvedValue({ id: 1, user_id: 1 });
      jest.spyOn(service, 'create').mockResolvedValue({ id: 1} as any);

      const result = await service.redeemPoints(1, dto);
      expect(result).toHaveProperty('id', 1);
    });

    it('should throw BadRequestException if insufficient points', async () => {
      const dto: RedeemPointsDto = { points: 200, booking_id: 1 };
      mockPrisma.users.findUnique.mockResolvedValue({ id: 1, points: 100 });
      await expect(service.redeemPoints(1, dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return a transaction', async () => {
      mockPrisma.points_Transactions.findUnique.mockResolvedValue({ id: 1 });
      const result = await service.findOne(1);
      expect(result).toHaveProperty('id', 1);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.points_Transactions.findUnique.mockResolvedValue(null);
      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return transactions with pagination', async () => {
      const data = [{ id: 1 }];
      mockPrisma.points_Transactions.findMany.mockResolvedValue(data);
      mockPrisma.points_Transactions.count.mockResolvedValue(1);

      const result = await service.findAll(1, 10);
      expect(result.data).toEqual(data);
      expect(result.meta.total).toBe(1);
    });
  });
});
