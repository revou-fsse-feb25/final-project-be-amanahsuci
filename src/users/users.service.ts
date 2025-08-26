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
import { Role, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password, name, phone, role = Role.customer } = createUserDto;

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
    
    let whereCondition: Prisma.UsersWhereInput = {};
    
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const searchTerm = search.trim();
      whereCondition = {
        OR: [
          { 
            name: { 
              contains: searchTerm, 
              mode: Prisma.QueryMode.insensitive 
            } 
          },
          { 
            email: { 
              contains: searchTerm, 
              mode: Prisma.QueryMode.insensitive 
            } 
          },
        ],
      };
    }

    try {
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
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new BadRequestException('Failed to fetch users');
    }
  }

  async findOne(id: number) {
    if (!id || id <= 0) {
      throw new BadRequestException('Invalid user ID');
    }

    try {
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
          Points_Transactions: { 
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
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error in findOne:', error);
      throw new BadRequestException('Failed to fetch user details');
    }
  }

  async findByEmail(email: string) {
    if (!email || typeof email !== 'string') {
      throw new BadRequestException('Invalid email');
    }

    const user = await this.prisma.users.findUnique({
      where: { email: email.toLowerCase().trim() },
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
    if (!id || id <= 0) {
      throw new BadRequestException('Invalid user ID');
    }

    // Check if user exists
    const existingUser = await this.prisma.users.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailToCheck = updateUserDto.email.toLowerCase().trim();
      const userWithEmail = await this.prisma.users.findUnique({
        where: { email: emailToCheck },
      });

      if (userWithEmail) {
        throw new ConflictException('Email already in use');
      }
    }

    let hashedPassword: string | undefined;
    if (updateUserDto.password) {
      hashedPassword = await bcrypt.hash(updateUserDto.password, 12);
    }

    const updateData: Prisma.UsersUpdateInput = {
      ...(updateUserDto.name !== undefined && { name: updateUserDto.name }),
      ...(updateUserDto.email !== undefined && { 
        email: updateUserDto.email.toLowerCase().trim() 
      }),
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
          created_at: true,
          updated_at: true,
        },
      });

      return updatedUser;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      console.error('Error in update:', error);
      throw new BadRequestException('Failed to update user');
    }
  }

  async remove(id: number) {
    if (!id || id <= 0) {
      throw new BadRequestException('Invalid user ID');
    }

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

      return { 
        message: 'User deleted successfully',
        deletedUser: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      };
    } catch (error) {
      if (error.code === 'P2003') {
        throw new BadRequestException(
          'Cannot delete user with related data. Please remove related records first.'
        );
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      console.error('Error in remove:', error);
      throw new BadRequestException('Failed to delete user');
    }
  }

  async getProfile(id: number) {
    return this.findOne(id);
  }

  async addPoints(userId: number, points: number) {
    if (!userId || userId <= 0) {
      throw new BadRequestException('Invalid user ID');
    }

    if (!points || points <= 0) {
      throw new BadRequestException('Points must be greater than 0');
    }

    // Check if user exists
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      const updatedUser = await this.prisma.users.update({
        where: { id: userId },
        data: {
          points: { increment: points },
        },
        select: {
          id: true,
          name: true,
          email: true,
          points: true,
        },
      });

      return updatedUser;
    } catch (error) {
      console.error('Error in addPoints:', error);
      throw new BadRequestException('Failed to add points');
    }
  }

  async deductPoints(userId: number, points: number) {
    if (!userId || userId <= 0) {
      throw new BadRequestException('Invalid user ID');
    }

    if (!points || points <= 0) {
      throw new BadRequestException('Points must be greater than 0');
    }

    // Check if user exists and has enough points
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.points < points) {
      throw new BadRequestException('Insufficient points');
    }

    try {
      const updatedUser = await this.prisma.users.update({
        where: { id: userId },
        data: {
          points: { decrement: points },
        },
        select: {
          id: true,
          name: true,
          email: true,
          points: true,
        },
      });

      return updatedUser;
    } catch (error) {
      console.error('Error in deductPoints:', error);
      throw new BadRequestException('Failed to deduct points');
    }
  }

  async getUserStats(id: number) {
    if (!id || id <= 0) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        points: true,
        created_at: true,
        _count: {
          select: {
            bookings: true,
            Points_Transactions: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        points: user.points,
        memberSince: user.created_at,
      },
      statistics: {
        totalBookings: user._count.bookings,
        totalPointsTransactions: user._count.Points_Transactions,
      },
    };
  }
}