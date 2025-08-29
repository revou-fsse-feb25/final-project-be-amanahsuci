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
import { AuthResponseDto } from './dto/auth-response.dto';
import { 
    ApiOperation, 
    ApiResponse, 
    ApiTags 
} from '@nestjs/swagger';

@ApiTags('Auth Service')
@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) {}

    @ApiOperation({ summary: 'Register a new user (service)' })
    @ApiResponse({ status: 201, description: 'User successfully registered', type: AuthResponseDto })
    @ApiResponse({ status: 400, description: 'Passwords do not match or bad request' })
    @ApiResponse({ status: 409, description: 'User already exists' })
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

    @ApiOperation({ summary: 'Login user (service)' })
    @ApiResponse({ status: 200, description: 'Successfully logged in', type: AuthResponseDto })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
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

    @ApiOperation({ summary: 'Validate user by ID (service)' })
    @ApiResponse({ status: 200, description: 'User found' })
    @ApiResponse({ status: 401, description: 'User not found or unauthorized' })
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

    @ApiOperation({ summary: 'Get profile (service)' })
    @ApiResponse({ status: 200, description: 'Return user profile' })
    async getProfile(userId: number) {
        return this.validateUser(userId);
    }
}
