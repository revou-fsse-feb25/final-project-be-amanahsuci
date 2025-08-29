import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentMethod, Status } from '@prisma/client';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  const mockPaymentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    getPaymentStats: jest.fn(),
    getDailyRevenue: jest.fn(),
    findByBooking: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    processPayment: jest.fn(),
    cancelPayment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get(PaymentsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a payment', async () => {
      const dto: CreatePaymentDto = {
        booking_id: 1,
        amount: 100,
        method: PaymentMethod.e_wallet,
      };

      const serviceReturn = {
        id: 1,
        booking_id: dto.booking_id,
        method: dto.method,
        status: Status.pending,
        amount: '100', 
      };

      service.create = jest.fn().mockResolvedValue(serviceReturn);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expect.objectContaining({
        id: 1,
        booking_id: dto.booking_id,
        method: dto.method,
        status: Status.pending,
      }));
      expect(Number((result as any).amount)).toBe(Number(dto.amount));
    });
  });

  describe('findAll', () => {
    it('should return paginated list of payments', async () => {
      const serviceReturn = {
        data: [{ id: 1, amount: '100' }],
        total: 1,
      };
      service.findAll = jest.fn().mockResolvedValue(serviceReturn);

      const result = await controller.findAll(1, 10, Status.pending, PaymentMethod.bank_transfer);

      expect(service.findAll).toHaveBeenCalledWith(1, 10, Status.pending, PaymentMethod.bank_transfer);
      expect(result).toEqual(expect.objectContaining({ total: 1 }));
      expect(Number((result as any).data[0].amount)).toBe(100);
    });
  });

  describe('getPaymentStats', () => {
    it('should return stats', async () => {
      const expected = { totalPayments: 5, totalAmount: 500 };
      service.getPaymentStats = jest.fn().mockResolvedValue(expected);

      const result = await controller.getPaymentStats();

      expect(service.getPaymentStats).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });

  describe('getDailyRevenue', () => {
    it('should return daily revenue', async () => {
      const serviceReturn = [{ date: '2025-08-01', revenue: '100' }];
      service.getDailyRevenue = jest.fn().mockResolvedValue(serviceReturn);

      const result = await controller.getDailyRevenue(7);

      expect(service.getDailyRevenue).toHaveBeenCalledWith(7);
      expect(Array.isArray(result)).toBe(true);
      expect(Number((result as any)[0].revenue)).toBe(100);
    });
  });

  describe('findByBooking', () => {
    it('should return payment by booking ID', async () => {
      const serviceReturn = { id: 1, booking_id: 123, amount: '100' };
      service.findByBooking = jest.fn().mockResolvedValue(serviceReturn);

      const result = await controller.findByBooking(123);

      expect(service.findByBooking).toHaveBeenCalledWith(123);
      expect(result).toEqual(expect.objectContaining({
        id: 1,
        booking_id: 123,
      }));
      expect(Number((result as any).amount)).toBe(100);
    });
  });

  describe('findOne', () => {
    it('should return payment by ID', async () => {
      const serviceReturn = { id: 1, amount: '200' };
      service.findOne = jest.fn().mockResolvedValue(serviceReturn);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(expect.objectContaining({ id: 1 }));
      expect(Number((result as any).amount)).toBe(200);
    });
  });

  describe('update', () => {
    it('should update payment', async () => {
      const dto: UpdatePaymentDto = { status: Status.complete } as any;
      const serviceReturn = { id: 1, status: Status.complete, amount: '200' };
      service.update = jest.fn().mockResolvedValue(serviceReturn);

      const result = await controller.update(1, dto);

      expect(service.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(expect.objectContaining({ id: 1, status: Status.complete }));
      expect(Number((result as any).amount)).toBe(200);
    });
  });

  describe('processPayment', () => {
    it('should process payment with given method', async () => {
      const serviceReturn = { id: 1, status: Status.complete };
      service.processPayment = jest.fn().mockResolvedValue(serviceReturn);

      const result = await controller.processPayment(1, PaymentMethod.qris);

      expect(service.processPayment).toHaveBeenCalledWith(1, PaymentMethod.qris);
      expect(result).toEqual(expect.objectContaining({ id: 1, status: Status.complete }));
    });
  });

  describe('cancelPayment', () => {
    it('should cancel payment', async () => {
      const serviceReturn = { id: 1, status: Status.cancelled };
      service.cancelPayment = jest.fn().mockResolvedValue(serviceReturn);

      const result = await controller.cancelPayment(1);

      expect(service.cancelPayment).toHaveBeenCalledWith(1);
      expect(result).toEqual(expect.objectContaining({ id: 1, status: Status.cancelled }));
    });
  });
});
