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
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiQuery, 
  ApiBody, 
  ApiParam 
} from '@nestjs/swagger';

@ApiTags('Movies')
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new movie' })
  @ApiBody({ type: CreateMovieDto })
  @ApiResponse({ status: 201, description: 'Movie created successfully' })
  async create(@Body() createMovieDto: CreateMovieDto) {
    return this.moviesService.create(createMovieDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of movies with pagination, search, and genre filter' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'Batman' })
  @ApiQuery({ name: 'genre', required: false, type: String, example: 'Action' })
  @ApiResponse({ status: 200, description: 'List of movies' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    @Query('search') search?: string,
    @Query('genre') genre?: string,
  ) {
    return this.moviesService.findAll(page, limit, search, genre);
  }

  @Get('now-showing')
  @ApiOperation({ summary: 'Get movies currently showing' })
  @ApiResponse({ status: 200, description: 'List of now showing movies' })
  async getNowShowing() {
    return this.moviesService.getNowShowing();
  }

  @Get('coming-soon')
  @ApiOperation({ summary: 'Get upcoming movies' })
  @ApiResponse({ status: 200, description: 'List of coming soon movies' })
  async getComingSoon() {
    return this.moviesService.getComingSoon();
  }

  @Get('genres')
  @ApiOperation({ summary: 'Get all available genres' })
  @ApiResponse({ status: 200, description: 'List of movie genres' })
  async getGenres() {
    return this.moviesService.getGenres();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get movie details by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Movie details' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.moviesService.findOne(id);
  }

  @Get('title/:title')
  @ApiOperation({ summary: 'Find a movie by title' })
  @ApiParam({ name: 'title', type: String, example: 'Inception' })
  @ApiResponse({ status: 200, description: 'Movie details' })
  async findByTitle(@Param('title') title: string) {
    return this.moviesService.findByTitle(title);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a movie by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateMovieDto })
  @ApiResponse({ status: 200, description: 'Movie updated successfully' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMovieDto: UpdateMovieDto,
  ) {
    return this.moviesService.update(id, updateMovieDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a movie by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 204, description: 'Movie deleted successfully' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.moviesService.remove(id);
  }
}
