import { Controller, Get, Query } from '@nestjs/common';

import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  private readonly metrics: MetricsService;

  constructor(metrics: MetricsService) {
    this.metrics = metrics;
  }

  @Get('summary')
  summary() {
    return this.metrics.getSummary();
  }

  @Get('deal-stage')
  dealStage() {
    return this.metrics.getDealStageCloseRate();
  }

  @Get('intent-vs-fit')
  intentVsFit() {
    return this.metrics.getIntentVsFit();
  }

  @Get('pain-points')
  painPoints(@Query('top') top?: string) {
    const n = top ? Number(top) : 10;
    const safeTop = Number.isFinite(n) ? Math.max(1, Math.min(30, n)) : 10;
    return this.metrics.getPainPoints(safeTop);
  }

  @Get('by-seller')
  bySeller() {
    return this.metrics.getBySeller();
  }
}
