import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, ProductionStatus } from '@prisma/client';
import { CreateProductionOrderDto } from './dto/create-production.dto';
import { ProductRequestDTO } from 'src/products/dto/product-request.dto';
import { ProductionRequestDto } from './dto/production-request.dto';

@Injectable()
export class ProductionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductionOrderDto) {
    console.log(dto);

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado.');
    }

    const deadline = new Date(dto.deadline);
    deadline.setUTCHours(12);

    return this.prisma.productionOrder.create({
      data: {
        productId: dto.productId,
        quantity: dto.quantity,
        deadline,
        status: ProductionStatus.PENDING,
      },
    });
  }

  async test() {
    return this.prisma.productionOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            unit: true,
          },
        },
      },
    });
  }

  async findAll(request: ProductionRequestDto) {
    const { page = 1, perPage = 20, searchTerm, status } = request;
    const skip = (Number(page) - 1) * Number(perPage);

    const where: Prisma.ProductionOrderWhereInput = {};

    if (searchTerm) {
      where.product = {
        name: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      };
    }

    if (status) {
      where.status = {
        equals: status,
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.productionOrder.findMany({
        where,
        skip,
        take: Number(perPage),
        include: {
          product: true,
        },
      }),

      this.prisma.productionOrder.count({ where }),
    ]);

    return {
      orders: data,
      meta: {
        total,
        page,
        perPage,
        lastPage: Math.ceil(total / perPage),
      },
    };
  }

  async updateStatus(id: string, newStatus: ProductionStatus) {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Ordem de produção não encontrada.');
    }

    if (
      order.status === ProductionStatus.COMPLETED ||
      order.status === ProductionStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Não é possível alterar o status de uma ordem já Finalizada ou Cancelada.',
      );
    }

    if (newStatus === ProductionStatus.COMPLETED) {
      return this.prisma.$transaction(async (tx) => {
        const updatedOrder = await tx.productionOrder.update({
          where: { id },
          data: { status: ProductionStatus.COMPLETED },
        });

        await tx.product.update({
          where: { id: order.productId },
          data: {
            stockOnHand: {
              increment: order.quantity,
            },
          },
        });

        return updatedOrder;
      });
    } else {
      return this.prisma.productionOrder.update({
        where: { id },
        data: { status: newStatus },
      });
    }
  }
}
