import { Module, Global } from '@nestjs/common';
import { AuthenticationModule } from './authentication/auth.module';
import { AuthorizationModule } from './authorization/authorization.module';

@Global()
@Module({
  imports: [AuthenticationModule, AuthorizationModule],
  exports: [AuthenticationModule, AuthorizationModule],
})
export class AuthModule {}
