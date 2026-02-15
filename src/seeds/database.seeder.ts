import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../authorization/entities/role.entity';
import { Permission } from '../authorization/entities/permission.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class DatabaseSeeder {
  constructor(
    @InjectRepository(Role) 
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission) 
    private permissionRepository: Repository<Permission>,
    private usersService: UsersService,
  ) {}

  async seedRoles(): Promise<void> {
    const defaultRoles = [
      { name: 'admin', description: 'Administrator with full access', isDefault: false },
      { name: 'user', description: 'Regular user', isDefault: true },
      { name: 'moderator', description: 'Content moderator', isDefault: false },
    ];

    for (const roleData of defaultRoles) {
      const existing = await this.roleRepository.findOneBy({ name: roleData.name });
      if (!existing) {
        await this.roleRepository.save(roleData);
      }
    }
  }

  async seedPermissions(): Promise<void> {
    const permissions = [
      { action: 'manage', subject: 'all' }, // admin permission
      { action: 'read', subject: 'User' },
      { action: 'update', subject: 'User' },
      { action: 'create', subject: 'Post' },
      { action: 'read', subject: 'Post' },
      { action: 'update', subject: 'Post' },
      { action: 'delete', subject: 'Post' },
    ];

    for (const permData of permissions) {
      const existing = await this.permissionRepository.findOneBy({
        action: permData.action,
        subject: permData.subject,
      });
      if (!existing) {
        await this.permissionRepository.save(permData);
      }
    }
  }
}