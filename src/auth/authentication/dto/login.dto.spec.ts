import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  it('should validate correct login data', async () => {
    const loginDto = new LoginDto();
    loginDto.email = 'test@example.com';
    loginDto.password = 'password123';

    const errors = await validate(loginDto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation if email is missing', async () => {
    const loginDto = new LoginDto();
    loginDto.password = 'password123';

    const errors = await validate(loginDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation if email is invalid', async () => {
    const loginDto = new LoginDto();
    loginDto.email = 'invalid-email';
    loginDto.password = 'password123';

    const errors = await validate(loginDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });

  it('should fail validation if password is missing', async () => {
    const loginDto = new LoginDto();
    loginDto.email = 'test@example.com';

    const errors = await validate(loginDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation if password is too short', async () => {
    const loginDto = new LoginDto();
    loginDto.email = 'test@example.com';
    loginDto.password = '12345';

    const errors = await validate(loginDto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('minLength');
  });
});
