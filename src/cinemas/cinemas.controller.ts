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

@Controller('cinemas')
export class CinemasController {
  constructor(private readonly cinemasService: CinemasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCinemaDto: CreateCinemaDto) {
    return this.cinemasService.create(createCinemaDto);
  }

  @Get()
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
  async findByTheater(@Param('theaterId', ParseIntPipe) theaterId: number) {
    return this.cinemasService.findByTheater(theaterId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cinemasService.findOne(id);
  }

  @Get(':id/available-seats')
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
  async getCinemaStats(@Param('id', ParseIntPipe) cinemaId: number) {
    return this.cinemasService.getCinemaStats(cinemaId);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCinemaDto: UpdateCinemaDto,
  ) {
    return this.cinemasService.update(id, updateCinemaDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.cinemasService.remove(id);
  }
}