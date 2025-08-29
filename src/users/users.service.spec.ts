import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrisma = {
    users: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const dto = { name: 'John', email: 'john@example.com', password: 'password123', phone: '123456', role: Role.customer };
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      const newUser = { id: 1, ...dto, password: 'hashedPassword', points: 0 };
      (prisma.users.create as jest.Mock).mockResolvedValue(newUser);

      expect(await service.create(dto as any)).toEqual(newUser);
    });

    it('should throw ConflictException if email exists', async () => {
      (prisma.users.findUnique as jest.Mock).mockResolvedValue({ id: 1 });

      await expect(service.create({ email: 'test@test.com' } as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return user if found', async () => {
      const user = { id: 1, name: 'John' };
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(user);

      expect(await service.findOne(1)).toEqual(user);
    });

    it('should throw NotFoundException if not found', async () => {
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update user if exists', async () => {
      const user = { id: 1, email: 'john@example.com' };
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(user);
      const updated = { id: 1, name: 'Jane' };
      (prisma.users.update as jest.Mock).mockResolvedValue(updated);

      expect(await service.update(1, { name: 'Jane' })).toEqual(updated);
    });

    it('should throw NotFoundException if user not found', async () => {
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.update(999, { name: 'Jane' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete user if exists', async () => {
      const user = { id: 1, email: 'john@example.com', name: 'John' };
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(user);
      (prisma.users.delete as jest.Mock).mockResolvedValue(user);

      expect(await service.remove(1)).toEqual({
        message: 'User deleted successfully',
        deletedUser: { id: user.id, email: user.email, name: user.name },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
