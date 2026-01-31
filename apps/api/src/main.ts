import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:3000';

  app.enableCors({
    origin: corsOrigin,
  });

  await app.listen(port);
}

bootstrap();
