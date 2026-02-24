import * as fs from 'fs';
import * as path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

// Load .env file manually
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split('=');
    const trimmedKey = key?.trim();
    if (trimmedKey && !trimmedKey.startsWith('#') && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      process.env[trimmedKey] = value.replace(/^["']|["']$/g, '');
    }
  });
}

const isSqlite = process.env.DB_TYPE === 'sqlite';

const dataSourceOptions: DataSourceOptions = {
  type: (process.env.DB_TYPE as 'postgres' | 'sqlite') || 'postgres',
  
  // PostgreSQL configuration
  host: isSqlite ? undefined : (process.env.DB_HOST || 'localhost'),
  port: isSqlite ? undefined : (parseInt(process.env.DB_PORT, 10) || 5432),
  username: isSqlite ? undefined : (process.env.DB_USERNAME || 'postgres'),
  password: isSqlite ? undefined : (process.env.DB_PASSWORD || 'postgres'),
  
  // Database name (different handling for SQLite vs PostgreSQL)
  database: isSqlite 
    ? (process.env.DB_DATABASE || './database.sqlite')
    : (process.env.DB_DATABASE || 'nestbc'),
  
  // Common configuration
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false, // Never use synchronize in production with migrations
  logging: process.env.NODE_ENV !== 'production',
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
