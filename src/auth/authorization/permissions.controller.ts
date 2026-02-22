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
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { AuthorizationGuard } from './guards/authorization.guard';
import { RequireRule } from '../shared/decorators/require-rule.decorator';
import { Action } from './casl/actions.enum';

@Controller('permissions')
@UseGuards(JwtAuthGuard, AuthorizationGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequireRule({ action: Action.Create, subject: 'Permission' })
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  @RequireRule({ action: Action.Read, subject: 'Permission' })
  async findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  @RequireRule({ action: Action.Read, subject: 'Permission' })
  async findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Put(':id')
  @RequireRule({ action: Action.Update, subject: 'Permission' })
  async update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @RequireRule({ action: Action.Delete, subject: 'Permission' })
  async remove(@Param('id') id: string) {
    await this.permissionsService.remove(id);
    return { message: `Permission ${id} deleted successfully` };
  }
}
