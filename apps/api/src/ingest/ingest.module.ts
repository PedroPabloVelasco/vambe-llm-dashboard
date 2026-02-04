import { Module } from '@nestjs/common';

import { PrismaService } from '../prisma.service';

import { IngestController } from './ingest.controller';
import { IngestService } from './ingest.service';

@Module({
  controllers: [IngestController],
  providers: [IngestService, PrismaService],
})
export class IngestModule {}
