import { PartialType } from '@nestjs/mapped-types';
import { CreateShowtimeDto } from './create-showtime.dto';
import { 
    IsNumber, 
    IsDateString, 
    IsOptional 
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateShowtimeDto extends PartialType(CreateShowtimeDto) {
    @ApiPropertyOptional({
        description: 'ID of the movie',
        example: 1,
    })
    @IsNumber()
    @IsOptional()
    movie_id?: number;

    @ApiPropertyOptional({
        description: 'ID of the cinema',
        example: 1,
    })
    @IsNumber()
    @IsOptional()
    cinema_id?: number;

    @ApiPropertyOptional({
        description: 'Start time of the showtime in ISO 8601 format',
        example: '2023-10-01T14:30:00Z',
    })
    @IsDateString()
    @IsOptional()
    start_time?: string;
}