import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../user.entity';

/**
 * Request DTO for creating a user (V1)
 */
export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  isActive?: boolean;
}

/**
 * Response DTO for user operations (V1)
 */
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Abstract base service for user operations.
 * 
 * Implements the Logic Fork Pattern:
 * - V1 and V2 services extend this abstract class
 * - Each version provides its own implementation
 * - Shared repository and utility methods stay in base class
 * 
 * This pattern ensures:
 * - Clean separation of version-specific logic
 * - No if/else version checks in services
 * - Easy to add V3, V4, etc. in the future
 */
@Injectable()
export abstract class AbstractUserService {
  constructor(
    protected readonly userRepository: Repository<User>,
  ) {}

  /**
   * Create a new user - version-specific implementation required
   */
  abstract createUser(dto: CreateUserRequest): Promise<UserResponse>;

  /**
   * Find user by ID - version-specific implementation required
   */
  abstract findOne(id: string): Promise<UserResponse>;

  /**
   * Find user by email - shared implementation
   */
  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'name', 'password', 'isActive', 'createdAt', 'updatedAt'],
    });
  }

  /**
   * Find all users - shared implementation with optional filtering
   */
  async findAll(options?: { isActive?: boolean }): Promise<User[]> {
    const where: any = {};
    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }
    return this.userRepository.find({ where });
  }

  /**
   * Update user - shared implementation
   */
  async update(id: string, updates: Partial<User>): Promise<UserResponse> {
    const user = await this.findOne(id);
    await this.userRepository.update(id, updates);
    return this.findOne(id);
  }

  /**
   * Delete user - shared implementation
   */
  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  /**
   * Map User entity to V1 response DTO
   */
  protected mapToResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Handle user not found - shared utility
   */
  protected throwNotFound(id: string): never {
    throw new NotFoundException(`User with ID ${id} not found`);
  }
}
