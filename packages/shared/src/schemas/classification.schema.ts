import { z } from 'zod';

const DealStage = z.enum([
  'discovery',
  'qualification',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
  'unknown',
]);

const IntentLevel = z.enum(['high', 'medium', 'low', 'unknown']);
const RiskLevel = z.enum(['high', 'medium', 'low', 'unknown']);

const ObjectionType = z.enum([
  'price',
  'timing',
  'authority',
  'need',
  'competition',
  'security',
  'integration',
  'budget_freeze',
  'other',
]);

const BantBudget = z.enum(['confirmed', 'unconfirmed', 'none', 'unknown']);
const BantAuthority = z.enum([
  'decision_maker_present',
  'influencer_present',
  'not_present',
  'unknown',
]);
const BantTimeline = z.enum([
  'this_month',
  'this_quarter',
  'this_year',
  'unknown',
]);
const BantNeed = z.enum(['clear', 'vague', 'none', 'unknown']);

const NextStepSchema = z.object({
  description: z.string().min(1).max(240),
  date: z.string().datetime().nullable(),
});

const ObjectionSchema = z.object({
  type: ObjectionType,
  evidence: z.string().min(1).max(240),
});

const InteractionVolumeSchema = z.object({
  value: z.number().int().positive().nullable(),
  unit: z.enum(['daily', 'weekly', 'monthly', 'unknown']),
  evidence: z.string().min(1).max(240).nullable(),
});

export const ClassificationResultSchema = z.object({
  version: z.literal('v1'),

  summary: z.string().min(1).max(400),

  industry: z.string().min(1).max(80).nullable(),
  company_context: z.string().min(1).max(240).nullable(),

  deal_stage: DealStage.default('unknown'),
  intent_level: IntentLevel.default('unknown'),

  fit_score: z.number().min(0).max(100).default(0),
  fit_reasons: z.array(z.string().min(1).max(120)).max(8).default([]),

  risk_level: RiskLevel.default('unknown'),
  risks: z.array(z.string().min(1).max(120)).max(8).default([]),

  use_cases: z.array(z.string().min(1).max(80)).max(8).default([]),
  pain_points: z.array(z.string().min(1).max(120)).max(10).default([]),
  priority_pain: z
    .enum(['high', 'medium', 'low', 'unknown'])
    .default('unknown'),

  objections: z.array(ObjectionSchema).max(8).default([]),
  objection_severity: z
    .enum(['high', 'medium', 'low', 'unknown'])
    .default('unknown'),

  competitors_mentioned: z.array(z.string().min(1).max(80)).max(6).default([]),
  status_quo: z.enum(['true', 'false', 'unknown']).default('unknown'),

  bant: z.object({
    budget: BantBudget.default('unknown'),
    authority: BantAuthority.default('unknown'),
    timeline: BantTimeline.default('unknown'),
    need: BantNeed.default('unknown'),
  }),

  interaction_volume: InteractionVolumeSchema,

  next_steps: z.array(NextStepSchema).max(6).default([]),

  signals: z.object({
    positive: z.array(z.string().min(1).max(120)).max(10).default([]),
    negative: z.array(z.string().min(1).max(120)).max(10).default([]),
  }),

  confidence: z.number().min(0).max(1).default(0.5),

  evidence: z.array(z.string().min(1).max(240)).max(10).default([]),
});
