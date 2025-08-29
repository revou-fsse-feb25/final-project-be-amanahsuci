import { 
    IsNumber, 
    IsNotEmpty, 
    IsOptional, 
    IsPositive 
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RedeemPointsDto {
    @ApiProperty({
        description: 'Number of points to redeem',
        example: 100,
    })
    @IsNumber()
    @IsNotEmpty()
    @IsPositive()
    points: number;

    @ApiProperty({
        description: 'Optional booking ID associated with the redemption',
        example: 123,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    @IsPositive()
    booking_id?: number;
}