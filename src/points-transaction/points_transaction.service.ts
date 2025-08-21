import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePointsTransactionDto } from './dto/create-points_transaction.dto';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { PointType, Prisma } from '@prisma/client';

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

    if (booking_id) {
      const booking = await this.prisma.bookings.findUnique({
        where: { id: booking_id },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      if (booking.user_id !== user_id) {
        throw new BadRequestException('Booking does not belong to this user');
      }
    }

    if (points <= 0) {
      throw new BadRequestException('Points must be greater than 0');
    }

    if (type === PointType.redeem && points > user.points) {
      throw new BadRequestException('Insufficient points for redemption');
    }

    return await this.prisma.$transaction(async (prisma) => {
      const transaction = await prisma.points_Transactions.create({
        data: {
          user_id,
          booking_id,
          type,
          points: type === PointType.earn ? points : -points,
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

      const pointsChange = type === PointType.earn ? points : -points;
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

  async earnPoints(userId: number, points: number, bookingId?: number) {
    if (points <= 0) {
      throw new BadRequestException('Points must be greater than 0');
    }

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (bookingId) {
      const booking = await this.prisma.bookings.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      if (booking.user_id !== userId) {
        throw new BadRequestException('Booking does not belong to this user');
      }
    }

    return this.create({
      user_id: userId,
      booking_id: bookingId,
      type: PointType.earn,
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
      type: PointType.redeem,
      points,
    });
  }

  async findAll(page: number = 1, limit: number = 10, userId?: number, type?: PointType) {
    if (page < 1) throw new BadRequestException('Page must be greater than 0');
    if (limit < 1) throw new BadRequestException('Limit must be greater than 0');
    if (limit > 100) throw new BadRequestException('Limit cannot exceed 100');

    const skip = (page - 1) * limit;
    
    const whereCondition: Prisma.Points_TransactionsWhereInput = {};

    if (userId) whereCondition.user_id = userId;
    if (type) whereCondition.type = type;

    try {
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
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new BadRequestException('Failed to fetch transactions');
    }
  }

  async findOne(id: number) {
    if (!id || id <= 0) {
      throw new BadRequestException('Invalid transaction ID');
    }

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
    if (!userId || userId <= 0) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.findAll(page, limit, userId);
  }

  async getUserPointsSummary(userId: number) {
    if (!userId || userId <= 0) {
      throw new BadRequestException('Invalid user ID');
    }

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

    try {
      const [totalEarned, totalRedeemed, recentTransactions] = await Promise.all([
        this.prisma.points_Transactions.aggregate({
          where: {
            user_id: userId,
            type: PointType.earn,
          },
          _sum: {
            points: true,
          },
        }),
        this.prisma.points_Transactions.aggregate({
          where: {
            user_id: userId,
            type: PointType.redeem,
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
    } catch (error) {
      console.error('Error in getUserPointsSummary:', error);
      throw new BadRequestException('Failed to get user points summary');
    }
  }

  async getSystemWidePointsStats() {
    try {
      const [totalUsers, totalPoints, totalTransactions] = await Promise.all([
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
      ]);

      const [earnedStats, redeemedStats] = await Promise.all([
        this.prisma.points_Transactions.aggregate({
          where: {
            type: PointType.earn,
          },
          _sum: {
            points: true,
          },
          _count: {
            id: true,
          },
        }),
        this.prisma.points_Transactions.aggregate({
          where: {
            type: PointType.redeem,
          },
          _sum: {
            points: true,
          },
          _count: {
            id: true,
          },
        }),
      ]);

      const totalSystemPoints = totalPoints._sum.points || 0;
      const earnedPoints = earnedStats._sum.points || 0;
      const redeemedPoints = Math.abs(redeemedStats._sum.points || 0);

      return {
        total_users_with_points: totalUsers,
        total_points_in_system: totalSystemPoints,
        total_transactions: totalTransactions,
        earned_points: earnedPoints,
        earned_transactions: earnedStats._count.id,
        redeemed_points: redeemedPoints,
        redeemed_transactions: redeemedStats._count.id,
        points_circulation_ratio: totalSystemPoints > 0 ? 
          (redeemedPoints / totalSystemPoints) * 100 : 0,
      };
    } catch (error) {
      console.error('Error in getSystemWidePointsStats:', error);
      throw new BadRequestException('Failed to get system stats');
    }
  }

  async getTopUsers(limit: number = 10) {
    if (limit <= 0 || limit > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }

    try {
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
          Points_Transactions: {
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
        last_activity: user.Points_Transactions[0]?.created_at || null,
      }));
    } catch (error) {
      console.error('Error in getTopUsers:', error);
      throw new BadRequestException('Failed to get top users');
    }
  }

  async voidTransaction(id: number) {
    if (!id || id <= 0) {
      throw new BadRequestException('Invalid transaction ID');
    }

    const transaction = await this.prisma.points_Transactions.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            points: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Points transaction not found');
    }

    const transactionAge = Date.now() - transaction.created_at.getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    if (transactionAge > thirtyDaysMs) {
      throw new BadRequestException('Cannot void transaction older than 30 days');
    }

    if (transaction.type === PointType.redeem) {
      const pointsToRestore = Math.abs(transaction.points);
    } else if (transaction.type === PointType.earn) {
      const pointsToDeduct = transaction.points;
      if (transaction.user.points < pointsToDeduct) {
        throw new BadRequestException('User has insufficient points to void this transaction');
      }
    }

    try {
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
          transaction_type: transaction.type,
          original_points: transaction.points,
        };
      });
    } catch (error) {
      console.error('Error in voidTransaction:', error);
      throw new BadRequestException('Failed to void transaction');
    }
  }

  async getMonthlyStats(year: number, month: number) {
    if (year < 2020 || year > 2030) {
      throw new BadRequestException('Invalid year');
    }
    if (month < 1 || month > 12) {
      throw new BadRequestException('Invalid month');
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    try {
      const [earnedStats, redeemedStats, totalTransactions] = await Promise.all([
        this.prisma.points_Transactions.aggregate({
          where: {
            type: PointType.earn,
            created_at: {
              gte: startDate,
              lte: endDate,
            },
          },
          _sum: { points: true },
          _count: { id: true },
        }),
        this.prisma.points_Transactions.aggregate({
          where: {
            type: PointType.redeem,
            created_at: {
              gte: startDate,
              lte: endDate,
            },
          },
          _sum: { points: true },
          _count: { id: true },
        }),
        this.prisma.points_Transactions.count({
          where: {
            created_at: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
      ]);

      return {
        period: `${year}-${month.toString().padStart(2, '0')}`,
        total_transactions: totalTransactions,
        earned: {
          points: earnedStats._sum.points || 0,
          transactions: earnedStats._count.id,
        },
        redeemed: {
          points: Math.abs(redeemedStats._sum.points || 0),
          transactions: redeemedStats._count.id,
        },
        net_points: (earnedStats._sum.points || 0) + (redeemedStats._sum.points || 0),
      };
    } catch (error) {
      console.error('Error in getMonthlyStats:', error);
      throw new BadRequestException('Failed to get monthly stats');
    }
  }
}