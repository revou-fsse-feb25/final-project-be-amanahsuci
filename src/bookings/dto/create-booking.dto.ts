import { 
    IsNumber, 
    IsNotEmpty, 
    IsArray, 
    ValidateNested 
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class SeatSelectionDto {
    @ApiProperty({
        example: 12,
        description: 'ID from selected seat',
    })
    @IsNumber()
    @IsNotEmpty()
    seat_id: number;
}

export class CreateBookingDto {
    @ApiProperty({
        example: 1,
        description: 'user ID who makes the booking',
    })
    @IsNumber()
    @IsNotEmpty()
    user_id: number;

    @ApiProperty({
        example: 5,
        description: 'showtime ID for the booking',
    })
    @IsNumber()
    @IsNotEmpty()
    showtime_id: number;

    @ApiProperty({
        type: [SeatSelectionDto],
        description: 'List of the selected seats',
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SeatSelectionDto)
    seats: SeatSelectionDto[];
}
