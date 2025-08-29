import { IsNumber, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateShowtimeDto {
    @IsNumber()
    @IsNotEmpty()
    movie_id: number;

    @IsNumber()
    @IsNotEmpty()
    cinema_id: number;

    @IsDateString()
    @IsNotEmpty()
    start_time: string;
}