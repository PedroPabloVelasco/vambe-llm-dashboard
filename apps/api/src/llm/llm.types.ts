export type LlmProvider = 'openai';

export type ClassificationRunStats = {
  processed: number;
  ok: number;
  errors: number;
  failures: Array<{ meetingId: string; reason: string }>;
  concurrency: number;
  durationMs: number;
};
