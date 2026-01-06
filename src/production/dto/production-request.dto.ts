import { ProductionStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ProductionRequestDto {
  @Transform(({ value }) => Number(value) || 20)
  @IsInt()
  @Min(5)
  perPage: number = 20;

  @Transform(({ value }) => Number(value) || 1)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @IsString()
  searchTerm?: string;

  @IsEnum(ProductionStatus)
  @IsOptional()
  status: ProductionStatus | null;
}
