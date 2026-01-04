import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service'; // Ajuste o import
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { OrderStatus, Prisma } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { OrderRequestDTO } from './dto/order-request.dto';
import { StatusEnum } from 'src/utils/enums/StatusEnum';

@Injectable()
@UseGuards(AuthGuard('jwt'))
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

 async create(dto: CreateOrderDto) {
    let totalItemsCount = 0;
    let itemsTotalValue = 0;

    const itemsData = dto.items.map((item) => {
      const lineSubtotal = item.quantity * item.price;

      totalItemsCount += item.quantity;

      itemsTotalValue += lineSubtotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        subtotal: lineSubtotal,
      };
    });


    const finalTotal = itemsTotalValue + dto.shippingCost - dto.totalDiscount;

    return await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          clientId: dto.clientId,
          address: dto.address,
          observation: dto.observation,
          status: dto.status,
          shippingCost: dto.shippingCost,
          totalDiscount: dto.totalDiscount,
          totalItems: totalItemsCount, 
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

  async findAll(request: OrderRequestDTO) {
    const {
      page = 1,
      perPage = 20,
      searchTerm,
      status,
      startDate,
      endDate,
    } = request;

    const skip = (Number(page) - 1) * Number(perPage);

    // --- 1. Filtros da Listagem (Tabela) ---
    const where: Prisma.OrderWhereInput = {};

    if (searchTerm) {
      const isNumber = !isNaN(Number(searchTerm));
      where.OR = [
        { client: { name: { contains: searchTerm, mode: 'insensitive' } } },
      ];
      if (isNumber) {
        where.OR.push({ code: { equals: Number(searchTerm) } });
      }
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // --- 2. Filtro dos Contadores (Sempre Hoje) ---
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const whereToday: Prisma.OrderWhereInput = {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    // --- 3. Execução Paralela ---
    const [
      data, // 0: Dados da tabela
      total, // 1: Total da paginação
      countAllToday, // 2: Card "Total de Pedidos" (Todos)
      countDraftsToday, // 3: Card "Total Orçamentos" (Apenas Draft)
      sumSalesToday, // 4: Card "Valor Total Pedidos" (Não Draft)
      sumDraftsToday, // 5: Card "Valor Total Orçamento" (Apenas Draft)
    ] = await Promise.all([
      // 0. Lista Paginada
      this.prisma.order.findMany({
        where,
        skip,
        take: Number(perPage),
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { name: true } },
        },
      }),

      // 1. Count da Lista Paginada
      this.prisma.order.count({ where }),

      // 2. Count: Total de Pedidos (Todos os registros de hoje)
      this.prisma.order.count({
        where: whereToday,
      }),

      // 3. Count: Total Orçamentos (Status DRAFT hoje)
      this.prisma.order.count({
        where: { ...whereToday, status: 'DRAFT' },
      }),

      // 4. Sum: Valor Total Pedidos (Tudo que NÃO é DRAFT hoje)
      // Assumindo que tudo que não é draft é um pedido "real"
      this.prisma.order.aggregate({
        _sum: { finalTotal: true },
        where: {
          ...whereToday,
          status: { not: 'DRAFT' },
        },
      }),

      // 5. Sum: Valor Total Orçamento (Apenas DRAFT hoje)
      this.prisma.order.aggregate({
        _sum: { finalTotal: true },
        where: {
          ...whereToday,
          status: 'DRAFT',
        },
      }),
    ]);

    // --- 4. Retorno ---
    return {
      orders: data,
      meta: {
        total,
        page: Number(page),
        perPage: Number(perPage),
        lastPage: Math.ceil(total / Number(perPage)),
      },
      counters: {
        totalCount: countAllToday,
        totalDraftsCount: countDraftsToday,
        totalSalesValue: Number(sumSalesToday._sum.finalTotal || 0),
        totalDraftsValue: Number(sumDraftsToday._sum.finalTotal || 0),
      },
    };
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
