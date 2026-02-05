import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';

import { ClassificationService } from './classification.service';

@Controller('classification')
export class ClassificationController {
  private readonly service: ClassificationService;

  constructor(service: ClassificationService) {
    this.service = service;
  }

  @Post('run')
  run(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.service.runBatch(limit ?? 10);
  }

  @Get()
  list(
    @Query('take', new ParseIntPipe({ optional: true })) take?: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.service.listLatest({ take: take ?? 10, cursor });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Get('by-meeting/:meetingId')
  getByMeeting(@Param('meetingId') meetingId: string) {
    return this.service.getByMeetingId(meetingId);
  }
}
