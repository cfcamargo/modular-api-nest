import { IsEnum, IsOptional, IsString, IsNumberString } from 'class-validator';
import { StockMovementType } from '@prisma/client';

export class CreateStockMovementDto {
  @IsString() productId: string;

  @IsEnum(StockMovementType) type: StockMovementType;
  @IsNumberString() quantity: string; // Decimal como string

  @IsOptional() @IsNumberString() unitCost?: string;
  @IsOptional() @IsNumberString() unitSalePrice?: string;
  @IsOptional() @IsNumberString() marginPct?: string;

  @IsOptional() @IsString() description?: string;

  @IsString() userId: string;
  @IsOptional() @IsString() supplierId?: string;

  @IsOptional() @IsString() originType?: string;
  @IsOptional() @IsString() originId?: string;
}