import {
  Controller, Post,
  Body, Param, UseGuards
} from "@nestjs/common";
import { StockService } from "./stock.service";
import { CreateStockMovementDto } from "./dto/create-stock-movement.dto";
import { AuthGuard } from "@nestjs/passport";

@UseGuards(AuthGuard("jwt"))
@Controller("stock-movements")
export class StockController {
	constructor(private readonly stockService: StockService) {}

	@Post()
  create(@Body() dto: CreateStockMovementDto) {
    return this.stockService.createMovement(dto);
  }

  @Post(':id/reverse')
  reverse(@Param('id') id: string, @Body('userId') userId: string) {
    return this.stockService.reverseMovement(id, userId);
  }
}
