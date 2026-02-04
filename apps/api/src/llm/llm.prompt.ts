export const buildClassificationPrompt = (transcript: string) => `
Devuelve SOLO un JSON válido (sin markdown).

Debes cumplir estrictamente con:
- version: "v1"
- deal_stage: "discovery" | "qualification" | "proposal" | "negotiation" | "closed_won" | "closed_lost" | "unknown"
- intent_level: "high" | "medium" | "low" | "unknown"
- risk_level: "high" | "medium" | "low" | "unknown"
- priority_pain: "high" | "medium" | "low" | "unknown"
- objection_severity: "high" | "medium" | "low" | "unknown"
- status_quo: "true" | "false" | "unknown"
- bant.budget: "confirmed" | "unconfirmed" | "none" | "unknown"
- bant.authority: "decision_maker_present" | "influencer_present" | "not_present" | "unknown"
- bant.timeline: "this_month" | "this_quarter" | "this_year" | "unknown"
- bant.need: "clear" | "vague" | "none" | "unknown"

Tipos obligatorios:
- fit_score: number entre 0 y 100 (si no sabes, usa 0)
- confidence: number entre 0 y 1 (si no sabes, usa 0.5)
- interaction_volume: { value: number, unit: string, evidence: string | null }
- objections: array de objetos { type: string, evidence: string }
- next_steps: array de objetos { description: string, date: string | null }
- signals: { positive: string[], negative: string[] }
- fit_reasons, risks, use_cases, pain_points, competitors_mentioned, evidence: string[]

Si no hay información:
- usa "unknown" para enums
- usa [] para arrays
- usa null solo donde se permite (date, interaction_volume.evidence, next_steps.date)

Devuelve EXACTAMENTE estas llaves a nivel raíz:
version, summary, industry, company_context, deal_stage, intent_level, fit_score, fit_reasons,
risk_level, risks, use_cases, pain_points, priority_pain, objections, objection_severity,
competitors_mentioned, status_quo, bant, interaction_volume, next_steps, signals, confidence, evidence.

Transcripción:
"""
${transcript}
"""
`;
