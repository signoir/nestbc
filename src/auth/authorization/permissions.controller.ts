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
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { AuthorizationGuard } from './guards/authorization.guard';
import { RequireRule } from '../shared/decorators/require-rule.decorator';
import { Action } from './casl/actions.enum';

@ApiTags('permissions')
@ApiBearerAuth('JWT')
@Controller('permissions')
@UseGuards(JwtAuthGuard, AuthorizationGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequireRule({ action: Action.Create, subject: 'Permission' })
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiBody({ type: CreatePermissionDto })
  @ApiResponse({
    status: 201,
    description: 'Permission created successfully',
    schema: {
      example: {
        id: 'uuid-string',
        action: 'read',
        subject: 'User',
        conditions: null,
        inverted: false,
        reason: 'Basic read permission',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation error or permission exists',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  @RequireRule({ action: Action.Read, subject: 'Permission' })
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({
    status: 200,
    description: 'List of all permissions',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  @RequireRule({ action: Action.Read, subject: 'Permission' })
  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiParam({ name: 'id', description: 'Permission UUID' })
  @ApiResponse({
    status: 200,
    description: 'Permission details',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Permission not found',
  })
  async findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Put(':id')
  @RequireRule({ action: Action.Update, subject: 'Permission' })
  @ApiOperation({ summary: 'Update permission by ID' })
  @ApiParam({ name: 'id', description: 'Permission UUID' })
  @ApiBody({ type: UpdatePermissionDto })
  @ApiResponse({
    status: 200,
    description: 'Permission updated successfully',
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
    description: 'Not Found - Permission not found',
  })
  async update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @RequireRule({ action: Action.Delete, subject: 'Permission' })
  @ApiOperation({ summary: 'Delete permission by ID' })
  @ApiParam({ name: 'id', description: 'Permission UUID' })
  @ApiResponse({
    status: 200,
    description: 'Permission deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Permission is assigned to roles',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Permission not found',
  })
  async remove(@Param('id') id: string) {
    await this.permissionsService.remove(id);
    return { message: `Permission ${id} deleted successfully` };
  }
}
