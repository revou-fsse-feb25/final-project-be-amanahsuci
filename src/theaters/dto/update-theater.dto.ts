import { PartialType } from '@nestjs/mapped-types';
import { CreateTheaterDto } from './create-theater.dto';
import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTheaterDto extends PartialType(CreateTheaterDto) {
    @ApiPropertyOptional({
        description: 'Name of the theater',
        example: 'Grand Cinema',
    })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({
        description: 'Location of the theater',
        example: '123 Main St, Anytown, USA',
    })
    @IsString()
    @IsOptional()
    location?: string;
}