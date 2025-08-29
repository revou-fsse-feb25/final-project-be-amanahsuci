import { PartialType } from '@nestjs/mapped-types';
import { CreateMovieDto } from './create-movie.dto';
import { 
    IsString, 
    IsNumber, 
    IsUrl, 
    IsOptional 
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMovieDto extends PartialType(CreateMovieDto) {
    @ApiPropertyOptional({
        example: 'Inception',
        description: 'Title of the movie',
    })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiPropertyOptional({
        example: 'A mind-bending thriller about dream invasion.',
        description: 'Brief description of the movie plot',
    })
    @IsString()
    @IsOptional()
    description?: string;   

    @ApiPropertyOptional({
        example: 'Sci-Fi',
        description: 'Genre of the movie',
    })
    @IsString()
    @IsOptional()
    genre?: string;

    @ApiPropertyOptional({
        example: 'PG-13',
        description: 'Rating of the movie',
    })
    @IsString()
    @IsOptional()
    rating?: string;

    @ApiPropertyOptional({
        example: 148,
        description: 'Duration of the movie in minutes',
    })
    @IsNumber()
    @IsOptional()
    duration_minutes?: number;

    @ApiPropertyOptional({
        example: 'https://example.com/poster.jpg',
        description: 'URL to the movie poster image',
    })
    @IsUrl()
    @IsOptional()
    poster_url?: string;
}