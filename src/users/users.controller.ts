import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
  UseGuards,
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
import { UsersService } from './users.service';
import { User } from './user.entity';
import { JwtAuthGuard } from '../auth/shared/guards/jwt-auth.guard';
import { AuthorizationGuard } from '../auth/authorization/guards/authorization.guard';
import { RequireRule } from '../auth/shared/decorators/require-rule.decorator';
import { Action } from '../auth/authorization/casl/actions.enum';
import { CurrentUser } from '../auth/shared/decorators/current-user.decorator';
import { AppAbility } from '../auth/authorization/casl/ability.factory';
import { AbilityGuard } from '../auth/shared/guards/ability.guard';
import { RequireAbility } from '../auth/shared/decorators/require-ability.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@ApiBearerAuth('JWT')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @RequireRule({ action: Action.Create, subject: 'User' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: User,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation error',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions to create user',
  })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Get('active')
  @UseGuards(JwtAuthGuard, AbilityGuard)
  @RequireAbility({ action: 'read', subject: 'User' })
  @ApiOperation({ summary: 'Get all active users' })
  @ApiResponse({
    status: 200,
    description: 'List of active users',
    type: [User],
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async getActiveUsers(@CurrentUser() user?: User) {
    const ability = (user as any)?.ability || undefined;
    return this.usersService.findActiveUsers(ability);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Current user profile',
    type: User,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  async getProfile(@CurrentUser() user: User) {
    return user;
  }

  @Get()
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @RequireRule({ action: Action.Read, subject: 'User' })
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'List of all users',
    type: [User],
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions to read users',
  })
  async getAllUsers(@CurrentUser() user?: User) {
    const ability = (user as any)?.ability || undefined;
    return this.usersService.findAll(ability);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @RequireRule({ action: Action.Read, subject: 'User' })
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({
    status: 200,
    description: 'User details',
    type: User,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions to read user',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - User not found',
  })
  async getUser(@Param('id') id: string, @CurrentUser() user?: User) {
    const ability = (user as any)?.ability || undefined;
    return this.usersService.findOne(id, ability, user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @RequireRule({ action: Action.Update, subject: 'User' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: User,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation error',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions to update user',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - User not found',
  })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user?: User,
  ) {
    const ability = (user as any)?.ability || undefined;
    return this.usersService.update(id, updateUserDto, ability, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @RequireRule({ action: Action.Delete, subject: 'User' })
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    schema: { example: { message: 'User deleted successfully' } },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions to delete user',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - User not found',
  })
  async deleteUser(@Param('id') id: string, @CurrentUser() user?: User) {
    const ability = (user as any)?.ability || undefined;
    return this.usersService.delete(id, ability, user);
  }
}
