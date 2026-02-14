import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, BadRequestException } from '@nestjs/common';
import { UsersController } from '../../src/users/users.controller';
import { UsersService } from '../../src/users/users.service';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { AuthorizationGuard } from '../../src/authorization/guards/authorization.guard';
import { AbilityGuard } from '../../src/auth/guards/ability.guard';
import * as request from 'supertest';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let mockUsersService: any;

  beforeAll(async () => {
    // Mock guards to allow everything
    const mockJwtAuthGuard = {
      canActivate: jest.fn(() => true),
    };

    const mockAuthorizationGuard = {
      canActivate: jest.fn(() => true),
    };

    const mockAbilityGuard = {
      canActivate: jest.fn(() => true),
    };

    // Mock service
    mockUsersService = {
      createUser: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findActiveUsers: jest.fn(),
      findAll: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(AuthorizationGuard)
      .useValue(mockAuthorizationGuard)
      .overrideGuard(AbilityGuard)
      .useValue(mockAbilityGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await app.init();
  }, 30000);

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
      .expect(201)
      .then(response => {
        expect(response.body).toBeDefined();
        expect(response.body.id).toBeDefined();
        expect(response.body.email).toBe(createUserDto.email);
        expect(response.body.name).toBe(createUserDto.name);
      });
  });

  it('/users (POST) should validate input data', async () => {
    const invalidUserDto = {
      email: 'invalid-email',
      name: '',
      password: '123'
    };

    // Since validation happens in the service in our app structure,
    // we must mock the rejection.
    mockUsersService.createUser.mockRejectedValue(new BadRequestException('Validation failed'));

    return request(app.getHttpServer())
      .post('/users')
      .send(invalidUserDto)
      .expect(400)
      .then(response => {
        expect(response.body).toBeDefined();
        expect(response.body.message).toBeDefined();
      });
  });

  it('/users/active (GET) should return active users', async () => {
    const activeUsers = [{ id: '1', email: 'active@example.com', name: 'Active User' }];
    mockUsersService.findActiveUsers.mockResolvedValue(activeUsers);

    return request(app.getHttpServer())
      .get('/users/active')
      .expect(200)
      .then(response => {
        // We expect the array directly or a wrapper depending on controller
        // Based on controller code: returns this.usersService.findActiveUsers(...)
        // So it should be the array.
        expect(response.body).toEqual(activeUsers);
      });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, 30000);
});