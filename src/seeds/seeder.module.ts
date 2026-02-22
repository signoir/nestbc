import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseSeeder } from './database.seeder';
import { AdminUserSeeder } from './admin-user.seeder';
import { UsersModule } from '../users/users.module';
import { Role } from '../auth/authorization/entities/role.entity';
import { Permission } from '../auth/authorization/entities/permission.entity';
import { SeedCommand } from './seed.command';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission]),
    UsersModule,
  ],
  providers: [DatabaseSeeder, AdminUserSeeder, SeedCommand],
  exports: [DatabaseSeeder, AdminUserSeeder],
})
export class SeederModule {}