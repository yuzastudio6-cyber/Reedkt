import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSam31EightMinuteQualificationSourceRepository,
  parseCanonicalSam31EightMinuteQualificationSourcePlan,
} from '../services/canonical-sam3_1-eight-minute-qualification-source-owner'
import {
  createCanonicalGcsSam31EightMinuteSourcePrivateChunkObjectPort,
  createCanonicalSam31EightMinuteSourcePreparationFixedProcessPort,
} from '../services/canonical-sam3_1-eight-minute-source-preparation-fixed-process-port'
import {
  createCanonicalSam31EightMinuteSourcePreparationAuthorityRepository,
} from '../services/canonical-sam3_1-eight-minute-source-preparation-admission-owner'
import { stableAuthorityStringify } from '../services/private-edit-authority-store'

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_STATE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const PRIVATE_CHUNK_BUCKET = 'reeditpro-production-reeditpro-masks' as const

const environmentSchema = z.object({
  WEEDITPRO_SAM31_SOURCE_PREPARATION_INVOCATION_ID:
    z.string().trim().min(1).max(240)
      .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
      .refine((value) => !value.includes('..')),
  WORKER_GROUP: z.literal('l4_standard_primary'),
  GCS_CONTROL_PLANE_STATE_BUCKET: z.literal(CONTROL_PLANE_STATE_BUCKET),
  REEDITPRO_ENV: z.literal('production'),
}).passthrough()

let gpuProcessEntered = false

try {
  const environment = environmentSchema.parse(process.env)
  const invocationId =
    environment.WEEDITPRO_SAM31_SOURCE_PREPARATION_INVOCATION_ID
  const storage = new Storage({ projectId: PROJECT_ID })
  const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: environment.GCS_CONTROL_PLANE_STATE_BUCKET,
  })
  const authorityRepository =
    createCanonicalSam31EightMinuteSourcePreparationAuthorityRepository({
      objectPort,
    })
  const sourceRepository =
    createCanonicalSam31EightMinuteQualificationSourceRepository({
      objectPort,
    })
  const consumed = await authorityRepository.rereadConsumedAdmission({
    invocationId,
  })
  if (!consumed) {
    emitNotReady('sam31_source_preparation_consumed_admission_not_ready')
  } else {
    const admission = consumed.admission
    const planRaw = await sourceRepository.rereadPlan({
      qualificationSourceId: admission.qualificationSourcePlanRef.id,
    })
    if (!planRaw) {
      emitNotReady('sam31_source_preparation_plan_not_ready')
    } else {
      const plan = parseCanonicalSam31EightMinuteQualificationSourcePlan(
        planRaw,
      )
      if (admission.invocationId !== invocationId
        || admission.qualificationSourcePlanRef.contentHash !==
          `sha256:${plan.planHash}`
        || admission.exactEightMinuteSourceRef.contentHash !==
          plan.exactEightMinuteSourceRef.contentHash
        || admission.releaseRef.contentHash !==
          `sha256:${consumed.release.releaseHash}`
        || admission.qualificationRef.contentHash !==
          `sha256:${consumed.qualification.qualificationHash}`
        || admission.immutableImageRef.contentHash !==
          consumed.release.immutableImageDigest) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'SAM 3.1 source-preparation worker lineage changed.',
          409,
          { requiredGate: 'sam31_source_preparation_worker_lineage_changed' },
        )
      }
      const preparationId =
        `${plan.qualificationSourceId}:preparation:${invocationId}`
      const existing = await sourceRepository.rereadPreparation({
        preparationId,
      })
      if (existing) {
        console.log(stableAuthorityStringify({
          ok: true,
          status: 'identical_replay',
          invocationId,
          qualificationSourceId: plan.qualificationSourceId,
          preparationRef: {
            id: existing.preparationId,
            version: 1,
            contentHash: `sha256:${existing.preparationHash}`,
          },
          gpuProcessEntered: false,
          exactCreateOnlyPreparationRereadVerified: true,
          terminalCloudRunExecutionClaimed: false,
          scaleBackToZeroClaimedByWorker: false,
          accountEffectiveCostClaimedByWorker: false,
          substantiveCpuMediaProcessingUsed: false,
          runtimeModelOrToolDownloadPerformed: false,
          customerCreditsMutated: false,
          qaApproved: false,
          publicDeliveryAuthorized: false,
          productionAuthorityGranted: false,
        }))
      } else {
        const executionPort =
          createCanonicalSam31EightMinuteSourcePreparationFixedProcessPort({
            storage,
            chunkObjectPort:
              createCanonicalGcsSam31EightMinuteSourcePrivateChunkObjectPort({
                storage,
                projectId: PROJECT_ID,
                bucketName: PRIVATE_CHUNK_BUCKET,
              }),
          })
        gpuProcessEntered = true
        const result = await executionPort.executeExact({
          invocationId,
          plan,
          dispatchAdmissionRef: {
            id: admission.admissionId,
            version: 1,
            contentHash: `sha256:${admission.admissionHash}`,
          },
          immutableImageRef: admission.immutableImageRef,
          toolchainQualificationRef: admission.qualificationRef,
        })
        const disposition = await sourceRepository
          .persistPreparationCreateOnly({ preparation: result.preparation })
        const reread = await sourceRepository.rereadPreparation({
          preparationId: result.preparation.preparationId,
        })
        if (!reread
          || reread.preparationHash !== result.preparation.preparationHash) {
          throw new ApiError(
            'IDEMPOTENCY_CONFLICT',
            'SAM 3.1 source preparation did not reread exactly.',
            409,
            { requiredGate: 'sam31_source_preparation_reread_changed' },
          )
        }
        console.log(stableAuthorityStringify({
          ok: true,
          status: disposition,
          invocationId,
          qualificationSourceId: plan.qualificationSourceId,
          preparationRef: {
            id: reread.preparationId,
            version: 1,
            contentHash: `sha256:${reread.preparationHash}`,
          },
          workerOutputRef: result.workerOutputRef,
          preparedChunkCount: reread.preparedChunkCount,
          exactCreateOnlyPreparationRereadVerified: true,
          gpuProcessEntered: true,
          terminalCloudRunExecutionClaimed:
            result.terminalCloudRunExecutionClaimed,
          scaleBackToZeroClaimedByWorker:
            result.scaleBackToZeroClaimedByWorker,
          accountEffectiveCostClaimedByWorker:
            result.accountEffectiveCostClaimedByWorker,
          substantiveCpuMediaProcessingUsed: false,
          runtimeModelOrToolDownloadPerformed: false,
          customerCreditsMutated: result.customerCreditsMutated,
          qaApproved: false,
          publicDeliveryAuthorized: false,
          productionAuthorityGranted: result.productionAuthorityGranted,
        }))
      }
    }
  }
} catch (error) {
  console.error(stableAuthorityStringify({
    ok: false,
    status: 'rejected',
    errorCode: safeErrorCode(error),
    gpuProcessState: gpuProcessEntered
      ? 'unknown_requires_terminal_reconciliation'
      : 'not_started',
    automaticRetryAllowed: false,
    substantiveCpuMediaProcessingUsed: false,
    runtimeModelOrToolDownloadPerformed: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
  }))
  process.exitCode = 1
}

function emitNotReady(requiredGate: string): void {
  console.error(stableAuthorityStringify({
    ok: false,
    status: 'not_ready',
    requiredGate,
    gpuProcessEntered: false,
    automaticRetryAllowed: false,
    substantiveCpuMediaProcessingUsed: false,
    runtimeModelOrToolDownloadPerformed: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
  }))
  process.exitCode = 2
}

function safeErrorCode(error: unknown): string {
  if (error instanceof ApiError) return error.code
  if (error instanceof z.ZodError) return 'WORKER_ENVIRONMENT_INVALID'
  return gpuProcessEntered
    ? 'SAM31_SOURCE_PREPARATION_EXECUTION_FAILED'
    : 'SAM31_SOURCE_PREPARATION_BOOTSTRAP_FAILED'
}
