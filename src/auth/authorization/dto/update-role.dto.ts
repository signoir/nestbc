import { PartialType } from '@nestjs/swagger';
import { CreateRoleDto } from './create-role.dto';

/**
 * UpdateRoleDto - All properties are optional
 * Uses PartialType to inherit from CreateRoleDto
 */
export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
