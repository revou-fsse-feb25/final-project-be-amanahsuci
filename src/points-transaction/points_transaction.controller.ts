import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { PointsTransactionsService } from './points_transaction.service';
import { CreatePointsTransactionDto } from './dto/create-points_transaction.dto';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { PointType } from '@prisma/client';

@Controller('points-transactions')
export class PointsTransactionsController {
  constructor(private readonly pointsTransactionsService: PointsTransactionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPointsTransactionDto: CreatePointsTransactionDto) {
    return this.pointsTransactionsService.create(createPointsTransactionDto);
  }

  @Post('earn')
  @HttpCode(HttpStatus.CREATED)
  async earnPoints(
    @Body('user_id', ParseIntPipe) userId: number,
    @Body('points', ParseIntPipe) points: number,
    @Body('booking_id') bookingId?: number,
  ) {
    return this.pointsTransactionsService.earnPoints(userId, points, bookingId);
  }

  @Post('redeem')
  @HttpCode(HttpStatus.CREATED)
  async redeemPoints(
    @Body('user_id', ParseIntPipe) userId: number,
    @Body() redeemPointsDto: RedeemPointsDto,
  ) {
    return this.pointsTransactionsService.redeemPoints(userId, redeemPointsDto);
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    @Query('userId') userId?: number,
    @Query('type') type?: PointType,
  ) {
    return this.pointsTransactionsService.findAll(page, limit, userId, type);
  }

  @Get('user/:userId')
  async findByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ) {
    return this.pointsTransactionsService.findByUser(userId, page, limit);
  }

  @Get('user/:userId/summary')
  async getUserPointsSummary(@Param('userId', ParseIntPipe) userId: number) {
    return this.pointsTransactionsService.getUserPointsSummary(userId);
  }

  @Get('stats')
  async getSystemWidePointsStats() {
    return this.pointsTransactionsService.getSystemWidePointsStats();
  }

  @Get('top-users')
  async getTopUsers(@Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number) {
    return this.pointsTransactionsService.getTopUsers(limit);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pointsTransactionsService.findOne(id);
  }

  @Post(':id/void')
  async voidTransaction(@Param('id', ParseIntPipe) id: number) {
    return this.pointsTransactionsService.voidTransaction(id);
  }
}