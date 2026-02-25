import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({
    description: 'Permission action',
    example: 'read',
    required: true,
    enum: ['create', 'read', 'update', 'delete', 'manage'],
  })
  @IsString()
  @IsNotEmpty({ message: 'Action is required' })
  action: string;

  @ApiProperty({
    description: 'Subject entity (e.g., User, Role, Permission)',
    example: 'User',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'Subject is required' })
  subject: string;

  @ApiProperty({
    description: 'CASL conditions object for ABAC rules',
    example: { id: 'user-id' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  conditions?: Record<string, any>;

  @ApiProperty({
    description: 'Whether the permission is inverted (denied)',
    example: false,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  inverted?: boolean = false;

  @ApiProperty({
    description: 'Reason for the permission',
    example: 'Basic read permission for users',
    required: false,
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
