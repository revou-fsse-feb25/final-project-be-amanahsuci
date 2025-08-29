import { PartialType } from '@nestjs/mapped-types';
import { CreatePaymentDto } from './create-payment.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { PaymentMethod, Status } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {
    @ApiPropertyOptional({
        enum: PaymentMethod,
        description: 'The payment method used',
        example: PaymentMethod.qris,
        required: false,
    })
    @IsEnum(PaymentMethod)
    @IsOptional()
    method?: PaymentMethod;

    @ApiPropertyOptional({
        enum: Status,
        description: 'The status of the payment',
        example: Status.pending,
        required: false,
    })
    @IsEnum(Status)
    @IsOptional()
    status?: Status;

    @ApiPropertyOptional({
        description: 'The date and time when the payment was made',
        example: '2024-10-01T12:34:56.789Z',
        required: false,
    })
    @IsOptional()
    paid_at?: Date;
}