import { Controller, Get, Post, Put, Delete, Body, Param, UsePipes, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async createUser(@Body() createUserDto: Partial<User>) {
    return this.usersService.createUser(createUserDto);
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async updateUser(@Param('id') id: string, @Body() updateUserDto: Partial<User>) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.usersService.delete(id);
  }

  @Get('active')
  async getActiveUsers() {
    return this.usersService.findActiveUsers();
  }

  @Get('profile')
  // Only requires authentication, not specific permissions
  async getProfile() {
    // This would typically use @CurrentUser decorator to get the authenticated user
    return { message: 'User profile endpoint' };
  }

  @Get('public')
  // Public endpoint that skips authentication
  async getPublicInfo() {
    // Implementation for public information
    return { message: 'This is public information' };
  }
}