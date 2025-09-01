import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "../auth/auth.module";
import { ConfigModule } from "@nestjs/config";
import { ProductModule } from "src/product/product.module";
import { StockModule } from "src/stock/stock.module";
import { SupplierModule } from "src/supplier/supplier.module";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		AuthModule,
		ProductModule,
		StockModule,
		SupplierModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
