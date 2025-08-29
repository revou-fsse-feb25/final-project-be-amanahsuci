import { PartialType } from '@nestjs/mapped-types';
import { CreateMovieDto } from './create-movie.dto';
import { IsString, IsNumber, IsUrl, IsOptional } from 'class-validator';

export class UpdateMovieDto extends PartialType(CreateMovieDto) {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;   

    @IsString()
    @IsOptional()
    genre?: string;

    @IsString()
    @IsOptional()
    rating?: string;

    @IsNumber()
    @IsOptional()
    duration_minutes?: number;

    @IsUrl()
    @IsOptional()
    poster_url?: string;
}