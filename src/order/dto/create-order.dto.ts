import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class OrderItemDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;
}

export class CreateOrderDto {
  @IsUUID()
  clientId: string;

  @IsUUID()
  userId: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  observation?: string;

  @IsNumber()
  @Min(0)
  shippingCost: number;

  @IsNumber()
  @Min(0)
  totalDiscount: number;

  @IsEnum(OrderStatus)
  status: OrderStatus; // O front decide se salva como DRAFT ou CONFIRMED

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
