import { PartialType } from '@nestjs/mapped-types';
import { CreateBookingDto } from './create-booking.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { Status } from '@prisma/client';

export class UpdateBookingDto extends PartialType(CreateBookingDto) {
    @IsEnum(Status)
    @IsOptional()
    payment_status?: Status;
}