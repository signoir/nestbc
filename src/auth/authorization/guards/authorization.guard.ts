import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AbilityFactory } from '../casl/ability.factory';
import { ForbiddenError } from '@casl/ability';
import { Action } from '../casl/actions.enum';

export interface RequiredRule {
  action: Action;
  subject: string;
}

export const REQUIRE_RULE = 'require-rule';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private abilityFactory: AbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRules = this.reflector.getAllAndOverride<RequiredRule[]>(
      REQUIRE_RULE,
      [context.getHandler(), context.getClass()],
    ) || [];

    if (!requiredRules.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const ability = await this.abilityFactory.createForUser(user);

    try {
      requiredRules.forEach((rule) =>
        ForbiddenError.from(ability).throwUnlessCan(rule.action, rule.subject),
      );
      return true;
    } catch (error) {
      if (error instanceof ForbiddenError) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }
  }
}