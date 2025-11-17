import { IsInt, IsString, Min, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class OrderRequestDTO {
  @Transform(({ value }) => Number(value) || 20)
  @IsInt()
  @Min(5)
  perPage: number = 20;

  @Transform(({ value }) => Number(value) || 1)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @IsString()
  searchTerm?: string;
}
