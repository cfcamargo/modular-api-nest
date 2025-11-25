import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductionOrderDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1, { message: 'A quantidade deve ser no mínimo 1' })
  quantity: number;

  @IsDateString()
  deadline: string;
}
