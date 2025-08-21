import {
	IsDateString,
	IsInt,
	IsOptional,
	IsString,
	Min,
} from "class-validator";
import { Transform } from "class-transformer";

export class ListStockMovementsDto {
	@IsString()
	@IsOptional()
	productId?: string;

	@IsString()
	@IsOptional()
	movmentType?: string;

	@IsDateString()
	@IsOptional()
	startDate?: string;

	@IsDateString()
	@IsOptional()
	endDate?: string;

	@Transform(({ value }) => Number(value) || 10)
	@IsInt()
	@Min(5)
	perPage: number = 10;

	@Transform(({ value }) => Number(value) || 1)
	@IsInt()
	@Min(1)
	page: number = 1;
}
