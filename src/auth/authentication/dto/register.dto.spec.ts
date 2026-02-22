import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

describe('RegisterDto', () => {
  it('should validate correct register data', async () => {
    const registerDto = new RegisterDto();
    registerDto.email = 'test@example.com';
    registerDto.name = 'Test User';
    registerDto.password = 'password123';

    const errors = await validate(registerDto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation if email is missing', async () => {
    const registerDto = new RegisterDto();
    registerDto.name = 'Test User';
    registerDto.password = 'password123';

    const errors = await validate(registerDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation if email is invalid', async () => {
    const registerDto = new RegisterDto();
    registerDto.email = 'invalid-email';
    registerDto.name = 'Test User';
    registerDto.password = 'password123';

    const errors = await validate(registerDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });

  it('should fail validation if name is missing', async () => {
    const registerDto = new RegisterDto();
    registerDto.email = 'test@example.com';
    registerDto.password = 'password123';

    const errors = await validate(registerDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation if name is too short', async () => {
    const registerDto = new RegisterDto();
    registerDto.email = 'test@example.com';
    registerDto.name = 'A';
    registerDto.password = 'password123';

    const errors = await validate(registerDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('minLength');
  });

  it('should fail validation if password is missing', async () => {
    const registerDto = new RegisterDto();
    registerDto.email = 'test@example.com';
    registerDto.name = 'Test User';

    const errors = await validate(registerDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation if password is too short', async () => {
    const registerDto = new RegisterDto();
    registerDto.email = 'test@example.com';
    registerDto.name = 'Test User';
    registerDto.password = '1234567';

    const errors = await validate(registerDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('minLength');
  });

  it('should pass validation with optional username', async () => {
    const registerDto = new RegisterDto();
    registerDto.email = 'test@example.com';
    registerDto.name = 'Test User';
    registerDto.password = 'password123';
    registerDto.username = 'testuser';

    const errors = await validate(registerDto);
    expect(errors.length).toBe(0);
  });
});
