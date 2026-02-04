import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ClassificationResultSchema } from '@vambe/shared';

import { buildClassificationPrompt } from './llm.prompt';
import { normalizeClassification } from './llm.normalize';

type JsonParseResult =
  | { ok: true; value: unknown }
  | { ok: false; reason: string; sample: string };

const safeSample = (text: string, max = 300) =>
  text.replace(/\s+/g, ' ').trim().slice(0, max);

const stripCodeFences = (text: string) => {
  const trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```[a-zA-Z]*\s*/g, '').replace(/```$/g, '').trim();
  }
  return trimmed;
};

const extractFirstJsonObject = (text: string): JsonParseResult => {
  const cleaned = stripCodeFences(text);

  try {
    return { ok: true, value: JSON.parse(cleaned) };
  } catch {
    // continue
  }

  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');

  if (first === -1 || last === -1 || last <= first) {
    return {
      ok: false,
      reason: 'No se encontró un objeto JSON en la respuesta',
      sample: safeSample(cleaned),
    };
  }

  const candidate = cleaned.slice(first, last + 1);

  try {
    return { ok: true, value: JSON.parse(candidate) };
  } catch {
    return {
      ok: false,
      reason: 'La respuesta contenía un objeto, pero no fue JSON válido',
      sample: safeSample(candidate),
    };
  }
};

@Injectable()
export class LlmService {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY no configurada');

    this.model = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini';
    this.client = new OpenAI({ apiKey });
  }

  async classifyTranscript(transcript: string) {
    const prompt = buildClassificationPrompt(transcript);

    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Responde SOLO con un objeto JSON válido. Sin markdown, sin backticks, sin texto extra.',
        },
        { role: 'user', content: prompt },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? '';

    const parsed = extractFirstJsonObject(text);
    if (!parsed.ok) {
      throw new Error(`${parsed.reason}. Sample: ${parsed.sample}`);
    }

    const normalized = normalizeClassification(parsed.value);
    return ClassificationResultSchema.parse(normalized);
  }
}
