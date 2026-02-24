import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';
import authConfig from './config/auth.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { SeederModule } from './seeds/seeder.module';
import { AuthModule } from './auth/auth.module';
import { CommandModule } from 'nestjs-command';

@Module({
  imports: [
    // ✅ Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, authConfig],
    }),

    // ✅ Enable command functionality
    CommandModule,

    // ✅ TypeORM with async configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
      }),
    }),

    AuthModule, // ✅ Import AuthModule (includes both authentication and authorization)
    UsersModule,
    HealthModule,
    SeederModule, // ✅ Import SeederModule for database seeding
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }