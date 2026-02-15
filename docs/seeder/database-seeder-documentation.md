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
  - `seedAdminUser()`: Creates an admin user with all permissions

### 3. SeedCommand
- **File**: `src/seeds/seed.command.ts`
- **Purpose**: Provides CLI commands for running the seeders
- **Commands**:
  - `seed:roles`: Seeds the database with default roles
  - `seed:permissions`: Seeds the database with default permissions
  - `seed:admin`: Seeds the database with admin user
  - `seed:all`: Seeds the database with all initial data (roles, permissions, and admin user)

### 4. SeederModule
- **File**: `src/seeds/seeder.module.ts`
- **Purpose**: Module that encapsulates the seeding functionality
- **Imports**: TypeORM features for Role and Permission entities, UsersModule
- **Providers**: DatabaseSeeder, AdminUserSeeder, SeedCommand

## Usage

### Running Seeders

#### Using CLI Commands
```bash
# Seed roles only
pnpm nest-command seed:roles

# Seed permissions only
pnpm nest-command seed:permissions

# Seed admin user only
pnpm nest-command seed:admin

# Seed all data (roles, permissions, and admin user)
pnpm nest-command seed:all
```

#### Manual Seeding
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
  - `manage` for `all`: Administrative permission
  - `read` for `User`: Read user permission
  - `update` for `User`: Update user permission
  - `create` for `Post`: Create post permission
  - `read` for `Post`: Read post permission
  - `update` for `Post`: Update post permission
  - `delete` for `Post`: Delete post permission

### 3. Admin User Seeding
- Checks if admin user already exists to prevent duplicates
- Creates an admin user with email `admin@example.com`
- Assigns the `admin` role to the user
- Sets a strong default password

## Security Considerations

### 1. Password Security
- Admin user password is securely hashed using bcrypt
- Strong default password is used for initial admin account
- Password complexity requirements are enforced

### 2. Role Assignment
- Admin user is assigned the `admin` role which grants all permissions
- Idempotency checks prevent duplicate admin user creation
- Role-based access control is properly enforced

### 3. Data Integrity
- Transactions are used to ensure data consistency during seeding
- Foreign key constraints are properly maintained
- Unique constraints prevent duplicate entries

## Performance Optimizations

### 1. Idempotency Checks
- Each seeder checks for existing data before creating new records
- Prevents unnecessary database operations
- Allows safe re-execution of seeders

### 2. Batch Operations
- Where possible, database operations are batched for efficiency
- Reduces the number of individual database calls
- Improves overall seeding performance

### 3. Connection Management
- Proper connection pooling is used for database operations
- Connections are released back to the pool after use
- Memory usage is optimized during seeding

## Error Handling

### 1. Database Errors
- Proper error handling for database connection issues
- Meaningful error messages for failed seeding operations
- Rollback transactions on seeding failures

### 2. Validation Errors
- Input validation for seeding parameters
- Proper error responses for invalid data
- Logging of validation failures

### 3. Business Logic Errors
- Checks for existing admin user before creation
- Verification of role existence before assignment
- Proper error handling for missing dependencies

## Testing

### 1. Unit Tests
- Individual methods in seeders are tested
- Mock repositories are used for database operations
- Edge cases and error scenarios are covered

### 2. Integration Tests
- Seeder integration with TypeORM is tested
- Real database operations are verified
- Transaction handling is validated

### 3. E2E Tests
- Complete seeding process is tested
- CLI command functionality is verified
- End-to-end data integrity is confirmed

## Configuration

### 1. Environment Variables
- Seeding can be enabled/disabled based on environment
- Admin credentials can be customized via environment variables
- Database connection settings are configurable

### 2. Conditional Seeding
- Seeding can be run only in development environments
- Selective seeding (roles only, permissions only, etc.) is supported
- Dry-run mode for testing seeding without actual changes

## Best Practices

### 1. Separation of Concerns
- Different seeders for different data types
- Clear separation between role, permission, and user seeding
- Modular design for easy maintenance

### 2. Type Safety
- Proper TypeScript typing for all seeder methods
- TypeORM entity relationships are properly typed
- Input validation with class-validator

### 3. Logging
- Comprehensive logging of seeding operations
- Error logging for debugging purposes
- Audit trail for seeding activities

## Troubleshooting

### 1. Duplicate Entry Errors
- Verify idempotency checks are working properly
- Check if data already exists in the database
- Ensure unique constraints are properly defined

### 2. Missing Role Errors
- Verify roles are seeded before permissions
- Check if admin role exists before assigning to user
- Ensure proper foreign key relationships

### 3. Permission Issues
- Verify admin user has all required permissions
- Check role-permission assignments
- Ensure ABAC conditions are properly set

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
- Support for seeding from external files
- Configuration-based seeding
- Automated seeding on first deployment

## References

### 1. Related Documents
- RBAC and ABAC Implementation Plan
- Authorization Module Documentation
- CASL Ability Factory Documentation

### 2. Code Files
- `src/seeds/database.seeder.ts`
- `src/seeds/admin-user.seeder.ts`
- `src/seeds/seed.command.ts`
- `src/seeds/seeder.module.ts`