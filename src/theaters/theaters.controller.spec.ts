import { Test, TestingModule } from '@nestjs/testing';
import { TheatersController } from './theaters.controller';
import { TheatersService } from './theaters.service';

describe('TheatersController', () => {
  let controller: TheatersController;
  let service: TheatersService;

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
    it('should call service and return theater', async () => {
      const dto = { name: 'Grand', location: 'City' };
      jest.spyOn(service, 'createTheater').mockResolvedValue({ id: 1, ...dto });
      const result = await controller.createTheater(dto);
      expect(result).toEqual({ id: 1, ...dto });
    });
  });

  describe('findAllTheaters', () => {
    it('should return theaters list', async () => {
      jest.spyOn(service, 'findAllTheaters').mockResolvedValue({ data: [], meta: {} });
      const result = await controller.findAllTheaters(1, 10, 'Grand');
      expect(result).toEqual({ data: [], meta: {} });
    });
  });

  describe('findTheaterById', () => {
    it('should return theater by id', async () => {
      jest.spyOn(service, 'findTheaterById').mockResolvedValue({ id: 1, name: 'Grand' });
      const result = await controller.findTheaterById(1);
      expect(result).toEqual({ id: 1, name: 'Grand' });
    });
  });

  describe('updateTheater', () => {
    it('should update and return theater', async () => {
      const dto = { name: 'New' };
      jest.spyOn(service, 'updateTheater').mockResolvedValue({ id: 1, name: 'New' });
      const result = await controller.updateTheater(1, dto);
      expect(result).toEqual({ id: 1, name: 'New' });
    });
  });

  describe('removeTheater', () => {
    it('should delete theater', async () => {
      jest.spyOn(service, 'removeTheater').mockResolvedValue({ message: 'Theater deleted successfully' });
      const result = await controller.removeTheater(1);
      expect(result).toEqual({ message: 'Theater deleted successfully' });
    });
  });

  describe('createCinema', () => {
    it('should create a cinema', async () => {
      const dto = { theater_id: 1, type: 'Reguler', total_seats: 100, price: 50000 };
      jest.spyOn(service, 'createCinema').mockResolvedValue({ id: 1, ...dto });
      const result = await controller.createCinema(dto as any);
      expect(result).toEqual({ id: 1, ...dto });
    });
  });

  describe('findAllCinemas', () => {
    it('should return cinemas list', async () => {
      jest.spyOn(service, 'findAllCinemas').mockResolvedValue({ data: [], meta: {} });
      const result = await controller.findAllCinemas(1, 10);
      expect(result).toEqual({ data: [], meta: {} });
    });
  });

  describe('findCinemaById', () => {
    it('should return cinema by id', async () => {
      jest.spyOn(service, 'findCinemaById').mockResolvedValue({ id: 1, type: 'Reguler' });
      const result = await controller.findCinemaById(1);
      expect(result).toEqual({ id: 1, type: 'Reguler' });
    });
  });

  describe('updateCinema', () => {
    it('should update and return cinema', async () => {
      jest.spyOn(service, 'updateCinema').mockResolvedValue({ id: 1, type: 'VIP' });
      const result = await controller.updateCinema(1, { type: 'VIP' } as any);
      expect(result).toEqual({ id: 1, type: 'VIP' });
    });
  });

  describe('removeCinema', () => {
    it('should delete cinema', async () => {
      jest.spyOn(service, 'removeCinema').mockResolvedValue({ message: 'Cinema deleted successfully' });
      const result = await controller.removeCinema(1);
      expect(result).toEqual({ message: 'Cinema deleted successfully' });
    });
  });
});
