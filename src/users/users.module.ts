import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { AbstractUserService } from './services/abstract-user.service';
import { UserServiceV1 } from './services/user.service.v1';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [
    // Provide UserServiceV1 for V1 controller
    {
      provide: 'USER_SERVICE_V1',
      useClass: UserServiceV1,
    },
    // Keep existing UsersService for backward compatibility
    UsersService,
  ],
  controllers: [UsersController],
  exports: [
    'USER_SERVICE_V1',
    UsersService,
    TypeOrmModule.forFeature([User]),
  ],
})
export class UsersModule {}
