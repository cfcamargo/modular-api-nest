import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app/app.module';
import * as cookieParser from 'cookie-parser';

const WHITE_LIST = [
  'https://qa.grupomodularms.com.br',
  'http://qa.grupomodularms.com.br',
  'https://app.grupomodularms.com.br',
  'http://app.grupomodularms.com.br',
  'http://localhost:5173',
];

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: WHITE_LIST, // ou seu domínio
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3333);
}
bootstrap();
