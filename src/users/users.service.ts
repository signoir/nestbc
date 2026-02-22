import { Injectable, InternalServerErrorException, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from './user.entity';
import { validateOrReject } from 'class-validator';
import { AppAbility } from '../auth/authorization/casl/ability.factory';
import { Action } from '../auth/authorization/casl/actions.enum';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource, // ✅ Inject DataSource for transactions
  ) {}

  async createUser(userData: Partial<User>): Promise<User> {
    // Validate input data
    const createUserDto = new CreateUserDto();
    Object.assign(createUserDto, userData);

    try {
      await validateOrReject(createUserDto);
    } catch (validationErrors) {
      throw new BadRequestException(
        validationErrors.map(error => Object.values(error.constraints || {}).join(', '))
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Idempotency check
      const existing = await queryRunner.manager.findOne(User, {
        where: { email: userData.email },
      });
      if (existing) return existing;

      const user = queryRunner.manager.create(User, userData);
      const savedUser = await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();
      return savedUser;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Transaction failed');
    } finally {
      await queryRunner.release(); // ✅ Release connection back to pool
    }
  }

  async findOne(id: string, ability?: AppAbility, currentUser?: User): Promise<User> {
    // If no ability is provided, just return the user (for internal use)
    if (!ability) {
      const user = await this.usersRepository.findOneBy({ id });
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return user;
    }

    // Check if user can read this specific user
    if (currentUser && currentUser.id === id) {
      // Users can always read their own profile
      if (ability.can(Action.Read, 'User')) {
        const user = await this.usersRepository.findOneBy({ id });
        if (!user) {
          throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
      }
    }

    // For other users, check if they have general read permission
    if (ability.can(Action.Read, 'User')) {
      const user = await this.usersRepository.findOneBy({ id });
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return user;
    }

    throw new ForbiddenException(`Insufficient permissions to read user ${id}`);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    // Find a user by email without authorization checks (for internal use)
    return await this.usersRepository.findOneBy({ email });
  }

  async update(id: string, updateUserDto: Partial<User>, ability?: AppAbility, currentUser?: User): Promise<User> {
    // If no ability is provided, just update the user (for internal use)
    if (!ability) {
      const user = await this.findOne(id); // Verify user exists first
      
      await this.usersRepository.update(id, updateUserDto);
      return this.findOne(id); // Return updated user
    }

    // Check if user can update this specific user
    if (currentUser && currentUser.id === id) {
      // Users can update their own profile if they have update permission
      if (ability.can(Action.Update, 'User')) {
        const user = await this.findOne(id); // Verify user exists first
        
        await this.usersRepository.update(id, updateUserDto);
        return this.findOne(id); // Return updated user
      }
    }

    // For other users, check if they have general update permission
    if (ability.can(Action.Update, 'User')) {
      const user = await this.findOne(id); // Verify user exists first
      
      await this.usersRepository.update(id, updateUserDto);
      return this.findOne(id); // Return updated user
    }

    throw new ForbiddenException(`Insufficient permissions to update user ${id}`);
  }

  async delete(id: string, ability?: AppAbility, currentUser?: User): Promise<void> {
    // If no ability is provided, just delete the user (for internal use)
    if (!ability) {
      const user = await this.findOne(id); // Verify user exists first
      
      await this.usersRepository.delete(id);
      return;
    }

    // Check if user can delete this specific user
    if (currentUser && currentUser.id === id) {
      // Users can delete their own account if they have delete permission
      if (ability.can(Action.Delete, 'User')) {
        await this.usersRepository.delete(id);
        return;
      }
    }

    // For other users, check if they have general delete permission
    if (ability.can(Action.Delete, 'User')) {
      const user = await this.findOne(id); // Verify user exists first
      
      await this.usersRepository.delete(id);
      return;
    }

    throw new ForbiddenException(`Insufficient permissions to delete user ${id}`);
  }

  async findActiveUsers(ability?: AppAbility): Promise<User[]> {
    // If no ability is provided, return all users (for internal use)
    if (!ability) {
      return this.usersRepository.find();
    }

    // Check if user has permission to read users
    if (ability.can(Action.Read, 'User')) {
      return this.usersRepository.find();
    }

    throw new ForbiddenException('Insufficient permissions to read users');
  }

  async findAll(ability: AppAbility): Promise<User[]> {
    // Check if user has permission to read all users
    if (!ability.can(Action.Read, 'User')) {
      throw new ForbiddenException('Insufficient permissions to read all users');
    }

    // Apply ABAC filters if needed
    return this.usersRepository.find();
  }
}