import { OrderStatus } from "@prisma/client";
import { IsEnum, IsString } from "class-validator";

export class ChangeStatusDto {
  @IsString()
  status: string;

  @IsString()
  id: string;
}