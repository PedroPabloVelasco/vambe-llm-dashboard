import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma.service';

type DistributionItem = { key: string; count: number };

const toPercent = (num: number, den: number) => {
  if (den <= 0) return 0;
  return Math.round((num / den) * 1000) / 10; // 1 decimal
};

const sortDesc = (items: DistributionItem[]) =>
  [...items].sort((a, b) => b.count - a.count);

@Injectable()
export class MetricsService {
  private readonly prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
  }

  async getSummary() {
    const totalMeetings = await this.prisma.meeting.count();
    const closedMeetings = await this.prisma.meeting.count({
      where: { closed: true },
    });

    const avgFitScoreAgg = await this.prisma.classification.aggregate({
      _avg: { fitScore: true },
    });

    const [byDealStage, byIntent, byRiskLevel] = await Promise.all([
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

    const dealStageDist: DistributionItem[] = byDealStage.map((x) => ({
      key: x.dealStage,
      count: x._count.dealStage ?? 0,
    }));

    const intentDist: DistributionItem[] = byIntent.map((x) => ({
      key: x.intent,
      count: x._count.intent ?? 0,
    }));

    const riskLevelDist: DistributionItem[] = byRiskLevel.map((x) => ({
      key: x.riskLevel,
      count: x._count.riskLevel ?? 0,
    }));

    const avgFitScore =
      avgFitScoreAgg._avg.fitScore != null
        ? Math.round(avgFitScoreAgg._avg.fitScore * 10) / 10
        : null;

    return {
      totals: {
        meetings: totalMeetings,
        closed: closedMeetings,
        closeRatePct: toPercent(closedMeetings, totalMeetings),
      },
      classification: {
        avgFitScore,
      },
      distributions: {
        dealStage: sortDesc(dealStageDist),
        intent: sortDesc(intentDist),
        riskLevel: sortDesc(riskLevelDist),
      },
    };
  }
}
