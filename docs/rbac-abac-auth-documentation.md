# RBAC and ABAC Authentication System Documentation

## Overview
This document provides comprehensive documentation for the Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC) system implemented in the nestbc application. The system uses CASL for policy definition and enforcement, Passport for authentication, and PostgreSQL for storing permissions and roles.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Authorization Implementation](#authorization-implementation)
4. [Authentication Implementation](#authentication-implementation)
5. [Guard and Decorator Usage](#guard-and-decorator-usage)
6. [Service Layer Authorization](#service-layer-authorization)
7. [Controller Implementation](#controller-implementation)
8. [Security Considerations](#security-considerations)
9. [Performance Optimizations](#performance-optimizations)
10. [Testing Strategy](#testing-strategy)
11. [Best Practices](#best-practices)

## Architecture Overview

### Core Components
- **Authentication**: JWT-based authentication using Passport
- **Authorization**: CASL-based authorization combining RBAC and ABAC
- **Database**: PostgreSQL with TypeORM for entity management
- **Entities**: Users, Roles, Permissions, Attributes

### Module Structure
```
src/
├── auth/                 # Authentication components
│   ├── guards/           # Authentication guards
│   ├── decorators/       # Authentication decorators
│   └── strategies/       # Passport strategies
├── authorization/        # Authorization components
│   ├── casl/             # CASL ability factory and actions
│   ├── guards/           # Authorization guards
│   ├── entities/         # Authorization-related entities
│   └── modules/          # Authorization module
├── users/                # User management
│   ├── user.entity.ts    # User entity with roles and attributes
│   ├── users.service.ts  # User service with authorization
│   └── users.controller.ts # User controller with guards
```

## Database Schema

### User Entity
The User entity has been enhanced to support RBAC and ABAC:

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column()
  @Exclude()  // Password is excluded from responses
  passwordHash: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToMany(() => Role, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @OneToMany(() => UserAttribute, (attribute) => attribute.user)
  attributes: UserAttribute[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Authorization Entities
- **Role**: Defines roles with associated permissions
- **Permission**: Defines actions and subjects for authorization
- **UserAttribute**: Stores user-specific attributes for ABAC
- **ResourceAttribute**: Stores resource-specific attributes for ABAC

## Authorization Implementation

### CASL Ability Factory
The `AbilityFactory` creates user-specific abilities combining both RBAC and ABAC rules:

```typescript
@Injectable()
export class AbilityFactory {
  async createForUser(user: User): Promise<AppAbility> {
    const { can, cannot, build } = new AbilityBuilder<Ability<[Action, Subjects]>>(
      Ability as AbilityClass<AppAbility>
    );

    // Apply permissions based on user's roles (RBAC)
    for (const role of user.roles) {
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

    // Add user-specific ABAC rules
    // Users can update their own profile
    can(Action.Update, 'User', { id: user.id });

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
```

### Actions Enum
Defines the available actions for authorization:

```typescript
export enum Action {
  Manage = 'manage',  // Wildcard permission
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}
```

## Authentication Implementation

### JWT Authentication
- Uses Passport with JWT strategy
- Validates user existence and active status
- Attaches user object to request for authorization

### JWT Auth Guard
The `JwtAuthGuard` validates JWT tokens and ensures users are active:

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Call super.canActivate to authenticate the request
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user || !user.isActive) {
      throw err || new UnauthorizedException('User is not active');
    }
    return user;
  }
}
```

## Guard and Decorator Usage

### Authorization Guard
The `AuthorizationGuard` checks if users have required permissions:

```typescript
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

    const { user } = context.switchToHttp().getRequest();
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
```

### Decorators
- `@RequireRule`: Specifies required permissions for endpoints
- `@CurrentUser`: Retrieves current authenticated user
- `@Public`: Marks endpoints as publicly accessible

## Service Layer Authorization

### Authorization Checks in Services
Authorization is enforced at the service layer to prevent data leaks:

```typescript
async findOne(id: string, ability?: AppAbility, currentUser?: User): Promise<User> {
  // If no ability is provided, just return the user (for internal use)
  if (!ability) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  // Check if user can read this specific user
  if (currentUser && currentUser.id === id) {
    // Users can always read their own profile
    if (ability.can(Action.Read, 'User')) {
      const user = await this.usersRepository.findOneBy({ id });
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return user;
    }
  }

  // For other users, check if they have general read permission
  if (ability.can(Action.Read, 'User')) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  throw new ForbiddenException(`Insufficient permissions to read user ${id}`);
}
```

## Controller Implementation

### Secured Endpoints
Controllers use both authentication and authorization guards:

```typescript
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @RequireRule({ action: Action.Create, subject: 'User' })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @RequireRule({ action: Action.Read, subject: 'User' })
  async getUser(
    @Param('id') id: string,
    @CurrentUser() user?: User,
  ) {
    // Get the ability from the request (would be added by the AuthorizationGuard)
    const ability = (user as any).ability || undefined;
    return this.usersService.findOne(id, ability, user);
  }
}
```

## Security Considerations

### Input Validation
- All inputs are validated using class-validator
- Whitelist validation prevents overposting
- Strong password requirements enforced

### Authentication Security
- JWT tokens with proper expiration
- User status verification (active/inactive)
- Secure password hashing (conceptually implemented)

### Authorization Security
- Multi-layered authorization (controller and service)
- Service-layer filtering to prevent data leaks
- Proper error handling with descriptive messages
- Idempotency checks to prevent duplicate operations

### Database Security
- Transaction management for data consistency
- Parameterized queries to prevent SQL injection
- Proper isolation levels

## Performance Optimizations

### Caching Strategies
- Planned caching for abilities and permissions
- Redis integration for distributed caching
- Efficient permission lookup algorithms

### Database Optimization
- Proper indexing on frequently queried fields
- Optimized queries with eager loading
- Connection pooling for database operations

### Memory Management
- Proper resource cleanup
- Efficient object creation and destruction
- Connection management with TypeORM

## Testing Strategy

### Unit Tests
- Ability factory unit tests
- Guard functionality tests
- Service method authorization tests
- Entity validation tests

### Integration Tests
- Module integration tests
- Database transaction tests
- Authorization flow tests

### End-to-End Tests
- API endpoint functionality
- Authentication and authorization flow
- Error handling verification

## Best Practices

### SOLID Principles
- Single Responsibility Principle: Each class has one reason to change
- Open/Closed Principle: Modules are open for extension but closed for modification
- Liskov Substitution Principle: Proper inheritance hierarchies
- Interface Segregation Principle: Well-defined interfaces
- Dependency Inversion Principle: Abstractions over concrete implementations

### NestJS Best Practices
- Proper module organization
- Dependency injection patterns
- Clean architecture principles
- Consistent error handling

### Security Best Practices
- Defense in depth: Multiple layers of security controls
- Least privilege: Users only get necessary permissions
- Fail securely: Default deny approach for authorization
- Secure defaults: Safe configuration settings

## Usage Examples

### Creating a User
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "name": "New User",
    "password": "SecurePassword123!"
  }'
```

### Retrieving Users
```bash
curl -X GET http://localhost:3000/users/active \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Protected Endpoint with Authorization
```typescript
@Get(':id')
@UseGuards(JwtAuthGuard, AuthorizationGuard)
@RequireRule({ action: Action.Read, subject: 'User' })
async getUser(@Param('id') id: string) {
  return this.usersService.findOne(id);
}
```

## Error Handling

### Common Error Responses
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Authentication failures
- `403 Forbidden`: Authorization failures
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Unexpected server errors

### Error Format
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions to read user 123",
  "error": "Forbidden"
}
```

## Future Enhancements

### Planned Features
- Permission caching with Redis
- Advanced ABAC condition support
- Audit logging for authorization decisions
- Role inheritance system
- Permission delegation capabilities

### Performance Improvements
- Database query optimization
- Efficient permission indexing
- Batch authorization operations