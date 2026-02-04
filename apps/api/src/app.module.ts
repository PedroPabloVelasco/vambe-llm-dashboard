import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { IngestModule } from './ingest/ingest.module';
import { ClassificationModule } from './classification/classification.module';
import { LlmModule } from './llm/llm.module';
import { ClassificationController } from './classification.controller';
import { HealthController } from './health.controller';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    IngestModule,
    LlmModule,
    ClassificationModule,
  ],
  controllers: [HealthController, ClassificationController],
  providers: [PrismaService],
})
export class AppModule {}
