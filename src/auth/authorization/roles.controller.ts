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
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { AuthorizationGuard } from './guards/authorization.guard';
import { RequireRule } from '../shared/decorators/require-rule.decorator';
import { Action } from './casl/actions.enum';

@Controller('roles')
@UseGuards(JwtAuthGuard, AuthorizationGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequireRule({ action: Action.Create, subject: 'Role' })
  async create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @RequireRule({ action: Action.Read, subject: 'Role' })
  async findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequireRule({ action: Action.Read, subject: 'Role' })
  async findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Put(':id')
  @RequireRule({ action: Action.Update, subject: 'Role' })
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @RequireRule({ action: Action.Delete, subject: 'Role' })
  async remove(@Param('id') id: string) {
    await this.rolesService.remove(id);
    return { message: `Role ${id} deleted successfully` };
  }
}
