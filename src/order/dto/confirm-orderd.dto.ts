import { IsOptional, IsString } from 'class-validator';

export class ConfirmOrderDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  userId: string;
}
