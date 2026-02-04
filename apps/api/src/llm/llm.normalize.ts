type AnyObj = Record<string, unknown>;

const asString = (v: unknown, fallback = 'unknown') =>
  typeof v === 'string' && v.trim() ? v.trim() : fallback;

const asNumber = (v: unknown, fallback = 0) => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
};

const asArrayOfStrings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];

const pickEnum = <T extends string>(
  v: unknown,
  allowed: readonly T[],
  fallback: T,
): T =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v)
    ? (v as T)
    : fallback;

const asObject = (v: unknown): AnyObj =>
  v && typeof v === 'object' ? (v as AnyObj) : {};

type InteractionUnit = 'daily' | 'weekly' | 'monthly' | 'unknown';

const normalizeInteractionUnit = (v: unknown): InteractionUnit => {
  if (typeof v !== 'string') return 'unknown';

  const s = v.trim().toLowerCase();

  // ya válido
  if (s === 'daily' || s === 'weekly' || s === 'monthly' || s === 'unknown') {
    return s;
  }

  // mapeos comunes (español/inglés)
  if (
    s.includes('día') ||
    s.includes('dia') ||
    s.includes('diario') ||
    s.includes('por dia') ||
    s.includes('per day') ||
    s.includes('/day') ||
    s.includes('day')
  ) {
    return 'daily';
  }

  if (
    s.includes('semana') ||
    s.includes('semanal') ||
    s.includes('per week') ||
    s.includes('/week') ||
    s.includes('week')
  ) {
    return 'weekly';
  }

  if (
    s.includes('mes') ||
    s.includes('mensual') ||
    s.includes('per month') ||
    s.includes('/month') ||
    s.includes('month')
  ) {
    return 'monthly';
  }

  return 'unknown';
};

export const normalizeClassification = (input: unknown) => {
  const o = asObject(input);

  const dealStage = pickEnum(
    o.deal_stage,
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
    o.intent_level,
    ['high', 'medium', 'low', 'unknown'] as const,
    'unknown',
  );
  const riskLevel = pickEnum(
    o.risk_level,
    ['high', 'medium', 'low', 'unknown'] as const,
    'unknown',
  );
  const priorityPain = pickEnum(
    o.priority_pain,
    ['high', 'medium', 'low', 'unknown'] as const,
    'unknown',
  );
  const objectionSeverity = pickEnum(
    o.objection_severity,
    ['high', 'medium', 'low', 'unknown'] as const,
    'unknown',
  );
  const statusQuo = pickEnum(
    o.status_quo,
    ['true', 'false', 'unknown'] as const,
    'unknown',
  );

  const bantObj = asObject(o.bant);
  const bant = {
    budget: pickEnum(
      bantObj.budget,
      ['confirmed', 'unconfirmed', 'none', 'unknown'] as const,
      'unknown',
    ),
    authority: pickEnum(
      bantObj.authority,
      [
        'decision_maker_present',
        'influencer_present',
        'not_present',
        'unknown',
      ] as const,
      'unknown',
    ),
    timeline: pickEnum(
      bantObj.timeline,
      ['this_month', 'this_quarter', 'this_year', 'unknown'] as const,
      'unknown',
    ),
    need: pickEnum(
      bantObj.need,
      ['clear', 'vague', 'none', 'unknown'] as const,
      'unknown',
    ),
  };

  const interactionObj = asObject(o.interaction_volume);
  const interaction_volume = {
    value: asNumber(interactionObj.value, 0),
    unit: normalizeInteractionUnit(interactionObj.unit),
    evidence: typeof interactionObj.evidence === 'string'
      ? interactionObj.evidence
      : null,
  };

  const objectionsRaw = Array.isArray(o.objections) ? o.objections : [];
  const objections = objectionsRaw
    .map((x) => asObject(x))
    .map((x) => ({
      type: asString(x.type, 'unknown'),
      evidence: asString(x.evidence, ''),
    }))
    .filter((x) => x.evidence.length > 0);

  const nextStepsRaw = Array.isArray(o.next_steps) ? o.next_steps : [];
  const next_steps = nextStepsRaw.map((x) => {
    const obj = asObject(x);
    return {
      description: asString(obj.description, 'unknown'),
      date: typeof obj.date === 'string' ? obj.date : null,
    };
  });

  const signalsObj = asObject(o.signals);
  const signals = {
    positive: asArrayOfStrings(signalsObj.positive),
    negative: asArrayOfStrings(signalsObj.negative),
  };

  const fit_score = Math.max(0, Math.min(100, asNumber(o.fit_score, 0)));
  const confidence = Math.max(0, Math.min(1, asNumber(o.confidence, 0.5)));

  return {
    version: 'v1' as const,
    summary: asString(o.summary, ''),
    industry: asString(o.industry, 'unknown'),
    company_context: asString(o.company_context, ''),
    deal_stage: dealStage,
    intent_level: intentLevel,
    fit_score,
    fit_reasons: asArrayOfStrings(o.fit_reasons),
    risk_level: riskLevel,
    risks: asArrayOfStrings(o.risks),
    use_cases: asArrayOfStrings(o.use_cases),
    pain_points: asArrayOfStrings(o.pain_points),
    priority_pain: priorityPain,
    objections,
    objection_severity: objectionSeverity,
    competitors_mentioned: asArrayOfStrings(o.competitors_mentioned),
    status_quo: statusQuo,
    bant,
    interaction_volume,
    next_steps,
    signals,
    confidence,
    evidence: asArrayOfStrings(o.evidence),
  };
};
