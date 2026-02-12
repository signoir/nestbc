import { Injectable, InternalServerErrorException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from './user.entity';
import { validateOrReject } from 'class-validator';
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

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: Partial<User>): Promise<User> {
    const user = await this.findOne(id); // Verify user exists first

    await this.usersRepository.update(id, updateUserDto);
    return this.findOne(id); // Return updated user
  }

  async delete(id: string): Promise<void> {
    const user = await this.findOne(id); // Verify user exists first

    await this.usersRepository.delete(id);
  }

  // Return all users since there's no isActive field in the entity
  async findActiveUsers(): Promise<User[]> {
    return this.usersRepository.find();
  }
}