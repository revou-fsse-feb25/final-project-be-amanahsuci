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
import { TheatersService } from './theaters.service';
import { CreateTheaterDto } from './dto/create-theater.dto';
import { UpdateTheaterDto } from './dto/update-theater.dto';
import { CreateCinemaDto } from '../cinemas/dto/create-cinema.dto';
import { UpdateCinemaDto } from '../cinemas/dto/update-cinema.dto';
import { CinemaType } from '@prisma/client';

@Controller('theaters')
export class TheatersController {
  constructor(private readonly theatersService: TheatersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTheater(@Body() createTheaterDto: CreateTheaterDto) {
    return this.theatersService.createTheater(createTheaterDto);
  }

  @Get()
  async findAllTheaters(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    @Query('search') search?: string,
  ) {
    return this.theatersService.findAllTheaters(page, limit, search);
  }

  @Get('with-showtimes')
  async getTheatersWithShowtimes(@Query('movieId') movieId?: number) {
    return this.theatersService.getTheatersWithShowtimes(movieId ? Number(movieId) : undefined);
  }

  @Get(':id')
  async findTheaterById(@Param('id', ParseIntPipe) id: number) {
    return this.theatersService.findTheaterById(id);
  }

  @Put(':id')
  async updateTheater(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTheaterDto: UpdateTheaterDto,
  ) {
    return this.theatersService.updateTheater(id, updateTheaterDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeTheater(@Param('id', ParseIntPipe) id: number) {
    return this.theatersService.removeTheater(id);
  }

  @Post('cinemas')
  @HttpCode(HttpStatus.CREATED)
  async createCinema(@Body() createCinemaDto: CreateCinemaDto) {
    return this.theatersService.createCinema(createCinemaDto);
  }

  @Get('cinemas/all')
  async findAllCinemas(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    @Query('theaterId') theaterId?: number,
    @Query('type') type?: CinemaType,
  ) {
    return this.theatersService.findAllCinemas(
      page,
      limit,
      theaterId ? Number(theaterId) : undefined,
      type,
    );
  }

  @Get('cinemas/:id')
  async findCinemaById(@Param('id', ParseIntPipe) id: number) {
    return this.theatersService.findCinemaById(id);
  }

  @Put('cinemas/:id')
  async updateCinema(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCinemaDto: UpdateCinemaDto,
  ) {
    return this.theatersService.updateCinema(id, updateCinemaDto);
  }

  @Delete('cinemas/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeCinema(@Param('id', ParseIntPipe) id: number) {
    return this.theatersService.removeCinema(id);
  }
}