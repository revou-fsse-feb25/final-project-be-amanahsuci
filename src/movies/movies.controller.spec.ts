import { Test, TestingModule } from '@nestjs/testing';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

describe('MoviesController', () => {
  let controller: MoviesController;
  let service: any;

  beforeEach(async () => {
    const mockMoviesService: Partial<jest.Mocked<MoviesService>> = {
      create: jest.fn(),
      findAll: jest.fn(),
      getNowShowing: jest.fn(),
      getComingSoon: jest.fn(),
      getGenres: jest.fn(),
      findOne: jest.fn(),
      findByTitle: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [
        { provide: MoviesService, useValue: mockMoviesService },
      ],
    }).compile();

    controller = module.get<MoviesController>(MoviesController);
    service = module.get(MoviesService);
  });

  describe('create', () => {
    it('should call service.create and return created movie', async () => {
      const dto: CreateMovieDto = {
        title: 'Movie A',
        description: 'desc',
        genre: 'Action',
        duration_minutes: 120,
        poster_url: '',
      };
      const mockMovie = { id: 1, ...dto };

      service.create.mockResolvedValue(mockMovie);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockMovie);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll and return paginated movies', async () => {
      const mockResult = { data: [{ id: 1, title: 'Movie A' }], meta: { total: 1 } };
      service.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(1, 10, 'Batman', 'Action');

      expect(service.findAll).toHaveBeenCalledWith(1, 10, 'Batman', 'Action');
      expect(result).toEqual(mockResult);
    });
  });

  describe('getNowShowing', () => {
    it('should return now showing movies', async () => {
      const mockMovies = [{ id: 1, title: 'Now Showing' }];
      service.getNowShowing.mockResolvedValue(mockMovies);

      const result = await controller.getNowShowing();

      expect(service.getNowShowing).toHaveBeenCalled();
      expect(result).toEqual(mockMovies);
    });
  });

  describe('getComingSoon', () => {
    it('should return coming soon movies', async () => {
      const mockMovies = [{ id: 1, title: 'Coming Soon' }];
      service.getComingSoon.mockResolvedValue(mockMovies);

      const result = await controller.getComingSoon();

      expect(service.getComingSoon).toHaveBeenCalled();
      expect(result).toEqual(mockMovies);
    });
  });

  describe('getGenres', () => {
    it('should return genres', async () => {
      const mockGenres = [{ name: 'Action', count: 2 }];
      service.getGenres.mockResolvedValue(mockGenres);

      const result = await controller.getGenres();

      expect(service.getGenres).toHaveBeenCalled();
      expect(result).toEqual(mockGenres);
    });
  });

  describe('findOne', () => {
    it('should return a movie by id', async () => {
      const mockMovie = { id: 1, title: 'Movie A' };
      service.findOne.mockResolvedValue(mockMovie);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockMovie);
    });
  });

  describe('findByTitle', () => {
    it('should return a movie by title', async () => {
      const mockMovie = { id: 1, title: 'Inception' };
      service.findByTitle.mockResolvedValue(mockMovie);

      const result = await controller.findByTitle('Inception');

      expect(service.findByTitle).toHaveBeenCalledWith('Inception');
      expect(result).toEqual(mockMovie);
    });
  });

  describe('update', () => {
    it('should update a movie and return it', async () => {
      const dto: UpdateMovieDto = { title: 'Updated Movie' };
      const mockMovie = { id: 1, ...dto };

      service.update.mockResolvedValue(mockMovie);

      const result = await controller.update(1, dto);

      expect(service.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(mockMovie);
    });
  });

  describe('remove', () => {
    it('should delete a movie and return message', async () => {
      const mockResponse = { message: 'Movie deleted successfully' };
      service.remove.mockResolvedValue(mockResponse);

      const result = await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResponse);
    });
  });
});
