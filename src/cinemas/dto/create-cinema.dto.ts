import { IsEnum, IsNumber, IsNotEmpty } from 'class-validator';
import { CinemaType } from '@prisma/client';

export class CreateCinemaDto {
    @IsNumber()
    @IsNotEmpty()
    theater_id: number;

    @IsEnum(CinemaType)
    @IsNotEmpty()
    type: CinemaType;

    @IsNumber()
    @IsNotEmpty()
    total_seats: number;

    @IsNumber()
    @IsNotEmpty()
    price: number;
}