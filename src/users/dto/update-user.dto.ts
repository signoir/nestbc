import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

/**
 * UpdateUserDto - All properties are optional
 * Uses PartialType to inherit from CreateUserDto
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {}
