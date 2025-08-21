import { Injectable } from "@nestjs/common";
import { CreateStockDto } from "./dto/create-stock.dto";
import { UpdateStockDto } from "./dto/update-stock.dto";
import { ListStockMovementsDto } from "./dto/list-stock-movements.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class StockService {
	constructor(private readonly prismaService: PrismaService) {}

	create(createStockDto: CreateStockDto) {
		return "This action adds a new stock";
	}

	async findAll(request: ListStockMovementsDto) {
		const { productId, movmentType, startDate, endDate, perPage, page } =
			request;

		const where: Prisma.StockMovementWhereInput = {};

		if (productId) {
			where.productId = productId;
		}

		if (movmentType) {
			where.type = movmentType as any;
		}

		if (startDate || endDate) {
			where.createdAt = {};
			if (startDate) {
				where.createdAt.gte = new Date(startDate);
			}
			if (endDate) {
				where.createdAt.lte = new Date(endDate);
			}
		}

		const pageNumber = Number(page) || 1;
		const perPageNumber = Number(perPage) || 10;
		const skip = (pageNumber - 1) * perPageNumber;

		const [data, total] = await Promise.all([
			this.prismaService.stockMovement.findMany({
				where,
				skip,
				take: perPageNumber,
				include: {
					product: {
						select: {
							id: true,
							name: true,
							brand: true,
							unit: true,
						},
					},
					user: {
						select: {
							id: true,
							fullName: true,
							email: true,
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			}),
			this.prismaService.stockMovement.count({ where }),
		]);

		const transformedData = data.map((movement) => ({
			...movement,
			quantity: Number(movement.quantity),
			unitCost: movement.unitCost ? Number(movement.unitCost) : null,
			unitSalePrice: movement.unitSalePrice
				? Number(movement.unitSalePrice)
				: null,
			totalCost: movement.totalCost ? Number(movement.totalCost) : null,
			totalRevenue: movement.totalRevenue
				? Number(movement.totalRevenue)
				: null,
		}));

		return {
			data: transformedData,
			total,
			page: pageNumber,
			perPage: perPageNumber,
			totalPages: Math.ceil(total / perPageNumber),
		};
	}

	findOne(id: number) {}

	update(id: number, updateStockDto: UpdateStockDto) {
		return `This action updates a #${id} stock`;
	}

	remove(id: number) {
		return `This action removes a #${id} stock`;
	}
}
