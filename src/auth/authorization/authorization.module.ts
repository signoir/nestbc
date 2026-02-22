import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AbilityFactory } from './casl/ability.factory';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { UserAttribute } from './entities/user-attribute.entity';
import { AuthorizationGuard } from './guards/authorization.guard';
import { AbilityGuard } from '../shared/guards/ability.guard';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission, UserAttribute]),
  ],
  providers: [
    AbilityFactory,
    AuthorizationGuard,
    AbilityGuard,
    RolesService,
    PermissionsService,
  ],
  controllers: [RolesController, PermissionsController],
  exports: [
    AbilityFactory,
    AuthorizationGuard,
    AbilityGuard,
    RolesService,
    PermissionsService,
    TypeOrmModule.forFeature([Role, Permission, UserAttribute]),
  ],
})
export class AuthorizationModule {}
