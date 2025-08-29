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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Points Transactions')
@Controller('points-transactions')
export class PointsTransactionsController {
  constructor(private readonly pointsTransactionsService: PointsTransactionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a points transaction' })
  @ApiBody({ type: CreatePointsTransactionDto })
  @ApiResponse({ status: 201, description: 'Points transaction created successfully' })
  async create(@Body() createPointsTransactionDto: CreatePointsTransactionDto) {
    return this.pointsTransactionsService.create(createPointsTransactionDto);
  }

  @Post('earn')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Earn points for a user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        user_id: { type: 'number', example: 1 },
        points: { type: 'number', example: 50 },
        booking_id: { type: 'number', example: 101, nullable: true },
      },
      required: ['user_id', 'points'],
    },
  })
  @ApiResponse({ status: 201, description: 'Points earned successfully' })
  async earnPoints(
    @Body('user_id', ParseIntPipe) userId: number,
    @Body('points', ParseIntPipe) points: number,
    @Body('booking_id') bookingId?: number,
  ) {
    return this.pointsTransactionsService.earnPoints(userId, points, bookingId);
  }

  @Post('redeem')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Redeem points for a user' })
  @ApiBody({ type: RedeemPointsDto })
  @ApiResponse({ status: 201, description: 'Points redeemed successfully' })
  async redeemPoints(
    @Body('user_id', ParseIntPipe) userId: number,
    @Body() redeemPointsDto: RedeemPointsDto,
  ) {
    return this.pointsTransactionsService.redeemPoints(userId, redeemPointsDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all points transactions (paginated)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'userId', required: false, example: 1 })
  @ApiQuery({ name: 'type', enum: PointType, required: false })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    @Query('userId') userId?: number,
    @Query('type') type?: PointType,
  ) {
    return this.pointsTransactionsService.findAll(page, limit, userId, type);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all transactions by user (paginated)' })
  @ApiParam({ name: 'userId', type: Number, example: 1 })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  async findByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ) {
    return this.pointsTransactionsService.findByUser(userId, page, limit);
  }

  @Get('user/:userId/summary')
  @ApiOperation({ summary: 'Get points summary for a specific user' })
  @ApiParam({ name: 'userId', type: Number, example: 1 })
  async getUserPointsSummary(@Param('userId', ParseIntPipe) userId: number) {
    return this.pointsTransactionsService.getUserPointsSummary(userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get system-wide points statistics' })
  async getSystemWidePointsStats() {
    return this.pointsTransactionsService.getSystemWidePointsStats();
  }

  @Get('top-users')
  @ApiOperation({ summary: 'Get top users with most points' })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  async getTopUsers(@Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number) {
    return this.pointsTransactionsService.getTopUsers(limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a points transaction by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pointsTransactionsService.findOne(id);
  }

  @Post(':id/void')
  @ApiOperation({ summary: 'Void (cancel) a points transaction' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Transaction voided successfully' })
  async voidTransaction(@Param('id', ParseIntPipe) id: number) {
    return this.pointsTransactionsService.voidTransaction(id);
  }
}
