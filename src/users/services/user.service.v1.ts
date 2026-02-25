import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user.entity';
import { AbstractUserService, CreateUserRequest, UserResponse } from './abstract-user.service';
import * as bcrypt from 'bcrypt';

/**
 * V1 User Service Implementation
 * 
 * Business Logic:
 * - Basic password hashing (bcrypt, 10 rounds)
 * - No phone verification
 * - No email verification
 * - Simple name field (not split into first/last)
 * 
 * This is the Logic Fork Pattern implementation for V1.
 * V2 would have its own service class with different logic.
 */
@Injectable()
export class UserServiceV1 extends AbstractUserService {
  constructor(
    @InjectRepository(User)
    userRepository: Repository<User>,
  ) {
    super(userRepository);
  }

  /**
   * V1 Implementation: Simple user creation
   * - Basic password hashing
   * - No additional validation beyond DTO
   * - No phone/email verification
   */
  async createUser(dto: CreateUserRequest): Promise<UserResponse> {
    // V1: Basic password hashing
    const hashedPassword = await this.hashPassword(dto.password);

    // Check for duplicate email
    const existing = await this.findOneByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    // Create user with V1 fields only
    const user = await this.userRepository.save({
      email: dto.email,
      name: dto.name,
      password: hashedPassword,
      isActive: dto.isActive ?? true,
      apiVersion: 'v1' as const,
    });

    return this.mapToResponse(user);
  }

  /**
   * V1 Implementation: Simple user lookup
   * Returns basic user fields only
   */
  async findOne(id: string): Promise<UserResponse> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'name',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      this.throwNotFound(id);
    }

    return this.mapToResponse(user);
  }

  /**
   * V1: Basic password hashing (10 rounds)
   */
  protected async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * V1: Simple password verification
   */
  async verifyPassword(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }

  /**
   * V1 Response Mapper: Basic fields only
   */
  protected override mapToResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
