import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ClassificationModule } from './classification/classification.module';
import { HealthController } from './health.controller';
import { IngestModule } from './ingest/ingest.module';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    IngestModule,
    ClassificationModule,
    MetricsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
