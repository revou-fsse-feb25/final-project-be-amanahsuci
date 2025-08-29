import { 
    IsEmail, 
    IsNotEmpty, 
    IsString, 
    MinLength, 
    IsOptional,
    Matches 
} from 'class-validator';

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(2, { message: 'Name must be at least 2 characters long' })
    name: string;

    @IsEmail({}, { message: 'Please provide a valid email' })
    @IsNotEmpty()
    email: string;

    @IsOptional()
    @IsString()
    @Matches(/^(\+62|62|0)8[1-9][0-9]{6,9}$/, {
        message: 'Please provide a valid Indonesian phone number'
    })
    phone?: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    })
    password: string;

    @IsString()
    @IsNotEmpty()
    confirmPassword: string;
}