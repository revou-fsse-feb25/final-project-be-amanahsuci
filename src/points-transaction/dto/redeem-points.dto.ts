import { IsNumber, IsNotEmpty, IsOptional, IsPositive } from 'class-validator';

export class RedeemPointsDto {
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    points: number;

    @IsNumber()
    @IsOptional()
    @IsPositive()
    booking_id?: number;
}