import { IsNumber, IsString, Min } from 'class-validator';
import { ProductUnitType } from 'src/common/_types/ProductUnity';

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
  costPrice: number;

  @IsNumber()
  @Min(0)
  price: number;
}

// id             String          @id @default(cuid())
//   description    String?
//   name           String
//   brand          String
//   status         Int
//   unit           Unit
//   stockMovements StockMovement[]
//   createdAt      DateTime        @default(now())
//   updatedAt      DateTime?       @updatedAt
