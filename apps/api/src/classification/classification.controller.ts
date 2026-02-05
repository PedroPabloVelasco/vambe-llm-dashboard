import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

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
  list(@Query('take') take?: string) {
    const n = take ? Number(take) : 20;
    return this.service.listLatest(Number.isFinite(n) ? n : 20);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Get('by-meeting/:meetingId')
  getByMeetingId(@Param('meetingId') meetingId: string) {
    return this.service.getByMeetingId(meetingId);
  }
}
