import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma.service';

type DistItem = { key: string; count: number };

const pct = (num: number, den: number) =>
  den === 0 ? 0 : Math.round((num / den) * 1000) / 10;

const toKeyCounts = (items: Array<{ key: string; count: number }>): DistItem[] =>
  items
    .map((x) => ({ key: x.key, count: x.count }))
    .sort((a, b) => b.count - a.count);

const safeArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const safeString = (v: unknown): string | null =>
  typeof v === 'string' && v.trim() ? v.trim() : null;

@Injectable()
export class MetricsService {
  private readonly prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
  }

  async getSummary() {
    const [meetingsTotal, meetingsClosed] = await Promise.all([
      this.prisma.meeting.count(),
      this.prisma.meeting.count({ where: { closed: true } }),
    ]);

    const avgFit = await this.prisma.classification.aggregate({
      _avg: { fitScore: true },
    });

    const [dealStage, intent, riskLevel] = await Promise.all([
      this.prisma.classification.groupBy({
        by: ['dealStage'],
        _count: { dealStage: true },
      }),
      this.prisma.classification.groupBy({
        by: ['intent'],
        _count: { intent: true },
      }),
      this.prisma.classification.groupBy({
        by: ['riskLevel'],
        _count: { riskLevel: true },
      }),
    ]);

    return {
      totals: {
        meetings: meetingsTotal,
        closed: meetingsClosed,
        closeRatePct: pct(meetingsClosed, meetingsTotal),
      },
      classification: {
        avgFitScore: avgFit._avg.fitScore
          ? Math.round(avgFit._avg.fitScore * 10) / 10
          : 0,
      },
      distributions: {
        dealStage: toKeyCounts(
          dealStage.map((x) => ({
            key: x.dealStage,
            count: x._count.dealStage,
          })),
        ),
        intent: toKeyCounts(
          intent.map((x) => ({ key: x.intent, count: x._count.intent })),
        ),
        riskLevel: toKeyCounts(
          riskLevel.map((x) => ({
            key: x.riskLevel,
            count: x._count.riskLevel,
          })),
        ),
      },
    };
  }

  async getDealStageCloseRate() {
    const rows = await this.prisma.classification.findMany({
      select: {
        dealStage: true,
        meeting: { select: { closed: true } },
      },
    });

    const map = new Map<string, { total: number; closed: number }>();
    for (const r of rows) {
      const key = r.dealStage;
      const cur = map.get(key) ?? { total: 0, closed: 0 };
      cur.total += 1;
      if (r.meeting.closed) cur.closed += 1;
      map.set(key, cur);
    }

    const items = Array.from(map.entries())
      .map(([dealStage, v]) => ({
        dealStage,
        total: v.total,
        closed: v.closed,
        closeRatePct: pct(v.closed, v.total),
      }))
      .sort((a, b) => b.total - a.total);

    return { items };
  }

  async getIntentVsFit() {
    const groups = await this.prisma.classification.groupBy({
      by: ['intent'],
      _count: { intent: true },
      _avg: { fitScore: true },
    });

    return {
      items: groups
        .map((g) => ({
          intent: g.intent,
          count: g._count.intent,
          avgFitScore: g._avg.fitScore ? Math.round(g._avg.fitScore * 10) / 10 : 0,
        }))
        .sort((a, b) => b.count - a.count),
    };
  }

  async getPainPoints(top = 10) {
    const rows = await this.prisma.classification.findMany({
      select: { raw: true },
    });

    const counter = new Map<string, number>();

    for (const r of rows) {
      const raw = r.raw as unknown;
      const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
      const painPoints = safeArray(obj.pain_points);

      for (const p of painPoints) {
        const s = safeString(p);
        if (!s) continue;
        counter.set(s, (counter.get(s) ?? 0) + 1);
      }
    }

    const items = Array.from(counter.entries())
      .map(([painPoint, count]) => ({ painPoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, top);

    return { items };
  }

  async getBySeller() {
    const meetings = await this.prisma.meeting.findMany({
      select: {
        seller: true,
        closed: true,
        classificationStatus: true,
        classification: { select: { fitScore: true } },
      },
    });

    const map = new Map<
      string,
      { meetings: number; closed: number; classified: number; fitSum: number; fitCount: number }
    >();

    for (const m of meetings) {
      const key = m.seller || 'Unknown';
      const cur =
        map.get(key) ?? { meetings: 0, closed: 0, classified: 0, fitSum: 0, fitCount: 0 };

      cur.meetings += 1;
      if (m.closed) cur.closed += 1;

      if (m.classificationStatus === 'done' && m.classification) {
        cur.classified += 1;
        cur.fitSum += m.classification.fitScore;
        cur.fitCount += 1;
      }

      map.set(key, cur);
    }

    const items = Array.from(map.entries())
      .map(([seller, v]) => ({
        seller,
        meetings: v.meetings,
        closed: v.closed,
        closeRatePct: pct(v.closed, v.meetings),
        classified: v.classified,
        avgFitScore: v.fitCount === 0 ? 0 : Math.round((v.fitSum / v.fitCount) * 10) / 10,
      }))
      .sort((a, b) => b.meetings - a.meetings);

    return { items };
  }
}
