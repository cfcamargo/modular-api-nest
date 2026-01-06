import {
  IsInt,
  IsString,
  Min,
  MinLength,
  IsOptional,
  IsEnum,
  IsISO8601,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { OrderStatus } from '@prisma/client';

export class OrderRequestDTO {
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

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;
}
