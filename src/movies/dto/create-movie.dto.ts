import { 
    IsString, 
    IsNotEmpty, 
    IsNumber, 
    IsUrl, 
    IsOptional 
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMovieDto {
    @ApiProperty({
        example: 'Inception',
        description: 'Title of the movie',
    })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({
        example: 'A mind-bending thriller about dream invasion.',
        description: 'Description of the movie',
    })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({
        example: 'Sci-Fi',
        description: 'Genre of the movie',
    })
    @IsString()
    @IsNotEmpty()
    genre: string;

    @ApiProperty({
        example: 'PG-13',
        description: 'Rating of the movie',
    })
    @IsString()
    @IsNotEmpty()
    rating: string;

    @ApiProperty({
        example: 148,
        description: 'Duration of the movie in minutes',
    })
    @IsNumber()
    @IsNotEmpty()
    duration_minutes: number;

    @ApiProperty({
        example: 'https://example.com/poster.jpg',
        description: 'URL to the movie poster image',
        required: false,
    })
    @IsUrl()
    @IsOptional()
    poster_url?: string;
}