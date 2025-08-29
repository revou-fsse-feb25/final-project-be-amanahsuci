import { PartialType } from '@nestjs/mapped-types';
import { CreateShowtimeDto } from './create-showtime.dto';
import { IsNumber, IsDateString, IsOptional } from 'class-validator';

export class UpdateShowtimeDto extends PartialType(CreateShowtimeDto) {
    @IsNumber()
    @IsOptional()
    movie_id?: number;

    @IsNumber()
    @IsOptional()
    cinema_id?: number;

    @IsDateString()
    @IsOptional()
    start_time?: string;
}