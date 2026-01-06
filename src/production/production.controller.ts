import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ProductionService } from './production.service';
import { UpdateProductionStatusDto } from './dto/update-production-status.dto';
import { CreateProductionOrderDto } from './dto/create-production.dto';
import { ProductionRequestDto } from './dto/production-request.dto';

@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Post()
  create(@Body() createDto: CreateProductionOrderDto) {
    return this.productionService.create(createDto);
  }

  @Get()
  findAll(@Query() request: ProductionRequestDto) {
    return this.productionService.findAll(request);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateProductionStatusDto,
  ) {
    return this.productionService.updateStatus(id, updateDto.status);
  }
}
