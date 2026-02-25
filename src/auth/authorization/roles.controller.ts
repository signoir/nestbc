import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { AuthorizationGuard } from './guards/authorization.guard';
import { RequireRule } from '../shared/decorators/require-rule.decorator';
import { Action } from './casl/actions.enum';

@ApiTags('v1-roles')
@ApiBearerAuth('JWT')
@Controller('roles')
@UseGuards(JwtAuthGuard, AuthorizationGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequireRule({ action: Action.Create, subject: 'Role' })
  @ApiOperation({ summary: 'Create a new role' })
  @ApiBody({ type: CreateRoleDto })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully',
    schema: {
      example: {
        id: 'uuid-string',
        name: 'moderator',
        description: 'Content moderator role',
        isDefault: false,
        permissions: [],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation error or role already exists',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions to create role',
  })
  async create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @RequireRule({ action: Action.Read, subject: 'Role' })
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({
    status: 200,
    description: 'List of all roles',
    schema: {
      example: [
        {
          id: 'uuid-1',
          name: 'admin',
          description: 'Administrator',
          isDefault: false,
          permissions: [],
        },
      ],
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions to read roles',
  })
  async findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequireRule({ action: Action.Read, subject: 'Role' })
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({
    status: 200,
    description: 'Role details',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Role not found',
  })
  async findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Put(':id')
  @RequireRule({ action: Action.Update, subject: 'Role' })
  @ApiOperation({ summary: 'Update role by ID' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiBody({ type: UpdateRoleDto })
  @ApiResponse({
    status: 200,
    description: 'Role updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation error',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Role not found',
  })
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @RequireRule({ action: Action.Delete, subject: 'Role' })
  @ApiOperation({ summary: 'Delete role by ID' })
  @ApiParam({ name: 'id', description: 'Role UUID' })
  @ApiResponse({
    status: 200,
    description: 'Role deleted successfully',
    schema: { example: { message: 'Role deleted successfully' } },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Role is assigned to users',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Role not found',
  })
  async remove(@Param('id') id: string) {
    await this.rolesService.remove(id);
    return { message: `Role ${id} deleted successfully` };
  }
}
