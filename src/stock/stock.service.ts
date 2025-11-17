// stock.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEntryMovementDto } from './dto/create-entry-movement.dto';
import { MovementItem, Prisma, StockMovementType } from '@prisma/client';
import { StockMovementQueryDto } from './dto/stock-movement-query.dto';

const VALID_OUT_TYPES = [
  StockMovementType.SELL,
  StockMovementType.ADJUST_OUT,
  StockMovementType.RETURN,
] as const;

const CMP_REQUIRED_TYPES = [
  StockMovementType.BUY,
  StockMovementType.PRODUCTION,
] as const;

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  async listMovments(request: StockMovementQueryDto) {
    const { page = 1, perPage = 20 } = request;
    const pageNumber = Number(page) || 1;
    const perPageNumber = Number(perPage) || 20;
    const skip = (pageNumber - 1) * perPageNumber;

    const where: Prisma.MovementWhereInput = {};

    if (request.type) {
      where.type = request.type;
    }

    if (request.initialDate || request.endDate) {
      where.movementDate = {};

      if (request.initialDate) {
        where.movementDate.gte = new Date(request.initialDate);
      }

      if (request.endDate) {
        const end = new Date(request.endDate);
        end.setHours(23, 59, 59, 999);
        where.movementDate.lte = end;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.movement.findMany({
        where,
        skip,
        take: perPageNumber,
        orderBy: { movementDate: 'desc' },
        include: {
          supplier: true,
          order: true,
        },
      }),

      this.prisma.movement.count({ where }),
    ]);

    return {
      data,
      total,
      page: pageNumber,
      perPage: perPageNumber,
      lastPage: Math.ceil(total / perPageNumber),
    };
  }

  async createEntryMovement(userId: string, data: CreateEntryMovementDto) {
    const { type, supplierId, description, products } = data;
    return this.prisma.$transaction(async (tx) => {
      const movement = await tx.movement.create({
        data: {
          type: type,
          movementDate: new Date(),
          notes: description,
          userId: userId,
          supplierId: supplierId || null,
        },
      });

      const movementItemsData = products.map((item) => ({
        movementId: movement.id,
        productId: item.productId,
        quantity: new Decimal(item.quantity),
        costPrice: item.cost ? new Decimal(item.cost) : null,
        salePrice: item.salePrice ? new Decimal(item.salePrice) : null,
      }));

      await tx.movementItem.createMany({
        data: movementItemsData,
      });

      for (const item of products) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { id: true, stockOnHand: true, avgUnitCost: true },
        });

        if (!product) {
          throw new BadRequestException(
            `Produto com ID ${item.productId} não encontrado. Transação revertida.`,
          );
        }

        const currentStock = product.stockOnHand.toNumber();
        const currentAvgCost = product.avgUnitCost.toNumber();
        const newQuantity = item.quantity;

        const totalStock = currentStock + newQuantity;
        let newAvgCost = currentAvgCost;

        if (
          (CMP_REQUIRED_TYPES as ReadonlyArray<StockMovementType>).includes(
            type,
          )
        ) {
          const newCost = item.cost!;

          const totalValueCurrent = currentStock * currentAvgCost;
          const totalValueNew = newQuantity * newCost;

          if (totalStock > 0) {
            newAvgCost = (totalValueCurrent + totalValueNew) / totalStock;
          } else {
            newAvgCost = 0;
          }
        }

        const updateData: { [key: string]: any } = {
          stockOnHand: new Decimal(totalStock),
          avgUnitCost: new Decimal(newAvgCost),
          updatedAt: new Date(),
        };

        await tx.product.update({
          where: { id: item.productId },
          data: updateData,
        });
      }

      return {
        ...movement,
        items: movementItemsData,
      };
    });
  }

  async createOutMovement(userId: string, data: CreateEntryMovementDto) {
    const { type, description, supplierId, products } = data;

    return this.prisma.$transaction(async (tx) => {
      const movementItemsData: {
        productId: string;
        costPrice: number;
        salePrice: number;
        quantity: number;
      }[] = [];

      for (const item of products) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: {
            stockOnHand: true,
            avgUnitCost: true,
          },
        });

        if (!product) {
          throw new BadRequestException(
            `Produto com ID ${item.productId} não encontrado. Transação revertida.`,
          );
        }

        const currentStock = product.stockOnHand.toNumber();
        const quantityToMove = item.quantity;

        if (currentStock < quantityToMove) {
          throw new BadRequestException(
            `Estoque insuficiente para o produto ${item.productId}. Disponível: ${currentStock.toFixed(2)}, Solicitado: ${quantityToMove}.`,
          );
        }

        const costPrice = product.avgUnitCost;

        let salePriceToRecord: Decimal | null = null;
        if (type === StockMovementType.SELL) {
          salePriceToRecord = item.salePrice
            ? new Decimal(item.salePrice)
            : product.avgUnitCost;

          if (!salePriceToRecord) {
            throw new BadRequestException(
              `Preço de venda é obrigatório para o produto ${item.productId} em uma venda (SELL).`,
            );
          }
        }

        const quantityTransformed = new Decimal(quantityToMove);

        movementItemsData.push({
          productId: item.productId,
          quantity: quantityTransformed.toNumber(),
          costPrice: costPrice.toNumber(),
          salePrice: salePriceToRecord!.toNumber(),
        });
      }

      const movement = await tx.movement.create({
        data: {
          type: type,
          movementDate: new Date(),
          notes: description,
          userId: userId,
          supplierId: supplierId,
          // orderId: (type === StockMovementType.SELL) ? relatedId : null, // (Descomentar futuramente)
        },
      });

      const finalItemsData = movementItemsData.map((item) => ({
        ...item,
        movementId: movement.id,
      }));

      await tx.movementItem.createMany({
        data: finalItemsData,
      });

      for (const itemData of finalItemsData) {
        const product = await tx.product.findUnique({
          where: { id: itemData.productId },
          select: { stockOnHand: true },
        });

        const newStock = product!.stockOnHand.toNumber() - itemData.quantity;

        await tx.product.update({
          where: { id: itemData.productId },
          data: {
            stockOnHand: new Decimal(newStock),
            updatedAt: new Date(),
          },
        });
      }

      return {
        ...movement,
        items: finalItemsData,
      };
    });
  }

  // async reverseMovement(movementId: string, userId: string) {
  //   return this.tx.$transaction(async (tx) => {
  //     const m = await tx.stockMovement.findUnique({
  //       where: { id: movementId },
  //     });
  //     if (!m) throw new NotFoundException('Movimentação não encontrada');
  //     if (m.reversedAt)
  //       throw new BadRequestException('Movimentação já estornada');

  //     const oppositeType: StockMovementType = ((): any => {
  //       switch (m.type) {
  //         case 'PURCHASE':
  //           return 'RETURN_TO_SUPPLIER';
  //         case 'RETURN_TO_SUPPLIER':
  //           return 'PURCHASE';
  //         case 'SALE':
  //           return 'RETURN_FROM_CLIENT';
  //         case 'RETURN_FROM_CLIENT':
  //           return 'SALE';
  //         case 'ADJUST_IN':
  //           return 'ADJUST_OUT';
  //         case 'ADJUST_OUT':
  //           return 'ADJUST_IN';
  //         case 'TRANSFER_IN':
  //           return 'TRANSFER_OUT';
  //         case 'TRANSFER_OUT':
  //           return 'TRANSFER_IN';
  //       }
  //     })();

  //     const reversed = await this.createMovement({
  //       productId: m.productId,
  //       type: oppositeType,
  //       quantity: m.quantity.toString(),
  //       unitCost: m.unitCost?.toString(),
  //       unitSalePrice: m.unitSalePrice?.toString(),
  //       marginPct: m.marginPct?.toString(),
  //       description: `Estorno de ${m.id}`,
  //       userId,
  //       supplierId: m.supplierId ?? undefined,
  //       originType: 'REVERSAL',
  //       originId: m.id,
  //     });

  //     await tx.stockMovement.update({
  //       where: { id: m.id },
  //       data: { reversedAt: new Date(), reversedById: reversed.id },
  //     });

  //     return reversed;
  //   });
  // }

  // async listMovments(dto: ListMovementsDto) {
  //   let createdAt: Prisma.DateTimeFilter | undefined;
  //   if (dto.from || dto.to) {
  //     createdAt = {};
  //     if (dto.from) createdAt.gte = new Date(dto.from);
  //     if (dto.to) {
  //       const end = new Date(dto.to);
  //       end.setHours(23, 59, 59, 999);
  //       createdAt.lte = end;
  //     }
  //   }

  //   const where: Prisma.StockMovementWhereInput = {
  //     ...(dto.productId ? { productId: dto.productId } : {}),
  //     ...(dto.type ? { type: dto.type } : {}),
  //     ...(createdAt ? { createdAt } : {}),
  //   };

  //   const page = dto.page ?? 1;
  //   const perPage = dto.perPage ?? 20;
  //   const skip = (page - 1) * perPage;
  //   const take = perPage;

  //   const [total, items] = await this.prisma.$transaction([
  //     this.prisma.stockMovement.count({ where }),
  //     this.prisma.stockMovement.findMany({
  //       where,
  //       orderBy: { createdAt: 'desc' },
  //       skip,
  //       take,
  //       include: {
  //         product: true,
  //         supplier: true,
  //         user: true,
  //       },
  //     }),
  //   ]);

  //   const totalPages = Math.max(1, Math.ceil(total / perPage));
  //   const currentPage = Math.min(page, totalPages);

  //   return {
  //     data: items,
  //     page: currentPage,
  //     perPage,
  //     total,
  //     totalPages,
  //     hasNext: currentPage < totalPages,
  //     hasPrev: currentPage > 1,
  //   };
  // }
}
