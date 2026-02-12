import { Ability, AbilityBuilder, AbilityClass, ExtractSubjectType, InferSubjects } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Action } from './actions.enum';
import { User } from '../../users/user.entity';
import { Permission } from '../entities/permission.entity';

type Subjects = InferSubjects<typeof User | 'all'> | string;

export type AppAbility = Ability<[Action, Subjects]>;

@Injectable()
export class AbilityFactory {
  async createForUser(user: User): Promise<AppAbility> {
    const { can, cannot, build } = new AbilityBuilder<Ability<[Action, Subjects]>>(
      Ability as AbilityClass<AppAbility>
    );

    // Apply permissions based on user's roles
    if (user.roles) {
      for (const role of user.roles) {
        if (role.permissions) {
          for (const permission of role.permissions) {
            if (permission.inverted) {
              cannot(permission.action as Action, permission.subject);
            } else {
              if (permission.conditions) {
                // Apply ABAC conditions
                can(permission.action as Action, permission.subject, permission.conditions);
              } else {
                // Apply RBAC permissions
                can(permission.action as Action, permission.subject);
              }
            }
          }
        }
      }
    }

    // Add user-specific ABAC rules
    // Users can update their own profile
    can(Action.Update, 'User', { id: user.id });
    
    // Users can read their own profile
    can(Action.Read, 'User', { id: user.id });

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}