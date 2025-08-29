import { IsString, IsNotEmpty } from 'class-validator';

export class CreateTheaterDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    location: string;
}