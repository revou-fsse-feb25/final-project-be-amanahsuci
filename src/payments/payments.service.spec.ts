import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { 
  NotFoundException, 
  ConflictException, 
  BadRequestException 
} from '@nestjs/common';
import { PaymentMethod, Status } from '@prisma/client';

describe('PaymentsService', () => {
  let service: PaymentsService;
  const prismaMock = {
    bookings: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payments: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    booking_Seats: {
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    points_Transactions: {
      create: jest.fn(),
    },
    users: {
      update: jest.fn(),
    },
  };

  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = prismaMock;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create', () => {
    it('should throw if booking not found', async () => {
      prisma.bookings.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ booking_id: 1, method: PaymentMethod.e_wallet, amount: 100 } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if booking already has payment', async () => {
      prisma.bookings.findUnique.mockResolvedValue({ id: 1, payments: [{}], payment_status: 'pending' });

      await expect(
        service.create({ booking_id: 1, method: PaymentMethod.e_wallet, amount: 100 } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should create payment successfully', async () => {
      prisma.bookings.findUnique.mockResolvedValue({ id: 1, payments: [], payment_status: 'pending' });

      const created = {
        id: 10,
        booking_id: 1,
        status: 'pending',
        amount: '100',
        booking: { /* minimal include */ },
      };
      prisma.payments.create.mockResolvedValue(created);

      const result = await service.create({ booking_id: 1, method: PaymentMethod.e_wallet, amount: 100 } as any);
      expect(result).toEqual(expect.objectContaining({ id: 10, booking_id: 1, status: 'pending' }));
      expect(Number((result as any).amount)).toBe(100);
    });

    it('should set paid_at when status = complete in DTO', async () => {
      prisma.bookings.findUnique.mockResolvedValue({ id: 2, payments: [], payment_status: 'pending' });

      const created = {
        id: 11,
        booking_id: 2,
        status: 'complete',
        amount: '150',
        paid_at: new Date(),
        booking: {},
      };
      prisma.payments.create.mockResolvedValue(created);

      const result = await service.create({ booking_id: 2, method: PaymentMethod.e_wallet, amount: 150, status: 'complete' } as any);
      expect(result.status).toBe('complete');
      expect(Number((result as any).amount)).toBe(150);
      expect(result.paid_at).toBeInstanceOf(Date);
    });
  });

  describe('findAll', () => {
    it('should throw if page < 1', async () => {
      await expect(service.findAll(0, 10)).rejects.toThrow(BadRequestException);
    });

    it('should throw if limit < 1', async () => {
      await expect(service.findAll(1, 0)).rejects.toThrow(BadRequestException);
    });

    it('should throw if limit > 100', async () => {
      await expect(service.findAll(1, 101)).rejects.toThrow(BadRequestException);
    });

    it('should return paginated payments', async () => {
      prisma.payments.findMany.mockResolvedValue([{ id: 1, amount: '200' }]);
      prisma.payments.count.mockResolvedValue(1);

      const result = await service.findAll(1, 10, 'pending' as Status, PaymentMethod.e_wallet);
      expect(result.meta.total).toBe(1);
      expect(Array.isArray(result.data)).toBe(true);
      expect(Number((result.data as any)[0].amount)).toBe(200);
    });
  });

  describe('findOne', () => {
    it('should throw if not found', async () => {
      prisma.payments.findUnique.mockResolvedValue(null);
      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });

    it('should return payment', async () => {
      prisma.payments.findUnique.mockResolvedValue({ id: 1, amount: '300' });
      const result = await service.findOne(1);
      expect(result).toEqual(expect.objectContaining({ id: 1 }));
      expect(Number((result as any).amount)).toBe(300);
    });
  });

  describe('findByBooking', () => {
    it('should throw if booking not found', async () => {
      prisma.bookings.findUnique.mockResolvedValue(null);
      await expect(service.findByBooking(1)).rejects.toThrow(NotFoundException);
    });

    it('should throw if payment not found for booking', async () => {
      prisma.bookings.findUnique.mockResolvedValue({ id: 1 });
      prisma.payments.findFirst.mockResolvedValue(null);
      await expect(service.findByBooking(1)).rejects.toThrow(NotFoundException);
    });

    it('should return payment by booking', async () => {
      prisma.bookings.findUnique.mockResolvedValue({ id: 1 });
      prisma.payments.findFirst.mockResolvedValue({ id: 2, booking_id: 1, amount: '150' });

      const result = await service.findByBooking(1);
      expect(result).toEqual(expect.objectContaining({ id: 2, booking_id: 1 }));
      expect(Number((result as any).amount)).toBe(150);
    });
  });

  describe('update', () => {
    it('should throw if payment not found', async () => {
      prisma.payments.findUnique.mockResolvedValue(null);
      await expect(service.update(1, { status: 'complete' } as any)).rejects.toThrow(NotFoundException);
    });

    it('should update payment and handle complete status side-effects', async () => {
      prisma.payments.findUnique.mockResolvedValue({
        id: 1,
        status: 'pending',
        booking_id: 99,
        booking: { total_price: 2000, user_id: 5 },
      });

      prisma.payments.update.mockResolvedValue({ id: 1, status: 'complete', booking: { total_price: 2000 } });

      const result = await service.update(1, { status: 'complete' } as any);

      expect(result).toEqual(expect.objectContaining({ id: 1, status: 'complete' }));
      expect(prisma.bookings.update).toHaveBeenCalledWith({
        where: { id: 99 },
        data: { payment_status: 'complete' },
      });
      expect(prisma.booking_Seats.updateMany).toHaveBeenCalledWith({
        where: { booking_id: 99 },
        data: { status: 'booked' },
      });
      expect(prisma.points_Transactions.create).toHaveBeenCalled();
      expect(prisma.users.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when prisma.update raises P2025', async () => {
      prisma.payments.findUnique.mockResolvedValue({
        id: 5,
        status: 'pending',
        booking_id: 50,
        booking: { total_price: 1000, user_id: 9 },
      });

      const error: any = new Error('Record not found');
      error.code = 'P2025';
      prisma.payments.update.mockRejectedValue(error);

      await expect(service.update(5, { status: 'complete' } as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('processPayment', () => {
    it('should throw if payment not found', async () => {
      prisma.payments.findUnique.mockResolvedValue(null);
      await expect(service.processPayment(1, PaymentMethod.e_wallet)).rejects.toThrow(NotFoundException);
    });

    it('should throw if already complete', async () => {
      prisma.payments.findUnique.mockResolvedValue({ id: 1, status: 'complete' });
      await expect(service.processPayment(1, PaymentMethod.e_wallet)).rejects.toThrow(BadRequestException);
    });

    it('should process payment successfully when Math.random indicates success', async () => {
      const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.9);
      prisma.payments.findUnique.mockResolvedValue({ id: 1, status: 'pending', booking: {} });

      const updateSpy = jest.spyOn(service, 'update').mockResolvedValue({ id: 1, status: 'complete' } as any);

      const result = await service.processPayment(1, PaymentMethod.e_wallet);
      expect(updateSpy).toHaveBeenCalledWith(1, expect.objectContaining({ status: 'complete', method: PaymentMethod.e_wallet }));
      expect(result).toEqual(expect.objectContaining({ status: 'complete' }));

      updateSpy.mockRestore();
      randomSpy.mockRestore();
    });

    it('should throw BadRequestException on processing failure', async () => {
      const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.05); // simulate failure
      prisma.payments.findUnique.mockResolvedValue({ id: 2, status: 'pending', booking: {} });

      await expect(service.processPayment(2, PaymentMethod.e_wallet)).rejects.toThrow(BadRequestException);

      randomSpy.mockRestore();
    });
  });

  describe('cancelPayment', () => {
    it('should throw if payment not found', async () => {
      prisma.payments.findUnique.mockResolvedValue(null);
      await expect(service.cancelPayment(1)).rejects.toThrow(NotFoundException);
    });

    it('should throw if already complete', async () => {
      prisma.payments.findUnique.mockResolvedValue({ id: 1, status: 'complete' });
      await expect(service.cancelPayment(1)).rejects.toThrow(BadRequestException);
    });

    it('should cancel payment successfully and perform side-effects', async () => {
      prisma.payments.findUnique.mockResolvedValue({ id: 1, status: 'pending', booking_id: 55 });
      prisma.payments.update.mockResolvedValue({ id: 1, status: 'cancelled' });
      prisma.bookings.update.mockResolvedValue({ id: 55, payment_status: 'cancelled' });
      prisma.booking_Seats.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.cancelPayment(1);
      expect(result).toEqual(expect.objectContaining({ id: 1, status: 'cancelled' }));
      expect(prisma.bookings.update).toHaveBeenCalledWith({ where: { id: 55 }, data: { payment_status: 'cancelled' } });
      expect(prisma.booking_Seats.deleteMany).toHaveBeenCalledWith({ where: { booking_id: 55 } });
    });
  });

  describe('getPaymentStats', () => {
    it('should return stats correctly', async () => {
      const completedPayments = [{ booking: { total_price: 100 } }, { booking: { total_price: 200 } }];
      prisma.payments.findMany.mockImplementation(async (args?: any) => {
        if (args && args.where && args.where.status === 'complete' && !args.where.method) {
          return completedPayments;
        }
        return [];
      });

      prisma.payments.count.mockImplementation(async (args?: any) => {
        if (!args) return 3; 
        if (args.where && args.where.status === 'pending') return 1;
        if (args.where && args.where.status === 'cancelled') return 1;
        return 0;
      });

      const result = await service.getPaymentStats();

      expect(result.total_payments).toBe(3);
      expect(result.total_revenue).toBe(300);
      expect(result.completed_payments).toBe(2);
      expect(Array.isArray(result.revenue_by_method)).toBe(true);
    });
  });

  describe('getDailyRevenue', () => {
    it('should return daily revenue', async () => {
      const today = new Date();
      prisma.payments.findMany.mockResolvedValue([
        { paid_at: today, booking: { total_price: 400 } },
      ]);

      const result = await service.getDailyRevenue(7);
      expect(Array.isArray(result)).toBe(true);
      expect(Number((result as any)[0].revenue)).toBe(400);
      expect((result as any)[0].date instanceof Date).toBe(true);
    });
  });
});
