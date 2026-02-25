import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../../users/user.entity';
import { RolesService } from '../authorization/roles.service';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private rolesService: RolesService,
    private dataSource: DataSource,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findOneByEmail(email);
    
    if (!user || !user.isActive) {
      return null;
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      email: user.email,
      sub: user.id,
      name: user.name,
    };

    const expiresIn = (this.configService.get('JWT_EXPIRES_IN') as string) || '1d';

    return {
      access_token: this.jwtService.sign(payload, {
        expiresIn: expiresIn as any,
      }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.usersService.findOneByEmail(registerDto.email);

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Find the default 'user' role first (outside transaction)
    const defaultRole = await this.rolesService.findDefaultRole();
    if (!defaultRole) {
      throw new InternalServerErrorException('Default user role not found. Please run database seeding.');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    // Create user
    const userData = {
      email: registerDto.email,
      name: registerDto.name,
      password: hashedPassword,
      isActive: true,
      roles: [defaultRole],
    };

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create user with role within transaction
      const user = queryRunner.manager.create(User, userData);
      const savedUser = await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();

      // Generate JWT token
      const payload = {
        email: savedUser.email,
        sub: savedUser.id,
        name: savedUser.name,
      };

      const expiresIn = (this.configService.get('JWT_EXPIRES_IN') as string) || '1d';

      return {
        access_token: this.jwtService.sign(payload, {
          expiresIn: expiresIn as any,
        }),
        user: {
          id: savedUser.id,
          email: savedUser.email,
          name: savedUser.name,
          isActive: savedUser.isActive,
          roles: [{ id: defaultRole.id, name: defaultRole.name }],
        },
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error('Registration error:', err);
      if (err instanceof BadRequestException || err instanceof InternalServerErrorException) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to register user');
    } finally {
      await queryRunner.release();
    }
  }
}
