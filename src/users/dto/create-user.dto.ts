import { IsEmail, IsString, MinLength, Length } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(1, 100)
  name: string;

  @IsString()
  @MinLength(8)
  password: string;
}