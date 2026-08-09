import { z } from 'zod'

import {
  createCanonicalSam31VertexQualificationReleaseRuntime,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-vertex-release-runtime'
import { assertPlainSerializedData } from
  '../services/canonical-professional-gpu-job-lifecycle-service'

export const CANONICAL_SAM3_1_VERTEX_QUALIFICATION_RELEASE_CONFIRMATION =
  'publish-one-sam31-vertex-source-checkpoint-qualification-release-v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const positiveVersion = z.coerce.number().int().positive().safe()
const environmentSchema = z.object({
  confirmation: z.literal(
    CANONICAL_SAM3_1_VERTEX_QUALIFICATION_RELEASE_CONFIRMATION,
  ),
  executionId: safeId,
  executionVersion: z.coerce.number().pipe(z.literal(2)),
  executionSha256: sha256,
  workerResultId: safeId,
  workerResultVersion: positiveVersion,
  workerResultSha256: sha256,
  providerUsageId: safeId,
  providerUsageVersion: positiveVersion,
  providerUsageSha256: sha256,
  platformStopId: safeId,
  platformStopVersion: positiveVersion,
  platformStopSha256: sha256,
  currentRateId: safeId,
  currentRateVersion: positiveVersion,
  currentRateSha256: sha256,
  costReceiptId: safeId,
  costReceiptVersion: positiveVersion,
  costReceiptSha256: sha256,
}).strict()

type Environment = Readonly<Record<string, string | undefined>>
type Runtime = Pick<
  ReturnType<typeof createCanonicalSam31VertexQualificationReleaseRuntime>,
  'publish'
>

export async function publishCanonicalSam31VertexQualificationReleaseFromEnvironment(
  environment: Environment,
  runtime?: Runtime,
) {
  const parsed = parseEnvironment(environment)
  const selected = runtime ??
    createCanonicalSam31VertexQualificationReleaseRuntime()
  return selected.publish({
    executionRef: ref(
      parsed.executionId,
      parsed.executionVersion,
      parsed.executionSha256,
    ),
    workerResultRef: ref(
      parsed.workerResultId,
      parsed.workerResultVersion,
      parsed.workerResultSha256,
    ),
    providerUsageRef: ref(
      parsed.providerUsageId,
      parsed.providerUsageVersion,
      parsed.providerUsageSha256,
    ),
    platformStopRef: ref(
      parsed.platformStopId,
      parsed.platformStopVersion,
      parsed.platformStopSha256,
    ),
    currentAccountRateRef: ref(
      parsed.currentRateId,
      parsed.currentRateVersion,
      parsed.currentRateSha256,
    ),
    qualificationCostReceiptRef: ref(
      parsed.costReceiptId,
      parsed.costReceiptVersion,
      parsed.costReceiptSha256,
    ),
  })
}

function parseEnvironment(environment: Environment) {
  const selected = {
    confirmation:
      environment.WEEDITPRO_SAM31_VERTEX_RELEASE_CONFIRMATION,
    executionId: environment.WEEDITPRO_SAM31_VERTEX_RELEASE_EXECUTION_ID,
    executionVersion:
      environment.WEEDITPRO_SAM31_VERTEX_RELEASE_EXECUTION_VERSION,
    executionSha256:
      environment.WEEDITPRO_SAM31_VERTEX_RELEASE_EXECUTION_SHA256,
    workerResultId:
      environment.WEEDITPRO_SAM31_VERTEX_RELEASE_WORKER_RESULT_ID,
    workerResultVersion:
      environment.WEEDITPRO_SAM31_VERTEX_RELEASE_WORKER_RESULT_VERSION,
    workerResultSha256:
      environment.WEEDITPRO_SAM31_VERTEX_RELEASE_WORKER_RESULT_SHA256,
    providerUsageId:
      environment.WEEDITPRO_SAM31_VERTEX_RELEASE_PROVIDER_USAGE_ID,
    providerUsageVersion:
      environment.WEEDITPRO_SAM31_VERTEX_RELEASE_PROVIDER_USAGE_VERSION,
    providerUsageSha256:
      environment.WEEDITPRO_SAM31_VERTEX_RELEASE_PROVIDER_USAGE_SHA256,
    platformStopId:
      environment.WEEDITPRO_SAM31_VERTEX_RELEASE_PLATFORM_STOP_ID,
    platformStopVersion:
      environment.WEEDITPRO_SAM31_VERTEX_RELEASE_PLATFORM_STOP_VERSION,
    platformStopSha256:
      environment.WEEDITPRO_SAM31_VERTEX_RELEASE_PLATFORM_STOP_SHA256,
    currentRateId:
      environment.WEEDITPRO_SAM31_VERTEX_RELEASE_CURRENT_RATE_ID,
    currentRateVersion:
      environment.WEEDITPRO_SAM31_VERTEX_RELEASE_CURRENT_RATE_VERSION,
    currentRateSha256:
      environment.WEEDITPRO_SAM31_VERTEX_RELEASE_CURRENT_RATE_SHA256,
    costReceiptId:
      environment.WEEDITPRO_SAM31_VERTEX_RELEASE_COST_RECEIPT_ID,
    costReceiptVersion:
      environment.WEEDITPRO_SAM31_VERTEX_RELEASE_COST_RECEIPT_VERSION,
    costReceiptSha256:
      environment.WEEDITPRO_SAM31_VERTEX_RELEASE_COST_RECEIPT_SHA256,
  }
  assertPlainSerializedData(selected, 'sam31_vertex_release_environment')
  return environmentSchema.parse(selected)
}

function ref(id: string, version: number, hash: string) {
  return {
    id,
    version,
    contentHash: `sha256:${hash}` as const,
  }
}
