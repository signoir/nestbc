import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthorizationTables1707476400000 implements MigrationInterface {
  name = 'AddAuthorizationTables1707476400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create roles table
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

    // Create permissions table
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

    // Create user_attributes table
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

    // Create resource_attributes table
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

    // Create user_roles junction table
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

    // Create role_permissions junction table
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

    // Add isActive column to users table if it doesn't exist
    try {
      await queryRunner.query(`
        ALTER TABLE "users" ADD COLUMN "isActive" boolean NOT NULL DEFAULT true
      `);
    } catch (error) {
      // Column may already exist, which is fine
      console.log('Column isActive may already exist in users table');
    }

    // Insert default roles
    await queryRunner.query(`
      INSERT INTO "roles" ("name", "description", "isDefault") VALUES
        ('admin', 'Administrator with full access', false),
        ('user', 'Regular user', true),
        ('moderator', 'Content moderator', false)
      ON CONFLICT ("name") DO NOTHING
    `);

    // Insert basic permissions
    await queryRunner.query(`
      INSERT INTO "permissions" ("action", "subject") VALUES
        ('manage', 'all'), -- admin permission
        ('read', 'User'),
        ('update', 'User'),
        ('create', 'Post'),
        ('read', 'Post'),
        ('update', 'Post'),
        ('delete', 'Post')
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(`DROP TABLE "user_roles"`);
    await queryRunner.query(`DROP TABLE "resource_attributes"`);
    await queryRunner.query(`DROP TABLE "user_attributes"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
    await queryRunner.query(`DROP TABLE "roles"`);
  }
}