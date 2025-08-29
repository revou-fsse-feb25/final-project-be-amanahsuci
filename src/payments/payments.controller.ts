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
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiParam, 
  ApiQuery 
} from '@nestjs/swagger';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiBody({ type: CreatePaymentDto })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  async create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of payments with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: Status, example: 'PENDING' })
  @ApiQuery({ name: 'method', required: false, enum: PaymentMethod, example: 'CREDIT_CARD' })
  @ApiResponse({ status: 200, description: 'List of payments' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    @Query('status') status?: Status,
    @Query('method') method?: PaymentMethod,
  ) {
    return this.paymentsService.findAll(page, limit, status, method);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get payment statistics' })
  @ApiResponse({ status: 200, description: 'Payment statistics data' })
  async getPaymentStats() {
    return this.paymentsService.getPaymentStats();
  }

  @Get('daily-revenue')
  @ApiOperation({ summary: 'Get daily revenue' })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 7 })
  @ApiResponse({ status: 200, description: 'Revenue data by day' })
  async getDailyRevenue(@Query('days') days?: number) {
    return this.paymentsService.getDailyRevenue(days ? Number(days) : undefined);
  }

  @Get('booking/:bookingId')
  @ApiOperation({ summary: 'Get payment by booking ID' })
  @ApiParam({ name: 'bookingId', type: Number, example: 101 })
  @ApiResponse({ status: 200, description: 'Payment details for the booking' })
  async findByBooking(@Param('bookingId', ParseIntPipe) bookingId: number) {
    return this.paymentsService.findByBooking(bookingId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Payment details' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a payment by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdatePaymentDto })
  @ApiResponse({ status: 200, description: 'Payment updated successfully' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ) {
    return this.paymentsService.update(id, updatePaymentDto);
  }

  @Put(':id/process')
  @ApiOperation({ summary: 'Process a payment with given method' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiQuery({ name: 'method', enum: PaymentMethod, example: 'CREDIT_CARD' })
  @ApiResponse({ status: 200, description: 'Payment processed successfully' })
  async processPayment(
    @Param('id', ParseIntPipe) id: number,
    @Query('method') method: PaymentMethod,
  ) {
    return this.paymentsService.processPayment(id, method);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel a payment by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Payment canceled successfully' })
  async cancelPayment(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.cancelPayment(id);
  }
}
