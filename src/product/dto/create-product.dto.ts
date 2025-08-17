import { IsNumber, IsString, Min } from "class-validator";
import { ProductUnitType } from "src/common/_types/ProductUnity";

export class CreateProductDto {
	@IsString()
	@Min(3)
	name: string;

	@IsString()
	description: string;

	@IsString()
	brand: string;

	@IsString()
	unit: ProductUnitType;

	@IsNumber()
	@Min(0)
	marginPercent: number;
}
