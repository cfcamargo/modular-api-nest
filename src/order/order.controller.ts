import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CreateOrderDto } from './dto/create-order.dto';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { OrdersService } from './order.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post(':id/shipments')
  createShipment(
    @Param('id') id: string,
    @Body() createShipmentDto: CreateShipmentDto,
  ) {
    return this.ordersService.createShipment(id, createShipmentDto);
  }
}
