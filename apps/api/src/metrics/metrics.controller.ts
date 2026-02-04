import { Controller, Get } from '@nestjs/common';

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
}
