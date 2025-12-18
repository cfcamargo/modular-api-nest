import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { CreateOrderDto } from './dto/create-order.dto';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { OrdersService } from './order.service';
import { OrderRequestDTO } from './dto/order-request.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  findAll(@Query() request: OrderRequestDTO) {
    return this.ordersService.findAll(request);
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
