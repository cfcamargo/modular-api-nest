import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  Get,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateEntryMovementDto } from './dto/create-entry-movement.dto';
import { StockMovementQueryDto } from './dto/stock-movement-query.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('stock-movements')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  getAllMovments(@Query() dto: StockMovementQueryDto) {
    return this.stockService.listMovments(dto);
  }

  @Post('/create-entry')
  createEntry(@Body() dto: CreateEntryMovementDto) {
    return this.stockService.createEntryMovement(dto.userId, dto);
  }

  @Post('/create-out')
  createOut(@Body() dto: CreateEntryMovementDto) {
    return this.stockService.createOutMovement(dto.userId, dto);
  }

  // @Post(':id/reverse')
  // reverse(@Param('id') id: string, @Body('userId') userId: string) {
  //   return this.stockService.reverseMovement(id, userId);
  // }
}
