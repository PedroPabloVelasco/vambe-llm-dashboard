export const buildClassificationPrompt = (transcript: string) => `
Devuelve SOLO un JSON válido (sin texto extra) con EXACTAMENTE estas llaves:
version, summary, industry, company_context, deal_stage, intent_level, fit_score, fit_reasons,
risk_level, risks, use_cases, pain_points, priority_pain, objections, objection_severity,
competitors_mentioned, status_quo, bant, interaction_volume, next_steps, signals, confidence, evidence.

Reglas generales:
- Si un dato no está en la transcripción: usa "unknown", null o [] según corresponda.
- NO incluyas texto fuera del JSON.
- version SIEMPRE debe ser "v1".
- fit_score debe ser un número entero entre 0 y 100.
- confidence debe ser un número entre 0 y 1 (ej: 0.74). NO uses strings ni porcentajes.

Enums válidos (usa SOLO estos valores):
- deal_stage: "discovery" | "qualification" | "proposal" | "negotiation" | "closed_won" | "closed_lost" | "unknown"
- intent_level: "high" | "medium" | "low" | "unknown"
- risk_level: "high" | "medium" | "low" | "unknown"
- priority_pain: "high" | "medium" | "low" | "unknown"
- objection_severity: "high" | "medium" | "low" | "unknown"
- status_quo: "true" | "false" | "unknown"

BANT enums (usa SOLO estos valores):
- bant.budget: "confirmed" | "unconfirmed" | "none" | "unknown"
- bant.authority: "decision_maker_present" | "influencer_present" | "not_present" | "unknown"
- bant.timeline: "this_month" | "this_quarter" | "this_year" | "unknown"
- bant.need: "clear" | "vague" | "none" | "unknown"

interaction_volume:
- Debe ser un objeto: { value: number, unit: "daily"|"weekly"|"monthly"|"unknown", evidence: string|null }
- unit SOLO puede ser: "daily", "weekly", "monthly" o "unknown"
- Si aparece "al día"/"diario" => "daily"; "semanal"/"por semana" => "weekly"; "mensual"/"por mes" => "monthly"

objections:
- Es un array de objetos: { type, evidence }
- type SOLO puede ser: "price"|"timing"|"authority"|"need"|"competition"|"security"|"integration"|"budget_freeze"|"other"

next_steps:
- Array de objetos: { description: string, date: string|null }

signals:
- Objeto: { positive: string[], negative: string[] }

Transcripción:
"""
${transcript}
"""
`;
