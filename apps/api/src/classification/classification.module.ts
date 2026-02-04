import { Module } from '@nestjs/common';

import { PrismaService } from '../prisma.service';
import { LlmModule } from '../llm/llm.module';

import { ClassificationController } from './classification.controller';
import { ClassificationService } from './classification.service';

@Module({
  imports: [LlmModule],
  controllers: [ClassificationController],
  providers: [ClassificationService, PrismaService],
})
export class ClassificationModule {}
