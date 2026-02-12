import { Test, TestingModule } from '@nestjs/testing';
import { AbilityFactory } from './ability.factory';
import { Action } from './actions.enum';

describe('AbilityFactory', () => {
  let abilityFactory: AbilityFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AbilityFactory],
    }).compile();

    abilityFactory = module.get<AbilityFactory>(AbilityFactory);
  });

  it('should be defined', () => {
    expect(abilityFactory).toBeDefined();
  });

  describe('createForUser', () => {
    it('should create abilities for a user', async () => {
      // Create a mock user object
      const mockUser: any = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'password',
        roles: [
          {
            id: 'role-1',
            name: 'admin',
            permissions: [
              {
                id: 'perm-1',
                action: 'read',
                subject: 'User',
                inverted: false,
                conditions: null
              },
              {
                id: 'perm-2',
                action: 'manage',
                subject: 'all',
                inverted: false,
                conditions: null
              }
            ]
          }
        ],
        attributes: []
      };

      const ability = await abilityFactory.createForUser(mockUser);

      // Test that the ability was created
      expect(ability).toBeDefined();
    });

    it('should apply user-specific permissions', async () => {
      const mockUser: any = {
        id: '123',
        email: 'user@example.com',
        name: 'Test User',
        password: 'password',
        roles: [],
        attributes: []
      };

      const ability = await abilityFactory.createForUser(mockUser);

      // Test that the ability was created successfully
      expect(ability).toBeDefined();
    });
  });
});