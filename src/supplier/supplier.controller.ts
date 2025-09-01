import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	Query,
	UseGuards,
} from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { ListSuppliersDto } from './dto/list-suppliers.dto';
import { JwtAuthGuard } from '../auth/guards/authToken.guard';

@Controller('suppliers')
@UseGuards(JwtAuthGuard)
export class SupplierController {
	constructor(private readonly supplierService: SupplierService) {}

	@Post()
	create(@Body() createSupplierDto: CreateSupplierDto) {
		return this.supplierService.create(createSupplierDto);
	}

	@Get()
	findAll(@Query() query: ListSuppliersDto) {
		return this.supplierService.findAll(query);
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.supplierService.findOne(id);
	}

	@Patch(':id')
	update(@Param('id') id: string, @Body() updateSupplierDto: UpdateSupplierDto) {
		return this.supplierService.update(id, updateSupplierDto);
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.supplierService.remove(id);
	}
}