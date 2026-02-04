import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma.service';
import { LlmService } from '../llm/llm.service';

@Injectable()
export class ClassificationService {
  private readonly prisma: PrismaService;
  private readonly llm: LlmService;

  constructor(prisma: PrismaService, llm: LlmService) {
    this.prisma = prisma;
    this.llm = llm;
  }

  async runBatch(limit = 10) {
    const meetings = await this.prisma.meeting.findMany({
      where: { classificationStatus: 'pending' },
      take: limit,
    });

    let ok = 0;
    let errors = 0;
    const failures: Array<{ meetingId: string; reason: string }> = [];

    for (const meeting of meetings) {
      try {
        const result = await this.llm.classifyTranscript(meeting.transcript);

        await this.prisma.classification.create({
          data: {
            meetingId: meeting.id,
            dealStage: result.deal_stage,
            intent: result.intent_level,
            fitScore: result.fit_score,
            riskLevel: result.risk_level,
            raw: result,
          },
        });

        await this.prisma.meeting.update({
          where: { id: meeting.id },
          data: {
            classificationStatus: 'done',
            classificationError: null,
          },
        });

        ok += 1;
      } catch (e) {
        const reason = e instanceof Error ? e.message : 'Error desconocido';

        await this.prisma.meeting.update({
          where: { id: meeting.id },
          data: {
            classificationStatus: 'error',
            classificationError: reason.slice(0, 900), // evita errores gigantes
          },
        });

        failures.push({ meetingId: meeting.id, reason });
        errors += 1;
      }
    }

    return {
      processed: meetings.length,
      ok,
      errors,
      failures,
    };
  }

  async listLatest(limit = 10) {
    return this.prisma.classification.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}
