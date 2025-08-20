import { IsNumber, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
    @IsNumber()
    @IsNotEmpty()
    booking_id: number;

    @IsEnum(PaymentMethod)
    @IsNotEmpty()
    method: PaymentMethod;

    @IsOptional()
    @IsEnum(PaymentMethod)
    status?: string;
}