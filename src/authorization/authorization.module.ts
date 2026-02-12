import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AbilityFactory } from './casl/ability.factory';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { UserAttribute } from './entities/user-attribute.entity';
import { AuthorizationGuard } from './guards/authorization.guard';
import { AbilityGuard } from '../auth/guards/ability.guard';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission, UserAttribute]),
  ],
  providers: [AbilityFactory, AuthorizationGuard, AbilityGuard],
  exports: [AbilityFactory, AuthorizationGuard, AbilityGuard, TypeOrmModule],
})
export class AuthorizationModule {}