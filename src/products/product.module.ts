import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProductService } from './product.service';

@Module({
  controllers: [ProductController],
  imports: [PrismaModule],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
