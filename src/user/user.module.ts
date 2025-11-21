import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MailModule } from 'src/mail/mail.module';
import { BcryptService } from 'src/auth/hashing/bcrypt.service';

@Module({
  controllers: [UserController],
  imports: [PrismaModule, MailModule, BcryptService],
  providers: [UserService, BcryptService],
  exports: [UserService, BcryptService],
})
export class UserModule {}
