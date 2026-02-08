import { OrderStatus } from "@prisma/client";
import { IsEnum, IsString } from "class-validator";

export class ChangeStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsString()
  id: string;
}