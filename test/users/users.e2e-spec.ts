import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import * as request from 'supertest';

describe('UsersController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 30000); // Increase timeout for setup

  it('/users (POST) should create a new user', async () => {
    const createUserDto = {
      email: 'e2e-test@example.com',
      name: 'E2E Test User',
      password: 'SecurePassword123!'
    };

    return request(app.getHttpServer())
      .post('/users')
      .send(createUserDto)
      .expect(201) // Expect 201 Created if the endpoint exists
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
      });
  });

  it('/users/active (GET) should return active users', async () => {
    return request(app.getHttpServer())
      .get('/users/active')
      .expect(200) // Expect 200 OK
      .then(response => {
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBeTruthy();
      });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, 30000); // Increase timeout for cleanup
});