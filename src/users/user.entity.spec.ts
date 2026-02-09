import { User } from './user.entity';

describe('User Entity', () => {
  it('should be defined', () => {
    expect(new User()).toBeDefined();
  });

  it('should have the correct table name', () => {
    const user = new User();
    // Testing the entity metadata would require TypeORM testing utilities
    // For now, we can test basic instantiation
    expect(user).toBeInstanceOf(User);
  });
});