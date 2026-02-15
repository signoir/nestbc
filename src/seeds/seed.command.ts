import { Command, Commander } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { DatabaseSeeder } from './database.seeder';
import { AdminUserSeeder } from './admin-user.seeder';

@Injectable()
export class SeedCommand {
  constructor(
    private readonly databaseSeeder: DatabaseSeeder,
    private readonly adminUserSeeder: AdminUserSeeder,
  ) {}

  @Command({
    command: 'seed:roles',
    describe: 'Seed the database with default roles',
  })
  async seedRoles() {
    try {
      await this.databaseSeeder.seedRoles();
      console.log('Roles seeded successfully');
    } catch (error) {
      console.error('Error seeding roles:', error);
    }
  }

  @Command({
    command: 'seed:permissions',
    describe: 'Seed the database with default permissions',
  })
  async seedPermissions() {
    try {
      await this.databaseSeeder.seedPermissions();
      console.log('Permissions seeded successfully');
    } catch (error) {
      console.error('Error seeding permissions:', error);
    }
  }

  @Command({
    command: 'seed:admin',
    describe: 'Seed the database with admin user',
  })
  async seedAdmin() {
    try {
      await this.adminUserSeeder.seedAdminUser();
      console.log('Admin user seeded successfully');
    } catch (error) {
      console.error('Error seeding admin user:', error);
    }
  }

  @Command({
    command: 'seed:all',
    describe: 'Seed the database with all initial data (roles, permissions and admin user)',
  })
  async seedAll() {
    try {
      await this.databaseSeeder.seedRoles();
      await this.databaseSeeder.seedPermissions();
      await this.adminUserSeeder.seedAdminUser();
      console.log('All data seeded successfully');
    } catch (error) {
      console.error('Error seeding data:', error);
    }
  }
}