import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    private dataSource: DataSource,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if role already exists
      const existing = await queryRunner.manager.findOne(Role, {
        where: { name: createRoleDto.name },
      });

      if (existing) {
        throw new BadRequestException(`Role '${createRoleDto.name}' already exists`);
      }

      const role = queryRunner.manager.create(Role, createRoleDto);
      const savedRole = await queryRunner.manager.save(role);

      await queryRunner.commitTransaction();
      return savedRole;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException('Failed to create role');
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Role[]> {
    return await this.rolesRepository.find({
      relations: ['permissions'],
    });
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.rolesRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async findByName(name: string): Promise<Role> {
    const role = await this.rolesRepository.findOne({
      where: { name },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException(`Role '${name}' not found`);
    }

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const role = await queryRunner.manager.findOne(Role, { where: { id } });

      if (!role) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }

      // If updating name, check for duplicates
      if (updateRoleDto.name && updateRoleDto.name !== role.name) {
        const existing = await queryRunner.manager.findOne(Role, {
          where: { name: updateRoleDto.name },
        });

        if (existing) {
          throw new BadRequestException(`Role '${updateRoleDto.name}' already exists`);
        }
      }

      Object.assign(role, updateRoleDto);
      const updatedRole = await queryRunner.manager.save(role);

      await queryRunner.commitTransaction();
      return updatedRole;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err instanceof NotFoundException || err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException('Failed to update role');
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const role = await queryRunner.manager.findOne(Role, { where: { id } });

      if (!role) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }

      // Check if role is assigned to any users
      const userCount = await queryRunner.manager
        .createQueryBuilder('users', 'user')
        .innerJoin('user_roles', 'ur', 'ur.user_id = user.id')
        .where('ur.role_id = :roleId', { roleId: id })
        .getCount();

      if (userCount > 0) {
        throw new BadRequestException(`Cannot delete role: it is assigned to ${userCount} user(s)`);
      }

      await queryRunner.manager.remove(role);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err instanceof NotFoundException || err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException('Failed to delete role');
    } finally {
      await queryRunner.release();
    }
  }

  async findDefaultRole(): Promise<Role | null> {
    return await this.rolesRepository.findOne({
      where: { isDefault: true },
    });
  }
}
