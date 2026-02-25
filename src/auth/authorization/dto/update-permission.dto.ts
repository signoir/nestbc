import { PartialType } from '@nestjs/swagger';
import { CreatePermissionDto } from './create-permission.dto';

/**
 * UpdatePermissionDto - All properties are optional
 * Uses PartialType to inherit from CreatePermissionDto
 */
export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}
