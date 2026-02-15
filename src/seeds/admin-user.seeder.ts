import { Injectable, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Role } from '../authorization/entities/role.entity';

@Injectable()
export class AdminUserSeeder {
  constructor(
    private usersService: UsersService,
    @InjectRepository(Role) private roleRepository: Repository<Role>,
    private dataSource: DataSource,
  ) {}

  async seedAdminUser(): Promise<User> {
    // Find the admin role
    const adminRole = await this.roleRepository.findOneBy({ name: 'admin' });
    if (!adminRole) {
      throw new Error('Admin role not found. Please seed roles first.');
    }

    // Create admin user with strong password
    const adminUserData = {
      email: 'admin@example.com',
      name: 'Administrator',
      password: 'SuperSecurePassword123!',
      isActive: true,
    };

    // Check if admin user already exists
    const existingAdmin = await this.usersService.findOneByEmail(adminUserData.email);
    if (existingAdmin) {
      console.log('Admin user already exists');
      return existingAdmin;
    }

    // Create the admin user
    const adminUser = await this.usersService.createUser(adminUserData);

    // Now assign the admin role to the user using a direct database update
    // since the user entity has a many-to-many relationship with roles
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find the user again to update its roles
      const userToUpdate = await queryRunner.manager.findOne(User, {
        where: { id: adminUser.id },
        relations: ['roles'],
      });

      if (userToUpdate) {
        // Add the admin role to the user
        userToUpdate.roles = [adminRole];
        const updatedUser = await queryRunner.manager.save(userToUpdate);
        await queryRunner.commitTransaction();
        return updatedUser;
      } else {
        throw new Error('Could not find created admin user to assign role');
      }
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('Failed to assign admin role to user');
    } finally {
      await queryRunner.release();
    }
  }
}