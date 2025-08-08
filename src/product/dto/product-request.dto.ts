import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class ProductRequestDTO {
  @IsInt()
  @Min(5)
  perPage: number;

  @IsInt()
  @Min(1)
  page: number;

  @IsString()
  @MinLength(3)
  searchTerm: string;
}
