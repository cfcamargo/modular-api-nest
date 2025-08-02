import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
  controllers: [UserController],
  imports: [PrismaModule, MailModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
