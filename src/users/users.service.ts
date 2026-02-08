import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource, // ✅ Inject DataSource for transactions
  ) {}

  async createUser(userData: Partial<User>): Promise<User> {
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

  // ✅ Use query builder for complex queries
  async findActiveUsers(): Promise<User[]> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('user.isActive = :isActive', { isActive: true })
      .getMany();
  }
}