import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { StatusEnum } from "src/utils/enums/StatusEnum";
import { ProductRequestDTO } from "./dto/product-request.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class ProductService {
	constructor(private readonly prismaService: PrismaService) {}

	async create(createProductDto: CreateProductDto) {
		const status = StatusEnum.ACTIVE;

		return this.prismaService.product.create({
			data: {
				status,
				...createProductDto,
			},
		});
	}

	async findAll(request: ProductRequestDTO) {
		const { page = 1, perPage = 20, searchTerm } = request;
		const pageNumber = Number(page) || 1;
		const perPageNumber = Number(perPage) || 20;
		const skip = (pageNumber - 1) * perPageNumber;

		const where: Prisma.ProductWhereInput = {};

		if (searchTerm) {
			where.name = {
				contains: searchTerm,
				mode: "insensitive",
			};
		}

		const [data, total] = await Promise.all([
			this.prismaService.product.findMany({
				where,
				skip,
				take: perPageNumber,
			}),

			this.prismaService.product.count({ where }),
		]);

		const transformedData = data.map((product) => ({
			...product,
		}));

		return {
			data: transformedData,
			total,
			page: pageNumber,
			perPage: perPageNumber,
			lastPage: Math.ceil(total / perPageNumber),
		};
	}

	async findOne(id: string) {
		const product = await this.prismaService.product.findFirst({
			where: {
				id,
			},
		});

		if (!product) {
			throw new NotFoundException("Produto não encontrado");
		}

		return {
			product,
		};
	}

	async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.prismaService.product.findUnique({
      where: {
        id
      }
    })

    if(!product){
      throw new NotFoundException("Produto nao encontrato")
    }

		return await this.prismaService.product.update({
			where: { id },
			data: updateProductDto,
		});
	}

	async remove(id: string) {
		return await this.prismaService.product.delete({
			where: { id },
		});
	}
}
