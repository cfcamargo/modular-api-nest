import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ExitStockDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(0.01, { message: 'Quantity must be greater than 0' })
  @Type(() => Number)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Unit sale price must be greater than or equal to 0' })
  @Type(() => Number)
  unitSalePrice?: number;

  @IsOptional()
  @IsString()
  description?: string;
}