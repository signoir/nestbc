import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthorizationTables1707476400000 implements MigrationInterface {
  name = 'AddAuthorizationTables1707476400000';

  /**
   * Helper method to check if a table exists
   */
  private async tableExists(queryRunner: QueryRunner, tableName: string): Promise<boolean> {
    const result = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) AS exists
    `, [tableName]);
    return result[0]?.exists || false;
  }

  /**
   * Helper method to check if a column exists in a table
   */
  private async columnExists(queryRunner: QueryRunner, tableName: string, columnName: string): Promise<boolean> {
    const result = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1 
        AND column_name = $2
      ) AS exists
    `, [tableName, columnName]);
    return result[0]?.exists || false;
  }

  /**
   * Helper method to check if a constraint exists
   */
  private async constraintExists(queryRunner: QueryRunner, constraintName: string): Promise<boolean> {
    const result = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name = $1
      ) AS exists
    `, [constraintName]);
    return result[0]?.exists || false;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // STEP 1: Create users table if it doesn't exist
    // ============================================
    if (await this.tableExists(queryRunner, 'users')) {
      console.log('Table "users" already exists, skipping creation');
    } else {
      await queryRunner.query(`
        CREATE TABLE "users" (
          "id" uuid NOT NULL DEFAULT gen_random_uuid(),
          "email" character varying NOT NULL,
          "name" character varying NOT NULL,
          "password" character varying NOT NULL,
          "isActive" boolean NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "UQ_users_email" UNIQUE ("email"),
          CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
        )
      `);
      console.log('Table "users" created successfully');
    }

    // Create roles table
    if (await this.tableExists(queryRunner, 'roles')) {
      console.log('Table "roles" already exists, skipping creation');
    } else {
      await queryRunner.query(`
        CREATE TABLE "roles" (
          "id" uuid NOT NULL DEFAULT gen_random_uuid(),
          "name" character varying NOT NULL,
          "description" text,
          "isDefault" boolean NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "UQ_roles_name" UNIQUE ("name"),
          CONSTRAINT "PK_roles_id" PRIMARY KEY ("id")
        )
      `);
      console.log('Table "roles" created successfully');
    }

    // Create permissions table
    if (await this.tableExists(queryRunner, 'permissions')) {
      console.log('Table "permissions" already exists, skipping creation');
    } else {
      await queryRunner.query(`
        CREATE TABLE "permissions" (
          "id" uuid NOT NULL DEFAULT gen_random_uuid(),
          "action" character varying NOT NULL,
          "subject" character varying NOT NULL,
          "conditions" jsonb,
          "inverted" boolean NOT NULL DEFAULT false,
          "reason" text,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "PK_permissions_id" PRIMARY KEY ("id")
        )
      `);
      console.log('Table "permissions" created successfully');
    }

    // Create user_attributes table (depends on users table)
    if (await this.tableExists(queryRunner, 'user_attributes')) {
      console.log('Table "user_attributes" already exists, skipping creation');
    } else {
      await queryRunner.query(`
        CREATE TABLE "user_attributes" (
          "id" uuid NOT NULL DEFAULT gen_random_uuid(),
          "userId" uuid NOT NULL,
          "attributeKey" character varying NOT NULL,
          "attributeValue" text NOT NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "PK_user_attributes_id" PRIMARY KEY ("id"),
          CONSTRAINT "FK_user_attributes_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        )
      `);
      console.log('Table "user_attributes" created successfully');
    }

    // Create resource_attributes table
    if (await this.tableExists(queryRunner, 'resource_attributes')) {
      console.log('Table "resource_attributes" already exists, skipping creation');
    } else {
      await queryRunner.query(`
        CREATE TABLE "resource_attributes" (
          "id" uuid NOT NULL DEFAULT gen_random_uuid(),
          "resourceType" character varying NOT NULL,
          "resourceId" uuid NOT NULL,
          "attributeKey" character varying NOT NULL,
          "attributeValue" text,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "PK_resource_attributes_id" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_resource_attributes_resource" UNIQUE ("resourceType", "resourceId", "attributeKey")
        )
      `);
      console.log('Table "resource_attributes" created successfully');
    }

    // Create user_roles junction table
    if (await this.tableExists(queryRunner, 'user_roles')) {
      console.log('Table "user_roles" already exists, skipping creation');
    } else {
      await queryRunner.query(`
        CREATE TABLE "user_roles" (
          "userId" uuid NOT NULL,
          "roleId" uuid NOT NULL,
          "assignedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "PK_user_roles" PRIMARY KEY ("userId", "roleId"),
          CONSTRAINT "FK_user_roles_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_user_roles_roleId" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE,
          CONSTRAINT "UQ_user_roles_userId_roleId" UNIQUE ("userId", "roleId")
        )
      `);
      console.log('Table "user_roles" created successfully');
    }

    // Create role_permissions junction table
    if (await this.tableExists(queryRunner, 'role_permissions')) {
      console.log('Table "role_permissions" already exists, skipping creation');
    } else {
      await queryRunner.query(`
        CREATE TABLE "role_permissions" (
          "roleId" uuid NOT NULL,
          "permissionId" uuid NOT NULL,
          "assignedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "PK_role_permissions" PRIMARY KEY ("roleId", "permissionId"),
          CONSTRAINT "FK_role_permissions_roleId" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_role_permissions_permissionId" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE,
          CONSTRAINT "UQ_role_permissions_roleId_permissionId" UNIQUE ("roleId", "permissionId")
        )
      `);
      console.log('Table "role_permissions" created successfully');
    }

    // Add isActive column to users table if it doesn't exist
    if (await this.columnExists(queryRunner, 'users', 'isActive')) {
      console.log('Column "isActive" already exists in "users" table, skipping');
    } else {
      await queryRunner.query(`
        ALTER TABLE "users" ADD "isActive" boolean NOT NULL DEFAULT true
      `);
      console.log('Column "isActive" added to "users" table successfully');
    }

    // Add unique constraint to permissions table if it doesn't exist (for ON CONFLICT to work)
    if (!await this.constraintExists(queryRunner, 'UQ_permissions_action_subject')) {
      await queryRunner.query(`
        ALTER TABLE "permissions" ADD CONSTRAINT "UQ_permissions_action_subject" UNIQUE ("action", "subject")
      `);
      console.log('Unique constraint "UQ_permissions_action_subject" added to "permissions" table');
    } else {
      console.log('Unique constraint "UQ_permissions_action_subject" already exists, skipping');
    }

    // Insert default roles (safe to run multiple times with ON CONFLICT)
    await queryRunner.query(`
      INSERT INTO "roles" ("name", "description", "isDefault") VALUES
        ('admin', 'Administrator with full access', false),
        ('user', 'Regular user', true),
        ('moderator', 'Content moderator', false)
      ON CONFLICT ("name") DO NOTHING
    `);
    console.log('Default roles inserted or already exist');

    // Insert basic permissions (safe to run multiple times with ON CONFLICT)
    await queryRunner.query(`
      INSERT INTO "permissions" ("action", "subject") VALUES
        ('manage', 'all'), -- admin permission
        ('read', 'User'),
        ('update', 'User'),
        ('create', 'Post'),
        ('read', 'Post'),
        ('update', 'Post'),
        ('delete', 'Post')
      ON CONFLICT ("action", "subject") DO NOTHING
    `);
    console.log('Basic permissions inserted or already exist');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse order of creation (respecting foreign key dependencies)
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "resource_attributes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_attributes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}