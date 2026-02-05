import { setTimeout as sleep } from 'timers/promises';

import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ClassificationResultSchema } from '@vambe/shared';

import { buildClassificationPrompt } from './llm.prompt';
import { normalizeClassification } from './llm.normalize';

@Injectable()
export class LlmService {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY no configurada');

    this.model = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini';
    this.timeoutMs = Math.max(1, Number(process.env.LLM_TIMEOUT_MS ?? '30000'));
    this.client = new OpenAI({ apiKey });
  }

  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      sleep(ms).then(() => {
        throw new Error(`Timeout LLM (${ms}ms)`);
      }),
    ]);
  }

  async classifyTranscript(transcript: string) {
    const prompt = buildClassificationPrompt(transcript);

    const completion = await this.withTimeout(
      this.client.chat.completions.create({
        model: this.model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Responde SOLO con un objeto JSON válido. No incluyas texto adicional.',
          },
          { role: 'user', content: prompt },
        ],
      }),
      this.timeoutMs,
    );

    const text = completion.choices[0]?.message?.content ?? '{}';

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error('La respuesta del modelo no fue JSON válido');
    }

    const normalized = normalizeClassification(json);

    const parsed = ClassificationResultSchema.safeParse(normalized);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      throw new Error(
        `Respuesta inválida: ${firstIssue.path.join('.')} → ${firstIssue.message}`,
      );
    }

    return parsed.data;
  }
}
