import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  assertCanonicalSam31PrivateArtifactIngestReceipt,
  type CanonicalSam31PrivateArtifactIngestReceipt,
} from '../model-artifacts/canonical-sam3_1-private-artifact-ingest'
import {
  assertCanonicalSam31SourceCheckpointQualificationWorkerRequest,
  type CanonicalSam31SourceCheckpointQualificationWorkerRequest,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification'
import type {
  CanonicalGoogleCloudGpuRateReadPort,
} from '../tool-cost-metering/canonical-current-google-cloud-gpu-rate-authority'
import {
  createCanonicalCurrentGoogleCloudGpuRateAuthorityRepository,
} from './canonical-current-google-cloud-gpu-rate-authority-repository'
import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalGcsSam31A100QualificationFoundationRepository,
} from './canonical-sam3_1-a100-qualification-foundation-repository'
import type {
  CanonicalSam31A100QualificationFoundationReadPort,
} from './canonical-sam3_1-a100-qualification-foundation-owner'
import {
  createCanonicalSam31GcpQualificationImageSupplyChainReleaseRepository,
} from './canonical-sam3_1-cloud-image-supply-chain-release-runtime'
import {
  createCanonicalSam31QualificationA100RateOwner,
  type CanonicalSam31QualificationA100RateOwner,
} from './canonical-sam3_1-qualification-a100-rate-owner'
import {
  assertCanonicalSam31QualificationA100Admission,
  assertCanonicalSam31QualificationA100JobObservation,
  assertCanonicalSam31QualificationA100MountObservation,
  assertCanonicalSam31QualificationA100Submission,
  createCanonicalGoogleBatchSam31QualificationTransport,
  createCanonicalSam31SourceCheckpointQualificationA100Phase,
  type CanonicalSam31QualificationA100StatePort,
  type CanonicalSam31QualificationBatchTransport,
  type CanonicalSam31QualificationImageReleaseReadPort,
} from './canonical-sam3_1-source-checkpoint-qualification-a100-phase'
import {
  createCanonicalSam31QualificationA100StateRepository,
} from './canonical-sam3_1-source-checkpoint-qualification-a100-runtime'
import {
  createCanonicalSam31GcpQualificationPackageRepository,
  type CanonicalSam31QualificationPackageRepository,
} from './canonical-sam3_1-source-checkpoint-qualification-package-repository'
import {
  assertCanonicalSam31QualificationResultEvidence,
  createCanonicalSam31QualificationGcsResultObjectPort,
  createCanonicalSam31QualificationResultOwner,
  type CanonicalSam31QualificationResultEvidence,
} from './canonical-sam3_1-source-checkpoint-qualification-result-owner'
import {
  createCanonicalSam31QualificationGcsStagingPort,
  createCanonicalSam31QualificationStagingOwner,
  type CanonicalSam31QualificationStagingOwner,
} from './canonical-sam3_1-source-checkpoint-qualification-staging-owner'
import {
  assertCanonicalSam31QualificationTerminalEvidence,
  createCanonicalSam31QualificationGoogleCloudTerminalPort,
  createCanonicalSam31QualificationTerminalEvidenceOwner,
  type CanonicalSam31QualificationTerminalEvidence,
  type CanonicalSam31QualificationTerminalPlatformReadPort,
} from './canonical-sam3_1-source-checkpoint-qualification-terminal-evidence-owner'
import { assertPlainSerializedData } from
  './canonical-professional-gpu-job-lifecycle-service'

export const CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_RUNTIME_VERSION =
  'canonical-sam3_1-source-checkpoint-qualification-runtime-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()

type ResultOwner = Pick<
  ReturnType<typeof createCanonicalSam31QualificationResultOwner>,
  'rereadAndPersist'
>
type TerminalEvidenceOwner = Pick<
  ReturnType<typeof createCanonicalSam31QualificationTerminalEvidenceOwner>,
  'rereadAndPersist'
>

export interface CanonicalSam31SourceCheckpointQualificationRuntimeDependencies {
  readonly foundationReadPort:
    CanonicalSam31A100QualificationFoundationReadPort
  readonly qualificationPackageRepository:
    CanonicalSam31QualificationPackageRepository
  readonly qualificationImageReleaseReadPort:
    CanonicalSam31QualificationImageReleaseReadPort
  readonly stagingOwner: CanonicalSam31QualificationStagingOwner
  readonly statePort: CanonicalSam31QualificationA100StatePort
  readonly rateOwner: CanonicalSam31QualificationA100RateOwner
  readonly batchTransport: CanonicalSam31QualificationBatchTransport
  readonly resultOwner: ResultOwner
  readonly terminalEvidenceOwner: TerminalEvidenceOwner
  readonly now?: () => string
}

/**
 * One ordered server composition for the private source/checkpoint
 * qualification lane. It can stage, dispatch, reconcile, and record terminal
 * evidence, but deliberately cannot qualify or release SAM 3.1.
 */
export function createCanonicalSam31SourceCheckpointQualificationRuntime(
  input: CanonicalSam31SourceCheckpointQualificationRuntimeDependencies,
) {
  assertDependencies(input)
  const phase = createCanonicalSam31SourceCheckpointQualificationA100Phase({
    foundationReadPort: input.foundationReadPort,
    imageReleaseReadPort: input.qualificationImageReleaseReadPort,
    workerRequestReadPort: input.qualificationPackageRepository,
    privateMountReadPort: input.stagingOwner,
    rateReadPort: input.rateOwner,
    statePort: input.statePort,
    batchTransport: input.batchTransport,
    now: input.now,
  })
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_RUNTIME_VERSION,
    evidenceClass:
      'private_ordered_fail_closed_qualification_composition' as const,

    async prepareAndStage(untrusted: {
      readonly attemptId: string
      readonly workerRequest:
        CanonicalSam31SourceCheckpointQualificationWorkerRequest
      readonly ingestReceipt: CanonicalSam31PrivateArtifactIngestReceipt
      readonly preparedAt: string
    }) {
      assertPlainSerializedData(untrusted, 'sam31_qualification_prepare')
      const request = z.object({
        attemptId: safeId,
        workerRequest: z.unknown(),
        ingestReceipt: z.unknown(),
        preparedAt: timestamp,
      }).strict().parse(untrusted)
      const workerRequest =
        assertCanonicalSam31SourceCheckpointQualificationWorkerRequest(
          request.workerRequest,
        )
      const ingestReceipt = assertCanonicalSam31PrivateArtifactIngestReceipt(
        request.ingestReceipt,
      )
      const persisted = await input.qualificationPackageRepository
        .persistQualificationPackageCreateOnly({
          workerRequest,
          ingestReceipt,
          preparedAt: request.preparedAt,
        })
      const mountObservation =
        assertCanonicalSam31QualificationA100MountObservation(
          await input.stagingOwner.stageOne({
            attemptId: request.attemptId,
            workerRequest,
          }),
        )
      return Object.freeze({
        status: 'staged_not_dispatched' as const,
        attemptId: request.attemptId,
        packageDisposition: persisted.disposition,
        packageRef: persisted.packageRef,
        workerRequestRef: persisted.workerRequestRef,
        mountObservation,
        gpuJobStarted: false as const,
        modelOrCheckpointDownloadedToDeveloperMachine: false as const,
        sourceCheckpointQualificationGranted: false as const,
        runtimeReleaseGranted: false as const,
        customerCreditsMutated: false as const,
        productionReady: false as const,
      })
    },

    async admitAndStart(untrusted: {
      readonly attemptId: string
      readonly qualificationImageSupplyChainReleaseRef:
        z.input<typeof evidenceRefSchema>
      readonly workerRequestRef: z.input<typeof evidenceRefSchema>
    }) {
      assertPlainSerializedData(untrusted, 'sam31_qualification_admit_start')
      const request = z.object({
        attemptId: safeId,
        qualificationImageSupplyChainReleaseRef: evidenceRefSchema,
        workerRequestRef: evidenceRefSchema,
      }).strict().parse(untrusted)
      return phase.admitAndStart(request)
    },

    async reconcileOne(untrusted: { readonly attemptId: string }) {
      assertPlainSerializedData(untrusted, 'sam31_qualification_reconcile')
      return phase.reconcileOne(z.object({
        attemptId: safeId,
      }).strict().parse(untrusted))
    },

    async finalizeSucceededAttempt(untrusted: {
      readonly attemptId: string
    }): Promise<{
      readonly status: 'terminal_evidence_recorded_release_blocked'
      readonly resultEvidence: CanonicalSam31QualificationResultEvidence
      readonly terminalEvidence: CanonicalSam31QualificationTerminalEvidence
      readonly sourceCheckpointQualificationGranted: false
      readonly runtimeReleaseGranted: false
      readonly customerCreditsMutated: false
      readonly customerBillingAuthorityGranted: false
      readonly productionReady: false
    }> {
      assertPlainSerializedData(untrusted, 'sam31_qualification_finalize')
      const { attemptId } = z.object({ attemptId: safeId })
        .strict().parse(untrusted)
      const admission = assertCanonicalSam31QualificationA100Admission(
        await input.statePort.rereadAdmission({ attemptId }),
      )
      const submission = assertCanonicalSam31QualificationA100Submission(
        await input.statePort.rereadSubmission({ attemptId }),
      )
      const terminal = assertCanonicalSam31QualificationA100JobObservation(
        await input.statePort.rereadTerminalObservation({ attemptId }),
      )
      if (
        terminal.disposition !== 'job_succeeded_pending_result_reread'
        || terminal.batchState !== 'SUCCEEDED'
      ) throw new Error(
        'SAM 3.1 qualification cannot finalize before exact job success.',
      )
      const workerRequest =
        assertCanonicalSam31SourceCheckpointQualificationWorkerRequest(
          await input.qualificationPackageRepository.rereadExactWorkerRequest({
            workerRequestRef: admission.workerRequestRef,
          }),
        )
      const mountObservation =
        assertCanonicalSam31QualificationA100MountObservation(
          await input.stagingOwner.rereadExactAttemptMount({
            attemptId,
            workerRequest,
          }),
        )
      const resultEvidence =
        assertCanonicalSam31QualificationResultEvidence(
          await input.resultOwner.rereadAndPersist({
            attemptId,
            workerRequest,
            mountObservation,
            submission,
            terminalJobObservation: terminal,
          }),
        )
      const terminalEvidence =
        assertCanonicalSam31QualificationTerminalEvidence(
          await input.terminalEvidenceOwner.rereadAndPersist({
            attemptId,
            mountObservation,
            admission,
            submission,
            terminalJobObservation: terminal,
            resultEvidence,
          }),
        )
      return Object.freeze({
        status: 'terminal_evidence_recorded_release_blocked' as const,
        resultEvidence,
        terminalEvidence,
        sourceCheckpointQualificationGranted: false as const,
        runtimeReleaseGranted: false as const,
        customerCreditsMutated: false as const,
        customerBillingAuthorityGranted: false as const,
        productionReady: false as const,
      })
    },
  })
}

/** Real Google Cloud wiring. Construction performs no network or GPU work. */
export function createCanonicalSam31GcpSourceCheckpointQualificationRuntime(
  input: {
    readonly liveRateReadPort: CanonicalGoogleCloudGpuRateReadPort
    readonly storage?: Storage
    readonly batchTransport?: CanonicalSam31QualificationBatchTransport
    readonly terminalPlatformReadPort?:
      CanonicalSam31QualificationTerminalPlatformReadPort
    readonly now?: () => string
  },
) {
  const storage = input.storage ?? new Storage({ projectId: PROJECT_ID })
  const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
    storage,
    bucketName: CONTROL_PLANE_BUCKET,
  })
  const foundation =
    createCanonicalGcsSam31A100QualificationFoundationRepository({ storage })
  const qualificationPackageRepository =
    createCanonicalSam31GcpQualificationPackageRepository({ storage })
  const stagingOwner = createCanonicalSam31QualificationStagingOwner({
    foundationReadPort: foundation,
    sourceReadPort: qualificationPackageRepository,
    stagingPort: createCanonicalSam31QualificationGcsStagingPort({ storage }),
    observationObjectPort: objectPort,
    now: input.now,
  })
  const statePort = createCanonicalSam31QualificationA100StateRepository({
    objectPort,
  })
  const rateOwner = createCanonicalSam31QualificationA100RateOwner({
    liveRateReadPort: input.liveRateReadPort,
    repository: createCanonicalCurrentGoogleCloudGpuRateAuthorityRepository({
      objectPort,
    }),
  })
  const resultOwner = createCanonicalSam31QualificationResultOwner({
    resultObjectPort:
      createCanonicalSam31QualificationGcsResultObjectPort({ storage }),
    evidenceObjectPort: objectPort,
    now: input.now,
  })
  const terminalEvidenceOwner =
    createCanonicalSam31QualificationTerminalEvidenceOwner({
      platformReadPort: input.terminalPlatformReadPort ??
        createCanonicalSam31QualificationGoogleCloudTerminalPort(),
      rateReadPort: rateOwner,
      evidenceObjectPort: objectPort,
      now: input.now,
    })
  return createCanonicalSam31SourceCheckpointQualificationRuntime({
    foundationReadPort: foundation,
    qualificationPackageRepository,
    qualificationImageReleaseReadPort:
      createCanonicalSam31GcpQualificationImageSupplyChainReleaseRepository({
        storage,
      }),
    stagingOwner,
    statePort,
    rateOwner,
    batchTransport: input.batchTransport ??
      createCanonicalGoogleBatchSam31QualificationTransport(),
    resultOwner,
    terminalEvidenceOwner,
    now: input.now,
  })
}

function assertDependencies(
  input: CanonicalSam31SourceCheckpointQualificationRuntimeDependencies,
): void {
  if (
    typeof input.foundationReadPort?.rereadCurrentFoundation !== 'function'
    || typeof input.qualificationPackageRepository
      ?.persistQualificationPackageCreateOnly !== 'function'
    || typeof input.qualificationPackageRepository
      ?.rereadExactWorkerRequest !== 'function'
    || typeof input.qualificationImageReleaseReadPort
      ?.rereadQualifiedQualificationImageRelease !== 'function'
    || typeof input.stagingOwner?.stageOne !== 'function'
    || typeof input.stagingOwner?.rereadExactAttemptMount !== 'function'
    || typeof input.statePort?.rereadAdmission !== 'function'
    || typeof input.rateOwner?.rereadCurrentAccountEffectiveA100Rate !==
      'function'
    || typeof input.rateOwner?.rereadExactApprovedRate !== 'function'
    || typeof input.batchTransport?.request !== 'function'
    || typeof input.resultOwner?.rereadAndPersist !== 'function'
    || typeof input.terminalEvidenceOwner?.rereadAndPersist !== 'function'
  ) throw new Error('SAM 3.1 qualification runtime is not configured.')
}
