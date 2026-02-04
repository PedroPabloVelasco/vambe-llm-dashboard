import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ClassificationModule } from './classification/classification.module';
import { IngestModule } from './ingest/ingest.module';
import { LlmModule } from './llm/llm.module';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    IngestModule,
    LlmModule,
    ClassificationModule,
    MetricsModule,
  ],
})
export class AppModule {}
