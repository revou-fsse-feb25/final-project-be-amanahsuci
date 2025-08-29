import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentMethod, Status } from '@prisma/client';

@Injectable()
export class PaymentsService {
    constructor(private readonly prisma: PrismaService) {}

    async create(createPaymentDto: CreatePaymentDto) {
        const { booking_id, method, status = 'pending' } = createPaymentDto;
    
        const booking = await this.prisma.bookings.findUnique({
            where: { id: booking_id },
            include: {
                payments: true,
            },
        });
    
        if (!booking) {
            throw new NotFoundException('Booking not found');
        }
    
        if (booking.payments.length > 0) {
            throw new ConflictException('Booking already has a payment');
        }
    
        if (booking.payment_status !== 'pending') {
            throw new BadRequestException(`Cannot create payment for ${booking.payment_status} booking`);
        }
    
        const payment = await this.prisma.payments.create({
            data: {
                booking_id,
                method,
                status: Status.pending,
                paid_at: status === 'complete' ? new Date() : null,
            },
            include: {
                booking: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                            },
                        },
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
    
        return payment;
    }

    async findAll(page: number = 1, limit: number = 10, status?: Status, method?: PaymentMethod) {
        if (page < 1) throw new BadRequestException('Page must be greater than 0');
        if (limit < 1) throw new BadRequestException('Limit must be greater than 0');
        if (limit > 100) throw new BadRequestException('Limit cannot exceed 100');
    
        const skip = (page - 1) * limit;
        
        const whereCondition: any = {};
    
        if (status) whereCondition.status = status;
        if (method) whereCondition.method = method;
    
        const [payments, total] = await Promise.all([
            this.prisma.payments.findMany({
                where: whereCondition,
                skip,
                take: limit,
                include: {
                    booking: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    email: true,
                                },
                            },
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
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: { paid_at: 'desc' },
            }),
            this.prisma.payments.count({ where: whereCondition }),
        ]);
    
        return {
            data: payments,
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
        const payment = await this.prisma.payments.findUnique({
            where: { id },
            include: {
                booking: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                            },
                        },
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
                        booking_seats: {
                            include: {
                                seat: true,
                            },
                        },
                    },
                },
            },
        });
    
        if (!payment) {
            throw new NotFoundException('Payment not found');
        }
    
        return payment;
    }

    async findByBooking(bookingId: number) {
        const booking = await this.prisma.bookings.findUnique({
            where: { id: bookingId },
        });
    
        if (!booking) {
            throw new NotFoundException('Booking not found');
        }
    
        const payment = await this.prisma.payments.findFirst({
            where: { booking_id: bookingId },
            include: {
                booking: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                            },
                        },
                        showtime: {
                            include: {
                                movie: {
                                    select: {
                                        title: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    
        if (!payment) {
            throw new NotFoundException('Payment not found for this booking');
        }
    
        return payment;
    }

    async update(id: number, updatePaymentDto: UpdatePaymentDto) {
        const existingPayment = await this.prisma.payments.findUnique({
            where: { id },
            include: {
                booking: true,
            },
        });
    
        if (!existingPayment) {
            throw new NotFoundException('Payment not found');
        }
    
        const updateData: any = { ...updatePaymentDto };
        if (updatePaymentDto.status === 'complete' && !existingPayment.paid_at) {
            updateData.paid_at = new Date();
        }
    
        try {
            const updatedPayment = await this.prisma.payments.update({
                where: { id },
                data: updateData,
                include: {
                    booking: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    email: true,
                                },
                            },
                            showtime: {
                                include: {
                                    movie: {
                                        select: {
                                            title: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
    
            if (updatePaymentDto.status === 'complete' && existingPayment.status !== 'complete') {
                await this.prisma.bookings.update({
                    where: { id: existingPayment.booking_id },
                    data: { payment_status: 'complete' },
                });
    
                await this.prisma.booking_Seats.updateMany({
                    where: { booking_id: existingPayment.booking_id },
                    data: { status: 'booked' },
                });
    
                const pointsEarned = Math.floor(existingPayment.booking.total_price / 1000);
                await this.prisma.points_Transactions.create({
                    data: {
                        user_id: existingPayment.booking.user_id,
                        booking_id: existingPayment.booking_id,
                        type: 'earn',
                        points: pointsEarned,
                    },
                });
    
                await this.prisma.users.update({
                    where: { id: existingPayment.booking.user_id },
                    data: { points: { increment: pointsEarned } },
                });
            }
    
            return updatedPayment;
        } catch (error) {
            if (error.code === 'P2025') {
                throw new NotFoundException('Payment not found');
            }
            throw error;
        }
    }

    async processPayment(id: number, method: PaymentMethod) {
        const payment = await this.prisma.payments.findUnique({
            where: { id },
            include: {
                booking: true,
            },
        });

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        if (payment.status === 'complete') {
            throw new BadRequestException('Payment already completed');
        }

        const isSuccess = Math.random() > 0.1;
    
        if (isSuccess) {
            return await this.update(id, {
            status: 'complete',
            method,
            paid_at: new Date(),
            });
        } else {
            throw new BadRequestException('Payment processing failed');
        }
    }

    async cancelPayment(id: number) {
        const payment = await this.prisma.payments.findUnique({
            where: { id },
            include: {
                booking: true,
            },
        });
    
        if (!payment) {
            throw new NotFoundException('Payment not found');
        }
    
        if (payment.status === 'complete') {
            throw new BadRequestException('Cannot cancel completed payment');
        }

        try {
            const cancelledPayment = await this.prisma.payments.update({
                where: { id },
                data: {
                    status: 'cancelled',
                },
                include: {
                    booking: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
            });

            await this.prisma.bookings.update({
                where: { id: payment.booking_id },
                data: { payment_status: 'cancelled' },
            });

            await this.prisma.booking_Seats.deleteMany({
                where: { booking_id: payment.booking_id },
            });

            return cancelledPayment;
        } catch (error) {
            if (error.code === 'P2025') {
                throw new NotFoundException('Payment not found');
            }
            throw error;
        }
    }

    async getPaymentStats() {
        const completedPayments = await this.prisma.payments.findMany({
            where: { status: 'complete' },
            include: {
                booking: {
                    select: {
                        total_price: true,
                    },
                },
            },
        });

        const totalPayments = await this.prisma.payments.count();
        const completedPaymentsCount = completedPayments.length;
        const pendingPayments = await this.prisma.payments.count({
            where: { status: 'pending' },
        });
        const cancelledPayments = await this.prisma.payments.count({
            where: { status: 'cancelled' },
        });

        const totalRevenue = completedPayments.reduce(
            (sum, payment) => sum + (payment.booking?.total_price || 0),
            0
        );

        const revenueByMethod = await Promise.all(
            Object.values(PaymentMethod).map(async (method) => {
                const payments = await this.prisma.payments.findMany({
                    where: { 
                        status: 'complete',
                        method: method as PaymentMethod,
                    },
                    include: {
                        booking: {
                            select: {
                                total_price: true,
                            },
                        },
                    },
                });

                const revenue = payments.reduce(
                    (sum, payment) => sum + (payment.booking?.total_price || 0),
                    0
                );

                return {
                    method,
                    revenue,
                };
            })
        );

        return {
            total_payments: totalPayments,
            completed_payments: completedPaymentsCount,
            pending_payments: pendingPayments,
            cancelled_payments: cancelledPayments,
            completion_rate: totalPayments > 0 ? (completedPaymentsCount / totalPayments) * 100 : 0,
            total_revenue: totalRevenue,
            revenue_by_method: revenueByMethod,
        };
    }

    async getDailyRevenue(days: number = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);
    
        const payments = await this.prisma.payments.findMany({
            where: {
                status: 'complete',
                paid_at: {
                    gte: startDate,
                },
            },
            include: {
                booking: {
                    select: {
                        total_price: true,
                    },
                },
            },
        });
    
        const revenueByDate = new Map<string, number>();
    
        payments.forEach(payment => {
            if (!payment.paid_at) return;
            
            const dateKey = payment.paid_at.toISOString().split('T')[0];
            const currentRevenue = revenueByDate.get(dateKey) || 0;
            revenueByDate.set(dateKey, currentRevenue + (payment.booking?.total_price || 0));
        });

        const dailyRevenue = Array.from(revenueByDate.entries())
            .map(([date, revenue]) => ({ date: new Date(date), revenue }))
            .sort((a, b) => a.date.getTime() - b.date.getTime());
    
        return dailyRevenue;
    }
}