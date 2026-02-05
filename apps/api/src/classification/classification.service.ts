import { setTimeout } from 'timers';

import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma.service';
import { LlmService } from '../llm/llm.service';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const withRetry = async <T>(
  fn: () => Promise<T>,
  attempts = 2,
  backoffMs = 500,
): Promise<T> => {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) await sleep(backoffMs * (i + 1));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Error LLM');
};

@Injectable()
export class ClassificationService {
  private readonly prisma: PrismaService;
  private readonly llm: LlmService;

  constructor(prisma: PrismaService, llm: LlmService) {
    this.prisma = prisma;
    this.llm = llm;
  }

  private async claimMeeting(meetingId: string): Promise<boolean> {
    const res = await this.prisma.meeting.updateMany({
      where: { id: meetingId, classificationStatus: 'pending' },
      data: { classificationStatus: 'processing', classificationError: null },
    });

    return res.count === 1;
  }

  async runBatch(limit = 10) {
    const startedAt = Date.now();

    const meetings = await this.prisma.meeting.findMany({
      where: { classificationStatus: 'pending' },
      take: limit,
      select: { id: true, transcript: true },
      orderBy: { createdAt: 'asc' },
    });

    const concurrency = Math.max(1, Number(process.env.LLM_CONCURRENCY ?? '3'));

    let ok = 0;
    let errors = 0;
    let skipped = 0;

    const failures: Array<{ meetingId: string; reason: string }> = [];

    const processOne = async (meeting: (typeof meetings)[number]) => {
      const claimed = await this.claimMeeting(meeting.id);
      if (!claimed) {
        skipped += 1;
        return;
      }

      try {
        const result = await withRetry(
          () => this.llm.classifyTranscript(meeting.transcript),
          2,
          500,
        );

        await this.prisma.classification.upsert({
          where: { meetingId: meeting.id },
          update: {
            dealStage: result.deal_stage,
            intent: result.intent_level,
            fitScore: result.fit_score,
            riskLevel: result.risk_level,
            raw: result,
          },
          create: {
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
          data: { classificationStatus: 'done', classificationError: null },
        });

        ok += 1;
      } catch (e) {
        const reason = e instanceof Error ? e.message : 'Error desconocido';

        await this.prisma.meeting.update({
          where: { id: meeting.id },
          data: {
            classificationStatus: 'error',
            classificationError: reason,
          },
        });

        failures.push({ meetingId: meeting.id, reason });
        errors += 1;
      }
    };

    const queue = [...meetings];
    const workers = Array.from({ length: concurrency }, async () => {
      while (queue.length > 0) {
        const next = queue.shift();
        if (!next) return;
        await processOne(next);
      }
    });

    await Promise.all(workers);

    return {
      processed: meetings.length,
      ok,
      errors,
      skipped,
      concurrency,
      durationMs: Date.now() - startedAt,
      failures,
    };
  }

  async listLatest(take = 20) {
    return this.prisma.classification.findMany({
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        meeting: {
          select: {
            id: true,
            seller: true,
            closed: true,
            meetingDate: true,
            customer: { select: { name: true, email: true } },
          },
        },
      },
    });
  }

  async getById(id: string) {
    return this.prisma.classification.findUnique({
      where: { id },
      include: {
        meeting: {
          select: {
            id: true,
            seller: true,
            closed: true,
            meetingDate: true,
            classificationStatus: true,
            classificationError: true,
            customer: { select: { name: true, email: true, phone: true } },
          },
        },
      },
    });
  }

  async getByMeetingId(meetingId: string) {
    return this.prisma.classification.findUnique({
      where: { meetingId },
      include: {
        meeting: {
          select: {
            id: true,
            seller: true,
            closed: true,
            meetingDate: true,
            classificationStatus: true,
            classificationError: true,
            customer: { select: { name: true, email: true, phone: true } },
          },
        },
      },
    });
  }
}
