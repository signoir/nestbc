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

    // Users can delete their own account (with additional checks)
    can(Action.Delete, 'User', { id: user.id });

    // Add conditional permissions based on user attributes
    if (user.attributes) {
      for (const attribute of user.attributes) {
        if (attribute.attributeKey === 'department' && attribute.attributeValue === 'admin') {
          // Admin department users can manage all users
          can(Action.Manage, 'User');
        }
        
        if (attribute.attributeKey === 'subscription' && attribute.attributeValue === 'premium') {
          // Premium users get additional permissions
          can(Action.Read, 'PremiumContent');
        }
      }
    }

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}