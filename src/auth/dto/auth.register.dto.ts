import { IsEmail, IsString, Min } from 'class-validator';

export class AuthRegisterDTO {
  @IsString()
  @Min(3)
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @Min(8)
  password: string;
}
