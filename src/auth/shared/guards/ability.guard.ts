import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AbilityFactory } from '../../authorization/casl/ability.factory';
import { ForbiddenError } from '@casl/ability';
import { Action } from '../../authorization/casl/actions.enum';

@Injectable()
export class AbilityGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private abilityFactory: AbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required abilities from the handler or class
    const requiredAbilities = this.reflector.getAllAndOverride<{ action: string; subject: string }[]>(
      'requireAbility',
      [context.getHandler(), context.getClass()],
    );
    
    if (!requiredAbilities || requiredAbilities.length === 0) {
      return true; // No specific abilities required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false; // User not authenticated
    }

    const ability = await this.abilityFactory.createForUser(user);

    // Check if user has all required abilities
    for (const req of requiredAbilities) {
      try {
        // Convert string action to Action enum
        const actionEnum = Action[req.action as keyof typeof Action] || req.action as Action;
        ForbiddenError.from(ability).throwUnlessCan(actionEnum, req.subject);
      } catch (error) {
        if (error instanceof ForbiddenError) {
          throw new ForbiddenException(error.message);
        }
        throw error;
      }
    }

    return true;
  }
}