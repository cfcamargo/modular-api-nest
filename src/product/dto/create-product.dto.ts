import { IsNumber, IsOptional, IsString, Min, MinLength } from "class-validator";
import { ProductUnitType } from "src/common/_types/ProductUnity";

export class CreateProductDto {
	@IsString()
  @MinLength(3)
	name: string;

	@IsString()
  @IsOptional()
	description: string;

	@IsString()
	brand: string;

	@IsString()
	unit: ProductUnitType;

	@IsNumber()
	@Min(0)
	marginPercent: number;
}
