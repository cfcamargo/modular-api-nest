import { Unit } from '@prisma/client';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  price: number;

  @IsString()
  unit: Unit;

  @IsNumber()
  @IsOptional()
  initialStock?: number;
}
