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
import { ShowtimesService } from './showtimes.service';
import { CreateShowtimeDto } from './dto/create-showtime.dto';
import { UpdateShowtimeDto } from './dto/update-showtime.dto';

@Controller('showtimes')
export class ShowtimesController {
  constructor(private readonly showtimesService: ShowtimesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createShowtimeDto: CreateShowtimeDto) {
    return this.showtimesService.create(createShowtimeDto);
  }

  @Get()
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
  async getShowtimesByMovie(
    @Param('movieId', ParseIntPipe) movieId: number,
    @Query('date') date?: string,
  ) {
    return this.showtimesService.getShowtimesByMovie(movieId, date);
  }

  @Get('cinema/:cinemaId')
  async getShowtimesByCinema(
    @Param('cinemaId', ParseIntPipe) cinemaId: number,
    @Query('date') date?: string,
  ) {
    return this.showtimesService.getShowtimesByCinema(cinemaId, date);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.showtimesService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateShowtimeDto: UpdateShowtimeDto,
  ) {
    return this.showtimesService.update(id, updateShowtimeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.showtimesService.remove(id);
  }
}