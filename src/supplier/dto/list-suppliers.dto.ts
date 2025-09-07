import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class ListSuppliersDto {
	@IsString()
	@IsOptional()
	searchTerm?: string;

	@Transform(({ value }) => Number(value) || 20)
	@IsInt()
	@Min(5)
	perPage: number = 20;

	@Transform(({ value }) => Number(value) || 1)
	@IsInt()
	@Min(1)
	page: number = 1;
}