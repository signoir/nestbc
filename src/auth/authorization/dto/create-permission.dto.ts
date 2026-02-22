import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty({ message: 'Action is required' })
  action: string;

  @IsString()
  @IsNotEmpty({ message: 'Subject is required' })
  subject: string;

  @IsObject()
  @IsOptional()
  conditions?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  inverted?: boolean = false;

  @IsString()
  @IsOptional()
  reason?: string;
}
