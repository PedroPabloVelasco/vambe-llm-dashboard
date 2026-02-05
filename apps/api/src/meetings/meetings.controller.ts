import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';

import { MeetingsService } from './meetings.service';

@Controller('meetings')
export class MeetingsController {
  private readonly meetings: MeetingsService;

  constructor(meetings: MeetingsService) {
    this.meetings = meetings;
  }

  @Get()
  list(
    @Query('status') status?: string,
    @Query('take', new ParseIntPipe({ optional: true })) take?: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.meetings.list({ status, take, cursor });
  }
}
