import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, CreateDateColumn } from 'typeorm';
import { Role } from './role.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  action: string;

  @Column()
  subject: string;

  @Column('jsonb', { nullable: true })
  conditions: Record<string, any>;

  @Column({ default: false })
  inverted: boolean;

  @Column({ nullable: true })
  reason: string;

  @ManyToMany(() => Role, role => role.permissions)
  roles: Role[];

  @CreateDateColumn()
  createdAt: Date;
}