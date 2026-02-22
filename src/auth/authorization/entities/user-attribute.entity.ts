import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../../../users/user.entity';

@Entity('user_attributes')
export class UserAttribute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, user => user.attributes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  attributeKey: string;

  @Column()
  attributeValue: string;

  @CreateDateColumn()
  createdAt: Date;
}