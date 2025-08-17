import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class EntryStockDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(0.01, { message: 'Quantity must be greater than 0' })
  @Type(() => Number)
  quantity: number;

  @IsNumber()
  @Min(0, { message: 'Unit cost must be greater than or equal to 0' })
  @Type(() => Number)
  unitCost: number;

  @IsOptional()
  @IsString()
  description?: string;
}