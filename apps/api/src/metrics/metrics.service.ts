import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma.service';

type DateFilter = {
  from?: string;
  to?: string;
};

const asDateRange = ({ from, to }: DateFilter) => {
  const gte = from ? new Date(from) : undefined;
  const lte = to ? new Date(to) : undefined;

  if (!gte && !lte) return undefined;

  return {
    ...(gte ? { gte } : {}),
    ...(lte ? { lte } : {}),
  };
};

@Injectable()
export class MetricsService {
  private readonly prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
  }

  private buildDateFilter(filter: DateFilter) {
    const range = asDateRange(filter);
    if (!range) return undefined;

    return { createdAt: range };
  }

  async getSummary(filter: DateFilter = {}) {
    const where = this.buildDateFilter(filter);

    const totalMeetings = await this.prisma.meeting.count({ where });
    const closedMeetings = await this.prisma.meeting.count({
      where: { ...where, closed: true },
    });

    const avgFit = await this.prisma.classification.aggregate({
      where,
      _avg: { fitScore: true },
    });

    return {
      totals: {
        meetings: totalMeetings,
        closed: closedMeetings,
        closeRatePct:
          totalMeetings === 0
            ? 0
            : Math.round((closedMeetings / totalMeetings) * 100),
      },
      classification: {
        avgFitScore: avgFit._avg.fitScore
          ? Number(avgFit._avg.fitScore.toFixed(1))
          : 0,
      },
    };
  }

  async getDealStageVsCloseRate(filter: DateFilter = {}) {
    const meetingWhere = this.buildDateFilter(filter);

   const rows = await this.prisma.classification.findMany({
      where: meetingWhere,
      select: {
        dealStage: true,
        meeting: { select: { closed: true } },
      },
    });

    const byStage = new Map<
      string,
      { dealStage: string; total: number; closed: number }
    >();

    for (const r of rows) {
      const key = r.dealStage;
      const current = byStage.get(key) ?? { dealStage: key, total: 0, closed: 0 };
      current.total += 1;
      if (r.meeting.closed) current.closed += 1;
      byStage.set(key, current);
    }

    const items = [...byStage.values()]
      .sort((a, b) => b.total - a.total)
      .map((r) => ({
        dealStage: r.dealStage,
        total: r.total,
        closed: r.closed,
        closeRatePct: r.total === 0 ? 0 : Math.round((r.closed / r.total) * 100),
      }));

    return { items };
  }

  async getIntentVsFitScore(filter: DateFilter = {}) {
    const where = this.buildDateFilter(filter);

    const rows = await this.prisma.classification.groupBy({
      by: ['intent'],
      where,
      _count: true,
      _avg: { fitScore: true },
    });

    return {
      items: rows.map((r) => ({
        intent: r.intent,
        count: r._count,
        avgFitScore: r._avg.fitScore ? Number(r._avg.fitScore.toFixed(1)) : 0,
      })),
    };
  }

  async getTopPainPoints(params: {
    top: number;
    normalize: boolean;
    from?: string;
    to?: string;
  }) {
    const { top, normalize, ...filter } = params;
    const where = this.buildDateFilter(filter);

    const rows = await this.prisma.classification.findMany({
      where,
      select: { raw: true },
    });

    const counter = new Map<string, number>();

    for (const row of rows) {
      const painPoints = Array.isArray((row.raw as any)?.pain_points)
        ? (row.raw as any).pain_points
        : [];

      for (let p of painPoints) {
        if (typeof p !== 'string') continue;
        p = normalize ? p.trim().toLowerCase() : p.trim();
        if (!p) continue;
        counter.set(p, (counter.get(p) ?? 0) + 1);
      }
    }

    return {
      items: [...counter.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, top)
        .map(([painPoint, count]) => ({ painPoint, count })),
    };
  }

  async getBySeller() {
    const rows = await this.prisma.$queryRaw<
      Array<{
        seller: string;
        meetings: number;
        closed: number;
        classified: number;
        avgFitScore: number | null;
      }>
    >`
      SELECT
        m.seller AS seller,
        COUNT(m.id) AS meetings,
        SUM(CASE WHEN m.closed = 1 THEN 1 ELSE 0 END) AS closed,
        COUNT(c.id) AS classified,
        AVG(c.fitScore) AS avgFitScore
      FROM Meeting m
      LEFT JOIN Classification c ON c.meetingId = m.id
      GROUP BY m.seller
    `;

    return {
      items: rows.map((r) => ({
        seller: r.seller,
        meetings: r.meetings,
        closed: r.closed,
        classified: r.classified,
        closeRatePct:
          r.meetings === 0
            ? 0
            : Number(((r.closed / r.meetings) * 100).toFixed(1)),
        avgFitScore: r.avgFitScore ? Number(r.avgFitScore.toFixed(1)) : 0,
      })),
    };
  }
}
