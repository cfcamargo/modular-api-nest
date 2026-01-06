import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { CreateOrderDto } from './dto/create-order.dto';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { OrdersService } from './order.service';
import { OrderRequestDTO } from './dto/order-request.dto';
import { OrderStatus } from '@prisma/client';
import { ChangeStatusDto } from './dto/change-status.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Post(':id')
  cancel(@Param('id') id: string) {
    return this.ordersService.cancelOrder(id);
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

  @Patch('/status')
  changeStatus(
    @Body() dto: ChangeStatusDto,
  ) {
    return this.ordersService.changeStatus(dto.id, dto.status as OrderStatus);
  } 
}
