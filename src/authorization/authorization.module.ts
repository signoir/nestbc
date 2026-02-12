import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AbilityFactory } from './casl/ability.factory';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { UserAttribute } from './entities/user-attribute.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission, UserAttribute]),
  ],
  providers: [AbilityFactory],
  exports: [AbilityFactory, TypeOrmModule],
})
export class AuthorizationModule {}