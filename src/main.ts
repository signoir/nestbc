import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend integration
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Swagger/OpenAPI Configuration
  const config = new DocumentBuilder()
    .setTitle('nestbc API')
    .setDescription('The nestbc API documentation with RBAC/ABAC authorization system using CASL')
    .setVersion('1.0')
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

  // Serve Swagger UI at /api
  SwaggerModule.setup('api', app, document, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'nestbc API Docs',
    swaggerOptions: {
      persistAuthorization: true, // Keep JWT token on refresh
      filter: true, // Enable filtering endpoints
      showRequestDuration: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/api`);
  console.log(`OpenAPI JSON: http://localhost:${port}/api-json`);
}
bootstrap();
