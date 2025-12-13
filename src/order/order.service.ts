import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service'; // Ajuste o import
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { OrderStatus } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
@UseGuards(AuthGuard('jwt'))
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto) {
    let totalItems = 0;

    const itemsData = dto.items.map((item) => {
      const subtotal = item.quantity * item.price;
      totalItems += subtotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        subtotal: subtotal,
      };
    });

    const finalTotal = totalItems + dto.shippingCost - dto.totalDiscount;

    return await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          clientId: dto.clientId,
          address: dto.address,
          observation: dto.observation,
          status: dto.status,
          shippingCost: dto.shippingCost,
          totalDiscount: dto.totalDiscount,
          totalItems: totalItems,
          finalTotal: finalTotal < 0 ? 0 : finalTotal,
          items: { create: itemsData },
          userId: dto.userId,
        },
        include: { items: true },
      });

      if (dto.status === OrderStatus.CONFIRMED) {
        for (const item of dto.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockOnHand: { decrement: item.quantity } },
          });
        }
      }

      return order;
    });
  }

  async createShipment(orderId: string, dto: CreateShipmentDto) {
    return await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) throw new NotFoundException('Pedido não encontrado.');

      if (
        order.status === OrderStatus.DRAFT ||
        order.status === OrderStatus.CANCELLED
      ) {
        throw new BadRequestException(
          'Status do pedido inválido para entrega.',
        );
      }

      const shipmentItemsData: {
        orderItemId: string;
        productId: string;
        quantity: number;
      }[] = [];

      for (const shipItem of dto.items) {
        const orderItem = order.items.find(
          (i) => i.productId === shipItem.productId,
        );

        if (!orderItem) {
          throw new BadRequestException(
            `Produto ${shipItem.productId} não pertence a este pedido.`,
          );
        }

        const remainingQty = orderItem.quantity - orderItem.deliveredQuantity;

        if (shipItem.quantity > remainingQty) {
          throw new BadRequestException(
            `Erro: Tentando entregar ${shipItem.quantity} do produto (ID: ${shipItem.productId}), mas só restam ${remainingQty}.`,
          );
        }

        shipmentItemsData.push({
          orderItemId: orderItem.id,
          productId: shipItem.productId,
          quantity: shipItem.quantity,
        });

        await tx.orderItem.update({
          where: { id: orderItem.id },
          data: { deliveredQuantity: { increment: shipItem.quantity } },
        });
      }

      const shipment = await tx.orderShipment.create({
        data: {
          orderId: order.id,
          driverName: dto.driverName,
          items: { create: shipmentItemsData },
        },
      });

      const updatedOrderItems = await tx.orderItem.findMany({
        where: { orderId: order.id },
      });

      const hasPendingItems = updatedOrderItems.some(
        (item) => item.quantity > item.deliveredQuantity,
      );

      const newStatus = hasPendingItems
        ? OrderStatus.SHIPMENT
        : OrderStatus.DONE;

      if (order.status !== newStatus) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: newStatus },
        });
      }

      return shipment;
    });
  }

  async findAll() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, name: true } },
        items: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        client: true,
        items: { include: { product: true } },
        shipments: { include: { items: true } },
      },
    });
  }
}
