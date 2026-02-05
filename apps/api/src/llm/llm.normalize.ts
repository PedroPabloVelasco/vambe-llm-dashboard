type AnyObj = Record<string, unknown>;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const truncate = (value: string, max: number) =>
  value.length <= max ? value : value.slice(0, max);

const cleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const requiredString = (value: unknown, fallback: string, max: number) =>
  truncate(cleanString(value) ?? fallback, max);

const optionalString = (value: unknown, max: number) => {
  const result = cleanString(value);
  return result ? truncate(result, max) : null;
};

const asObject = (value: unknown): AnyObj =>
  value && typeof value === 'object' ? (value as AnyObj) : {};

const parseNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const withoutPercent = trimmed.endsWith('%') ? trimmed.slice(0, -1) : trimmed;

  const parsed = Number(withoutPercent);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeFitScore = (value: unknown) => {
  const parsed = parseNumber(value);
  if (parsed === null) return 0;
  const scaled = parsed <= 1 ? parsed * 100 : parsed;
  return Math.round(clamp(scaled, 0, 100));
};

const normalizeConfidence = (value: unknown) => {
  const parsed = parseNumber(value);
  if (parsed === null) return 0.5;
  const scaled = parsed > 1 ? parsed / 100 : parsed;
  return clamp(scaled, 0, 1);
};

const normalizeStringArray = (
  value: unknown,
  maxItems: number,
  maxLength: number,
): string[] => {
  if (!Array.isArray(value)) return [];
  const result: string[] = [];
  for (const entry of value) {
    const str = cleanString(entry);
    if (!str) continue;
    result.push(truncate(str, maxLength));
    if (result.length >= maxItems) break;
  }
  return result;
};

const pickEnum = <T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T => {
  if (typeof value === 'string') {
    const normalized = value.trim();
    if ((allowed as readonly string[]).includes(normalized)) {
      return normalized as T;
    }
  }
  return fallback;
};

const normalizeInteractionUnit = (value: unknown) => {
  if (typeof value !== 'string') return 'unknown';
  const s = value.trim().toLowerCase();
  if (['daily', 'weekly', 'monthly', 'unknown'].includes(s)) return s;

  if (
    s.includes('day') ||
    s.includes('dia') ||
    s.includes('día') ||
    s.includes('diario')
  ) {
    return 'daily';
  }
  if (s.includes('week') || s.includes('seman')) {
    return 'weekly';
  }
  if (s.includes('month') || s.includes('mes') || s.includes('mensual')) {
    return 'monthly';
  }
  return 'unknown';
};

const normalizeInteractionVolume = (value: unknown) => {
  const obj = asObject(value);
  const parsedValue = parseNumber(obj.value);

  const normalizedValue =
    parsedValue === null
      ? null
      : parsedValue <= 0
        ? null
        : Math.round(Math.abs(parsedValue));

  return {
    value: normalizedValue,
    unit: normalizeInteractionUnit(obj.unit),
    evidence: optionalString(obj.evidence, 240),
  };
};

const normalizeObjections = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  const allowed = [
    'price',
    'timing',
    'authority',
    'need',
    'competition',
    'security',
    'integration',
    'budget_freeze',
    'other',
  ] as const;

  const result: Array<{ type: (typeof allowed)[number]; evidence: string }> =
    [];

  for (const entry of value) {
    const obj = asObject(entry);
    const evidence = optionalString(obj.evidence, 240);
    if (!evidence) continue;

    const type = pickEnum(obj.type, allowed, 'other');
    result.push({ type, evidence });

    if (result.length >= 8) break;
  }

  return result;
};

const isValidIsoDatetime = (value: string) => {
  const t = Date.parse(value);
  return Number.isFinite(t);
};

const normalizeNextSteps = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  const result: Array<{ description: string; date: string | null }> = [];

  for (const entry of value) {
    const obj = asObject(entry);
    const description = cleanString(obj.description);
    if (!description) continue;

    const dateRaw = cleanString(obj.date);
    const date = dateRaw && isValidIsoDatetime(dateRaw) ? dateRaw : null;

    result.push({
      description: truncate(description, 240),
      date,
    });

    if (result.length >= 6) break;
  }

  return result;
};

const normalizeSignals = (value: unknown) => {
  const obj = asObject(value);
  return {
    positive: normalizeStringArray(obj.positive, 10, 120),
    negative: normalizeStringArray(obj.negative, 10, 120),
  };
};

const normalizeEvidence = (value: unknown) =>
  normalizeStringArray(value, 10, 240);

export const normalizeClassification = (input: unknown) => {
  const source = asObject(input);

  const dealStage = pickEnum(
    source.deal_stage,
    [
      'discovery',
      'qualification',
      'proposal',
      'negotiation',
      'closed_won',
      'closed_lost',
      'unknown',
    ] as const,
    'unknown',
  );

  const intentLevel = pickEnum(
    source.intent_level,
    ['high', 'medium', 'low', 'unknown'] as const,
    'unknown',
  );

  const riskLevel = pickEnum(
    source.risk_level,
    ['high', 'medium', 'low', 'unknown'] as const,
    'unknown',
  );

  const priorityPain = pickEnum(
    source.priority_pain,
    ['high', 'medium', 'low', 'unknown'] as const,
    'unknown',
  );

  const objectionSeverity = pickEnum(
    source.objection_severity,
    ['high', 'medium', 'low', 'unknown'] as const,
    'unknown',
  );

  const statusQuo = pickEnum(
    source.status_quo,
    ['true', 'false', 'unknown'] as const,
    'unknown',
  );

  const bantSource = asObject(source.bant);
  const bant = {
    budget: pickEnum(
      bantSource.budget,
      ['confirmed', 'unconfirmed', 'none', 'unknown'] as const,
      'unknown',
    ),
    authority: pickEnum(
      bantSource.authority,
      [
        'decision_maker_present',
        'influencer_present',
        'not_present',
        'unknown',
      ] as const,
      'unknown',
    ),
    timeline: pickEnum(
      bantSource.timeline,
      ['this_month', 'this_quarter', 'this_year', 'unknown'] as const,
      'unknown',
    ),
    need: pickEnum(
      bantSource.need,
      ['clear', 'vague', 'none', 'unknown'] as const,
      'unknown',
    ),
  };

  const interaction_volume = normalizeInteractionVolume(
    source.interaction_volume,
  );
  const objections = normalizeObjections(source.objections);
  const next_steps = normalizeNextSteps(source.next_steps);
  const signals = normalizeSignals(source.signals);

  const fit_reasons = normalizeStringArray(source.fit_reasons, 8, 120);
  const risks = normalizeStringArray(source.risks, 8, 120);
  const use_cases = normalizeStringArray(source.use_cases, 8, 80);
  const pain_points = normalizeStringArray(source.pain_points, 10, 120);
  const competitors_mentioned = normalizeStringArray(
    source.competitors_mentioned,
    6,
    80,
  );
  const evidence = normalizeEvidence(source.evidence);

  const summary = requiredString(source.summary, 'Resumen no disponible', 400);

  return {
    version: 'v1' as const,
    summary,
    industry: optionalString(source.industry, 80),
    company_context: optionalString(source.company_context, 240),
    deal_stage: dealStage,
    intent_level: intentLevel,
    fit_score: normalizeFitScore(source.fit_score),
    fit_reasons,
    risk_level: riskLevel,
    risks,
    use_cases,
    pain_points,
    priority_pain: priorityPain,
    objections,
    objection_severity: objectionSeverity,
    competitors_mentioned,
    status_quo: statusQuo,
    bant,
    interaction_volume,
    next_steps,
    signals,
    confidence: normalizeConfidence(source.confidence),
    evidence,
  };
};
