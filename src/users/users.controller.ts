import { Controller, Post, Get, Body, ValidationPipe } from '@nestjs/common';
import { UsersService, CreateUserDto } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Get('active')
  async getActiveUsers() {
    return this.usersService.findActiveUsers();
  }
}