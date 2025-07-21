import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendAccountActivation(name: string, email: string, token: string) {
    const frontendURL = this.configService.get<string>('APP_URL');
    const activationUrl = `${frontendURL}/register/${token}`;

    this.mailerService.sendMail({
      to: email,
      from: 'no-reply@modular.com.br',
      subject: 'Ative sua conta',
      template: 'activation',
      context: {
        name,
        activationUrl,
      },
    });
  }
}
