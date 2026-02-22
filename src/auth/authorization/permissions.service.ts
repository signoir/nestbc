import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
    private dataSource: DataSource,
  ) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if permission already exists
      const existing = await queryRunner.manager.findOne(Permission, {
        where: {
          action: createPermissionDto.action,
          subject: createPermissionDto.subject,
        },
      });

      if (existing) {
        throw new BadRequestException(
          `Permission '${createPermissionDto.action}' on '${createPermissionDto.subject}' already exists`,
        );
      }

      const permission = queryRunner.manager.create(Permission, createPermissionDto);
      const savedPermission = await queryRunner.manager.save(permission);

      await queryRunner.commitTransaction();
      return savedPermission;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException('Failed to create permission');
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Permission[]> {
    return await this.permissionsRepository.find();
  }

  async findOne(id: string): Promise<Permission> {
    const permission = await this.permissionsRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return permission;
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const permission = await queryRunner.manager.findOne(Permission, { where: { id } });

      if (!permission) {
        throw new NotFoundException(`Permission with ID ${id} not found`);
      }

      // If updating action/subject, check for duplicates
      if (
        (updatePermissionDto.action && updatePermissionDto.action !== permission.action) ||
        (updatePermissionDto.subject && updatePermissionDto.subject !== permission.subject)
      ) {
        const existing = await queryRunner.manager.findOne(Permission, {
          where: {
            action: updatePermissionDto.action || permission.action,
            subject: updatePermissionDto.subject || permission.subject,
          },
        });

        if (existing && existing.id !== id) {
          throw new BadRequestException(
            `Permission '${updatePermissionDto.action}' on '${updatePermissionDto.subject}' already exists`,
          );
        }
      }

      Object.assign(permission, updatePermissionDto);
      const updatedPermission = await queryRunner.manager.save(permission);

      await queryRunner.commitTransaction();
      return updatedPermission;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err instanceof NotFoundException || err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException('Failed to update permission');
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const permission = await queryRunner.manager.findOne(Permission, { where: { id } });

      if (!permission) {
        throw new NotFoundException(`Permission with ID ${id} not found`);
      }

      // Check if permission is assigned to any roles
      const roleCount = await queryRunner.manager
        .createQueryBuilder('roles', 'role')
        .innerJoin('role_permissions', 'rp', 'rp.role_id = role.id')
        .where('rp.permission_id = :permissionId', { permissionId: id })
        .getCount();

      if (roleCount > 0) {
        throw new BadRequestException(
          `Cannot delete permission: it is assigned to ${roleCount} role(s)`,
        );
      }

      await queryRunner.manager.remove(permission);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err instanceof NotFoundException || err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException('Failed to delete permission');
    } finally {
      await queryRunner.release();
    }
  }
}
