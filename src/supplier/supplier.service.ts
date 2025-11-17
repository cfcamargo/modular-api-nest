import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { ListSuppliersDto } from './dto/list-suppliers.dto';
import { StatusEnum } from 'src/utils/enums/StatusEnum';
import { SupplierType } from '@prisma/client';

@Injectable()
export class SupplierService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSupplierDto: CreateSupplierDto) {
    const status = StatusEnum.ACTIVE;

    const type =
      createSupplierDto.type === 'cnpj' ? SupplierType.CNPJ : SupplierType.CPF;

    return this.prisma.supplier.create({
      data: {
        document: createSupplierDto.document,
        name: createSupplierDto.name,
        fantasyName: createSupplierDto.fantasyName,
        status,
        type,
      },
    });
  }

  async findAll(query: ListSuppliersDto) {
    const pageNumber = Number(query.page) || 1;
    const perPageNumber = Number(query.perPage) || 20;
    const skip = (pageNumber - 1) * perPageNumber;

    const where = query.searchTerm
      ? {
          OR: [
            {
              socialName: {
                contains: query.searchTerm,
                mode: 'insensitive' as const,
              },
            },
            {
              document: {
                contains: query.searchTerm,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {};

    const [suppliers, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: perPageNumber,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    const lastPage = Math.ceil(total / perPageNumber);

    return {
      data: suppliers,
      total,
      page: pageNumber,
      perPage: perPageNumber,
      lastPage,
    };
  }

  // async findOne(id: string) {
  //   const supplier = await this.prisma.supplier.findUnique({
  //     where: { id },
  //     include: {
  //       stockMovements: {
  //         include: {
  //           product: true,
  //           user: { select: { id: true, fullName: true } },
  //         },
  //         orderBy: { createdAt: 'desc' },
  //       },
  //     },
  //   });

  //   if (!supplier) {
  //     throw new NotFoundException('Fornecedor não encontrado');
  //   }

  //   return supplier;
  // }

  async update(id: string, updateSupplierDto: UpdateSupplierDto) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    const type =
      updateSupplierDto.type === 'cnpj' ? SupplierType.CNPJ : SupplierType.CPF;

    return this.prisma.supplier.update({
      where: { id },
      data: {
        document: updateSupplierDto.document,
        fantasyName: updateSupplierDto.fantasyName,
        name: updateSupplierDto.name,
        type: type,
      },
    });
  }

  async remove(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        stockMovements: true,
      },
    });

    if (!supplier) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    if (supplier.stockMovements.length > 0) {
      throw new Error(
        'Não é possível excluir fornecedor com movimentações de estoque',
      );
    }

    return this.prisma.supplier.delete({
      where: { id },
    });
  }
}
