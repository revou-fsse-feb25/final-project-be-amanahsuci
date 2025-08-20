import { Role } from '@prisma/client';

export interface JwtPayload {
    sub: number; 
    email: string;
    role: Role;
    name: string;
}

export interface AuthResponse {
    user: {
        id: number;
        name: string;
        email: string;
        role: Role;
        phone?: string | null;
        points: number;
    };
    access_token: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface RegisterDto {
    name: string;
    email: string;
    phone?: string;
    password: string;
    confirmPassword: string;
}