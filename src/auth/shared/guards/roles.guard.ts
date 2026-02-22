import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export interface Role {
  name: string;
  permissions?: string[];
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => {
  // Create role objects with name and permissions
  const roleObjects: Role[] = roles.map(roleName => ({
    name: roleName,
    permissions: [] // Define permissions based on role if needed
  }));
  
  return (target: any) => {
    Reflect.defineMetadata(ROLES_KEY, roleObjects, target);
  };
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    
    // Check if user has any of the required roles
    return requiredRoles.some(role => 
      user.roles?.some(userRole => userRole.name === role.name)
    );
  }
}