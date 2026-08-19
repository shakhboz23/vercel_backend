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
// import * as cookieParser from 'cookie-parser';
// import { ExpressPeerServer } from 'peer';

async function bootstrap() {
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
    // Webhook uchun raw body qo‘shish
    // app.use(
    //   '/api/webhook',
    //   bodyParser.raw({ type: 'application/json' }),
    // );

    // 🔴 Faqat webhook URL uchun raw body ishlatamiz
    // app.use('/api/stripe/webhook/stripe', bodyParser.raw({ type: 'application/json' }));

    // Serve static files for Swagger UI
    app.use('/swagger-ui', express.static(join(__dirname, '../node_modules/swagger-ui-dist')));

    const PORT = process.env.PORT || 4200;
    app.enableCors();
    // CORS sozlash
    app.enableCors({
      origin: [
        'http://localhost:3000',
        'https://vercel-backend-bay.vercel.app',
        'https://ilmnur.online',
        'https://www.ashacademy.uz',
      ],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: 'Content-Type, Authorization',
      credentials: true
    });
    //   app.enableCors({
    //     origin: true,
    //     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    //     credentials: true,
    // });
    app.setGlobalPrefix('api');

    // app.use(cookieParser()); 

    // const server = app.getHttpServer(); // Get the underlying HTTP server
    // const peerServer = ExpressPeerServer(server, { path: '/peerjs' }); // Create the PeerJS server with a custom path
    // const peerServer = ExpressPeerServer(server);
    // console.log(peerServer)
    // app.use('/peerjs', peerServer); 

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