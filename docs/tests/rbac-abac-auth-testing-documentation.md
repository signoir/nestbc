# Testing Documentation for RBAC and ABAC Authentication System

## Overview
This document provides comprehensive testing documentation for the Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC) system implemented in the nestbc application. The testing strategy ensures the security and reliability of the authentication and authorization components.

## Table of Contents
1. [Unit Testing Strategy](#unit-testing-strategy)
2. [Integration Testing Strategy](#integration-testing-strategy)
3. [End-to-End Testing Strategy](#end-to-end-testing-strategy)
4. [Test Coverage Requirements](#test-coverage-requirements)
5. [Running Tests](#running-tests)
6. [Test Organization](#test-organization)
7. [Security Testing](#security-testing)
8. [Performance Testing](#performance-testing)

## Unit Testing Strategy

### 1. Ability Factory Testing
- **File**: `src/authorization/casl/ability.factory.spec.ts`
- **Purpose**: Test the CASL ability factory that combines RBAC and ABAC rules
- **Test Cases**:
  - Verify ability creation for users with different roles
  - Test permission inheritance from roles
  - Validate ABAC condition application
  - Check user-specific permissions (self-update, etc.)

```typescript
describe('AbilityFactory', () => {
  let abilityFactory: AbilityFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AbilityFactory],
    }).compile();

    abilityFactory = module.get<AbilityFactory>(AbilityFactory);
  });

  it('should create ability for admin user with manage-all permissions', async () => {
    const adminUser = new User({
      id: '1',
      roles: [new Role({ name: 'admin', permissions: [new Permission({ action: 'manage', subject: 'all' })] })],
    });

    const ability = await abilityFactory.createForUser(adminUser);
    expect(ability.can(Action.Manage, 'any')).toBeTruthy();
  });

  it('should create ability for regular user with limited permissions', async () => {
    const regularUser = new User({
      id: '2',
      roles: [new Role({ name: 'user', permissions: [new Permission({ action: 'read', subject: 'User' })] })],
    });

    const ability = await abilityFactory.createForUser(regularUser);
    expect(ability.can(Action.Read, 'User')).toBeTruthy();
    expect(ability.can(Action.Delete, 'User')).toBeFalsy();
  });

  it('should apply ABAC conditions correctly', async () => {
    const userWithAttributes = new User({
      id: '3',
      department: 'engineering',
      attributes: [new UserAttribute({ key: 'department', value: 'engineering' })],
    });

    const ability = await abilityFactory.createForUser(userWithAttributes);
    // Test attribute-based permissions
    expect(ability.can(Action.Read, 'Project', { department: 'engineering' })).toBeTruthy();
  });
});
```

### 2. Guard Testing
- **Files**: `src/auth/guards/*.spec.ts`, `src/authorization/guards/*.spec.ts`
- **Purpose**: Test authentication and authorization guards
- **Test Cases**:
  - JWT authentication guard with valid/invalid tokens
  - Authorization guard with sufficient/insufficient permissions
  - Combined guard functionality
  - Error handling in guards

```typescript
describe('AuthorizationGuard', () => {
  let guard: AuthorizationGuard;
  let mockReflector: any;
  let mockAbilityFactory: any;

  beforeEach(async () => {
    mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    mockAbilityFactory = {
      createForUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: AbilityFactory,
          useValue: mockAbilityFactory,
        },
      ],
    }).compile();

    guard = module.get<AuthorizationGuard>(AuthorizationGuard);
  });

  it('should allow access when user has required permissions', async () => {
    const mockAbility = {
      can: jest.fn(() => true),
    };

    mockAbilityFactory.createForUser.mockResolvedValue(mockAbility);
    mockReflector.getAllAndOverride.mockReturnValue([{ action: Action.Read, subject: 'User' }]);

    const context = createMockExecutionContext();
    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBeTruthy();
  });

  it('should deny access when user lacks required permissions', async () => {
    const mockAbility = {
      can: jest.fn(() => false),
    };

    mockAbilityFactory.createForUser.mockResolvedValue(mockAbility);
    mockReflector.getAllAndOverride.mockReturnValue([{ action: Action.Delete, subject: 'User' }]);

    const context = createMockExecutionContext();
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
```

### 3. Service Testing
- **File**: `src/users/users.service.spec.ts`
- **Purpose**: Test user service with authorization integration
- **Test Cases**:
  - User creation with validation
  - User retrieval with authorization checks
  - User updates with permission validation
  - User deletion with authorization verification
  - Active user retrieval with permissions

```typescript
describe('UsersService', () => {
  let service: UsersService;
  let mockUserRepository: any;
  let mockAbility: any;

  beforeEach(async () => {
    mockUserRepository = {
      findOneBy: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockAbility = {
      can: jest.fn(() => true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should create a user when valid data is provided', async () => {
    const userData = { email: 'test@example.com', name: 'Test User', password: 'SecurePassword123!' };
    const createdUser = { id: '1', ...userData };

    mockUserRepository.create.mockReturnValue(createdUser);
    mockUserRepository.save.mockResolvedValue(createdUser);

    const result = await service.createUser(userData);
    expect(result).toEqual(createdUser);
    expect(mockUserRepository.create).toHaveBeenCalledWith(userData);
  });

  it('should check authorization when retrieving user', async () => {
    const user = { id: '1', email: 'test@example.com', name: 'Test User' };
    mockUserRepository.findOneBy.mockResolvedValue(user);

    const result = await service.findOne('1', mockAbility, user);
    expect(result).toEqual(user);
    expect(mockAbility.can).toHaveBeenCalledWith(Action.Read, 'User');
  });
});
```

### 4. Decorator Testing
- **Files**: `src/auth/decorators/*.spec.ts`
- **Purpose**: Test custom decorators functionality
- **Test Cases**:
  - CurrentUser decorator with authenticated user
  - RequireRule decorator with different permission requirements
  - Public decorator functionality

## Integration Testing Strategy

### 1. Module Integration Tests
- **Files**: `test/integration/**/*.integration-spec.ts`
- **Purpose**: Test module-to-module interactions
- **Test Cases**:
  - Authorization module integration with users module
  - Authentication service integration with authorization service
  - Database transaction integration with authorization checks

```typescript
describe('UsersModule Integration', () => {
  let app: INestApplication;
  let usersService: UsersService;
  let abilityFactory: AbilityFactory;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UsersModule, AuthorizationModule, DatabaseModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    usersService = moduleFixture.get<UsersService>(UsersService);
    abilityFactory = moduleFixture.get<AbilityFactory>(AbilityFactory);

    await app.init();
  });

  it('should properly integrate authorization with user operations', async () => {
    const user = { id: '1', email: 'integration@example.com', name: 'Integration User' };
    const ability = await abilityFactory.createForUser(user);

    // Test service integration with authorization
    const result = await usersService.findOne('1', ability, user);
    expect(result).toBeDefined();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
```

### 2. Database Integration Tests
- **Files**: `test/database/**/*.db-spec.ts`
- **Purpose**: Test database operations with authorization
- **Test Cases**:
  - Transaction management with authorization checks
  - Role-permission relationship queries
  - User-role assignments persistence
  - Attribute-based queries

### 3. Authentication-Authorization Flow Tests
- **Files**: `test/auth-flow/**/*.flow-spec.ts`
- **Purpose**: Test complete authentication and authorization flows
- **Test Cases**:
  - Login followed by authorized operations
  - Token validation with permission checks
  - Session management with authorization

## End-to-End Testing Strategy

### 1. API Endpoint Tests
- **Files**: `test/e2e/**/*.e2e-spec.ts`
- **Purpose**: Test complete API request-response cycles
- **Test Cases**:
  - User registration with role assignment
  - Login and JWT token generation
  - Authorized resource access
  - Permission denial scenarios
  - Error handling and response formatting

```typescript
describe('UsersController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(AbilityFactory)
    .useValue(mockAbilityFactory)
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/users (POST) should create a new user', async () => {
    const createUserDto = {
      email: 'e2e-test@example.com',
      name: 'E2E Test User',
      password: 'SecurePassword123!'
    };

    return request(app.getHttpServer())
      .post('/users')
      .send(createUserDto)
      .expect(201)
      .then(response => {
        expect(response.body).toBeDefined();
        expect(response.body.id).toBeDefined();
        expect(response.body.email).toBe(createUserDto.email);
      });
  });

  it('/users/:id (GET) should return user with proper authorization', async () => {
    // Test with authenticated user who has read permissions
    return request(app.getHttpServer())
      .get('/users/1')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200)
      .then(response => {
        expect(response.body).toBeDefined();
        expect(response.body.id).toBe('1');
      });
  });

  it('/users/:id (GET) should deny access without proper authorization', async () => {
    // Test with authenticated user who lacks read permissions
    return request(app.getHttpServer())
      .get('/users/1')
      .set('Authorization', `Bearer ${validTokenWithoutPermissions}`)
      .expect(403);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
```

### 2. Security Boundary Tests
- **Purpose**: Test security boundaries and edge cases
- **Test Cases**:
  - Authentication bypass attempts
  - Authorization escalation
  - Cross-user data access
  - Privilege escalation scenarios

### 3. Performance and Load Tests
- **Purpose**: Test system performance under load
- **Test Cases**:
  - Concurrent authentication requests
  - Authorization checks under high load
  - Database connection pooling
  - Memory usage under sustained load

## Test Coverage Requirements

### 1. Minimum Coverage Thresholds
- **Unit Tests**: 90%+ coverage for business logic
- **Integration Tests**: 85%+ coverage for module interactions
- **E2E Tests**: 80%+ coverage for critical user journeys

### 2. Critical Path Coverage
- Authentication and authorization flows
- Permission validation logic
- Database transaction handling
- Error handling and security responses

### 3. Security Test Coverage
- All authentication failure scenarios
- All authorization denial cases
- Input validation for all endpoints
- SQL injection and XSS prevention

## Running Tests

### 1. Unit Tests
```bash
# Run all unit tests
pnpm run test

# Run specific unit test file
pnpm run test -- src/authorization/casl/ability.factory.spec.ts

# Run unit tests with coverage
pnpm run test:cov
```

### 2. Integration Tests
```bash
# Run integration tests
pnpm run test:integration

# Run specific integration test
pnpm run test -- test/integration/users-module.integration-spec.ts
```

### 3. End-to-End Tests
```bash
# Run E2E tests
pnpm run test:e2e

# Run specific E2E test
pnpm run test -- test/e2e/users.e2e-spec.ts
```

### 4. Complete Test Suite
```bash
# Run all tests (unit + integration + E2E)
pnpm run test:all
```

## Test Organization

### 1. Directory Structure
```
test/
├── unit/
│   ├── auth/
│   │   ├── guards/
│   │   └── decorators/
│   ├── authorization/
│   │   ├── casl/
│   │   └── guards/
│   └── users/
│       └── services/
├── integration/
│   ├── auth/
│   ├── authorization/
│   └── database/
└── e2e/
    ├── auth/
    ├── users/
    └── health/
```

### 2. Naming Convention
- Unit tests: `*.spec.ts`
- Integration tests: `*.integration-spec.ts`
- E2E tests: `*.e2e-spec.ts`
- Database tests: `*.db-spec.ts`

### 3. Test Structure
Each test file follows the AAA pattern (Arrange, Act, Assert):
- Arrange: Set up test data and mocks
- Act: Execute the functionality being tested
- Assert: Verify the expected outcomes

## Security Testing

### 1. Authentication Tests
- JWT token validation
- Token expiration handling
- Invalid token rejection
- User status verification

### 2. Authorization Tests
- Role-based permission checks
- Attribute-based permission checks
- Permission inheritance validation
- Access denial scenarios

### 3. Vulnerability Tests
- SQL injection prevention
- Input validation bypass attempts
- Session hijacking prevention
- Cross-site request forgery protection

## Performance Testing

### 1. Authorization Performance
- Ability calculation time
- Permission lookup efficiency
- Database query optimization
- Memory usage during authorization

### 2. Authentication Performance
- JWT token generation and validation speed
- Password hashing performance
- Database connection efficiency
- Concurrent authentication handling

### 3. Load Testing
- Authentication throughput under load
- Authorization latency under concurrent requests
- Database connection pooling effectiveness
- Memory leak detection during sustained operations

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use fresh test data for each test
- Clean up resources after each test
- Mock external dependencies consistently

### 2. Test Clarity
- Use descriptive test names
- Follow consistent test structure
- Document test scenarios clearly
- Include expected behavior in comments

### 3. Security Focus
- Test both positive and negative cases
- Verify proper error responses
- Test boundary conditions
- Include security-specific test cases

### 4. Maintainability
- Keep tests readable and maintainable
- Update tests when functionality changes
- Use shared test utilities where appropriate
- Follow consistent testing patterns