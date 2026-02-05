import { Module } from '@nestjs/common';

import { LlmService } from '../llm/llm.service';
import { PrismaService } from '../prisma.service';

import { ClassificationController } from './classification.controller';
import { ClassificationService } from './classification.service';

@Module({
  controllers: [ClassificationController],
  providers: [ClassificationService, PrismaService, LlmService],
})
export class ClassificationModule {}
