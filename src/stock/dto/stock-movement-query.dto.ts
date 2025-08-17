import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { StockMovementType } from '@prisma/client';

export class StockMovementQueryDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsEnum(StockMovementType)
  type?: StockMovementType;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Page must be greater than 0' })
  @Type(() => Number)
  @Transform(({ value }) => value || 1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Page size must be greater than 0' })
  @Type(() => Number)
  @Transform(({ value }) => value || 20)
  pageSize?: number = 20;
}