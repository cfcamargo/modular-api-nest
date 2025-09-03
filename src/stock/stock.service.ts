// stock.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, StockMovementType } from '@prisma/client';
import { ListMovementsDto } from './dto/list-stock-movements.dto';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  private isEntry(type: StockMovementType) {
    return ['PURCHASE','ADJUST_IN','RETURN_FROM_CLIENT','TRANSFER_IN'].includes(type);
  }

  async createMovement(dto: CreateStockMovementDto) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: dto.productId },
        select: { id: true, stockOnHand: true, avgUnitCost: true },
      });
      if (!product) throw new NotFoundException('Produto não encontrado');

      const qty = new Decimal(dto.quantity);
      if (qty.lte(0)) throw new BadRequestException('Quantidade deve ser > 0');

      const isEntry = this.isEntry(dto.type);

      if (isEntry) {
        if (dto.unitCost == null) {
          throw new BadRequestException('unitCost é obrigatório em entradas');
        }
      } else {
        if (new Decimal(product.stockOnHand).lt(qty)) {
          throw new BadRequestException('Estoque insuficiente');
        }
      }

      let unitSalePrice: Decimal | null = dto.unitSalePrice ? new Decimal(dto.unitSalePrice) : null;
      let unitCost: Decimal | null = dto.unitCost ? new Decimal(dto.unitCost) : null;

      if (!unitSalePrice && dto.marginPct && unitCost) {
        const margin = new Decimal(dto.marginPct);
        unitSalePrice = unitCost.mul(margin.plus(1));
      }

      let totalCost: Decimal | null = null;
      let totalRevenue: Decimal | null = null;

      let newStockOnHand = new Decimal(product.stockOnHand);
      let newAvgCost = new Decimal(product.avgUnitCost);

      if (isEntry) {
        totalCost = unitCost!.mul(qty);
        const oldValue = newAvgCost.mul(newStockOnHand);
        const newValue = oldValue.plus(totalCost);
        newStockOnHand = newStockOnHand.plus(qty);
        newAvgCost = newStockOnHand.gt(0) ? newValue.div(newStockOnHand) : new Decimal(0);
      } else {
        totalCost = newAvgCost.mul(qty); // CMV
        if (unitSalePrice) totalRevenue = unitSalePrice.mul(qty);
        newStockOnHand = newStockOnHand.minus(qty);
        // avg permanece
      }

      const movement = await tx.stockMovement.create({
        data: {
          productId: dto.productId,
          type: dto.type,
          quantity: qty,
          unitCost: unitCost,
          unitSalePrice: unitSalePrice,
          totalCost: totalCost,
          totalRevenue: totalRevenue,
          marginPct: dto.marginPct ? new Decimal(dto.marginPct) : null,
          description: dto.description ?? null,
          userId: dto.userId,
          supplierId: dto.supplierId ?? null,
          originType: dto.originType ?? null,
          originId: dto.originId ?? null,
        },
      });

      await tx.product.update({
        where: { id: product.id },
        data: {
          stockOnHand: newStockOnHand,
          avgUnitCost: newAvgCost,
        },
      });

      return movement;
    });
  }

  async reverseMovement(movementId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const m = await tx.stockMovement.findUnique({ where: { id: movementId }});
      if (!m) throw new NotFoundException('Movimentação não encontrada');
      if (m.reversedAt) throw new BadRequestException('Movimentação já estornada');

      const oppositeType: StockMovementType = ((): any => {
        switch (m.type) {
          case 'PURCHASE': return 'RETURN_TO_SUPPLIER';
          case 'RETURN_TO_SUPPLIER': return 'PURCHASE';
          case 'SALE': return 'RETURN_FROM_CLIENT';
          case 'RETURN_FROM_CLIENT': return 'SALE';
          case 'ADJUST_IN': return 'ADJUST_OUT';
          case 'ADJUST_OUT': return 'ADJUST_IN';
          case 'TRANSFER_IN': return 'TRANSFER_OUT';
          case 'TRANSFER_OUT': return 'TRANSFER_IN';
        }
      })();

      const reversed = await this.createMovement({
        productId: m.productId,
        type: oppositeType,
        quantity: m.quantity.toString(),
        unitCost: m.unitCost?.toString(),
        unitSalePrice: m.unitSalePrice?.toString(),
        marginPct: m.marginPct?.toString(),
        description: `Estorno de ${m.id}`,
        userId,
        supplierId: m.supplierId ?? undefined,
        originType: 'REVERSAL',
        originId: m.id,
      });

      await tx.stockMovement.update({
        where: { id: m.id },
        data: { reversedAt: new Date(), reversedById: reversed.id },
      });

      return reversed;
    });
  }

  async listMovments(dto: ListMovementsDto){
    let createdAt: Prisma.DateTimeFilter | undefined;
    if (dto.from || dto.to) {
      createdAt = {};
      if (dto.from) createdAt.gte = new Date(dto.from); 
      if (dto.to) {
        const end = new Date(dto.to);
        end.setHours(23, 59, 59, 999);                
        createdAt.lte = end;
      }
    }

    const where: Prisma.StockMovementWhereInput = {
      ...(dto.productId ? { productId: dto.productId } : {}),
      ...(dto.type ? { type: dto.type } : {}),
      ...(createdAt ? { createdAt } : {}),
    };

    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 20;
    const skip = (page - 1) * perPage;
    const take = perPage;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.stockMovement.count({ where }),
      this.prisma.stockMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          product: true,
          supplier: true,
          user: true,
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const currentPage = Math.min(page, totalPages);

    return {
      data: items,
      page: currentPage,
      perPage,
      total,
      totalPages,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
    };
  }
}
