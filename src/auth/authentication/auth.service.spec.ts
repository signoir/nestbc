import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AuthService } from './auth.service';
import { UsersService } from '../../users/users.service';
import { RolesService } from '../authorization/roles.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let rolesService: RolesService;

  const mockUsersService = {
    findOneByEmail: jest.fn(),
    createUser: jest.fn(),
  };

  const mockRolesService = {
    findDefaultRole: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => ({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn((entity, data) => {
          const id = 'generated-uuid';
          const saved = { id, ...data, roles: [] };
          return Promise.resolve(saved);
        }),
        findOne: jest.fn(),
        remove: jest.fn(),
      },
    })),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      if (key === 'JWT_EXPIRES_IN') return '1d';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1d' },
        }),
      ],
      providers: [
        AuthService,
        JwtStrategy,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    rolesService = module.get<RolesService>(RolesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user without password if credentials are valid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        password: await bcrypt.hash('password123', 10),
        isActive: true,
      };

      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);

      const result = await authService.validateUser('test@example.com', 'password123');

      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
      expect(result?.password).toBeDefined(); // Password is returned from validateUser, but excluded from response
      expect(usersService.findOneByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should return null if user is not found', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(null);

      const result = await authService.validateUser('nonexistent@example.com', 'password123');

      expect(result).toBeNull();
      expect(usersService.findOneByEmail).toHaveBeenCalledWith('nonexistent@example.com');
    });

    it('should return null if user is inactive', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        password: await bcrypt.hash('password123', 10),
        isActive: false,
      };

      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);

      const result = await authService.validateUser('test@example.com', 'password123');

      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        password: await bcrypt.hash('password123', 10),
        isActive: true,
      };

      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);

      const result = await authService.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user info if credentials are valid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        password: await bcrypt.hash('password123', 10),
        isActive: true,
      };

      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);

      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await authService.login(loginDto);

      expect(result).toBeDefined();
      expect(result.access_token).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(null);

      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(authService.login(loginDto)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should create new user and return access token with user role', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        name: 'New User',
        password: 'password123',
      };

      const mockDefaultRole = {
        id: 'role-uuid',
        name: 'user',
        description: 'Regular user',
        isDefault: true,
      };

      const mockCreatedUser = {
        id: '1',
        email: registerDto.email,
        name: registerDto.name,
        password: await bcrypt.hash(registerDto.password, 10),
        isActive: true,
        roles: [mockDefaultRole],
      };

      mockUsersService.findOneByEmail.mockResolvedValue(null);
      mockRolesService.findDefaultRole.mockResolvedValue(mockDefaultRole);

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          create: jest.fn().mockReturnValue(mockCreatedUser),
          save: jest.fn().mockResolvedValue(mockCreatedUser),
        },
      };
      mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner as any);

      const result = await authService.register(registerDto);

      expect(result).toBeDefined();
      expect(result.access_token).toBeDefined();
      expect(result.user.email).toBe('newuser@example.com');
      expect(result.user.roles).toBeDefined();
      expect(usersService.findOneByEmail).toHaveBeenCalledWith('newuser@example.com');
      expect(rolesService.findDefaultRole).toHaveBeenCalled();
    });

    it('should throw BadRequestException if email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        name: 'Existing User',
        password: 'password123',
      };

      const existingUser = {
        id: '1',
        email: 'existing@example.com',
        name: 'Existing User',
        password: 'hashedpassword',
        isActive: true,
      };

      mockUsersService.findOneByEmail.mockResolvedValue(existingUser);

      await expect(authService.register(registerDto)).rejects.toThrow('Email already registered');
    });

    it('should throw InternalServerErrorException if default role not found', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        name: 'New User',
        password: 'password123',
      };

      mockUsersService.findOneByEmail.mockResolvedValue(null);
      mockRolesService.findDefaultRole.mockResolvedValue(null);

      await expect(authService.register(registerDto)).rejects.toThrow(
        'Default user role not found. Please run database seeding.',
      );
    });
  });
});
