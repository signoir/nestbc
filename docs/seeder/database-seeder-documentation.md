# Database Seeder Documentation

## Overview
This document provides comprehensive documentation for the database seeder implemented in the nestbc application. The seeder populates the database with initial roles, permissions, and a super user (administrator) with all permissions. This ensures the application has the necessary baseline data to function properly with the RBAC and ABAC system.

## Components

### 1. DatabaseSeeder
- **File**: `src/seeds/database.seeder.ts`
- **Purpose**: Seeds the database with initial roles and permissions
- **Methods**:
  - `seedRoles()`: Creates default roles in the database
  - `seedPermissions()`: Creates default permissions in the database

### 2. AdminUserSeeder
- **File**: `src/seeds/admin-user.seeder.ts`
- **Purpose**: Creates the initial super user with admin role
- **Methods**:
  - `seedAdminUser()`: Creates an admin user with all permissions and assigns the admin role

### 3. SeedCommand
- **File**: `src/seeds/seed.command.ts`
- **Purpose**: Provides CLI commands for running the seeders using nestjs-command
- **Commands**:
  - `seed:roles`: Seeds the database with default roles
  - `seed:permissions`: Seeds the database with default permissions
  - `seed:admin`: Seeds the database with admin user
  - `seed:all`: Seeds the database with all initial data (roles, permissions, and admin user)

### 4. SeederModule
- **File**: `src/seeds/seeder.module.ts`
- **Purpose**: Module that encapsulates the seeding functionality
- **Imports**: 
  - TypeORM features for Role and Permission entities
  - UsersModule
- **Providers**: DatabaseSeeder, AdminUserSeeder, SeedCommand

### 5. CLI Entrypoint
- **File**: `src/cli.ts`
- **Purpose**: Bootstrap file for running CLI commands with nestjs-command
- **Description**: Creates a NestJS application context and executes commands through the CommandModule

## Usage

### Running Seeders

#### Using npm/pnpm Scripts (Recommended)
```bash
# Seed roles only
pnpm run seed:roles

# Seed permissions only
pnpm run seed:permissions

# Seed admin user only
pnpm run seed:admin

# Seed all data (roles, permissions, and admin user)
pnpm run seed:all
```

#### Using nestjs-command Directly
```bash
# Seed all data
pnpm nest-command seed:all

# Or with npx
npx nest-command seed:all
```

#### Manual Seeding (Programmatic)
```typescript
import { DatabaseSeeder } from './seeds/database.seeder';
import { AdminUserSeeder } from './seeds/admin-user.seeder';

// In your application
const databaseSeeder = app.get(DatabaseSeeder);
const adminUserSeeder = app.get(AdminUserSeeder);

// Seed roles and permissions
await databaseSeeder.seedRoles();
await databaseSeeder.seedPermissions();

// Seed admin user
await adminUserSeeder.seedAdminUser();
```

## Seeding Process

### 1. Role Seeding
- Checks if roles already exist in the database to prevent duplicates
- Creates the following default roles:
  - `admin`: Administrator with full access
  - `user`: Regular user (default role)
  - `moderator`: Content moderator

### 2. Permission Seeding
- Checks if permissions already exist in the database to prevent duplicates
- Creates the following default permissions:
  - `manage` for `all`: Administrative permission (grants full access)
  - `read` for `User`: Read user permission
  - `update` for `User`: Update user permission
  - `create` for `Post`: Create post permission
  - `read` for `Post`: Read post permission
  - `update` for `Post`: Update post permission
  - `delete` for `Post`: Delete post permission

### 3. Admin User Seeding
- Checks if admin user already exists to prevent duplicates
- Creates an admin user with the following details:
  - Email: `admin@example.com`
  - Name: `Administrator`
  - Password: `SuperSecurePassword123!` (will be hashed)
  - Status: Active
- Assigns the `admin` role to the user
- Uses transactions to ensure data consistency

## Security Considerations

### 1. Password Security
- Admin user password is securely hashed using the UsersService
- Strong default password is used for initial admin account
- Password complexity requirements are enforced through class-validator

### 2. Role Assignment
- Admin user is assigned the `admin` role which grants all permissions
- Idempotency checks prevent duplicate admin user creation
- Role-based access control is properly enforced through CASL

### 3. Data Integrity
- Transactions are used to ensure data consistency during seeding
- Foreign key constraints are properly maintained
- Unique constraints prevent duplicate entries
- Rollback on errors to maintain database consistency

## Performance Optimizations

### 1. Idempotency Checks
- Each seeder checks for existing data before creating new records
- Prevents unnecessary database operations
- Allows safe re-execution of seeders without side effects

### 2. Batch Operations
- Database operations are performed sequentially with checks
- Reduces the number of individual database calls where possible
- Improves overall seeding performance

### 3. Connection Management
- Proper connection pooling is used through TypeORM
- Connections are released back to the pool after use via query runners
- Memory usage is optimized during seeding operations

## Error Handling

### 1. Database Errors
- Proper error handling for database connection issues
- Meaningful error messages for failed seeding operations
- Rollback transactions on seeding failures
- Console logging for debugging purposes

### 2. Validation Errors
- Input validation through class-validator in UsersService
- Proper error responses for invalid data
- Logging of validation failures

### 3. Business Logic Errors
- Checks for existing admin user before creation
- Verification of role existence before assignment to user
- Proper error handling for missing dependencies (e.g., admin role must exist before creating admin user)
- Throws descriptive errors for debugging

## Testing

### 1. Unit Tests
- Individual methods in seeders can be tested
- Mock repositories are used for database operations
- Edge cases and error scenarios are covered

### 2. Integration Tests
- Seeder integration with TypeORM is tested
- Real database operations are verified
- Transaction handling is validated

### 3. E2E Tests
- Complete seeding process is tested via CLI commands
- CLI command functionality is verified
- End-to-end data integrity is confirmed

## Configuration

### 1. Package.json Scripts
The following scripts are available in `package.json`:
```json
{
  "scripts": {
    "seed": "nestjs-command",
    "seed:roles": "nestjs-command seed:roles",
    "seed:permissions": "nestjs-command seed:permissions",
    "seed:admin": "nestjs-command seed:admin",
    "seed:all": "nestjs-command seed:all"
  }
}
```

### 2. Environment Variables
- Seeding can be enabled/disabled based on environment
- Admin credentials can be customized via environment variables (future enhancement)
- Database connection settings are configurable through `.env` file

### 3. Conditional Seeding
- Seeding can be run only in development environments
- Selective seeding (roles only, permissions only, etc.) is supported
- Dry-run mode for testing seeding without actual changes (future enhancement)

## Best Practices

### 1. Separation of Concerns
- Different seeders for different data types (roles, permissions, users)
- Clear separation between role, permission, and user seeding logic
- Modular design for easy maintenance and extension

### 2. Type Safety
- Proper TypeScript typing for all seeder methods
- TypeORM entity relationships are properly typed
- Input validation with class-validator in service layer

### 3. Logging
- Comprehensive logging of seeding operations via console
- Error logging for debugging purposes
- Audit trail for seeding activities through transaction logs

### 4. Idempotency
- All seeding operations are idempotent
- Safe to run multiple times without creating duplicates
- Checks for existing data before insertion

## Troubleshooting

### 1. Command Not Found Errors
**Issue**: `nestjs-command` is not recognized
**Solution**: 
- Ensure `nestjs-command` package is installed: `pnpm install nestjs-command`
- Use `pnpm run seed:all` instead of direct command
- Check that `cli.ts` file exists in `src/` directory

### 2. Duplicate Entry Errors
**Issue**: Duplicate key violation errors
**Solution**:
- Verify idempotency checks are working properly
- Check if data already exists in the database
- Ensure unique constraints are properly defined in entities

### 3. Missing Role Errors
**Issue**: Admin role not found when creating admin user
**Solution**:
- Run `pnpm run seed:roles` before `pnpm run seed:admin`
- Or use `pnpm run seed:all` to seed everything in order
- Check if admin role exists in the database

### 4. Permission Issues
**Issue**: Admin user doesn't have expected permissions
**Solution**:
- Verify permissions were seeded correctly
- Check role-permission assignments in the database
- Ensure CASL ability factory is properly configured

### 5. Database Connection Errors
**Issue**: Cannot connect to database during seeding
**Solution**:
- Verify database configuration in `.env` file
- Ensure database server is running
- Check database credentials and connection string

## CLI Entrypoint Details

### cli.ts File
The `src/cli.ts` file serves as the entrypoint for all CLI commands:

```typescript
import { NestFactory } from '@nestjs/core';
import { CommandModule, CommandService } from 'nestjs-command';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    await app
      .select(CommandModule)
      .get(CommandService)
      .exec();
    await app.close();
  } catch (error) {
    console.error(error);
    await app.close();
    process.exit(1);
  }
}

bootstrap();
```

**Key Points**:
- Creates a NestJS application context (not full HTTP server)
- Uses `CommandService.exec()` to run commands
- Proper error handling and cleanup
- Logger disabled for cleaner CLI output

## Future Enhancements

### 1. Additional Roles
- Support for more granular roles (editor, viewer, etc.)
- Role hierarchy implementation
- Role inheritance features

### 2. Advanced Permissions
- More sophisticated ABAC conditions
- Resource-based permissions
- Time-based access controls

### 3. Seeding Improvements
- Support for seeding from external JSON/YAML files
- Configuration-based seeding through environment variables
- Automated seeding on first deployment
- Dry-run mode for testing
- Seed versioning and migration

### 4. Custom Admin Credentials
- Environment variable-based admin email/password
- Secure password generation on first run
- Force password change on first login

## References

### 1. Related Documents
- RBAC and ABAC Implementation Plan
- Authorization Module Documentation
- CASL Ability Factory Documentation
- NestJS Command Package Documentation

### 2. Code Files
- `src/seeds/database.seeder.ts` - Role and permission seeding logic
- `src/seeds/admin-user.seeder.ts` - Admin user creation logic
- `src/seeds/seed.command.ts` - CLI command definitions
- `src/seeds/seeder.module.ts` - Seeder module configuration
- `src/cli.ts` - CLI entrypoint bootstrap file

### 3. External Resources
- [nestjs-command npm package](https://www.npmjs.com/package/nestjs-command)
- [yargs documentation](https://yargs.js.org/)
- [NestJS Application Context](https://docs.nestjs.com/standalone-applications)
