import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import * as request from 'supertest';

describe('HealthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health (GET) should return health status', async () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((response) => {
        expect(response.body).toBeDefined();
        expect(response.body.status).toBe('ok');
        // Verify that the database health check is included
        expect(response.body.info).toBeDefined();
        expect(response.body.info.database).toBeDefined();
      });
  });

  afterAll(async () => {
    await app.close();
  });
});