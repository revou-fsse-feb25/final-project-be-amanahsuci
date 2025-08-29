import { PartialType } from '@nestjs/mapped-types';
import { CreatePaymentDto } from './create-payment.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { PaymentMethod, Status } from '@prisma/client';

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {
    @IsEnum(PaymentMethod)
    @IsOptional()
    method?: PaymentMethod;

    @IsEnum(Status)
    @IsOptional()
    status?: Status;

    @IsOptional()
    paid_at?: Date;
}