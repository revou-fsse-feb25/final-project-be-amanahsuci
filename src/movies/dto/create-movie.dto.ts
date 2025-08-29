import { IsString, IsNotEmpty, IsNumber, IsUrl, IsOptional } from 'class-validator';

export class CreateMovieDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @IsNotEmpty()
    genre: string;

    @IsString()
    @IsNotEmpty()
    rating: string;

    @IsNumber()
    @IsNotEmpty()
    duration_minutes: number;

    @IsUrl()
    @IsOptional()
    poster_url?: string;
}