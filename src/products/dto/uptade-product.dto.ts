import { Unit } from '@prisma/client';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateProductDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  price: number;

  @IsNumber()
  installmentPrice: number;

  @IsNumber()
  @IsOptional()
  initialStock?: number;
}
