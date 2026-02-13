import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { UsersService } from '../../src/users/users.service';
import { User } from '../../src/users/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { AuthorizationGuard } from '../../src/authorization/guards/authorization.guard';
import { Reflector } from '@nestjs/core';
import { AbilityFactory } from '../../src/authorization/casl/ability.factory';
import * as request from 'supertest';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let mockUsersService: any;

  beforeAll(async () => {
    // Create mock implementations for all dependencies
    const mockUserRepository = {
      findOneBy: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      })),
    };

    const mockDataSource = {
      createQueryRunner: jest.fn(() => ({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        manager: {
          findOne: jest.fn(),
          create: jest.fn(),
          save: jest.fn(),
        },
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      })),
    };

    const mockAbility = {
      can: jest.fn(() => true), // Default to allowing all actions for testing
    };

    const mockAbilityFactory = {
      createForUser: jest.fn().mockResolvedValue(mockAbility),
    };

    const mockJwtAuthGuard = {
      canActivate: jest.fn(() => true), // Allow all requests for testing
    };

    const mockAuthorizationGuard = {
      canActivate: jest.fn(() => true), // Allow all requests for testing
    };

    const mockReflector = {
      getAllAndOverride: jest.fn(() => []), // Return empty array for required rules
    };

    mockUsersService = {
      createUser: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findActiveUsers: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(getRepositoryToken(User))
    .useValue(mockUserRepository)
    .overrideProvider(DataSource)
    .useValue(mockDataSource)
    .overrideProvider(AbilityFactory)
    .useValue(mockAbilityFactory)
    .overrideProvider(JwtAuthGuard)
    .useValue(mockJwtAuthGuard)
    .overrideProvider(AuthorizationGuard)
    .useValue(mockAuthorizationGuard)
    .overrideProvider(Reflector)
    .useValue(mockReflector)
    .overrideProvider(UsersService)
    .useValue(mockUsersService)
    .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await app.init();
  }, 30000); // Increase timeout for setup

  it('/users (POST) should create a new user', async () => {
    const createUserDto = {
      email: 'e2e-test@example.com',
      name: 'E2E Test User',
      password: 'SecurePassword123!'
    };

    const createdUser = { id: '1', ...createUserDto };
    mockUsersService.createUser.mockResolvedValue(createdUser);

    return request(app.getHttpServer())
      .post('/users')
      .send(createUserDto)
      .expect(201) // Expect 201 Created
      .then(response => {
        expect(response.body).toBeDefined();
        expect(response.body.id).toBeDefined();
        expect(response.body.email).toBe(createUserDto.email);
        expect(response.body.name).toBe(createUserDto.name);
      });
  });

  it('/users (POST) should validate input data', async () => {
    const invalidUserDto = {
      email: 'invalid-email',  // Invalid email format
      name: '',                // Empty name
      password: '123'          // Too short password
    };

    return request(app.getHttpServer())
      .post('/users')
      .send(invalidUserDto)
      .expect(400) // Expect 400 Bad Request for validation errors
      .then(response => {
        expect(response.body).toBeDefined();
        expect(response.body.message).toBeDefined();
        expect(Array.isArray(response.body.message)).toBeTruthy();
      });
  });

  it('/users/active (GET) should return active users', async () => {
    const activeUsers = [{ id: '1', email: 'active@example.com', name: 'Active User' }];
    mockUsersService.findActiveUsers.mockResolvedValue(activeUsers);

    return request(app.getHttpServer())
      .get('/users/active')
      .expect(200) // Expect 200 OK
      .then(response => {
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBeTruthy();
        expect(response.body.length).toBeGreaterThan(0);
      });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, 30000); // Increase timeout for cleanup
});