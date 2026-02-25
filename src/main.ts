import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import { DeprecationInterceptor } from './common/interceptors/deprecation.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend integration
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Enable API Versioning with /api/v1/, /api/v2/ prefix
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v',
  });

  // Register DeprecationInterceptor globally
  app.useGlobalInterceptors(new DeprecationInterceptor());

  // Swagger/OpenAPI Configuration
  const config = new DocumentBuilder()
    .setTitle('nestbc API')
    .setDescription('The nestbc API documentation with RBAC/ABAC authorization system using CASL')
    .setVersion('1.0')
    .addServer('http://localhost:3000/api/v1', 'API v1 Server')
    .addTag('auth', 'Authentication endpoints (login, register)')
    .addTag('users', 'User management endpoints')
    .addTag('roles', 'Role management endpoints')
    .addTag('permissions', 'Permission management endpoints')
    .addTag('health', 'Health check endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
        description: 'Enter your JWT token (obtained from /auth/login)',
      },
      'JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Serve Swagger UI at /docs (separate from API endpoints)
  SwaggerModule.setup('docs', app, document, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'nestbc API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      filter: true,
      showRequestDuration: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger UI (Documentation): http://localhost:${port}/docs`);
  console.log(`OpenAPI JSON: http://localhost:${port}/docs-json`);
  console.log(`API Versioning: URI-based (/api/v1/, /api/v2/, etc.)`);
  console.log(`Example API Endpoint: http://localhost:${port}/api/v1/users`);
}
bootstrap();
