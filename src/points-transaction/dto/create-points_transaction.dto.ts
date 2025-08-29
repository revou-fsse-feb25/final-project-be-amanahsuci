import { 
    IsNumber, 
    IsNotEmpty, 
    IsEnum, 
    IsOptional, 
    IsDateString, 
    IsPositive,
    IsString 
} from 'class-validator';
import { Type } from 'class-transformer';
import { PointType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePointsTransactionDto {
    @ApiProperty({
        description: 'ID of the user associated with the points transaction',
        example: 1
    })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    user_id: number;

    @ApiProperty({
        description: 'ID of the booking associated with the points transaction (if applicable)',
        example: 123,
        required: false
    })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    booking_id?: number; 

    @ApiProperty({
        description: 'Type of points transaction: earn or redeem',
        example: 'earn',
        enum: PointType
    })
    @IsEnum(PointType, {
        message: 'Type must be either earn or redeem'
    })
    @IsNotEmpty()
    type: PointType;

    @ApiProperty({
        description: 'Number of points involved in the transaction',
        example: 50
    })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive({
        message: 'Points must be greater than 0'
    })
    points: number;

    @ApiProperty({
        description: 'Timestamp when the transaction was created',
        example: '2023-10-05T14:48:00.000Z',
        required: false
    })
    @IsOptional()
    @IsDateString({}, {
        message: 'created_at must be a valid date string'
    })
    @Type(() => Date)
    created_at?: Date;
}