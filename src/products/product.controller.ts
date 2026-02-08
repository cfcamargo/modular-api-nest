import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { AuthGuard } from '@nestjs/passport';
import { ProductRequestDTO } from './dto/product-request.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/uptade-product.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  findAll(@Query() request: ProductRequestDTO) {
    return this.productService.findAll(request);
  }

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Delete(':id')
  destroy(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() createProductDto: UpdateProductDto) {
    return this.productService.update(id, createProductDto);
  }
}
