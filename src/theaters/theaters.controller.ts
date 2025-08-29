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
import { TheatersService } from './theaters.service';
import { CreateTheaterDto } from './dto/create-theater.dto';
import { UpdateTheaterDto } from './dto/update-theater.dto';
import { CreateCinemaDto } from '../cinemas/dto/create-cinema.dto';
import { UpdateCinemaDto } from '../cinemas/dto/update-cinema.dto';
import { CinemaType } from '@prisma/client';

@ApiTags('Theaters')
@Controller('theaters')
export class TheatersController {
  constructor(private readonly theatersService: TheatersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new theater' })
  @ApiResponse({ status: 201, description: 'Theater created successfully' })
  async createTheater(@Body() createTheaterDto: CreateTheaterDto) {
    return this.theatersService.createTheater(createTheaterDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all theaters (with pagination & search)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'XXI' })
  @ApiResponse({ status: 200, description: 'List of theaters' })
  async findAllTheaters(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    @Query('search') search?: string,
  ) {
    return this.theatersService.findAllTheaters(page, limit, search);
  }

  @Get('with-showtimes')
  @ApiOperation({ summary: 'Get theaters with showtimes (optionally filter by movieId)' })
  @ApiQuery({ name: 'movieId', required: false, type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'List of theaters with showtimes' })
  async getTheatersWithShowtimes(@Query('movieId') movieId?: number) {
    return this.theatersService.getTheatersWithShowtimes(movieId ? Number(movieId) : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a theater by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Theater details' })
  async findTheaterById(@Param('id', ParseIntPipe) id: number) {
    return this.theatersService.findTheaterById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a theater by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Theater updated successfully' })
  async updateTheater(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTheaterDto: UpdateTheaterDto,
  ) {
    return this.theatersService.updateTheater(id, updateTheaterDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a theater by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 204, description: 'Theater deleted successfully' })
  async removeTheater(@Param('id', ParseIntPipe) id: number) {
    return this.theatersService.removeTheater(id);
  }

  @Post('cinemas')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new cinema inside a theater' })
  @ApiResponse({ status: 201, description: 'Cinema created successfully' })
  async createCinema(@Body() createCinemaDto: CreateCinemaDto) {
    return this.theatersService.createCinema(createCinemaDto);
  }

  @Get('cinemas/all')
  @ApiOperation({ summary: 'Get all cinemas (with pagination & filters)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'theaterId', required: false, type: Number, example: 2 })
  @ApiQuery({ name: 'type', required: false, enum: CinemaType, example: CinemaType.Reguler })
  @ApiResponse({ status: 200, description: 'List of cinemas' })
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
  @ApiOperation({ summary: 'Get a cinema by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Cinema details' })
  async findCinemaById(@Param('id', ParseIntPipe) id: number) {
    return this.theatersService.findCinemaById(id);
  }

  @Put('cinemas/:id')
  @ApiOperation({ summary: 'Update a cinema by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Cinema updated successfully' })
  async updateCinema(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCinemaDto: UpdateCinemaDto,
  ) {
    return this.theatersService.updateCinema(id, updateCinemaDto);
  }

  @Delete('cinemas/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a cinema by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 204, description: 'Cinema deleted successfully' })
  async removeCinema(@Param('id', ParseIntPipe) id: number) {
    return this.theatersService.removeCinema(id);
  }
}
