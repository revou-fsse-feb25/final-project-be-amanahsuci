import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePointsTransactionDto } from './dto/create-points_transaction.dto';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { PointType } from '@prisma/client';

@Injectable()
export class PointsTransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPointsTransactionDto: CreatePointsTransactionDto) {
    const { user_id, booking_id, type, points, created_at } = createPointsTransactionDto;

    const user = await this.prisma.users.findUnique({
      where: { id: user_id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const booking = await this.prisma.bookings.findUnique({
      where: { id: booking_id },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.user_id !== user_id) {
      throw new BadRequestException('Booking does not belong to this user');
    }

    if (type === 'redeem' && points > user.points) {
      throw new BadRequestException('Insufficient points for redemption');
    }

    if (points <= 0) {
      throw new BadRequestException('Points must be greater than 0');
    }

    return await this.prisma.$transaction(async (prisma) => {
      const transaction = await prisma.points_Transactions.create({
        data: {
          user_id,
          booking_id,
          type,
          points: type === 'earn' ? points : -points,
          created_at: created_at || new Date(),
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          booking: {
            include: {
              showtime: {
                include: {
                  movie: {
                    select: {
                      title: true,
                    },
                  },
                  cinema: {
                    include: {
                      theater: {
                        select: {
                          name: true,
                          location: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const pointsChange = type === 'earn' ? points : -points;
      await prisma.users.update({
        where: { id: user_id },
        data: {
          points: {
            increment: pointsChange,
          },
        },
      });

      return transaction;
    });
  }

  async earnPoints(userId: number, points: number, bookingId: number) {
    if (points <= 0) {
      throw new BadRequestException('Points must be greater than 0');
    }

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.user_id !== userId) {
      throw new BadRequestException('Booking does not belong to this user');
    }

    return this.create({
      user_id: userId,
      booking_id: bookingId,
      type: 'earn',
      points,
    });
  }

  async redeemPoints(userId: number, redeemPointsDto: RedeemPointsDto) {
    const { points, booking_id } = redeemPointsDto;

    if (points <= 0) {
      throw new BadRequestException('Points must be greater than 0');
    }

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (points > user.points) {
      throw new BadRequestException('Insufficient points');
    }

    const booking = await this.prisma.bookings.findUnique({
      where: { id: booking_id },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.user_id !== userId) {
      throw new BadRequestException('Booking does not belong to this user');
    }

    return this.create({
      user_id: userId,
      booking_id,
      type: 'redeem',
      points,
    });
  }

  async findAll(page: number = 1, limit: number = 10, userId?: number, type?: PointType) {
    if (page < 1) throw new BadRequestException('Page must be greater than 0');
    if (limit < 1) throw new BadRequestException('Limit must be greater than 0');
    if (limit > 100) throw new BadRequestException('Limit cannot exceed 100');

    const skip = (page - 1) * limit;
    
    const whereCondition: any = {};

    if (userId) whereCondition.user_id = userId;
    if (type) whereCondition.type = type;

    const [transactions, total] = await Promise.all([
      this.prisma.points_Transactions.findMany({
        where: whereCondition,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          booking: {
            include: {
              showtime: {
                include: {
                  movie: {
                    select: {
                      title: true,
                    },
                  },
                  cinema: {
                    include: {
                      theater: {
                        select: {
                          name: true,
                          location: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.points_Transactions.count({ where: whereCondition }),
    ]);

    return {
      data: transactions,
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
    const transaction = await this.prisma.points_Transactions.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            points: true,
          },
        },
        booking: {
          include: {
            showtime: {
              include: {
                movie: true,
                cinema: {
                  include: {
                    theater: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Points transaction not found');
    }

    return transaction;
  }

  async findByUser(userId: number, page: number = 1, limit: number = 10) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.findAll(page, limit, userId);
  }

  async getUserPointsSummary(userId: number) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        points: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [totalEarned, totalRedeemed, recentTransactions] = await Promise.all([
      this.prisma.points_Transactions.aggregate({
        where: {
          user_id: userId,
          type: 'earn',
        },
        _sum: {
          points: true,
        },
      }),
      this.prisma.points_Transactions.aggregate({
        where: {
          user_id: userId,
          type: 'redeem',
        },
        _sum: {
          points: true,
        },
      }),
      this.prisma.points_Transactions.findMany({
        where: {
          user_id: userId,
        },
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
          booking: {
            include: {
              showtime: {
                include: {
                  movie: {
                    select: {
                      title: true,
                    },
                  },
                  cinema: {
                    include: {
                      theater: {
                        select: {
                          name: true,
                          location: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      user,
      summary: {
        current_points: user.points,
        total_earned: totalEarned._sum.points || 0,
        total_redeemed: Math.abs(totalRedeemed._sum.points || 0),
        net_points: (totalEarned._sum.points || 0) + (totalRedeemed._sum.points || 0),
      },
      recent_transactions: recentTransactions,
    };
  }

  async getSystemWidePointsStats() {
    const [totalUsers, totalPoints, totalTransactions, pointsByType] = await Promise.all([
      this.prisma.users.count({
        where: {
          points: {
            gt: 0,
          },
        },
      }),
      this.prisma.users.aggregate({
        _sum: {
          points: true,
        },
      }),
      this.prisma.points_Transactions.count(),
      this.prisma.points_Transactions.groupBy({
        by: ['type'],
        _sum: {
          points: true,
        },
        _count: {
          id: true,
        },
      }),
    ]);

    const earned = pointsByType.find(item => item.type === 'earn');
    const redeemed = pointsByType.find(item => item.type === 'redeem');

    return {
      total_users_with_points: totalUsers,
      total_points_in_system: totalPoints._sum.points || 0,
      total_transactions: totalTransactions,
      earned_points: earned?._sum.points || 0,
      earned_transactions: earned?._count.id || 0,
      redeemed_points: Math.abs(redeemed?._sum.points || 0),
      redeemed_transactions: redeemed?._count.id || 0,
      points_circulation_ratio: totalPoints._sum.points ? 
        (Math.abs(redeemed?._sum.points || 0) / totalPoints._sum.points) * 100 : 0,
    };
  }

  async getTopUsers(limit: number = 10) {
    const topUsers = await this.prisma.users.findMany({
      where: {
        points: {
          gt: 0,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        points: true,
        points_transactions: {
          take: 1,
          orderBy: { created_at: 'desc' },
          select: {
            created_at: true,
          },
        },
      },
      orderBy: { points: 'desc' },
      take: limit,
    });

    return topUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      points: user.points,
      last_activity: user.points_transactions[0]?.created_at,
    }));
  }

  async voidTransaction(id: number) {
    const transaction = await this.prisma.points_Transactions.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('Points transaction not found');
    }

    const transactionAge = Date.now() - transaction.created_at.getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    if (transactionAge > thirtyDaysMs) {
      throw new BadRequestException('Cannot void transaction older than 30 days');
    }

    return await this.prisma.$transaction(async (prisma) => {
      const pointsChange = -transaction.points;
      await prisma.users.update({
        where: { id: transaction.user_id },
        data: {
          points: {
            increment: pointsChange,
          },
        },
      });

      await prisma.points_Transactions.delete({
        where: { id },
      });

      return {
        message: 'Transaction voided successfully',
        points_adjusted: pointsChange,
      };
    });
  }
}