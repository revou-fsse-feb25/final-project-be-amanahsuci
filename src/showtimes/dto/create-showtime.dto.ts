import { 
    IsNumber, 
    IsNotEmpty, 
    IsDateString 
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShowtimeDto {
    @ApiProperty({
        example: 1,
        description: 'ID of the movie',
    })
    @IsNumber()
    @IsNotEmpty()
    movie_id: number;

    @ApiProperty({
        example: 1,
        description: 'ID of the cinema',
    })
    @IsNumber()
    @IsNotEmpty()
    cinema_id: number;

    @ApiProperty({
        example: '2024-12-31T20:00:00Z',
        description: 'Start time of the showtime in ISO 8601 format',
    })
    @IsDateString()
    @IsNotEmpty()
    start_time: string;
}