import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('resource_attributes')
export class ResourceAttribute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  resourceType: string;

  @Column()
  resourceId: string;

  @Column()
  attributeKey: string;

  @Column({ type: 'text', nullable: true })
  attributeValue: string;

  @CreateDateColumn()
  createdAt: Date;
}