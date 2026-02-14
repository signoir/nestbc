import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { AppService } from '../src/app.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { AuthorizationGuard } from '../src/authorization/guards/authorization.guard';
import { Reflector } from '@nestjs/core';
import { AbilityFactory } from '../src/authorization/casl/ability.factory';
import * as request from 'supertest';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Create mock implementations for all dependencies
    const mockAppService = {
      getHello: jest.fn(() => 'Hello World!'),
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
    
    const mockAbility = {
      can: jest.fn(() => true), // Default to allowing all actions for testing
    };
    
    const mockAbilityFactory = {
      createForUser: jest.fn().mockResolvedValue(mockAbility),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(AppService)
    .useValue(mockAppService)
    .overrideProvider(JwtAuthGuard)
    .useValue(mockJwtAuthGuard)
    .overrideProvider(AuthorizationGuard)
    .useValue(mockAuthorizationGuard)
    .overrideProvider(Reflector)
    .useValue(mockReflector)
    .overrideProvider(AbilityFactory)  // Corrected typo: should be AbilityFactory
    .useValue(mockAbilityFactory)
    .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await app.init();
  }, 30000); // Increase timeout for setup

  it('/ (GET) should return welcome message', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .then(response => {
        expect(response.text).toBe('Hello World!');
      });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, 30000); // Increase timeout for cleanup
});