import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { validationExceptionFactory } from './core/common/field-errors.js';
import { PrismaExceptionFilter } from './core/prisma/prisma-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Derriere nginx : sans cela, tous les visiteurs auraient l'IP du proxy
  const proxies = Number(process.env.TRUST_PROXY_HOPS ?? 0);
  if (proxies > 0) app.set('trust proxy', proxies);
  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
  app.useGlobalFilters(
    new PrismaExceptionFilter(app.get(HttpAdapterHost).httpAdapter),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Najahni API')
    .setVersion('0.1')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
    // Garde le jeton apres un rechargement de la page
    { swaggerOptions: { persistAuthorization: true } },
  );

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
