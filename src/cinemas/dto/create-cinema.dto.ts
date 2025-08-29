import { IsEnum, IsNumber, IsNotEmpty } from 'class-validator';
import { CinemaType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCinemaDto {
    @ApiProperty({
        example: 3,
        description: 'Theaters ID where the cinema is located',
    })
    @IsNumber()
    @IsNotEmpty()
    theater_id: number;

    @ApiProperty({
        enum: CinemaType,
        example: CinemaType.IMAX,
        description: 'Cinemas type (e.g, Reguler, IMAX, Premier)',
    })
    @IsEnum(CinemaType)
    @IsNotEmpty()
    type: CinemaType;

    @ApiProperty({
        example: 150,
        description: 'Total seats available in this cinema',
    })
    @IsNumber()
    @IsNotEmpty()
    total_seats: number;

    @ApiProperty({
        example: 75000,
        description: 'Ticket price for this cinema',
    })
    @IsNumber()
    @IsNotEmpty()
    price: number;
}
