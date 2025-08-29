import { 
    IsNumber, 
    IsNotEmpty, 
    IsEnum, 
    IsOptional 
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
    @ApiProperty({
        example: 1,
        description: 'The ID of the booking associated with the payment',
    })
    @IsNumber()
    @IsNotEmpty()
    booking_id: number;

    @ApiProperty({
        example: 150.75,
        description: 'The amount to be paid',
    })
    @IsEnum(PaymentMethod)
    @IsNotEmpty()
    method: PaymentMethod;

    @ApiProperty({
        example: 'COMPLETED',
        description: 'The status of the payment',
        required: false,
    })
    @IsOptional()
    @IsEnum(PaymentMethod)
    status?: string;
}