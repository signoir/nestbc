import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Permission } from './permission.entity';

@Entity('roles')
export class Role {
  @ApiProperty({
    description: 'Role unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Role name (unique)',
    example: 'admin',
  })
  @Column({ unique: true })
  name: string;

  @ApiProperty({
    description: 'Role description',
    example: 'Administrator with full access',
    required: false,
  })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({
    description: 'Whether this is the default role for new users',
    example: false,
    default: false,
  })
  @Column({ default: false })
  isDefault: boolean;

  @ApiProperty({
    description: 'Role permissions',
    type: () => [Permission],
    required: false,
  })
  @ManyToMany(() => Permission, { eager: true })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  @ApiProperty({
    description: 'Role creation timestamp',
    example: '2026-02-12T10:00:00.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;
}
