import { 
    IsEmail, 
    IsEnum, 
    IsNotEmpty, 
    IsString, 
    MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsNotEmpty()
    @MinLength(8)
    password: string;

    @IsString()
    phone: string;

    @IsEnum(Role)
    role: Role;
}
