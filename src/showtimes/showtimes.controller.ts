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
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiQuery, 
  ApiParam 
} from '@nestjs/swagger';
import { ShowtimesService } from './showtimes.service';
import { CreateShowtimeDto } from './dto/create-showtime.dto';
import { UpdateShowtimeDto } from './dto/update-showtime.dto';

@ApiTags('Showtimes')
@Controller('showtimes')
export class ShowtimesController {
  constructor(private readonly showtimesService: ShowtimesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new showtime' })
  @ApiResponse({ status: 201, description: 'Showtime created successfully' })
  async create(@Body() createShowtimeDto: CreateShowtimeDto) {
    return this.showtimesService.create(createShowtimeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all showtimes (with pagination & filters)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'movieId', required: false, type: Number })
  @ApiQuery({ name: 'cinemaId', required: false, type: Number })
  @ApiQuery({ name: 'date', required: false, type: String, example: '2025-09-01' })
  @ApiResponse({ status: 200, description: 'List of showtimes' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    @Query('movieId') movieId?: number,
    @Query('cinemaId') cinemaId?: number,
    @Query('date') date?: string,
  ) {
    return this.showtimesService.findAll(
      page,
      limit,
      movieId ? Number(movieId) : undefined,
      cinemaId ? Number(cinemaId) : undefined,
      date,
    );
  }

  @Get('movie/:movieId')
  @ApiOperation({ summary: 'Get showtimes by movie ID (optionally filter by date)' })
  @ApiParam({ name: 'movieId', type: Number, example: 1 })
  @ApiQuery({ name: 'date', required: false, type: String, example: '2025-09-01' })
  @ApiResponse({ status: 200, description: 'List of showtimes for the given movie' })
  async getShowtimesByMovie(
    @Param('movieId', ParseIntPipe) movieId: number,
    @Query('date') date?: string,
  ) {
    return this.showtimesService.getShowtimesByMovie(movieId, date);
  }

  @Get('cinema/:cinemaId')
  @ApiOperation({ summary: 'Get showtimes by cinema ID (optionally filter by date)' })
  @ApiParam({ name: 'cinemaId', type: Number, example: 1 })
  @ApiQuery({ name: 'date', required: false, type: String, example: '2025-09-01' })
  @ApiResponse({ status: 200, description: 'List of showtimes for the given cinema' })
  async getShowtimesByCinema(
    @Param('cinemaId', ParseIntPipe) cinemaId: number,
    @Query('date') date?: string,
  ) {
    return this.showtimesService.getShowtimesByCinema(cinemaId, date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a showtime by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Details of the showtime' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.showtimesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a showtime by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Showtime updated successfully' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateShowtimeDto: UpdateShowtimeDto,
  ) {
    return this.showtimesService.update(id, updateShowtimeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a showtime by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 204, description: 'Showtime deleted successfully' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.showtimesService.remove(id);
  }
}
