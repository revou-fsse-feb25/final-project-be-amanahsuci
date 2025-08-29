import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Status } from '@prisma/client';

describe('BookingsController', () => {
  let controller: BookingsController;
  let service: BookingsService;

  const mockBooking = {
    id: 1,
    user_id: 1,
    showtime_id: 1,
    payment_status: Status.pending,
    seats: [{ seat_id: 1 }, { seat_id: 2 }],
    total_price: 150000,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockBookingsService = {
    create: jest.fn(() => Promise.resolve(mockBooking)),
    findAll: jest.fn(() => Promise.resolve({
      data: [mockBooking],
      meta: { total: 1, page: 1, limit: 10 },
    })),
    findByUser: jest.fn(() => Promise.resolve({
      data: [mockBooking],
      meta: { total: 1, page: 1, limit: 10 },
    })),
    getBookingStats: jest.fn(() => Promise.resolve({ totalBookings: 1, totalRevenue: 150000 })),
    findOne: jest.fn(() => Promise.resolve(mockBooking)),
    update: jest.fn(() => Promise.resolve(mockBooking)),
    cancelBooking: jest.fn(() => Promise.resolve({ ...mockBooking, payment_status: Status.complete })),
    confirmPayment: jest.fn(() => Promise.resolve({ ...mockBooking, payment_status: Status.complete })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        {
          provide: BookingsService,
          useValue: mockBookingsService,
        },
      ],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
    service = module.get<BookingsService>(BookingsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call bookingsService.create with the correct DTO and return the result', async () => {
      const createBookingDto: CreateBookingDto = {
        user_id: 1,
        showtime_id: 1,
        seats: [{ seat_id: 1 }, { seat_id: 2 }],
      };
      const result = await controller.create(createBookingDto);
      expect(service.create).toHaveBeenCalledWith(createBookingDto);
      expect(result).toEqual(mockBooking);
    });
  });

  describe('findAll', () => {
    it('should call bookingsService.findAll with default parameters', async () => {
      const result = await controller.findAll();
      expect(service.findAll).toHaveBeenCalledWith(1, 10, undefined, undefined);
      expect(result.data).toEqual([mockBooking]);
    });

    it('should filter bookings by userId and status', async () => {
      const page = 2;
      const limit = 5;
      const userId = 1;
      const status = Status.pending;
      await controller.findAll(page, limit, userId, status);
      expect(service.findAll).toHaveBeenCalledWith(page, limit, userId, status);
    });
  });

  describe('findByUser', () => {
    it('should return bookings for a specific user', async () => {
      const userId = 1;
      const result = await controller.findByUser(userId);
      expect(service.findByUser).toHaveBeenCalledWith(userId, 1, 10);
      expect(result.data).toEqual([mockBooking]);
    });

    it('should handle pagination for findByUser', async () => {
      const userId = 1;
      const page = 2;
      const limit = 5;
      await controller.findByUser(userId, page, limit);
      expect(service.findByUser).toHaveBeenCalledWith(userId, page, limit);
    });
  });

  describe('getBookingStats', () => {
    it('should return global booking statistics if no userId is provided', async () => {
      const result = await controller.getBookingStats(undefined);
      expect(service.getBookingStats).toHaveBeenCalledWith(undefined);
      expect(result).toEqual({ totalBookings: 1, totalRevenue: 150000 });
    });

    it('should return user-specific stats if a userId is provided', async () => {
      const userId = 1;
      const result = await controller.getBookingStats(userId);
      expect(service.getBookingStats).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ totalBookings: 1, totalRevenue: 150000 });
    });
  });

  describe('findOne', () => {
    it('should return a single booking by id', async () => {
      const id = 1;
      const result = await controller.findOne(id);
      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockBooking);
    });
  });

  describe('update', () => {
    it('should update a booking', async () => {
      const id = 1;
      const updateBookingDto: UpdateBookingDto = { payment_status: Status.cancelled};
      const result = await controller.update(id, updateBookingDto);
      expect(service.update).toHaveBeenCalledWith(id, updateBookingDto);
      expect(result).toEqual(mockBooking);
    });
  });

  describe('cancelBooking', () => {
    it('should call cancelBooking service and return the result', async () => {
      const id = 1;
      const result = await controller.cancelBooking(id);
      expect(service.cancelBooking).toHaveBeenCalledWith(id);
      expect(result.payment_status).toEqual(Status.cancelled);
    });
  });

  describe('confirmPayment', () => {
    it('should call confirmPayment service and return the result', async () => {
      const id = 1;
      const result = await controller.confirmPayment(id);
      expect(service.confirmPayment).toHaveBeenCalledWith(id);
      expect(result.payment_status).toEqual(Status.complete);
    });
  });

  describe('remove', () => {
    it('should call bookingsService.cancelBooking for soft delete', async () => {
      const id = 1;
      const result = await controller.remove(id);
      expect(service.cancelBooking).toHaveBeenCalledWith(id);
      expect(result.payment_status).toEqual(Status.cancelled);
    });
  });
});