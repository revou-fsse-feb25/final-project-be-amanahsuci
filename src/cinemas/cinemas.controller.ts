import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { CinemasService } from './cinemas.service';
import { CreateCinemaDto } from './dto/create-cinema.dto';
import { UpdateCinemaDto } from './dto/update-cinema.dto';
import { CinemaType } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Cinemas')
@Controller('cinemas')
export class CinemasController {
  constructor(private readonly cinemasService: CinemasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new cinema' })
  @ApiResponse({ status: 201, description: 'Cinema created successfully' })
  async create(@Body() createCinemaDto: CreateCinemaDto) {
    return this.cinemasService.create(createCinemaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all cinemas with pagination, filter by theater or type' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'theaterId', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: CinemaType })
  @ApiResponse({ status: 200, description: 'List of cinemas returned successfully' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    @Query('theaterId') theaterId?: number,
    @Query('type') type?: CinemaType,
  ) {
    return this.cinemasService.findAll(
      page,
      limit,
      theaterId ? Number(theaterId) : undefined,
      type,
    );
  }

  @Get('theater/:theaterId')
  @ApiOperation({ summary: 'Get cinemas by theater' })
  @ApiParam({ name: 'theaterId', type: Number })
  @ApiResponse({ status: 200, description: 'Cinemas found for the given theater' })
  async findByTheater(@Param('theaterId', ParseIntPipe) theaterId: number) {
    return this.cinemasService.findByTheater(theaterId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cinema by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Cinema found' })
  @ApiResponse({ status: 404, description: 'Cinema not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cinemasService.findOne(id);
  }

  @Get(':id/available-seats')
  @ApiOperation({ summary: 'Get available seats for a cinema showtime' })
  @ApiParam({ name: 'id', type: Number, description: 'Cinema ID' })
  @ApiQuery({ name: 'showtimeId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Available seats returned successfully' })
  async getAvailableSeats(
    @Param('id', ParseIntPipe) cinemaId: number,
    @Query('showtimeId') showtimeId?: number,
  ) {
    return this.cinemasService.getAvailableSeats(
      cinemaId,
      showtimeId ? Number(showtimeId) : undefined,
    );
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get statistics for a cinema' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Cinema statistics returned successfully' })
  async getCinemaStats(@Param('id', ParseIntPipe) cinemaId: number) {
    return this.cinemasService.getCinemaStats(cinemaId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update cinema by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Cinema updated successfully' })
  @ApiResponse({ status: 404, description: 'Cinema not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCinemaDto: UpdateCinemaDto,
  ) {
    return this.cinemasService.update(id, updateCinemaDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete cinema by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Cinema deleted successfully' })
  @ApiResponse({ status: 404, description: 'Cinema not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.cinemasService.remove(id);
  }
}
