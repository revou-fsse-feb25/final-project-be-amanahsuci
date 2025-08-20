import { 
  Injectable, 
  ConflictException, 
  UnauthorizedException,
  BadRequestException 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponse, JwtPayload } from './types/auth';

@Injectable()
export class AuthService {
  constructor(
      private prisma: PrismaService,
      private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
      const { name, email, phone, password, confirmPassword } = registerDto;

      if (password !== confirmPassword) {
          throw new BadRequestException('Passwords do not match');
      }

      const existingUser = await this.prisma.users.findUnique({
          where: { email },
      });

      if (existingUser) {
          throw new ConflictException('User with this email already exists');
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const user = await this.prisma.users.create({
          data: {
              name,
              email,
              phone,
              password: hashedPassword,
              role: 'customer', 
              points: 0,
          },
          select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              points: true,
          },
      });

      const payload: JwtPayload = {
          sub: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
      };

      const access_token = this.jwtService.sign(payload);

      return {
          user,
          access_token,
      };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
      const { email, password } = loginDto;

      const user = await this.prisma.users.findUnique({
          where: { email },
      });

      if (!user) {
          throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
          throw new UnauthorizedException('Invalid credentials');
      }

      const payload: JwtPayload = {
          sub: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
      };

      const access_token = this.jwtService.sign(payload);

      return {
          user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              phone: user.phone ?? null,
              points: user.points,
          },
          access_token,
      };
  }

  async validateUser(userId: number) {
      const user = await this.prisma.users.findUnique({
          where: { id: userId },
          select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              points: true,
          },
      });

      if (!user) {
          throw new UnauthorizedException('User not found');
      }

      return user;
  }

  async getProfile(userId: number) {
      return this.validateUser(userId);
  }
}