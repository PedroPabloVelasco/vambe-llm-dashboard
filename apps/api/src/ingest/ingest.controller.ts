import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';

import { IngestService } from './ingest.service';

@Controller('ingest')
export class IngestController {
  private readonly ingest: IngestService;

  constructor(ingest: IngestService) {
    this.ingest = ingest;
  }

  @Post('csv')
  @UseInterceptors(FileInterceptor('file'))
  async ingestCsv(@UploadedFile() file: Express.Multer.File) {
    const content = file?.buffer?.toString('utf-8') ?? '';
    const rows = this.ingest.parseCsv(content);
    return this.ingest.ingestRows(rows);
  }
}
