// src/orders/order.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus, Prisma, StockMovementType } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { ConfirmOrderDto } from './dto/confirm-orderd.dto';
import { OrderRequestDTO } from './dto/order-request.dto';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  private calcTotal(order: {
    items: Array<{ totalPrice: any }>;
    freight?: any;
    discount?: any;
  }) {
    const itemsTotal =
      order.items?.reduce((sum, it) => sum + Number(it.totalPrice ?? 0), 0) ??
      0;

    const freight = order.freight ? Number(order.freight) : 0;
    const discount = order.discount ? Number(order.discount) : 0;

    return itemsTotal + freight - discount;
  }

  async findAll(request: OrderRequestDTO) {
    const { page = 1, perPage = 20, searchTerm } = request;
    const pageNumber = Number(page) || 1;
    const perPageNumber = Number(perPage) || 20;
    const skip = (pageNumber - 1) * perPageNumber;

    const where: Prisma.OrderWhereInput = {};

    if (searchTerm) {
      where.client = {
        name: searchTerm,
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          client: true,
          user: true,
          items: true,
        },
        where,
        skip,
        take: perPageNumber,
      }),

      this.prisma.order.count({ where }),
    ]);

    // const orders = await this.prisma.order.findMany({
    //   orderBy: { createdAt: 'desc' },
    //   include: {
    //     client: true,
    //     user: true,
    //     items: true,
    //   },
    // });

    // return orders.map((order) => ({
    //   ...order,
    //   total: this.calcTotal(order),
    // }));

    const transformedData = data.map((order) => ({
      ...order,
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
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        client: true,
        user: true,
        items: {
          include: {
            product: true,
          },
        },
        stockMovement: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      ...order,
      total: this.calcTotal(order),
    };
  }

  /**
   * Cria pedido já com itens
   * Se vier status = CONFIRMED, já gera movimento e baixa estoque
   */
  async create(dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order items are required');
    }

    const status = dto.status ?? OrderStatus.DRAFT;

    // vamos fazer tudo em transação
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. cria pedido
      const order = await tx.order.create({
        data: {
          clientId: dto.clientId,
          userId: dto.userId,
          orderDate: dto.orderDate ? new Date(dto.orderDate) : new Date(),
          status,
          freight: dto.freight ?? 0,
          discount: dto.discount ?? 0,
        },
      });

      // 2. cria itens
      for (const item of dto.items) {
        const totalPrice = item.quantity * item.unitPrice;

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice,
          },
        });
      }

      // 3. se for CONFIRMED já gera movimento
      if (status === OrderStatus.CONFIRMED) {
        const movement = await tx.movement.create({
          data: {
            type: StockMovementType.SELL,
            userId: dto.userId,
            notes: `Saída gerada automaticamente a partir do pedido ${order.id}`,
          },
        });

        // pega itens do pedido
        const orderItems = await tx.orderItem.findMany({
          where: { orderId: order.id },
        });

        for (const item of orderItems) {
          // cria item de movimento
          await tx.movementItem.create({
            data: {
              movementId: movement.id,
              productId: item.productId,
              quantity: item.quantity,
              salePrice: item.unitPrice,
            },
          });

          // baixa estoque
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockOnHand: {
                decrement: item.quantity,
              },
            },
          });
        }

        // amarra movimento no pedido
        await tx.order.update({
          where: { id: order.id },
          data: {
            movementId: movement.id,
          },
        });
      }

      // volta o pedido completo
      const fullOrder = await tx.order.findUnique({
        where: { id: order.id },
        include: {
          client: true,
          user: true,
          items: true,
          stockMovement: true,
        },
      });

      return fullOrder!;
    });

    return {
      ...result,
      total: this.calcTotal(result),
    };
  }

  /**
   * Atualizar pedido (inclusive itens)
   * Se status mudar pra CONFIRMED aqui, também gera movimento
   */
  async update(id: string, dto: UpdateOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const nextStatus = dto.status ?? order.status;

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          clientId: dto.clientId ?? order.clientId,
          userId: dto.userId ?? order.userId,
          orderDate: dto.orderDate ? new Date(dto.orderDate) : order.orderDate,
          status: nextStatus,
          freight: dto.freight ?? order.freight,
          discount: dto.discount ?? order.discount,
        },
      });

      // 2. se vier items, vamos simplificar: apagar e recriar
      if (dto.items) {
        await tx.orderItem.deleteMany({
          where: { orderId: id },
        });

        for (const item of dto.items) {
          const totalPrice = item.quantity * item.unitPrice;
          await tx.orderItem.create({
            data: {
              orderId: id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice,
            },
          });
        }
      }

      // 3. se o status virou CONFIRMED agora e ainda não tem movimento, cria
      if (nextStatus === OrderStatus.CONFIRMED && !order.movementId) {
        const movement = await tx.movement.create({
          data: {
            type: StockMovementType.SELL,
            userId: updatedOrder.userId,
            notes: `Saída gerada automaticamente a partir do pedido ${id}`,
          },
        });

        const orderItems = await tx.orderItem.findMany({
          where: { orderId: id },
        });

        for (const item of orderItems) {
          await tx.movementItem.create({
            data: {
              movementId: movement.id,
              productId: item.productId,
              quantity: item.quantity,
              salePrice: item.unitPrice,
            },
          });

          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockOnHand: {
                decrement: item.quantity,
              },
            },
          });
        }

        await tx.order.update({
          where: { id },
          data: {
            movementId: movement.id,
          },
        });
      }

      const fullOrder = await tx.order.findUnique({
        where: { id },
        include: {
          client: true,
          user: true,
          items: true,
          stockMovement: true,
        },
      });

      return fullOrder!;
    });

    return {
      ...updated,
      total: this.calcTotal(updated),
    };
  }

  async confirm(id: string, dto: ConfirmOrderDto, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (order.status === OrderStatus.CONFIRMED) {
      throw new BadRequestException('Order already confirmed');
    }

    await this.prisma.$transaction(async (tx) => {
      // cria movimento
      const movement = await tx.movement.create({
        data: {
          type: StockMovementType.SELL,
          userId,
          notes:
            dto.notes ??
            `Saída gerada automaticamente a partir do pedido ${id}`,
        },
      });

      // cria itens de movimento + baixa estoque
      for (const item of order.items) {
        await tx.movementItem.create({
          data: {
            movementId: movement.id,
            productId: item.productId,
            quantity: item.quantity,
            salePrice: item.unitPrice,
          },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockOnHand: {
              decrement: item.quantity,
            },
          },
        });
      }

      await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.CONFIRMED,
          movementId: movement.id,
          notes: dto.notes ?? order.notes,
        },
      });
    });

    return this.findOne(id);
  }

  async delete(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    if (order.status !== OrderStatus.DRAFT) {
      throw new BadRequestException('Only draft orders can be deleted');
    }

    await this.prisma.orderItem.deleteMany({
      where: { orderId: id },
    });

    await this.prisma.order.delete({
      where: { id },
    });

    return { deleted: true };
  }
}
