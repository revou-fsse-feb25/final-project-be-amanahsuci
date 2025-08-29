import { Test, TestingModule } from '@nestjs/testing';
import { TheatersController } from './theaters.controller';
import { TheatersService } from './theaters.service';

describe('TheatersController', () => {
  let controller: TheatersController;
  let service: TheatersService;

  const mockDate = new Date();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TheatersController],
      providers: [
        {
          provide: TheatersService,
          useValue: {
            createTheater: jest.fn(),
            findAllTheaters: jest.fn(),
            getTheatersWithShowtimes: jest.fn(),
            findTheaterById: jest.fn(),
            updateTheater: jest.fn(),
            removeTheater: jest.fn(),
            createCinema: jest.fn(),
            findAllCinemas: jest.fn(),
            findCinemaById: jest.fn(),
            updateCinema: jest.fn(),
            removeCinema: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TheatersController>(TheatersController);
    service = module.get<TheatersService>(TheatersService);
  });

  describe('createTheater', () => {
    it('should create a theater', async () => {
      const dto = { name: 'Grand', location: 'City' };

      jest.spyOn(service, 'createTheater').mockResolvedValue({
        id: 1,
        name: dto.name,
        location: dto.location,
        // cast to any to avoid strict typing errors (createdAt / updatedAt may differ in schema)
      } as any);

      const result = await controller.createTheater(dto);
      expect(result).toEqual({
        id: 1,
        name: 'Grand',
        location: 'City',
      } as any);
    });
  });

  describe('findAllTheaters', () => {
    it('should return list of theaters with meta', async () => {
      jest.spyOn(service, 'findAllTheaters').mockResolvedValue({
        data: [
          { id: 1, name: 'Grand', location: 'City' },
        ],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1, hasNext: false, hasPrev: false },
      } as any);

      const result = await controller.findAllTheaters(1, 10);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.data[0].name).toBe('Grand');
    });
  });

  describe('getTheatersWithShowtimes', () => {
    it('should call service.getTheatersWithShowtimes and return value', async () => {
      const mockResp = [
        { id: 1, name: 'Grand', location: 'City', cinemas: [] },
      ];
      jest.spyOn(service, 'getTheatersWithShowtimes').mockResolvedValue(mockResp as any);

      const res = await controller.getTheatersWithShowtimes(undefined);
      expect(res).toEqual(mockResp as any);
    });
  });

  describe('findTheaterById', () => {
    it('should return a theater by id', async () => {
      jest.spyOn(service, 'findTheaterById').mockResolvedValue({
        id: 1,
        name: 'Grand',
        location: 'City',
        cinemas: [],
      } as any);

      const result = await controller.findTheaterById(1);
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('name', 'Grand');
    });
  });

  describe('updateTheater', () => {
    it('should update a theater and return updated entity', async () => {
      const dto = { name: 'New', location: 'New City' };

      jest.spyOn(service, 'updateTheater').mockResolvedValue({
        id: 1,
        name: dto.name,
        location: dto.location,
      } as any);

      const result = await controller.updateTheater(1, dto);
      expect(result).toHaveProperty('name', 'New');
      expect(result).toHaveProperty('location', 'New City');
    });
  });

  describe('removeTheater', () => {
    it('should remove a theater and return message', async () => {
      jest.spyOn(service, 'removeTheater').mockResolvedValue({ message: 'Theater deleted successfully' } as any);

      const result = await controller.removeTheater(1);
      expect(result).toEqual({ message: 'Theater deleted successfully' });
    });
  });

  // --- Cinema-related controller tests (optional / helpful) ---
  describe('createCinema', () => {
    it('should create a cinema', async () => {
      const dto = { theater_id: 1, type: 'Reguler', total_seats: 100, price: 50000 };

      jest.spyOn(service, 'createCinema').mockResolvedValue({
        id: 10,
        theater_id: dto.theater_id,
        type: dto.type,
        total_seats: dto.total_seats,
        price: dto.price,
      } as any);

      const result = await controller.createCinema(dto as any);
      expect(result).toHaveProperty('id', 10);
      expect(result).toHaveProperty('type', 'Reguler');
    });
  });

  describe('findAllCinemas', () => {
    it('should return cinemas list', async () => {
      jest.spyOn(service, 'findAllCinemas').mockResolvedValue({
        data: [{ id: 10, theater_id: 1, type: 'Reguler' }],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1, hasNext: false, hasPrev: false },
      } as any);

      const result = await controller.findAllCinemas(1, 10);
      expect(result.data[0].type).toBe('Reguler');
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findCinemaById', () => {
    it('should return a cinema by id', async () => {
      jest.spyOn(service, 'findCinemaById').mockResolvedValue({
        id: 10,
        theater_id: 1,
        type: 'Reguler',
        seats: [],
        showtimes: [],
      } as any);

      const result = await controller.findCinemaById(10);
      expect(result).toHaveProperty('id', 10);
      expect(result).toHaveProperty('type', 'Reguler');
    });
  });

  describe('updateCinema', () => {
    it('should update a cinema', async () => {
      jest.spyOn(service, 'updateCinema').mockResolvedValue({
        id: 10,
        theater_id: 1,
        type: 'VIP',
      } as any);

      const result = await controller.updateCinema(10, { type: 'VIP' } as any);
      expect(result).toHaveProperty('type', 'VIP');
    });
  });

  describe('removeCinema', () => {
    it('should remove a cinema and return message', async () => {
      jest.spyOn(service, 'removeCinema').mockResolvedValue({ message: 'Cinema deleted successfully' } as any);

      const result = await controller.removeCinema(10);
      expect(result).toEqual({ message: 'Cinema deleted successfully' });
    });
  });
});
