import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password, name, phone, role = Role.customer } = createUserDto;

    // Check if email already exists
    const existingUser = await this.prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    const newUser = await this.prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role,
        points: 0,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        points: true,
        created_at: true,
        updated_at: true,
      },
    });

    return newUser;
  }

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    if (page < 1) throw new BadRequestException('Page must be greater than 0');
    if (limit < 1) throw new BadRequestException('Limit must be greater than 0');
    if (limit > 100) throw new BadRequestException('Limit cannot exceed 100');

    const skip = (page - 1) * limit;
    
    const whereCondition = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    } : {};

    const [users, total] = await Promise.all([
      this.prisma.users.findMany({
        where: whereCondition,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          points: true,
          created_at: true,
          updated_at: true,
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.users.count({ where: whereCondition }),
    ]);

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: number) {
    const user = await this.prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        points: true,
        created_at: true,
        updated_at: true,
        bookings: {
          select: {
            id: true,
            total_price: true,
            payment_status: true,
            created_at: true,
            showtime: {
              select: {
                start_time: true,
                movie: {
                  select: {
                    title: true,
                  },
                },
                cinema: {
                  select: {
                    type: true,
                    theater: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { created_at: 'desc' },
          take: 5,
        },
        points_transactions: {
          select: {
            id: true,
            type: true,
            points: true,
            created_at: true,
            booking: {
              select: {
                id: true,
                total_price: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    const user = await this.prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        password: true,
        role: true,
        points: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    // Check if user exists
    const existingUser = await this.prisma.users.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being changed to an existing email
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const userWithEmail = await this.prisma.users.findUnique({
        where: { email: updateUserDto.email },
      });

      if (userWithEmail) {
        throw new ConflictException('Email already in use');
      }
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (updateUserDto.password) {
      hashedPassword = await bcrypt.hash(updateUserDto.password, 12);
    }

    const updateData: any = {
      ...(updateUserDto.name !== undefined && { name: updateUserDto.name }),
      ...(updateUserDto.email !== undefined && { email: updateUserDto.email }),
      ...(updateUserDto.phone !== undefined && { phone: updateUserDto.phone }),
      ...(updateUserDto.role !== undefined && { role: updateUserDto.role }),
      updated_at: new Date(),
    };

    if (hashedPassword) {
      updateData.password = hashedPassword;
    }

    try {
      const updatedUser = await this.prisma.users.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          points: true,
          updated_at: true,
        },
      });

      return updatedUser;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  async remove(id: number) {
    // Check if user exists
    const user = await this.prisma.users.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      await this.prisma.users.delete({
        where: { id },
      });

      return { message: 'User deleted successfully' };
    } catch (error) {
      if (error.code === 'P2003') {
        throw new BadRequestException('Cannot delete user with related data');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  // Bonus methods
  async getProfile(id: number) {
    return this.findOne(id);
  }

  async addPoints(userId: number, points: number) {
    if (points <= 0) {
      throw new BadRequestException('Points must be greater than 0');
    }

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.users.update({
      where: { id: userId },
      data: {
        points: { increment: points },
      },
      select: {
        id: true,
        name: true,
        points: true,
      },
    });

    return updatedUser;
  }
}