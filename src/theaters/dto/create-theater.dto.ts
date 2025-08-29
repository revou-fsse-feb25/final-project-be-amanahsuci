import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTheaterDto {
    @ApiProperty({
        description: 'Name of the theater',
        example: 'Grand Cinema',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Location of the theater',
        example: '123 Main St, Springfield',
    })
    @IsString()
    @IsNotEmpty()
    location: string;
}