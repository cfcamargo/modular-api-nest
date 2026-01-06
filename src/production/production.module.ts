import { Module } from '@nestjs/common';
import { ProductionService } from './production.service';
import { ProductionController } from './production.controller';
import { PrismaModule } from 'src/prisma/prisma.module'; // Importe seu módulo do Prisma

@Module({
  imports: [PrismaModule],
  controllers: [ProductionController],
  providers: [ProductionService],
})
export class ProductionModule {}
