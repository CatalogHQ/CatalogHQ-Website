import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

function normalizeCorsOrigins(raw: string): string[] {
  return raw
    .split(',')
    .map((origin) =>
      origin
        .trim()
        .replace(/^["']|["']$/g, '')
        .replace(/\/$/, ''),
    )
    .filter(Boolean);
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  app.set('trust proxy', 1);
  const configService = app.get(ConfigService);

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
        connectSrc: ["'self'", 'https://api.flutterwave.com'],
        frameSrc: ["'none'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  const corsOrigins = new Set(
    normalizeCorsOrigins(
      configService.get<string>(
        'CORS_ORIGIN',
        'http://localhost:3000,https://cataloghq.store,https://www.cataloghq.store',
      ),
    ),
  );

  if (process.env.NODE_ENV === 'production') {
    corsOrigins.add('https://cataloghq.store');
    corsOrigins.add('https://www.cataloghq.store');
  }

  const allowedOrigins = [...corsOrigins];
  logger.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Cookie',
      'x-csrf-token',
      'X-CSRF-Token',
    ],
    optionsSuccessStatus: 204,
  });

  app.enableShutdownHooks();

  const redisUrl = configService.get<string>('REDIS_URL')?.trim();
  if (redisUrl) {
    logger.log('Rate limiting storage: Redis');
  } else if (process.env.NODE_ENV === 'production') {
    logger.error('REDIS_URL is not configured in production');
  } else {
    logger.warn(
      'REDIS_URL is not set. Rate limits are in-memory only (single instance).',
    );
  }

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
}

bootstrap();
