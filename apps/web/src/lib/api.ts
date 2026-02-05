export type MetricsSummary = {
  totals: { meetings: number; closed: number; closeRatePct: number };
  classification: { avgFitScore: number };
  distributions?: {
    dealStage: Array<{ key: string; count: number }>;
    intent: Array<{ key: string; count: number }>;
    riskLevel: Array<{ key: string; count: number }>;
  };
};

export type DealStageItem = {
  dealStage: string;
  total: number;
  closed: number;
  closeRatePct: number;
};

export type IntentVsFitItem = {
  intent: string;
  count: number;
  avgFitScore: number;
};

export type PainPointItem = {
  painPoint: string;
  count: number;
};

export type BySellerItem = {
  seller: string;
  meetings: number;
  closed: number;
  closeRatePct: number;
  classified: number;
  avgFitScore: number;
};

export type ClassificationLLMData = {
  version: 'v1';
  summary: string;
  industry: string | null;
  company_context: string | null;
  deal_stage: string;
  intent_level: string;
  fit_score: number;
  fit_reasons: string[];
  risk_level: string;
  risks: string[];
  use_cases: string[];
  pain_points: string[];
  priority_pain: string;
  objections: Array<{ type: string; evidence: string }>;
  objection_severity: string;
  competitors_mentioned: string[];
  status_quo: string;
  bant: {
    budget: string;
    authority: string;
    timeline: string;
    need: string;
  };
  interaction_volume: {
    value: number | null;
    unit: string;
    evidence: string | null;
  };
  next_steps: Array<{ description: string; date: string | null }>;
  signals: { positive: string[]; negative: string[] };
  confidence: number;
  evidence: string[];
};

export type ClassificationListItem = {
  id: string;
  meetingId: string;
  dealStage: string;
  intent: string;
  fitScore: number;
  riskLevel: string;
  raw: ClassificationLLMData;
  createdAt: string;
  meeting?: {
    id: string;
    seller: string;
    closed: boolean;
    meetingDate: string;
    customer?: { name: string; email: string };
  };
};

export type ClassificationListResponse =
  | { items: ClassificationListItem[]; nextCursor: string | null }
  | ClassificationListItem[];

export type ClassificationStatusSummary = {
  pending: number;
  processing: number;
  done: number;
  error: number;
  totalMeetings: number;
  totalClassifications: number;
  lastRun: {
    processed: number;
    durationMs: number;
    avgDurationMsPerItem: number | null;
  } | null;
};

export type ClassificationRunSummary = {
  processed: number;
  ok: number;
  errors: number;
  failures: Array<{ meetingId: string; reason: string }>;
  concurrency: number;
  durationMs: number;
};

export type IngestSummary = {
  rows: number;
  customersUpserted: number;
  meetingsCreated: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
};

export type ResetSummary = {
  classificationsDeleted: number;
  meetingsDeleted: number;
  customersDeleted: number;
  message: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ??
  'http://localhost:3001';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;

  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Error desconocido';
    throw new Error(
      `No se pudo conectar con la API (${API_URL}). ¿Está corriendo el servidor? Detalle: ${reason}`,
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  metricsSummary: (params?: { from?: string; to?: string }) => {
    const qs = new URLSearchParams();
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiFetch<MetricsSummary>(`/metrics/summary${suffix}`);
  },

  dealStageVsClose: (params?: { from?: string; to?: string }) => {
    const qs = new URLSearchParams();
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiFetch<{ items: DealStageItem[] }>(`/metrics/deal-stage${suffix}`);
  },

  intentVsFit: (params?: { from?: string; to?: string }) => {
    const qs = new URLSearchParams();
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiFetch<{ items: IntentVsFitItem[] }>(
      `/metrics/intent-vs-fit${suffix}`,
    );
  },

  painPoints: (params?: {
    top?: number;
    normalize?: boolean;
    from?: string;
    to?: string;
  }) => {
    const qs = new URLSearchParams();
    qs.set('top', String(params?.top ?? 10));
    if (params?.normalize) qs.set('normalize', 'true');
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    return apiFetch<{ items: PainPointItem[] }>(
      `/metrics/pain-points?${qs.toString()}`,
    );
  },

  bySeller: (params?: { from?: string; to?: string }) => {
    const qs = new URLSearchParams();
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiFetch<{ items: BySellerItem[] }>(`/metrics/by-seller${suffix}`);
  },

  classificationList: async (params?: { take?: number; cursor?: string }) => {
    const qs = new URLSearchParams();
    qs.set('take', String(params?.take ?? 10));
    if (params?.cursor) qs.set('cursor', params.cursor);
    const data = await apiFetch<ClassificationListResponse>(
      `/classification?${qs.toString()}`,
    );
    if (Array.isArray(data)) return { items: data, nextCursor: null };
    return data;
  },

  classificationById: (id: string) =>
    apiFetch<ClassificationListItem | null>(`/classification/${id}`),

  uploadCsv: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_URL}/ingest/csv`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || 'Error subiendo CSV.');
    }
    return (await res.json()) as IngestSummary;
  },

  classificationRun: (params?: { limit?: number }) => {
    const suffix = params?.limit ? `?limit=${params.limit}` : '';
    return apiFetch<ClassificationRunSummary>(`/classification/run${suffix}`, {
      method: 'POST',
    });
  },

  classificationStatus: () =>
    apiFetch<ClassificationStatusSummary>('/classification/status'),

  resetDatabase: () =>
    apiFetch<ResetSummary>('/admin/reset', {
      method: 'POST',
    }),
};
