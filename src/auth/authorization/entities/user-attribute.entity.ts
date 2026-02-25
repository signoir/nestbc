import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../users/user.entity';

@Entity('user_attributes')
export class UserAttribute {
  @ApiProperty({
    description: 'Attribute unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column()
  userId: string;

  @ApiProperty({
    description: 'Associated user',
    type: () => User,
    required: false,
  })
  @ManyToOne(() => User, (user) => user.attributes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({
    description: 'Attribute key',
    example: 'department',
  })
  @Column()
  attributeKey: string;

  @ApiProperty({
    description: 'Attribute value',
    example: 'admin',
  })
  @Column()
  attributeValue: string;

  @ApiProperty({
    description: 'Attribute creation timestamp',
    example: '2026-02-12T10:00:00.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;
}
