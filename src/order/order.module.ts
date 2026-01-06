import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma/prisma.module'; // Verifique o caminho do seu módulo Prisma
import { OrdersController } from './order.controller';
import { OrdersService } from './order.service';

@Module({
  imports: [PrismaModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
