import type { z } from 'zod';

import type { ClassificationResultSchema } from '../schemas/classification.schema';

export type ClassificationResult = z.infer<typeof ClassificationResultSchema>;
