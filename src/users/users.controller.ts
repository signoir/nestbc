import { Controller, Get, Post, Put, Delete, Body, Param, UsePipes, ValidationPipe, UseGuards, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthorizationGuard } from '../authorization/guards/authorization.guard';
import { RequireRule } from '../auth/decorators/require-rule.decorator';
import { Action } from '../authorization/casl/actions.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AppAbility } from '../authorization/casl/ability.factory';
import { AbilityGuard } from '../auth/guards/ability.guard';
import { RequireAbility } from '../auth/decorators/require-ability.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @RequireRule({ action: Action.Create, subject: 'User' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async createUser(@Body() createUserDto: Partial<User>) {
    return this.usersService.createUser(createUserDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @RequireRule({ action: Action.Read, subject: 'User' })
  async getUser(
    @Param('id') id: string,
    @CurrentUser() user?: User,
  ) {
    // Get the ability from the request (would be added by the AuthorizationGuard)
    const ability = (user as any)?.ability || undefined;
    return this.usersService.findOne(id, ability, user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @RequireRule({ action: Action.Update, subject: 'User' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: Partial<User>,
    @CurrentUser() user?: User,
  ) {
    // Get the ability from the request (would be added by the AuthorizationGuard)
    const ability = (user as any)?.ability || undefined;
    return this.usersService.update(id, updateUserDto, ability, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @RequireRule({ action: Action.Delete, subject: 'User' })
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() user?: User,
  ) {
    // Get the ability from the request (would be added by the AuthorizationGuard)
    const ability = (user as any)?.ability || undefined;
    return this.usersService.delete(id, ability, user);
  }

  @Get('active')
  @UseGuards(JwtAuthGuard, AbilityGuard)
  @RequireAbility({ action: 'read', subject: 'User' })
  async getActiveUsers(
    @CurrentUser() user?: User,
  ) {
    // Get the ability from the request (would be added by the AbilityGuard)
    const ability = (user as any)?.ability || undefined;
    return this.usersService.findActiveUsers(ability);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @RequireRule({ action: Action.Read, subject: 'User' })
  async getAllUsers(
    @CurrentUser() user?: User,
  ) {
    // Get the ability from the request (would be added by the AuthorizationGuard)
    const ability = (user as any)?.ability || undefined;
    return this.usersService.findAll(ability);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard) // Only requires authentication, not specific permissions
  async getProfile(@CurrentUser() user: User) {
    // Return user's own profile
    return user;
  }
}