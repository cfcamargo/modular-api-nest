import { IsEmail, IsString, Min } from 'class-validator';

export class ChangePasswordDTO {
  @IsString()
  currentPassword: string;

  @IsString()
  @Min(8)
  newPassword: string;
}
