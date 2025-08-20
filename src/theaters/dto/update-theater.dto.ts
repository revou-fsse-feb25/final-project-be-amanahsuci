import { PartialType } from '@nestjs/mapped-types';
import { CreateTheaterDto } from './create-theater.dto';
import { IsString, IsOptional } from 'class-validator';

export class UpdateTheaterDto extends PartialType(CreateTheaterDto) {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    location?: string;
}