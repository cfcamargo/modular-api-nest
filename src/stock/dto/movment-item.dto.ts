import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  Min,
  IsOptional,
} from 'class-validator';

export class MovementItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  name: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  cost?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  salePrice?: number;
}
