import { Body, Controller, Get, Post } from '@nestjs/common';

import { ClassificationService } from './classification.service';

@Controller('classification')
export class ClassificationController {
  private readonly service: ClassificationService;

  constructor(service: ClassificationService) {
    this.service = service;
  }

  @Post('run')
  run(@Body() body: { limit?: number }) {
    return this.service.runBatch(body.limit ?? 10);
  }

  @Get()
  list() {
    return this.service.listLatest(10);
  }
}
