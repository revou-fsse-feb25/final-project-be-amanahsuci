import { IsNumber, IsNotEmpty, IsEnum, IsOptional, IsDateString, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { PointType } from '@prisma/client';

export class CreatePointsTransactionDto {
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    user_id: number;

    @IsNumber()
    @IsOptional()
    @IsPositive()
    booking_id?: number; 

    @IsEnum(PointType, {
        message: 'Type must be either earn or redeem'
    })
    @IsNotEmpty()
    type: PointType;

    @IsNumber()
    @IsNotEmpty()
    @IsPositive({
        message: 'Points must be greater than 0'
    })
    points: number;

    @IsOptional()
    @IsDateString({}, {
        message: 'created_at must be a valid date string'
    })
    @Type(() => Date)
    created_at?: Date;
}