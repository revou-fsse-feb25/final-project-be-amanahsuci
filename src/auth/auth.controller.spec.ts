import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guards';
import { ExecutionContext } from '@nestjs/common';
import { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    getProfile: jest.fn(),
  };

  const mockResponse = () => {
    const res: Partial<Response> = {};
    res.cookie = jest.fn().mockReturnValue(res);
    return res as Response;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({
      canActivate: (context: ExecutionContext) => true,
    })
    .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call authService.register with correct DTO', async () => {
      const dto = new RegisterDto();
      dto.name = 'John';
      dto.email = 'john@mail.com';
      dto.password = 'changeme';

      const expectedResult = { id: 1, ...dto };
      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(dto);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('login', () => {
    it('should login and set cookie', async () => {
      const dto = new LoginDto();
      dto.email = 'john@mail.com';
      dto.password = 'changeme';

      const res = mockResponse();
      const accessToken = 'mockedToken';
      mockAuthService.login.mockResolvedValue({ access_token: accessToken });

      const result = await controller.login(dto, res);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(res.cookie).toHaveBeenCalledWith('access_token', accessToken, expect.objectContaining({
        httpOnly: true,
        secure: expect.any(Boolean),
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60,
      }));
      expect(result).toEqual({ access_token: accessToken });
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const userId = 1;
      const profile = { id: 1, name: 'John', email: 'john@mail.com' };
      mockAuthService.getProfile.mockResolvedValue(profile);

      const result = await controller.getProfile(userId);

      expect(mockAuthService.getProfile).toHaveBeenCalledWith(userId);
      expect(result).toEqual(profile);
    });
  });
});
