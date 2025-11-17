import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { StockMovementType } from '@prisma/client';

export class ListMovementsDto {
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  productId?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(StockMovementType)
  type?: StockMovementType;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsISO8601()
  from?: string; // inclusive

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsISO8601()
  to?: string; // inclusive

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value, 10) : 1))
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => (value ? Math.min(parseInt(value, 10), 100) : 20))
  @IsInt()
  @Min(1)
  perPage: number = 20;
}
