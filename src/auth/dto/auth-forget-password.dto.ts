import { IsEmail } from 'class-validator';

export class AuthForgetPasswordDTO {
  @IsEmail()
  email: string;
}
