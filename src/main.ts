import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app/app.module';
import * as cookieParser from 'cookie-parser';

const isProd = process.env.NODE_ENV === 'production';

// regex: http(s)://(qa|app).grupomodularms.com.br(:porta opcional)
const RGX_APP_QA = /^https?:\/\/(qa|app)\.grupomodularms\.com\.br(?::\d+)?$/i;

const FRONT_EXACT = ['http://localhost:5173', 'http://127.0.0.1:5173'];

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.enableCors({
    credentials: true,
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);

      if (RGX_APP_QA.test(origin)) return cb(null, true);
      if (!isProd && FRONT_EXACT.includes(origin)) return cb(null, true);

      return cb(new Error(`CORS: Origin não permitido: ${origin}`), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 600,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3333);
}
bootstrap();
