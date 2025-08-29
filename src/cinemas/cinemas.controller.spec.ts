import { Test, TestingModule } from '@nestjs/testing';
import { CinemasController } from './cinemas.controller';
import { CinemasService } from './cinemas.service';
import { CreateCinemaDto } from './dto/create-cinema.dto';
import { UpdateCinemaDto } from './dto/update-cinema.dto';
import { CinemaType } from '@prisma/client';

describe('CinemasController', () => {
  let controller: CinemasController;
  let service: CinemasService;

  const mockCinema = {
    id: 1,
    theater_id: 1,
    type: CinemaType.Reguler,
    total_seats: 100,
    price: 50000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCinemasService = {
    create: jest.fn(() => Promise.resolve(mockCinema)),
    findAll: jest.fn(() => Promise.resolve({
      data: [mockCinema],
      meta: { total: 1, page: 1, limit: 10 },
    })),
    findByTheater: jest.fn(() => Promise.resolve([mockCinema])),
    findOne: jest.fn(() => Promise.resolve(mockCinema)),
    getAvailableSeats: jest.fn(() => Promise.resolve({ availableSeats: 50 })),
    getCinemaStats: jest.fn(() => Promise.resolve({ totalSeats: 100, soldSeats: 50 })),
    update: jest.fn(() => Promise.resolve(mockCinema)),
    remove: jest.fn(() => Promise.resolve(mockCinema)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CinemasController],
      providers: [
        {
          provide: CinemasService,
          useValue: mockCinemasService,
        },
      ],
    }).compile();

    controller = module.get<CinemasController>(CinemasController);
    service = module.get<CinemasService>(CinemasService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a cinema and return it', async () => {
      const createCinemaDto: CreateCinemaDto = {
        theater_id: 1,
        type: CinemaType.Reguler,
        total_seats: 100,
        price: 50000,
      };
      
      const result = await controller.create(createCinemaDto);
      expect(service.create).toHaveBeenCalledWith(createCinemaDto);
      expect(result).toEqual(mockCinema);
    });
  });

  describe('findAll', () => {
    it('should return a list of cinemas', async () => {
      const result = await controller.findAll();
      expect(service.findAll).toHaveBeenCalledWith(1, 10, undefined, undefined);
      expect(result.data).toEqual([mockCinema]);
    });
  });

  describe('findByTheater', () => {
    it('should return cinemas for a specific theater', async () => {
      const theaterId = 1;
      const result = await controller.findByTheater(theaterId);
      expect(service.findByTheater).toHaveBeenCalledWith(theaterId);
      expect(result).toEqual([mockCinema]);
    });
  });

  describe('findOne', () => {
    it('should return a single cinema', async () => {
      const id = 1;
      const result = await controller.findOne(id);
      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockCinema);
    });
  });

  describe('getAvailableSeats', () => {
    it('should return available seats for a cinema', async () => {
      const cinemaId = 1;
      const result = await controller.getAvailableSeats(cinemaId);
      expect(service.getAvailableSeats).toHaveBeenCalledWith(cinemaId, undefined);
      expect(result).toEqual({ availableSeats: 50 });
    });
  });

  describe('getCinemaStats', () => {
    it('should return cinema statistics', async () => {
      const cinemaId = 1;
      const result = await controller.getCinemaStats(cinemaId);
      expect(service.getCinemaStats).toHaveBeenCalledWith(cinemaId);
      expect(result).toEqual({ totalSeats: 100, soldSeats: 50 });
    });
  });

  describe('update', () => {
    it('should update a cinema and return the updated object', async () => {
      const id = 1;
      const updateCinemaDto: UpdateCinemaDto = {
      };
      const result = await controller.update(id, updateCinemaDto);
      expect(service.update).toHaveBeenCalledWith(id, updateCinemaDto);
      expect(result).toEqual(mockCinema);
    });
  });

  describe('remove', () => {
    it('should remove a cinema', async () => {
      const id = 1;
      const result = await controller.remove(id);
      expect(service.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockCinema);
    });
  });
});