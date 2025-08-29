import { PartialType } from '@nestjs/mapped-types';
import { CreateCinemaDto } from './create-cinema.dto';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { CinemaType } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';


export class UpdateCinemaDto extends PartialType(CreateCinemaDto) {
    @ApiPropertyOptional({
        example: 3,
        description: 'ID teater (opsional)',
    })
    @IsNumber()
    @IsOptional()
    theater_id?: number;

    @ApiPropertyOptional({
        enum: CinemaType,
        example: CinemaType.Reguler,
        description: 'Jenis cinema (opsional)',
    })
    @IsEnum(CinemaType)
    @IsOptional()
    type?: CinemaType;

    @ApiPropertyOptional({
        example: 180,
        description: 'Jumlah kursi (opsional)',
    })
    @IsNumber()
    @IsOptional()
    total_seats?: number;

    @ApiPropertyOptional({
        example: 65000,
        description: 'Harga tiket (opsional)',
    })
    @IsNumber()
    @IsOptional()
    price?: number;
}
