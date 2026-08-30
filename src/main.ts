import { webcrypto } from 'crypto';

// @nestjs/schedule (>= v3) calls the global `crypto.randomUUID()` to name
// unnamed @Cron/@Interval jobs. That global was only added to Node without a
// flag starting in later Node 18 patch releases, so on older Node 18 builds
// (e.g. Render's default 18.15.0) bootstrap crashes with
// "ReferenceError: crypto is not defined". Polyfill it before Nest starts.
if (!(globalThis as any).crypto) {
  (globalThis as any).crypto = webcrypto;
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

// Default CORS origins, used when the CORS_ORIGINS env var is not set.
const DEFAULT_CORS_ORIGINS = [
  'http://localhost:3000',
  'https://vercel-backend-bay.vercel.app',
  'https://ilmnur.online',
  'https://ashacademy.uz',
  'https://www.ashacademy.uz',
];

async function bootstrap() {
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      rawBody: true,
    });

    // Serve static files for Swagger UI
    app.use(
      '/swagger-ui',
      express.static(join(__dirname, '../node_modules/swagger-ui-dist')),
    );

    const PORT = process.env.PORT || 4200;
    const corsOrigins = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
      : DEFAULT_CORS_ORIGINS;
    app.enableCors({
      origin: corsOrigins,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: 'Content-Type, Authorization',
      credentials: true,
    });
    app.setGlobalPrefix('api');

    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    const config = new DocumentBuilder()
      .setTitle('IlmNur')
      .setDescription('REST API')
      .setVersion('1.0.0')
      .addTag('NodeJS, NestJS, Postgres, sequelize')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        docExpansion: 'none', // collapse the dropdown by default
      },
    });
    await app.listen(PORT, () => {
      console.log('Server listening on port', PORT);
    });
  } catch (error: any) {
    throw new BadRequestException(error.message);
  }
}
bootstrap();
