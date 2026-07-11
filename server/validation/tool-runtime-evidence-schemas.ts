import { z } from 'zod'

export const inspectToolRuntimeEvidenceSchema = z.object({
  probeMode: z.enum(['disabled', 'safe_local_presence']).default('disabled'),
}).strict()
