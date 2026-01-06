import { IsEmail, IsString } from 'class-validator';

export class UpdateByResetCodeDto {
  @IsString()
  resetCode: string;

  @IsString()
  password: string;

  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  document: string;
}
