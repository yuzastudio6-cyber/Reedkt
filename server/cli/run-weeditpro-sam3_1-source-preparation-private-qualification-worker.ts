import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  buildCanonicalSam31EightMinuteQualificationSourcePlan,
  createCanonicalSam31EightMinuteQualificationSourceRepository,
} from '../services/canonical-sam3_1-eight-minute-qualification-source-owner'
import {
  createCanonicalGcsSam31EightMinuteSourcePrivateChunkObjectPort,
  createCanonicalSam31EightMinuteSourcePreparationFixedProcessPort,
} from '../services/canonical-sam3_1-eight-minute-source-preparation-fixed-process-port'
import {
  createCanonicalSam31SourcePreparationPrivateQualificationRepository,
  createCanonicalSam31SourcePreparationPrivateQualificationRun,
  getCanonicalSam31SourcePreparationPrivateQualificationRunRef,
} from '../services/canonical-sam3_1-source-preparation-private-qualification-run'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const PRIVATE_CHUNK_BUCKET = 'reeditpro-production-reeditpro-masks' as const
const QUALIFICATION_SOURCE_ID =
  'sam31-eight-minute-qualification-source-v2' as const
const SOURCE_SHA256 =
  'c13eda5816aba31ed60f5dce838d178ed8307f825972eec7aacf9fb29d8c47cb'

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/+:-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('//'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const environmentSchema = z.object({
  WEEDITPRO_SAM31_SOURCE_PREPARATION_QUALIFICATION_RUN_ID: safeId,
  WEEDITPRO_SAM31_SOURCE_PREPARATION_IMAGE_DIGEST: prefixedSha256,
  WEEDITPRO_SAM31_SOURCE_PREPARATION_IMAGE_BUILD_RECEIPT_ID: safeId,
  WEEDITPRO_SAM31_SOURCE_PREPARATION_IMAGE_BUILD_RECEIPT_HASH:
    prefixedSha256,
  WEEDITPRO_SAM31_SOURCE_PREPARATION_IMAGE_SUPPLY_CHAIN_ID: safeId,
  WEEDITPRO_SAM31_SOURCE_PREPARATION_IMAGE_SUPPLY_CHAIN_HASH:
    prefixedSha256,
  WORKER_GROUP: z.literal('l4_standard_primary'),
  GCS_CONTROL_PLANE_STATE_BUCKET: z.literal(CONTROL_PLANE_BUCKET),
  REEDITPRO_ENV: z.literal('production'),
}).passthrough()

let gpuProcessEntered = false

try {
  const environment = environmentSchema.parse(process.env)
  const runId =
    environment.WEEDITPRO_SAM31_SOURCE_PREPARATION_QUALIFICATION_RUN_ID
  const imageDigest =
    environment.WEEDITPRO_SAM31_SOURCE_PREPARATION_IMAGE_DIGEST
  const storage = new Storage({ projectId: PROJECT_ID })
  const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: CONTROL_PLANE_BUCKET,
  })
  const sourceRepository =
    createCanonicalSam31EightMinuteQualificationSourceRepository({
      objectPort,
    })
  const runRepository =
    createCanonicalSam31SourcePreparationPrivateQualificationRepository({
      objectPort,
    })
  const existing = await runRepository.reread({ qualificationRunId: runId })
  if (existing) {
    console.log(stableAuthorityStringify({
      ok: true,
      status: 'identical_replay',
      qualificationRunRef:
        getCanonicalSam31SourcePreparationPrivateQualificationRunRef(existing),
      gpuProcessEntered: false,
      customerCreditsMutated: false,
      productionAuthorityGranted: false,
    }))
  } else {
    let plan = await sourceRepository.rereadPlan({
      qualificationSourceId: QUALIFICATION_SOURCE_ID,
    })
    if (!plan) {
      plan = buildCanonicalSam31EightMinuteQualificationSourcePlan({
        qualificationSourceId: QUALIFICATION_SOURCE_ID,
        exactSourceObjectRef: {
          id: 'sam31-qualification-source-object-v1',
          version: 1,
          contentHash: `sha256:${SOURCE_SHA256}`,
        },
        exactSourceReadAuthorityRef: {
          id: 'sam31-qualification-source-gcs-reread-authority-v1',
          version: 1,
          contentHash: `sha256:${sha256AuthorityValue({
            bucketName: 'reeditpro-staging-reeditpro-source-media',
            objectName:
              'activation-real-video/phase28/phase28-20260528T01552/source-video.mov',
            generation: '1779933335766660',
            etag: 'CISNz7Hw2pQDEAE=',
            crc32c: 'NalDEA==',
            md5Hash: 'Nw67Ab2dYskL+EvoUyDrLg==',
            sha256: SOURCE_SHA256,
            byteLength: 90_971_927,
          })}`,
        },
        plannedAt: new Date().toISOString(),
      })
      await sourceRepository.persistPlanCreateOnly({ plan })
      const reread = await sourceRepository.rereadPlan({
        qualificationSourceId: QUALIFICATION_SOURCE_ID,
      })
      if (!reread || reread.planHash !== plan.planHash) {
        throw new TypeError('Qualification source plan reread changed.')
      }
      plan = reread
    }
    const immutableImageRef = {
      id: `sam31-source-preparation-image-${imageDigest.slice(7, 23)}`,
      version: 1 as const,
      contentHash: imageDigest,
    }
    const imageBuildReceiptRef = {
      id: environment
        .WEEDITPRO_SAM31_SOURCE_PREPARATION_IMAGE_BUILD_RECEIPT_ID,
      version: 1 as const,
      contentHash: environment
        .WEEDITPRO_SAM31_SOURCE_PREPARATION_IMAGE_BUILD_RECEIPT_HASH,
    }
    const imageSupplyChainRef = {
      id: environment
        .WEEDITPRO_SAM31_SOURCE_PREPARATION_IMAGE_SUPPLY_CHAIN_ID,
      version: 1 as const,
      contentHash: environment
        .WEEDITPRO_SAM31_SOURCE_PREPARATION_IMAGE_SUPPLY_CHAIN_HASH,
    }
    const dispatchAdmissionRef = {
      id: runId,
      version: 1 as const,
      contentHash: `sha256:${sha256AuthorityValue({
        domain:
          'weeditpro_sam3_1_source_preparation_private_qualification_admission_v1',
        runId,
        qualificationSourcePlanHash: plan.planHash,
        immutableImageRef,
        imageBuildReceiptRef,
        imageSupplyChainRef,
        cloudRunJobResource:
          'projects/reeditpro/locations/us-central1/jobs/weeditpro-sam31-source-prep-l4-private-qualification',
        platformFundedPrivateQualification: true,
        customerCreditsMutated: false,
      })}`,
    }
    const processPort =
      createCanonicalSam31EightMinuteSourcePreparationFixedProcessPort({
        storage,
        chunkObjectPort:
          createCanonicalGcsSam31EightMinuteSourcePrivateChunkObjectPort({
            storage,
            projectId: PROJECT_ID,
            bucketName: PRIVATE_CHUNK_BUCKET,
          }),
      })
    const startedAt = new Date().toISOString()
    gpuProcessEntered = true
    const result = await processPort.executeExact({
      invocationId: runId,
      plan,
      dispatchAdmissionRef,
      immutableImageRef,
      toolchainQualificationRef: imageSupplyChainRef,
    })
    const preparationDisposition = await sourceRepository
      .persistPreparationCreateOnly({ preparation: result.preparation })
    const preparation = await sourceRepository.rereadPreparation({
      preparationId: result.preparation.preparationId,
    })
    if (!preparation
      || preparation.preparationHash !== result.preparation.preparationHash) {
      throw new TypeError('Qualification preparation reread changed.')
    }
    const run = createCanonicalSam31SourcePreparationPrivateQualificationRun({
      qualificationRunId: runId,
      immutableImageRef,
      immutableImageDigest: imageDigest,
      imageBuildReceiptRef,
      imageSupplyChainRef,
      plan,
      preparation,
      workerOutputRef: {
        ...result.workerOutputRef,
        version: z.literal(1).parse(result.workerOutputRef.version),
      },
      startedAt,
      completedAt: preparation.preparedAt,
    })
    const runDisposition = await runRepository.persistCreateOnly({ run })
    const reread = await runRepository.reread({ qualificationRunId: runId })
    if (!reread || reread.runHash !== run.runHash) {
      throw new TypeError('Qualification run reread changed.')
    }
    console.log(stableAuthorityStringify({
      ok: true,
      status: runDisposition,
      qualificationRunRef:
        getCanonicalSam31SourcePreparationPrivateQualificationRunRef(reread),
      preparationRef: run.preparationRef,
      workerOutputRef: run.workerOutputRef,
      preparationDisposition,
      exactEightMinute4KL4QualificationRunPersistedAndReread: true,
      terminalCloudRunExecutionReconciliationRequired: true,
      gpuProcessEntered: true,
      substantiveCpuMediaProcessingUsed: false,
      runtimeModelOrToolDownloadPerformed: false,
      customerCreditsMutated: false,
      qaApproved: false,
      publicDeliveryAuthorized: false,
      productionAuthorityGranted: false,
    }))
  }
} catch (error) {
  console.error(stableAuthorityStringify({
    ok: false,
    status: 'rejected',
    errorCode: error instanceof z.ZodError
      ? gpuProcessEntered
        ? 'SAM31_SOURCE_PREPARATION_QUALIFICATION_OUTPUT_INVALID'
        : 'SAM31_SOURCE_PREPARATION_QUALIFICATION_ENVIRONMENT_INVALID'
      : gpuProcessEntered
        ? 'SAM31_SOURCE_PREPARATION_QUALIFICATION_EXECUTION_FAILED'
        : 'SAM31_SOURCE_PREPARATION_QUALIFICATION_BOOTSTRAP_FAILED',
    validationIssues: error instanceof z.ZodError
      ? error.issues.slice(0, 16).map((issue) => ({
          code: issue.code,
          path: issue.path.map((part) => String(part)).join('.'),
          ...(issue.code === 'unrecognized_keys'
            ? { keys: [...issue.keys].sort() }
            : {}),
        }))
      : [],
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
