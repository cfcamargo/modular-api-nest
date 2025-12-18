import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ClientModule } from 'src/clients/client.module';
import { ProductModule } from 'src/products/product.module';
import { ProductionModule } from 'src/production/production.module';
import { OrdersModule } from 'src/order/order.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    ClientModule,
    ProductModule,
    ProductionModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
