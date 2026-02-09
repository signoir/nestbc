import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService, CreateUserDto } from './users.service';
import { User } from './user.entity';
import { DataSource } from 'typeorm';

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: any;
  let mockDataSource: any;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(), // Add the find method that's used in findActiveUsers
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

    mockDataSource = {
      createQueryRunner: jest.fn(() => mockQueryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
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

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData = { email: 'test@example.com', name: 'Test User', password: 'securePassword123' };
      const expectedResult = { id: '1', ...userData };
      
      // Mock the query runner behavior
      const mockQueryRunner: any = (service as any).dataSource.createQueryRunner();
      mockQueryRunner.manager.findOne.mockResolvedValue(null); // No existing user
      mockQueryRunner.manager.create.mockReturnValue(expectedResult);
      mockQueryRunner.manager.save.mockResolvedValue(expectedResult);

      const result = await service.createUser(userData);

      expect(result).toEqual(expectedResult);
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should return existing user if email already exists', async () => {
      const userData = { email: 'existing@example.com', name: 'Existing User', password: 'securePassword123' };
      const existingUser = { id: '1', ...userData };

      // Mock the query runner behavior
      const mockQueryRunner: any = (service as any).dataSource.createQueryRunner();
      mockQueryRunner.manager.findOne.mockResolvedValue(existingUser); // Existing user found

      const result = await service.createUser(userData);

      expect(result).toEqual(existingUser);
    });
  });

  describe('findActiveUsers', () => {
    it('should return all users', async () => {
      const users = [{ id: '1', email: 'user@example.com', name: 'Test User' }];
      mockRepository.find.mockResolvedValue(users);

      const result = await service.findActiveUsers();
      expect(result).toEqual(users);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });
});