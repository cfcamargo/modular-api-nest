import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailService } from './mail.service';
import { join } from 'path';

const isProd = process.env.NODE_ENV === 'production';
const templatesDir = isProd
  ? join(__dirname, '/templates')
  : join(process.cwd(), 'src', 'mail', 'templates');

console.log(templatesDir);

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: process.env.MAIL_HOST,
          port: Number(process.env.MAIL_PORT),
          auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
          },
          defaults: {
            from: '"Modular Pré Moldados" <no-reply@modular.com.br>',
          },
        },
        template: {
          dir: templatesDir,
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
