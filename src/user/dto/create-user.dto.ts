import { IsEmail, isEmail, IsEnum, IsInt, IsString, Min } from "class-validator";

export class CreateUserDto {
  @IsString()
  @Min(5)
  fullName: string
  
  @IsEmail()
  email: string

  @IsInt()
  @IsEnum([1, 2, 3])
  role: number
}
