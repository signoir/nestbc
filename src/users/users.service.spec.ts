import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { DataSource } from 'typeorm';
import { AppAbility } from '../auth/authorization/casl/ability.factory';
import { Action } from '../auth/authorization/casl/actions.enum';
import { ForbiddenException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: any;
  let mockDataSource: any;

  beforeEach(async () => {
    mockRepository = {
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(), // Add the find method that's used in findActiveUsers
      update: jest.fn(),
      delete: jest.fn(),
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

  describe('findOne', () => {
    it('should return a user when found', async () => {
      const user = { id: '1', email: 'test@example.com', name: 'Test User' };
      mockRepository.findOneBy.mockResolvedValue(user);

      const result = await service.findOne('1');
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow();
    });

    it('should check authorization when ability is provided', async () => {
      const user = { id: '1', email: 'test@example.com', name: 'Test User' };
      mockRepository.findOneBy.mockResolvedValue(user);

      // Mock ability that can read User
      const mockAbility: Partial<AppAbility> = {
        can: jest.fn().mockReturnValue(true),
      };

      const result = await service.findOne('1', mockAbility as AppAbility);
      expect(result).toEqual(user);
      expect(mockAbility.can).toHaveBeenCalledWith(Action.Read, 'User');
    });

    it('should throw ForbiddenException when user lacks permission', async () => {
      const mockAbility: Partial<AppAbility> = {
        can: jest.fn().mockReturnValue(false),
      };

      await expect(service.findOne('1', mockAbility as AppAbility)).rejects.toThrow(ForbiddenException);
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

    it('should check authorization when ability is provided', async () => {
      const users = [{ id: '1', email: 'user@example.com', name: 'Test User' }];
      mockRepository.find.mockResolvedValue(users);

      // Mock ability that can read User
      const mockAbility: Partial<AppAbility> = {
        can: jest.fn().mockReturnValue(true),
      };

      const result = await service.findActiveUsers(mockAbility as AppAbility);
      expect(result).toEqual(users);
      expect(mockAbility.can).toHaveBeenCalledWith(Action.Read, 'User');
    });

    it('should throw ForbiddenException when user lacks permission', async () => {
      const mockAbility: Partial<AppAbility> = {
        can: jest.fn().mockReturnValue(false),
      };

      await expect(service.findActiveUsers(mockAbility as AppAbility)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update and return the user', async () => {
      const user = { id: '1', email: 'test@example.com', name: 'Test User' };
      const updatedData = { name: 'Updated Name' };
      const updatedUser = { ...user, ...updatedData };

      jest.spyOn(service, 'findOne').mockResolvedValueOnce(user as any).mockResolvedValueOnce(updatedUser as any);
      mockRepository.update.mockResolvedValue(undefined);

      const result = await service.update('1', updatedData);
      expect(result).toEqual(updatedUser);
      expect(mockRepository.update).toHaveBeenCalledWith('1', updatedData);
    });
  });

  describe('delete', () => {
    it('should delete the user', async () => {
      const user = { id: '1', email: 'test@example.com', name: 'Test User' };

      jest.spyOn(service, 'findOne').mockResolvedValue(user as any);
      mockRepository.delete.mockResolvedValue(undefined);

      await service.delete('1');
      expect(mockRepository.delete).toHaveBeenCalledWith('1');
    });
  });
});