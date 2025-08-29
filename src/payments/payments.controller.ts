import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentMethod, Status } from '@prisma/client';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    @Query('status') status?: Status,
    @Query('method') method?: PaymentMethod,
  ) {
    return this.paymentsService.findAll(page, limit, status, method);
  }

  @Get('stats')
  async getPaymentStats() {
    return this.paymentsService.getPaymentStats();
  }

  @Get('daily-revenue')
  async getDailyRevenue(@Query('days') days?: number) {
    return this.paymentsService.getDailyRevenue(days ? Number(days) : undefined);
  }

  @Get('booking/:bookingId')
  async findByBooking(@Param('bookingId', ParseIntPipe) bookingId: number) {
    return this.paymentsService.findByBooking(bookingId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ) {
    return this.paymentsService.update(id, updatePaymentDto);
  }

  @Put(':id/process')
  async processPayment(
    @Param('id', ParseIntPipe) id: number,
    @Query('method') method: PaymentMethod,
  ) {
    return this.paymentsService.processPayment(id, method);
  }

  @Put(':id/cancel')
  async cancelPayment(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.cancelPayment(id);
  }
}