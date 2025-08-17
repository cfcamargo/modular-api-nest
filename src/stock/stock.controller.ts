import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	UseGuards,
	Query,
} from "@nestjs/common";
import { StockService } from "./stock.service";
import { CreateStockDto } from "./dto/create-stock.dto";
import { UpdateStockDto } from "./dto/update-stock.dto";
import { AuthGuard } from "@nestjs/passport";
import { ListStockMovementsDto } from "./dto/list-stock-movements.dto";

@UseGuards(AuthGuard("jwt"))
@Controller("stock-movements")
export class StockController {
	constructor(private readonly stockService: StockService) {}

	@Post()
	create(@Body() createStockDto: CreateStockDto) {
		return this.stockService.create(createStockDto);
	}

	@Get()
	findAll(@Query() request: ListStockMovementsDto) {
		return this.stockService.findAll(request);
	}

	@Get(":id")
	findOne(@Param("id") id: string) {
		return this.stockService.findOne(+id);
	}

	@Patch(":id")
	update(@Param("id") id: string, @Body() updateStockDto: UpdateStockDto) {
		return this.stockService.update(+id, updateStockDto);
	}

	@Delete(":id")
	remove(@Param("id") id: string) {
		return this.stockService.remove(+id);
	}
}
