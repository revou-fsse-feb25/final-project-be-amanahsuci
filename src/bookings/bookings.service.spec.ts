import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Status, SeatStatus, CinemaType } from '@prisma/client';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

describe('BookingsService', () => {
  let service: BookingsService;
  let prisma: PrismaService;

  const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    points: 0,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockMovie = {
    id: 1,
    title: 'Example Movie',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockTheater = {
    id: 1,
    name: 'Example Theater',
    location: 'City Center',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockCinema = {
    id: 1,
    theater_id: 1,
    type: CinemaType.Reguler,
    total_seats: 100,
    price: 75000,
    created_at: new Date(),
    updated_at: new Date(),
    theater: mockTheater,
  };

  const mockShowtime = {
    id: 1,
    movie_id: 1,
    cinema_id: 1,
    start_time: new Date(new Date().getTime() + 60 * 60 * 1000), 
    created_at: new Date(),
    updated_at: new Date(),
    movie: mockMovie,
    cinema: mockCinema,
  };
  
  const mockSeat1 = { id: 1, name: 'A1', cinema_id: 1, status: SeatStatus.selected, created_at: new Date(), updated_at: new Date() };
  const mockSeat2 = { id: 2, name: 'A2', cinema_id: 1, status: SeatStatus.booked, created_at: new Date(), updated_at: new Date() };
  const mockSeats = [mockSeat1, mockSeat2];

  const mockBooking = {
    id: 1,
    user_id: 1,
    showtime_id: 1,
    total_price: 150000,
    payment_status: Status.pending,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const prismaMock = {
    users: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    showtimes: {
      findUnique: jest.fn(),
    },
    seats: {
      findMany: jest.fn(),
    },
    bookings: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      aggregate: jest.fn(),
    },
    booking_Seats: {
      createMany: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    points_Transactions: {
      create: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(async (callback) => await callback(prismaMock)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    prisma = module.get<PrismaService>(PrismaService);
    
    jest.clearAllMocks();

    // set mock data default untuk 'happy path'
    jest.spyOn(prisma.users, 'findUnique').mockResolvedValue(mockUser as any);
    jest.spyOn(prisma.showtimes, 'findUnique').mockResolvedValue(mockShowtime as any);
    jest.spyOn(prisma.seats, 'findMany').mockResolvedValue(mockSeats as any);
    jest.spyOn(prisma.bookings, 'findMany').mockResolvedValue([] as any);
    jest.spyOn(prisma.bookings, 'create').mockResolvedValue(mockBooking as any);
    jest.spyOn(prisma.bookings, 'findUnique').mockResolvedValue(mockBooking as any);
    jest.spyOn(prisma.bookings, 'update').mockResolvedValue(mockBooking as any);
    jest.spyOn(prisma.booking_Seats, 'createMany').mockResolvedValue({ count: 2 } as any);
    jest.spyOn(prisma.booking_Seats, 'deleteMany').mockResolvedValue({ count: 2 } as any);
    jest.spyOn(prisma.booking_Seats, 'updateMany').mockResolvedValue({ count: 2 } as any);
    jest.spyOn(prisma.users, 'update').mockResolvedValue(mockUser as any);
    jest.spyOn(prisma.bookings, 'count').mockResolvedValue(1);
    jest.spyOn(prisma.bookings, 'aggregate').mockResolvedValue({ _sum: { total_price: 150000 } } as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createBookingDto: CreateBookingDto = {
      user_id: 1,
      showtime_id: 1,
      seats: [{ seat_id: 1 }, { seat_id: 2 }],
    };

    it('should successfully create a new booking', async () => {
      await service.create(createBookingDto);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.bookings.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(prisma.users, 'findUnique').mockResolvedValue(null);
      await expect(service.create(createBookingDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if showtime not found', async () => {
      jest.spyOn(prisma.showtimes, 'findUnique').mockResolvedValue(null);
      await expect(service.create(createBookingDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for past showtime', async () => {
      const pastShowtime = { ...mockShowtime, start_time: new Date(new Date().getTime() - 1000) };
      jest.spyOn(prisma.showtimes, 'findUnique').mockResolvedValue(pastShowtime as any);
      await expect(service.create(createBookingDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no seats are selected', async () => {
      const dtoWithNoSeats = { ...createBookingDto, seats: [] };
      await expect(service.create(dtoWithNoSeats)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if invalid seats are selected', async () => {
      jest.spyOn(prisma.seats, 'findMany').mockResolvedValue([mockSeat1] as any);
      await expect(service.create(createBookingDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if seats are already booked', async () => {
      const bookedSeats = [{ booking_seats: [{ seat_id: 1 }] }];
      jest.spyOn(prisma.bookings, 'findMany').mockResolvedValue(bookedSeats as any);
      await expect(service.create(createBookingDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated bookings with default params', async () => {
      const result = await service.findAll();
      expect(prisma.bookings.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10, where: {} })
      );
      expect(result).toEqual({
        data: [mockBooking],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
      });
    });

    it('should filter bookings by userId and status', async () => {
      await service.findAll(1, 10, 1, Status.pending);
      expect(prisma.bookings.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: 1, payment_status: Status.pending },
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a single booking', async () => {
      const result = await service.findOne(1);
      expect(prisma.bookings.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } })
      );
      expect(result).toEqual(mockBooking);
    });

    it('should throw NotFoundException if booking not found', async () => {
      jest.spyOn(prisma.bookings, 'findUnique').mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByUser', () => {
    it('should return a paginated list of bookings for a user', async () => {
      const result = await service.findByUser(1);
      expect(prisma.users.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result.data).toEqual([mockBooking]);
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(prisma.users, 'findUnique').mockResolvedValue(null);
      await expect(service.findByUser(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a booking', async () => {
      const updateDto: UpdateBookingDto = { payment_status: Status.complete };
      const result = await service.update(1, updateDto);
      expect(prisma.bookings.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 }, data: updateDto })
      );
      expect(result).toEqual(mockBooking);
    });

    it('should throw NotFoundException if booking not found', async () => {
      jest.spyOn(prisma.bookings, 'findUnique').mockResolvedValue(null);
      await expect(service.update(999, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelBooking', () => {
    it('should cancel a booking', async () => {
      const cancelledBooking = { ...mockBooking, payment_status: 'cancelled', showtime: { start_time: new Date(new Date().getTime() + 60 * 60 * 1000) } };
      jest.spyOn(prisma.bookings, 'findUnique').mockResolvedValue(cancelledBooking as any);
      jest.spyOn(prisma.bookings, 'update').mockResolvedValue(cancelledBooking as any);

      const result = await service.cancelBooking(1);

      expect(prisma.bookings.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 }, data: { payment_status: 'cancelled' } })
      );
      expect(prisma.booking_Seats.deleteMany).toHaveBeenCalledWith({ where: { booking_id: 1 } });
      expect(result.payment_status).toEqual('cancelled');
    });

    it('should throw NotFoundException if booking not found', async () => {
      jest.spyOn(prisma.bookings, 'findUnique').mockResolvedValue(null);
      await expect(service.cancelBooking(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if showtime is in the past', async () => {
      const pastShowtimeBooking = { ...mockBooking, showtime: { start_time: new Date(new Date().getTime() - 1000) } };
      jest.spyOn(prisma.bookings, 'findUnique').mockResolvedValue(pastShowtimeBooking as any);
      await expect(service.cancelBooking(1)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if booking is already completed', async () => {
      const completedBooking = { ...mockBooking, payment_status: 'complete' };
      jest.spyOn(prisma.bookings, 'findUnique').mockResolvedValue(completedBooking as any);
      await expect(service.cancelBooking(1)).rejects.toThrow(BadRequestException);
    });
  });

  // ---

  describe('confirmPayment', () => {
    it('should confirm payment and update user points', async () => {
      const pendingBooking = { ...mockBooking, payment_status: 'pending', user: mockUser, showtime: mockShowtime };
      const completedBooking = { ...pendingBooking, payment_status: 'complete' };
      
      jest.spyOn(prisma.bookings, 'findUnique').mockResolvedValue(pendingBooking as any);
      jest.spyOn(prisma.bookings, 'update').mockResolvedValue(completedBooking as any);
      jest.spyOn(prisma.users, 'update').mockResolvedValue({ ...mockUser, points: mockUser.points + 150 } as any);

      await service.confirmPayment(1);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.bookings.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 }, data: { payment_status: 'complete' } })
      );
      expect(prisma.users.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 }, data: { points: { increment: 150 } } })
      );
    });

    it('should throw NotFoundException if booking not found', async () => {
      jest.spyOn(prisma.bookings, 'findUnique').mockResolvedValue(null);
      await expect(service.confirmPayment(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if booking is not pending', async () => {
      const nonPendingBooking = { ...mockBooking, payment_status: 'cancelled' };
      jest.spyOn(prisma.bookings, 'findUnique').mockResolvedValue(nonPendingBooking as any);
      await expect(service.confirmPayment(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getBookingStats', () => {
    it('should return global booking statistics', async () => {
      jest.spyOn(prisma.bookings, 'count').mockResolvedValueOnce(10).mockResolvedValueOnce(5).mockResolvedValueOnce(3).mockResolvedValueOnce(2);
      jest.spyOn(prisma.bookings, 'aggregate').mockResolvedValueOnce({ _sum: { total_price: 500000 } } as any);

      const result = await service.getBookingStats();

      expect(result.total_bookings).toEqual(10);
      expect(result.completed_bookings).toEqual(5);
      expect(result.total_revenue).toEqual(500000);
    });

    it('should return user-specific booking statistics', async () => {
      jest.spyOn(prisma.bookings, 'count').mockResolvedValueOnce(5).mockResolvedValueOnce(3).mockResolvedValueOnce(1).mockResolvedValueOnce(1);
      jest.spyOn(prisma.bookings, 'aggregate').mockResolvedValueOnce({ _sum: { total_price: 250000 } } as any);

      const result = await service.getBookingStats(1);

      expect(result.total_bookings).toEqual(5);
      expect(result.completed_bookings).toEqual(3);
      expect(result.total_revenue).toEqual(250000);
      expect(prisma.bookings.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: { user_id: 1 } })
      );
    });
  });
});