import { Test, TestingModule } from '@nestjs/testing';
import { ShowtimesController } from './showtimes.controller';
import { ShowtimesService } from './showtimes.service';

describe('ShowtimesController', () => {
  let controller: ShowtimesController;
  let service: ShowtimesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShowtimesController],
      providers: [
        {
          provide: ShowtimesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            getShowtimesByMovie: jest.fn(),
            getShowtimesByCinema: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ShowtimesController>(ShowtimesController);
    service = module.get<ShowtimesService>(ShowtimesService);
  });

  describe('create', () => {
    it('should call service.create and return result', async () => {
      const dto = { movie_id: 1, cinema_id: 1, start_time: new Date().toISOString() };
      (service.create as jest.Mock).mockResolvedValue({ id: 1, ...dto });

      const result = await controller.create(dto as any);
      expect(result).toHaveProperty('id', 1);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return paginated showtimes', async () => {
      (service.findAll as jest.Mock).mockResolvedValue({ data: [{ id: 1 }], meta: { total: 1 } });

      const result = await controller.findAll(1, 10);
      expect(result.data[0]).toHaveProperty('id', 1);
    });
  });

  describe('getShowtimesByMovie', () => {
    it('should return showtimes by movie', async () => {
      (service.getShowtimesByMovie as jest.Mock).mockResolvedValue({ movie: { id: 1 }, showtimes: [] });

      const result = await controller.getShowtimesByMovie(1);
      expect(result.movie).toHaveProperty('id', 1);
    });
  });

  describe('getShowtimesByCinema', () => {
    it('should return showtimes by cinema', async () => {
      (service.getShowtimesByCinema as jest.Mock).mockResolvedValue({ cinema: { id: 1 }, showtimes: [] });

      const result = await controller.getShowtimesByCinema(1);
      expect(result.cinema).toHaveProperty('id', 1);
    });
  });

  describe('findOne', () => {
    it('should return a showtime by id', async () => {
      (service.findOne as jest.Mock).mockResolvedValue({ id: 1 });

      const result = await controller.findOne(1);
      expect(result).toHaveProperty('id', 1);
    });
  });

  describe('update', () => {
    it('should update showtime', async () => {
      (service.update as jest.Mock).mockResolvedValue({ id: 1, movie: { title: 'Updated' } });

      const result = await controller.update(1, { movie_id: 2 } as any);
      expect(result).toHaveProperty('id', 1);
    });
  });

  describe('remove', () => {
    it('should remove showtime and return message', async () => {
      (service.remove as jest.Mock).mockResolvedValue({ message: 'Showtime deleted successfully' });

      const result = await controller.remove(1);
      expect(result).toEqual({ message: 'Showtime deleted successfully' });
    });
  });
});
