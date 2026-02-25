import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Role name (unique)',
    example: 'admin',
    required: true,
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty({ message: 'Role name is required' })
  name: string;

  @ApiProperty({
    description: 'Role description',
    example: 'Administrator with full access',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Whether this is the default role for new users',
    example: false,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean = false;
}
