import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { jwtConstants } from '../constants/constants';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../types/auth';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private prisma: PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtConstants.secret,
        });
    }

    async validate(payload: JwtPayload): Promise<JwtPayload> {
        const user = await this.prisma.users.findUnique({
            where: { id: payload.sub },
            select: { id: true, email: true, role: true, name: true }
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return payload;
    }
}