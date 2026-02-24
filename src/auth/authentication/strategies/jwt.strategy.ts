import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../../users/users.service';
import { User } from '../../../users/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    
    // Fail fast if JWT secret is not configured
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any): Promise<User> {
    const user = await this.usersService.findOneByEmail(payload.email);
    
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Attach the payload information to the user object
    return { ...user, ...payload };
  }
}
