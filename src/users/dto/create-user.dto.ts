import { IsEmail, IsString, MinLength, Length, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    required: true,
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    required: true,
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @Length(1, 100, { message: 'Name must be between 1 and 100 characters' })
  name: string;

  @ApiProperty({
    description: 'User password (min 8 characters)',
    example: 'SecurePassword123!',
    required: true,
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @ApiProperty({
    description: 'Whether the user is active',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
