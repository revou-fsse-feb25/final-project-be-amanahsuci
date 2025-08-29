import { PartialType } from '@nestjs/mapped-types';
import { CreateCinemaDto } from './create-cinema.dto';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { CinemaType } from '@prisma/client';

export class UpdateCinemaDto extends PartialType(CreateCinemaDto) {
    @IsNumber()
    @IsOptional()
    theater_id?: number;

    @IsEnum(CinemaType)
    @IsOptional()
    type?: CinemaType;

    @IsNumber()
    @IsOptional()
    total_seats?: number;

    @IsNumber()
    @IsOptional()
    price?: number;
}