import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaService } from './prisma.service';
import { HealthController } from './health.controller';
import { ClassificationModule } from './classification/classification.module';
import { IngestModule } from './ingest/ingest.module';
import { MetricsModule } from './metrics/metrics.module';
import { MeetingsModule } from './meetings/meetings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    IngestModule,
    ClassificationModule,
    MetricsModule,
    MeetingsModule,
  ],
  controllers: [HealthController],
  providers: [PrismaService],
})
export class AppModule {}
