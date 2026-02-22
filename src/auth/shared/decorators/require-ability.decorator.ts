import { SetMetadata } from '@nestjs/common';

export interface RequiredAbility {
  action: string;
  subject: string;
}

export const REQUIRE_ABILITY = 'requireAbility';
export const RequireAbility = (...abilities: RequiredAbility[]) =>
  SetMetadata(REQUIRE_ABILITY, abilities);