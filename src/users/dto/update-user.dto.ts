import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { 
    IsEmail, 
    IsOptional, 
    IsString, 
    IsEnum, 
    MinLength, 
    IsPhoneNumber 
} from 'class-validator';
import { Role } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @ApiPropertyOptional({
        description: 'Name of the user',
        example: 'John Doe',
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({
        description: 'Email of the user',
        example: 'john@example.com',
    })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({
        description: 'Phone number of the user',
        example: '+6281234567890',
    })
    @IsOptional()
    @IsPhoneNumber('ID') 
    phone?: string;

    @ApiPropertyOptional({
        description: 'Password of the user (minimum 6 characters)',
        example: 'strongPassword123',
    })
    @IsOptional()
    @IsString()
    @MinLength(6)
    password?: string;

    @ApiPropertyOptional({
        description: 'Role of the user',
        example: 'USER',
        enum: Role,
    })
    @IsOptional()
    @IsEnum(Role)
    role?: Role;
}