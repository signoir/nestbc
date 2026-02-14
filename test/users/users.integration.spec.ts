import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { UsersService } from '../../src/users/users.service';
import { User } from '../../src/users/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

describe('UsersService Integration Tests', () => {
  let app: INestApplication;
  let usersService: UsersService;

  beforeAll(async () => {
    // Mock repository and DataSource
    const mockRepository = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      find: jest.fn(), // Add the missing find method
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      })),
    };

    const mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      manager: {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
      },
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    };

    const mockDataSource = {
      createQueryRunner: jest.fn(() => mockQueryRunner),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    await app.init();

    usersService = app.get<UsersService>(UsersService);
  }, 30000); // Increase timeout for setup

  beforeEach(() => {
    // Clear mock calls before each test
    jest.clearAllMocks();
  });

  describe('User Creation Integration', () => {
    it('should create a user and store it in the database', async () => {
      const userData = {
        email: 'integration-test@example.com',
        name: 'Integration Test User',
        password: 'securePassword123'
      };

      const expectedResult = { id: '1', ...userData };

      // Mock the query runner behavior
      const mockQueryRunner: any = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        manager: {
          findOne: jest.fn().mockResolvedValue(null), // No existing user
          create: jest.fn().mockReturnValue(expectedResult),
          save: jest.fn().mockResolvedValue(expectedResult),
        },
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      };

      // Mock the data source to return our mock query runner
      const mockDataSource: any = (usersService as any).dataSource;
      mockDataSource.createQueryRunner = jest.fn(() => mockQueryRunner);

      const createdUser = await usersService.createUser(userData);

      expect(createdUser).toBeDefined();
      expect(createdUser.id).toBeDefined();
      expect(createdUser.email).toBe(userData.email);
      expect(createdUser.name).toBe(userData.name);

      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should handle duplicate email scenario', async () => {
      const userData = {
        email: 'duplicate-test@example.com',
        name: 'Duplicate Test User',
        password: 'securePassword123'
      };

      const existingUser = { id: '1', ...userData };

      const mockQueryRunner: any = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        manager: {
          findOne: jest.fn().mockResolvedValue(existingUser), // Existing user found
          create: jest.fn(),
          save: jest.fn(),
        },
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      };

      // Mock the data source to return our mock query runner
      const mockDataSource: any = (usersService as any).dataSource;
      mockDataSource.createQueryRunner = jest.fn(() => mockQueryRunner);

      // Create the first user
      const firstUser = await usersService.createUser(userData);

      // Attempt to create a user with the same email
      const secondUser = await usersService.createUser(userData);

      // Should return the existing user
      expect(firstUser.id).toBe(secondUser.id);
      expect(firstUser.email).toBe(secondUser.email);
    });
  });

  describe('Find Active Users Integration', () => {
    it('should return only active users', async () => {
      const activeUsers = [{ id: '1', email: 'active@example.com', name: 'Active User', isActive: true }];

      // Mock the repository's find method to return active users
      const mockRepository: any = (usersService as any).usersRepository;
      mockRepository.find.mockResolvedValue(activeUsers);

      const result = await usersService.findActiveUsers();
      expect(result).toEqual(activeUsers);
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, 30000); // Increase timeout for cleanup
});