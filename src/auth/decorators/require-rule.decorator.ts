import { SetMetadata } from '@nestjs/common';
import { Action } from '../../authorization/casl/actions.enum';

export interface RequiredRule {
  action: Action;
  subject: string;
}

export const REQUIRE_RULE = 'require-rule';
export const RequireRule = (...rules: RequiredRule[]) =>
  SetMetadata(REQUIRE_RULE, rules);