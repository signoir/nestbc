import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs('database', (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,

  // 🔴 NEVER use synchronize in production
  synchronize: process.env.NODE_ENV !== 'production',

  // ✅ Use explicit entity paths (faster than globs)
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],

  // ✅ Migration configuration
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  migrationsRun: process.env.NODE_ENV === 'production',

  // ✅ Connection pooling
  extra: {
    max: 20,  // Maximum connections
    min: 5,   // Minimum connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },

  // ✅ Enable logging only in development
  logging: process.env.NODE_ENV !== 'production',

  // ✅ SSL for production (if using cloud DB)
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
}));