import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AdjustStockDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(0, { message: 'Target quantity must be greater than or equal to 0' })
  @Type(() => Number)
  targetQuantity: number;

  @IsOptional()
  @IsString()
  description?: string;
}