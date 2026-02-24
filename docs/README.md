# nestbc

A progressive [Node.js](http://nodejs.org) framework for building efficient and scalable server-side applications with **RBAC (Role-Based Access Control)** and **ABAC (Attribute-Based Access Control)** authentication and authorization system.

## Features

- 🔐 **JWT Authentication** - Secure token-based authentication using Passport
- 🛡️ **RBAC + ABAC Authorization** - Combined role-based and attribute-based access control using CASL
- 📦 **TypeORM Integration** - Database ORM with PostgreSQL and SQLite support
- 🚀 **NestJS Framework** - Built with NestJS for scalable and maintainable architecture
- 📝 **Validation** - Request validation using class-validator and class-transformer
- 🔧 **Database Migrations** - TypeORM migration support for schema management
- 🌱 **Seeders** - Database seeding for roles, permissions, and admin users

## Tech Stack

- **Runtime**: Node.js
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL / SQLite
- **ORM**: TypeORM
- **Authentication**: Passport + JWT
- **Authorization**: CASL
- **Package Manager**: pnpm

## Prerequisites

- Node.js >= 18.x
- pnpm >= 8.x
- PostgreSQL (for production) or SQLite (for development)

## Installation

```bash
# Clone the repository
git clone https://github.com/signoir/nestbc
cd nestbc

# Install dependencies
pnpm install
```

## Setup

### Environment Configuration

Create a `.env` file in the root directory based on `.env.example` (if available) or configure the following variables:

```env
# Database
DB_TYPE=sqlite
DB_DATABASE=./database.sqlite
# For PostgreSQL:
# DB_TYPE=postgres
# DB_HOST=localhost
# DB_PORT=5432
# DB_USERNAME=postgres
# DB_PASSWORD=your_password
# DB_DATABASE=your_db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d

# App
PORT=3000
```

### Database Setup

```bash
# Run migrations to create database schema
pnpm run migration:run

# Seed the database with initial data
pnpm run seed:all
```

### Available Seed Commands

```bash
# Seed roles
pnpm run seed:roles

# Seed permissions
pnpm run seed:permissions

# Seed admin user
pnpm run seed:admin

# Seed all data
pnpm run seed:all
```

## Running the App

```bash
# Development mode (with watch)
pnpm run start:dev

# Production mode
pnpm run start:prod

# Debug mode
pnpm run start:debug

# Build for production
pnpm run build
```

## Testing

```bash
# Unit tests
pnpm run test

# Watch mode for tests
pnpm run test:watch

# Test coverage
pnpm run test:cov

# E2E tests
pnpm run test:e2e

# Integration tests
pnpm run test:integration

# Debug tests
pnpm run test:debug
```

## Code Quality

```bash
# Format code with Prettier
pnpm run format

# Lint code with ESLint
pnpm run lint
```

## Database Commands

```bash
# Generate a new migration
pnpm run migration:generate -- -n MigrationName

# Run pending migrations
pnpm run migration:run

# Revert last migration
pnpm run migration:revert
```

## API Documentation

Once the application is running, you can test the API endpoints:

- **Health Check**: `GET /health`
- **Authentication**: `POST /auth/login`
- **Users**: `GET /users`, `POST /users`, etc.

## Project Structure

```
src/
├── auth/           # Authentication module (JWT, Passport)
├── authorization/  # Authorization module (CASL, RBAC, ABAC)
├── users/          # User management module
├── config/         # Configuration modules
├── health/         # Health check endpoints
├── migrations/     # Database migrations
├── seeds/          # Database seeders
├── app.module.ts   # Root application module
└── main.ts         # Application entry point
```

## Documentation

For detailed documentation on the RBAC and ABAC authentication system, see:

- [RBAC & ABAC Documentation](./docs/rbac-abac-auth-documentation.md)
- [Tests Documentation](./docs/tests/)
- [Seeder Documentation](./docs/seeder/)

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in Touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

This project is [UNLICENSED](LICENSE).

---

# Documentation for nestbc Application

## Available Documentation

This directory contains comprehensive documentation for the RBAC (Role-Based Access Control) and ABAC (Attribute-Based Access Control) system implemented in the nestbc application.

### RBAC and ABAC Authentication System
- **File**: `rbac-abac-auth-documentation.md`
- **Description**: Complete documentation for the authentication and authorization system including architecture, implementation details, security considerations, and usage examples.

## Documentation Overview

The RBAC and ABAC system provides a robust security framework that combines:
- Role-Based Access Control (RBAC) for managing permissions by roles
- Attribute-Based Access Control (ABAC) for dynamic, context-aware permissions
- JWT-based authentication for secure user identification
- CASL for flexible and powerful authorization policies

## Getting Started

For detailed information about the authentication and authorization system, refer to the main documentation file: `rbac-abac-auth-documentation.md`

## Contributing

When making changes to the authentication or authorization system:
1. Update the relevant sections in the documentation
2. Ensure all examples remain accurate
3. Add new usage patterns or security considerations as needed