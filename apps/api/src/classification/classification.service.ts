import { setTimeout as sleep } from 'timers/promises';

import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../prisma.service';
import { LlmService } from '../llm/llm.service';

const withRetry = async <T>(
  fn: () => Promise<T>,
  attempts = 2,
  backoffMs = 400,
): Promise<T> => {
  let lastErr: unknown;

  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) {
        await sleep(backoffMs * (i + 1));
      }
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error('Error LLM');
};

@Injectable()
export class ClassificationService {
  private readonly logger = new Logger(ClassificationService.name);
  private readonly prisma: PrismaService;
  private readonly llm: LlmService;
  private lastRunSummary: {
    processed: number;
    durationMs: number;
  } | null = null;

  constructor(prisma: PrismaService, llm: LlmService) {
    this.prisma = prisma;
    this.llm = llm;
  }

  private async claimBatch(limit: number) {
    const pending = await this.prisma.meeting.findMany({
      where: { classificationStatus: 'pending' },
      take: limit,
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    if (pending.length === 0) return [];

    const ids = pending.map((m) => m.id);

    await this.prisma.meeting.updateMany({
      where: { id: { in: ids }, classificationStatus: 'pending' },
      data: { classificationStatus: 'processing', classificationError: null },
    });

    return this.prisma.meeting.findMany({
      where: { id: { in: ids }, classificationStatus: 'processing' },
      take: limit,
      orderBy: { createdAt: 'asc' },
    });
  }

  async runBatch(limit = 10) {
    const startedAt = Date.now();
    const concurrency = Math.max(1, Number(process.env.LLM_CONCURRENCY ?? '3'));

    const meetings = await this.claimBatch(limit);

    let ok = 0;
    let errors = 0;
    const failures: Array<{ meetingId: string; reason: string }> = [];

    const processOne = async (meeting: (typeof meetings)[number]) => {
      const t0 = Date.now();

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
        this.logger.log(
          `classified meeting=${meeting.id} ok durationMs=${Date.now() - t0}`,
        );
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

        this.logger.warn(
          `classified meeting=${meeting.id} error durationMs=${Date.now() - t0} reason=${reason}`,
        );
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

    this.lastRunSummary = {
      processed: ok,
      durationMs: Date.now() - startedAt,
    };

    return {
      processed: meetings.length,
      ok,
      errors,
      failures,
      concurrency,
      durationMs: Date.now() - startedAt,
    };
  }

  async listLatest(params: { take: number; cursor?: string }) {
    const take = Math.max(1, Math.min(100, params.take));

    const items = await this.prisma.classification.findMany({
      take: take + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
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

    const hasMore = items.length > take;
    const sliced = hasMore ? items.slice(0, take) : items;
    const nextCursor = hasMore ? (sliced[sliced.length - 1]?.id ?? null) : null;

    return { items: sliced, nextCursor };
  }

  async getById(id: string) {
    return this.prisma.classification.findUnique({
      where: { id },
      include: {
        meeting: {
          include: { customer: true },
        },
      },
    });
  }

  async status() {
    const [
      pending,
      processing,
      done,
      error,
      totalMeetings,
      totalClassifications,
    ] = await Promise.all([
      this.prisma.meeting.count({
        where: { classificationStatus: 'pending' },
      }),
      this.prisma.meeting.count({
        where: { classificationStatus: 'processing' },
      }),
      this.prisma.meeting.count({
        where: { classificationStatus: 'done' },
      }),
      this.prisma.meeting.count({
        where: { classificationStatus: 'error' },
      }),
      this.prisma.meeting.count(),
      this.prisma.classification.count(),
    ]);

    return {
      pending,
      processing,
      done,
      error,
      totalMeetings,
      totalClassifications,
      lastRun: this.lastRunSummary
        ? {
            processed: this.lastRunSummary.processed,
            durationMs: this.lastRunSummary.durationMs,
            avgDurationMsPerItem:
              this.lastRunSummary.processed > 0
                ? this.lastRunSummary.durationMs / this.lastRunSummary.processed
                : null,
          }
        : null,
    };
  }

  async getByMeetingId(meetingId: string) {
    return this.prisma.classification.findUnique({
      where: { meetingId },
      include: {
        meeting: {
          include: { customer: true },
        },
      },
    });
  }
}
