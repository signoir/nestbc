import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { Role } from '../auth/authorization/entities/role.entity';
import { UserAttribute } from '../auth/authorization/entities/user-attribute.entity';

@Entity('users')
export class User {
  @ApiProperty({
    description: 'User unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @Column({ unique: true })
  email: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  @Column()
  name: string;

  @ApiHideProperty()
  @Column({ select: false })
  @Exclude()
  password: string;

  @ApiProperty({
    description: 'Whether the user account is active',
    example: true,
    default: true,
  })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'User roles',
    type: [Role],
    required: false,
  })
  @ManyToMany(() => Role, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @ApiProperty({
    description: 'User attributes for ABAC',
    type: [UserAttribute],
    required: false,
  })
  @OneToMany(() => UserAttribute, (attribute) => attribute.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  attributes: UserAttribute[];

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2026-02-12T10:00:00.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-02-12T10:00:00.000Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
