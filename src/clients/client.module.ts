import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';

@Module({
  controllers: [ClientController],
  imports: [PrismaModule],
  providers: [ClientService],
  exports: [ClientService],
})
export class ClientModule {}
