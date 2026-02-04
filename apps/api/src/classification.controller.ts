import { Controller, Post } from '@nestjs/common';

@Controller('classification')
export class ClassificationController {
  @Post('test-persist')
  testPersist() {
    return { ok: true };
  }
}