import { 
    IsEmail, 
    IsEnum, 
    IsNotEmpty, 
    IsString, 
    MinLength } from 'class-validator';
import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({
        example: 'John Doe',
        description: 'The name of the user',
    })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({
        example: 'john@example.com',
        description: 'The email of the user',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'strongPassword123',
        description: 'The password of the user (minimum 8 characters)',
    })
    @IsNotEmpty()
    @MinLength(8)
    password: string;

    @ApiProperty({
        example: '+1234567890',
        description: 'The phone number of the user',
    })
    @IsString()
    phone: string;

    @ApiProperty({
        example: 'USER',
        description: 'The role of the user (USER or ADMIN)',
        enum: Role,
    })
    @IsEnum(Role)
    role: Role;
}
