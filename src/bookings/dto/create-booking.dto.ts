import { IsNumber, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SeatSelectionDto {
    @IsNumber()
    @IsNotEmpty()
    seat_id: number;
    }

    export class CreateBookingDto {
    @IsNumber()
    @IsNotEmpty()
    user_id: number;

    @IsNumber()
    @IsNotEmpty()
    showtime_id: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SeatSelectionDto)
    seats: SeatSelectionDto[];
}