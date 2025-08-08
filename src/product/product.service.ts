import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { StatusEnum } from 'src/utils/enums/StatusEnum';
import { ProductRequestDTO } from './dto/product-request.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    const status = StatusEnum.ACTIVE;

    return this.prismaService.product.create({
      data: { status, ...createProductDto },
    });
  }

  async findAll(request: ProductRequestDTO) {
    const { page = 1, perPage = 20, searchTerm } = request;
    const skip = (Number(page) - 1) * Number(perPage);

    const where: Prisma.ProductWhereInput = {};

    if (searchTerm) {
      where.name = {
        contains: searchTerm,
        mode: 'insensitive',
      };
    }

    const [data, total] = await Promise.all([
      this.prismaService.product.findMany({
        where,
        skip,
        take: Number(perPage),
      }),

      this.prismaService.product.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      perPage,
      lastPage: Math.ceil(total / perPage),
    };
  }

  async findOne(id: string) {
    const product = await this.prismaService.product.findFirst({
      where: {
        id,
      },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    return {
      product,
    };
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
