import { ProductionStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateProductionStatusDto {
  @IsEnum(ProductionStatus)
  status: ProductionStatus;
}
