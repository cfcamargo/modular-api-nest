import {
  ArrayMinSize,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { StockMovementType } from '@prisma/client';
import { Type } from 'class-transformer';
import { MovementItemDto } from './movment-item.dto';

export class CreateEntryMovementDto {
  @IsEnum(StockMovementType) type: StockMovementType;

  @IsOptional() @IsString() description?: string;

  @IsString() userId: string;
  @IsOptional() @IsString() supplierId?: string;

  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MovementItemDto)
  products: MovementItemDto[];
}
