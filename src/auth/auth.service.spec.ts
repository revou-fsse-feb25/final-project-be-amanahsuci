import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const jwtMock = {
    sign: jest.fn(),
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    it('should register a new user and return access token', async () => {
      const dto: RegisterDto = {
        name: 'John',
        email: 'john@mail.com',
        phone: '08123456789',
        password: 'changeme',
        confirmPassword: 'changeme',
      };

      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 1,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        role: 'customer',
        points: 0,
      });

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');
      jwtMock.sign.mockReturnValue('mockToken');
      jwtMock.signAsync.mockResolvedValue('mockToken');

      const result = await service.register(dto);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(prismaMock.user.create).toHaveBeenCalled();
      expect(result).toEqual({
        user: {
          id: 1,
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          role: 'customer',
          points: 0,
        },
        access_token: 'mockToken',
      });
    });

    it('should throw BadRequestException if passwords do not match', async () => {
      const dto: RegisterDto = {
        name: 'John',
        email: 'john@mail.com',
        phone: '08123456789',
        password: 'changeme',
        confirmPassword: 'wrong',
      };

      await expect(service.register(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if user already exists', async () => {
      const dto: RegisterDto = {
        name: 'John',
        email: 'john@mail.com',
        phone: '08123456789',
        password: 'changeme',
        confirmPassword: 'changeme',
      };

      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        email: dto.email,
      });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login successfully and return access token', async () => {
      const dto: LoginDto = {
        email: 'john@mail.com',
        password: 'changeme',
      };

      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        name: 'John',
        email: dto.email,
        password: 'hashedPassword',
        role: 'customer',
        phone: '08123456789',
        points: 0,
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jwtMock.sign.mockReturnValue('mockToken');
      jwtMock.signAsync.mockResolvedValue('mockToken');

      const result = await service.login(dto);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(result.access_token).toBe('mockToken');
      expect(result.user.name).toBe('John');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const dto: LoginDto = { email: 'john@mail.com', password: 'changeme' };

      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password invalid', async () => {
      const dto: LoginDto = { email: 'john@mail.com', password: 'changeme' };

      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        name: 'John',
        email: dto.email,
        password: 'hashedPassword',
        role: 'customer',
        phone: '08123456789',
        points: 0,
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should return user if found', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        name: 'John',
        email: 'john@mail.com',
        phone: '08123456789',
        role: 'customer',
        points: 0,
      });

      const result = await service.validateUser(1);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result.id).toBe(1);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(service.validateUser(1)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue({
        id: 1,
        name: 'John',
        email: 'john@mail.com',
        phone: '08123456789',
        role: 'customer',
        points: 0,
      } as any);

      const result = await service.getProfile(1);
      expect(result.name).toBe('John');
    });
  });
});
