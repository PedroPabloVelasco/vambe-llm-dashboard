import {
  Controller,
  Get,
  ParseBoolPipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common';

import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  private readonly metrics: MetricsService;

  constructor(metrics: MetricsService) {
    this.metrics = metrics;
  }

  @Get('summary')
  summary(@Query('from') from?: string, @Query('to') to?: string) {
    return this.metrics.getSummary({ from, to });
  }

  @Get('deal-stage')
  dealStageVsCloseRate(@Query('from') from?: string, @Query('to') to?: string) {
    return this.metrics.getDealStageVsCloseRate({ from, to });
  }

  @Get('intent-vs-fit')
  intentVsFit(@Query('from') from?: string, @Query('to') to?: string) {
    return this.metrics.getIntentVsFitScore({ from, to });
  }

  @Get('pain-points')
  painPoints(
    @Query('top', new ParseIntPipe({ optional: true })) top?: number,
    @Query('normalize', new ParseBoolPipe({ optional: true }))
    normalize?: boolean,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.metrics.getTopPainPoints({
      top: top ?? 10,
      normalize: normalize ?? true,
      from,
      to,
    });
  }

  @Get('by-seller')
  bySeller() {
    return this.metrics.getBySeller();
  }
}
