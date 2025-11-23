import { PrismaService } from 'src/prisma/prisma.service';
import { ClientRequestDTO } from './dto/client-request.dto';
import { Prisma } from '@prisma/client';
import { CreateClientDto } from './dto/create-client.dto';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class ClientService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(request: ClientRequestDTO) {
    const { page = 1, perPage = 20, searchTerm } = request;
    const skip = (Number(page) - 1) * Number(perPage);

    const where: Prisma.ClientWhereInput = {};

    if (searchTerm) {
      where.name = {
        contains: searchTerm,
        mode: 'insensitive',
      };
    }

    const [data, total] = await Promise.all([
      this.prismaService.client.findMany({
        where,
        skip,
        take: Number(perPage),
      }),

      this.prismaService.client.count({ where }),
    ]);

    return {
      clients: data,
      meta: {
        total,
        page,
        perPage,
        lastPage: Math.ceil(total / perPage),
      },
    };
  }

  async create(createClientDto: CreateClientDto) {
    const { address, ...clientData } = createClientDto;

    try {
      const newClient = await this.prismaService.client.create({
        data: {
          ...clientData,
          address: address ? { create: address } : undefined,
        },
        include: {
          address: true,
        },
      });

      return newClient;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target as string[];
          throw new ConflictException(
            `Já existe um cliente com este ${target ? target.join(', ') : 'dado'}.`,
          );
        }
      }

      console.error(error);
      throw new InternalServerErrorException('Erro ao criar cliente.');
    }
  }

  async findOne(id: string) {
    const client = await this.prismaService.client.findFirst({
      where: {
        id,
      },
      include: {
        address: true,
      },
    });

    if (!client) {
      throw new NotFoundException();
    }

    return client;
  }

  async remove(id: string) {
    const client = await this.prismaService.client.findUnique({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    await this.prismaService.client.delete({
      where: { id },
    });

    return { status: 200, message: 'ok' };
  }

  async update(id: string, updateClientDto: CreateClientDto) {
    const { address, ...clientData } = updateClientDto;

    const client = await this.prismaService.client.findUnique({
      where: { id },
      include: { address: true },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    try {
      const updatedClient = await this.prismaService.client.update({
        where: { id },
        data: {
          ...clientData,
          address: address
            ? client.address
              ? {
                  update: address,
                }
              : {
                  create: address,
                }
            : undefined,
        },
        include: {
          address: true,
        },
      });

      return updatedClient;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target as string[];
          throw new ConflictException(
            `Já existe um cliente com este ${target ? target.join(', ') : 'dado'}.`,
          );
        }
      }

      console.error(error);
      throw new InternalServerErrorException('Erro ao atualizar cliente.');
    }
  }
}
