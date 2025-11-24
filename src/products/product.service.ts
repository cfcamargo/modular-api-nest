import { PrismaService } from 'src/prisma/prisma.service';
import { ProductRequestDTO } from './dto/product-request.dto';
import { Prisma } from '@prisma/client';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { StatusEnum } from 'src/utils/enums/StatusEnum';

@Injectable()
export class ProductService {
  constructor(private readonly prismaService: PrismaService) {}

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
      products: data,
      meta: {
        total,
        page,
        perPage,
        lastPage: Math.ceil(total / perPage),
      },
    };
  }

  async create(request: CreateProductDto) {
    const { initialStock, ...productRequest } = request;
    const product = await this.prismaService.product.findFirst({
      where: {
        name: request.name,
      },
    });

    if (product) {
      throw new ConflictException('Ja existe um produto com esse nome.');
    }

    try {
      const response = await this.prismaService.product.create({
        data: {
          status: StatusEnum.ACTIVE,
          stockOnHand: initialStock,
          ...productRequest,
        },
      });

      return {
        product: response,
      };
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException('Erro ao criar produto.');
    }
  }

  async findOne(id: string) {
    const product = await this.prismaService.product.findFirst({
      where: {
        id,
      },
    });

    if (!product) {
      throw new NotFoundException(
        'Produto não existe, ou não encontrado no BD',
      );
    }

    return product;
  }

  async remove(id: string) {
    const client = await this.prismaService.product.findUnique({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    await this.prismaService.product.delete({
      where: { id },
    });

    return { status: 200, message: 'ok' };
  }
}
