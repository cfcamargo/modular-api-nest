import {
  Controller, Post,
  Body, Param, UseGuards,
  Query,
  Get
} from "@nestjs/common";
import { StockService } from "./stock.service";
import { CreateStockMovementDto } from "./dto/create-stock-movement.dto";
import { AuthGuard } from "@nestjs/passport";
import { ListMovementsDto } from "./dto/list-stock-movements.dto";

@UseGuards(AuthGuard("jwt"))
@Controller("stock-movements")
export class StockController {
	constructor(private readonly stockService: StockService) {}

  @Get()
  getAllMovments(@Query() dto: ListMovementsDto) {
    return this.stockService.listMovments(dto)
  }

	@Post()
  create(@Body() dto: CreateStockMovementDto) {
    return this.stockService.createMovement(dto);
  }

  @Post(':id/reverse')
  reverse(@Param('id') id: string, @Body('userId') userId: string) {
    return this.stockService.reverseMovement(id, userId);
  }
}
