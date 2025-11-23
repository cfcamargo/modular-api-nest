import { PrismaService } from 'src/prisma/prisma.service';

export class ProductService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll() {
    return this.prismaService.product.findMany();
  }

  async create() {}
}
