import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '@prisma/client';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByEmail: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const dto: CreateUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '1234567890',
        role: Role.customer,
      };
      const result = { id: 1, ...dto, points: 0 };

      mockUsersService.create.mockResolvedValue(result);

      expect(await controller.create(dto)).toEqual(result);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const result = {
        data: [{ id: 1, name: 'John Doe' }],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
      };

      mockUsersService.findAll.mockResolvedValue(result);

      expect(await controller.findAll(1, 10, 'john')).toEqual(result);
      expect(service.findAll).toHaveBeenCalledWith(1, 10, 'john');
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const result = { id: 1, name: 'John Doe' };

      mockUsersService.findOne.mockResolvedValue(result);

      expect(await controller.findOne(1)).toEqual(result);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const result = { id: 1, name: 'John Doe', email: 'john@example.com' };

      mockUsersService.findByEmail.mockResolvedValue(result);

      expect(await controller.findByEmail('john@example.com')).toEqual(result);
      expect(service.findByEmail).toHaveBeenCalledWith('john@example.com');
    });
  });

  describe('update', () => {
    it('should update a user by id', async () => {
      const dto: UpdateUserDto = { name: 'Jane Doe' };
      const result = { id: 1, name: 'Jane Doe' };

      mockUsersService.update.mockResolvedValue(result);

      expect(await controller.update(1, dto)).toEqual(result);
      expect(service.update).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('remove', () => {
    it('should remove a user by id', async () => {
      const result = { message: 'User deleted successfully', deletedUser: { id: 1, email: 'john@example.com', name: 'John Doe' } };

      mockUsersService.remove.mockResolvedValue(result);

      expect(await controller.remove(1)).toEqual(result);
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
