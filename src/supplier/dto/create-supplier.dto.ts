import { IsEnum, IsNotEmpty, IsString, MinLength } from "class-validator";
import { SupplierType } from "@prisma/client";

export class CreateSupplierDto {
	@IsString()
	@IsNotEmpty()
	@MinLength(3)
	socialName: string;

	@IsString()
	@IsNotEmpty()
	@MinLength(11)
	document: string;

	@IsNotEmpty()
	@IsEnum(SupplierType)
	type: SupplierType;
}