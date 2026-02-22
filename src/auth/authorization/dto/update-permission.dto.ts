import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class UpdatePermissionDto {
  @IsString()
  @IsOptional()
  action?: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsObject()
  @IsOptional()
  conditions?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  inverted?: boolean;

  @IsString()
  @IsOptional()
  reason?: string;
}
