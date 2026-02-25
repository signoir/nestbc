import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('permissions')
export class Permission {
  @ApiProperty({
    description: 'Permission unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Permission action',
    example: 'read',
    enum: ['create', 'read', 'update', 'delete', 'manage'],
  })
  @Column()
  action: string;

  @ApiProperty({
    description: 'Subject entity',
    example: 'User',
  })
  @Column()
  subject: string;

  @ApiProperty({
    description: 'CASL conditions for ABAC',
    example: { id: 'user-id' },
    required: false,
  })
  @Column('jsonb', { nullable: true })
  conditions?: Record<string, any>;

  @ApiProperty({
    description: 'Whether the permission is inverted (denied)',
    example: false,
    default: false,
  })
  @Column({ default: false })
  inverted: boolean;

  @ApiProperty({
    description: 'Reason for the permission',
    example: 'Basic read permission',
    required: false,
  })
  @Column({ nullable: true })
  reason?: string;

  @ApiProperty({
    description: 'Permission creation timestamp',
    example: '2026-02-12T10:00:00.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;
}
