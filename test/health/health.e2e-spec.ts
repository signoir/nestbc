import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { HealthController } from '../../src/health/health.controller';
import { TerminusModule } from '@nestjs/terminus';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { AuthorizationGuard } from '../../src/authorization/guards/authorization.guard';
import { Reflector } from '@nestjs/core';
import { AbilityFactory } from '../../src/authorization/casl/ability.factory';
import { AppAbility } from '../../src/authorization/casl/ability.factory';
import * as request from 'supertest';

describe('HealthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mockJwtAuthGuard = {
      canActivate: jest.fn(() => true), // Allow all requests for testing
    };
    
    const mockAuthorizationGuard = {
      canActivate: jest.fn(() => true), // Allow all requests for testing
    };
    
    const mockReflector = {
      getAllAndOverride: jest.fn(() => []), // Return empty array for required rules
    };
    
    const mockAbility: Partial<AppAbility> = {
      can: jest.fn(() => true), // Default to allowing all actions for testing
    };
    
    const mockAbilityFactory = {
      createForUser: jest.fn().mockResolvedValue(mockAbility), // Mock ability creation
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TerminusModule],
    })
    .overrideProvider(JwtAuthGuard)
    .useValue(mockJwtAuthGuard)
    .overrideProvider(AuthorizationGuard)
    .useValue(mockAuthorizationGuard)
    .overrideProvider(Reflector)
    .useValue(mockReflector)
    .overrideProvider(AbilityFactory)
    .useValue(mockAbilityFactory)
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 30000); // Increase timeout for setup

  it('/health (GET) should return health status', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .then(response => {
        expect(response.body).toBeDefined();
        expect(response.body.status).toBe('ok');
      });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, 30000); // Increase timeout for cleanup
});