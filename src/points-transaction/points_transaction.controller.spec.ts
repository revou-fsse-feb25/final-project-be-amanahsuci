import { Test, TestingModule } from '@nestjs/testing';
import { PointsTransactionsController } from './points_transaction.controller';
import { PointsTransactionsService } from './points_transaction.service';
import { CreatePointsTransactionDto } from './dto/create-points_transaction.dto';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { PointType } from '@prisma/client';

// Mock the PointsTransactionsService to isolate controller logic
const mockPointsTransactionsService = {
  create: jest.fn(),
  earnPoints: jest.fn(),
  redeemPoints: jest.fn(),
  findAll: jest.fn(),
  findByUser: jest.fn(),
  getUserPointsSummary: jest.fn(),
  getSystemWidePointsStats: jest.fn(),
  getTopUsers: jest.fn(),
  findOne: jest.fn(),
  voidTransaction: jest.fn(),
};

describe('PointsTransactionsController', () => {
  let controller: PointsTransactionsController;
  let service: PointsTransactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointsTransactionsController],
      providers: [
        {
          provide: PointsTransactionsService,
          useValue: mockPointsTransactionsService,
        },
      ],
    }).compile();

    controller = module.get<PointsTransactionsController>(PointsTransactionsController);
    service = module.get<PointsTransactionsService>(PointsTransactionsService);

    // Reset mocks before each test to ensure a clean state
    for (const key in mockPointsTransactionsService) {
      if (Object.prototype.hasOwnProperty.call(mockPointsTransactionsService, key)) {
        (mockPointsTransactionsService as any)[key].mockReset();
      }
    }
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call pointsTransactionsService.create with the correct DTO', async () => {
      const createDto: CreatePointsTransactionDto = {
        user_id: 1,
        points: 100,
        type: PointType.earn,
        booking_id: 101
      };
      await controller.create(createDto);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('earnPoints', () => {
    it('should call pointsTransactionsService.earnPoints with user_id, points, and booking_id', async () => {
      const userId = 1;
      const points = 50;
      const bookingId = 101;
      await controller.earnPoints(userId, points, bookingId);
      expect(service.earnPoints).toHaveBeenCalledWith(userId, points, bookingId);
    });
  });

  describe('redeemPoints', () => {
    it('should call pointsTransactionsService.redeemPoints with user_id and redeemPointsDto', async () => {
      const userId = 1;
      const redeemDto: RedeemPointsDto = {
        points: 50,
        booking_id: 101
      };
      await controller.redeemPoints(userId, redeemDto);
      expect(service.redeemPoints).toHaveBeenCalledWith(userId, redeemDto);
    });
  });

  describe('findAll', () => {
    it('should call pointsTransactionsService.findAll with default pagination and optional query parameters', async () => {
      await controller.findAll();
      expect(service.findAll).toHaveBeenCalledWith(1, 10, undefined, undefined);
    });

    it('should call pointsTransactionsService.findAll with provided query parameters', async () => {
      const page = 2;
      const limit = 20;
      const userId = 1;
      const type = PointType.earn;
      await controller.findAll(page, limit, userId, type);
      expect(service.findAll).toHaveBeenCalledWith(page, limit, userId, type);
    });
  });

  describe('findByUser', () => {
    it('should call pointsTransactionsService.findByUser with user_id and default pagination', async () => {
      const userId = 1;
      await controller.findByUser(userId);
      expect(service.findByUser).toHaveBeenCalledWith(userId, 1, 10);
    });

    it('should call pointsTransactionsService.findByUser with provided pagination', async () => {
      const userId = 1;
      const page = 3;
      const limit = 15;
      await controller.findByUser(userId, page, limit);
      expect(service.findByUser).toHaveBeenCalledWith(userId, page, limit);
    });
  });

  describe('getUserPointsSummary', () => {
    it('should call pointsTransactionsService.getUserPointsSummary with user_id', async () => {
      const userId = 1;
      await controller.getUserPointsSummary(userId);
      expect(service.getUserPointsSummary).toHaveBeenCalledWith(userId);
    });
  });

  describe('getSystemWidePointsStats', () => {
    it('should call pointsTransactionsService.getSystemWidePointsStats', async () => {
      await controller.getSystemWidePointsStats();
      expect(service.getSystemWidePointsStats).toHaveBeenCalled();
    });
  });

  describe('getTopUsers', () => {
    it('should call pointsTransactionsService.getTopUsers with default limit', async () => {
      await controller.getTopUsers(10);
      expect(service.getTopUsers).toHaveBeenCalledWith(10);
    });
    
    it('should call pointsTransactionsService.getTopUsers with a provided limit', async () => {
      const limit = 5;
      await controller.getTopUsers(limit);
      expect(service.getTopUsers).toHaveBeenCalledWith(limit);
    });
  });

  describe('findOne', () => {
    it('should call pointsTransactionsService.findOne with the provided ID', async () => {
      const id = 1;
      await controller.findOne(id);
      expect(service.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('voidTransaction', () => {
    it('should call pointsTransactionsService.voidTransaction with the provided ID', async () => {
      const id = 1;
      await controller.voidTransaction(id);
      expect(service.voidTransaction).toHaveBeenCalledWith(id);
    });
  });
});