import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  assertCanonicalSam31PrivateArtifactIngestReceipt,
  canonicalSam31PrivateArtifactIngestReceiptSchema,
} from '../model-artifacts/canonical-sam3_1-private-artifact-ingest'
import {
  assertCanonicalSam31VertexSourceCheckpointWorkerRequest,
  assertCanonicalSam31VertexSourceCheckpointWorkerResult,
  canonicalSam31VertexSourceCheckpointWorkerRequestSchema,
  canonicalSam31VertexSourceCheckpointWorkerResultSchema,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification-vertex'
import {
  assertCanonicalSam31SourceRuntimeCandidate,
  canonicalSam31SourceRuntimeCandidateSchema,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import {
  assertCanonicalCurrentGoogleCloudVertexA100RateAuthority,
  canonicalCurrentGoogleCloudVertexA100RateAuthoritySchema,
} from '../tool-cost-metering/canonical-current-google-cloud-vertex-a100-rate-authority'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31VertexQualificationAdmission,
  assertCanonicalSam31VertexQualificationExecution,
  canonicalSam31VertexQualificationAdmissionSchema,
  canonicalSam31VertexQualificationExecutionSchema,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-launch-port'
import {
  canonicalSam31VertexQualificationCostReceiptSchema,
  canonicalSam31VertexQualificationPlatformStopSchema,
  canonicalSam31VertexQualificationProviderUsageSchema,
  canonicalSam31VertexQualificationTerminalResultSchema,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-terminal-reconciliation'
import {
  assertCanonicalSam31QualificationSecurityClearance,
  canonicalSam31QualificationSecurityClearanceSchema,
} from './canonical-sam3_1-source-checkpoint-qualification-release-owner'
import { assertPlainSerializedData } from
  './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_VERTEX_COMPATIBILITY_QUALIFICATION_VERSION =
  'canonical-sam3_1-source-checkpoint-compatibility-qualification-v2' as const
export const CANONICAL_SAM3_1_VERTEX_QUALIFICATION_RELEASE_VERSION =
  'canonical-sam3_1-source-checkpoint-qualification-release-v2' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const requestRefSchema = evidenceRefSchema.extend({
  version: z.literal(2),
  schemaVersion: z.literal(
    'canonical-sam3_1-source-checkpoint-qualification-worker-request-v2',
  ),
}).strict()
const resultRefSchema = evidenceRefSchema.extend({
  schemaVersion: z.literal(
    'canonical-sam3_1-source-checkpoint-qualification-worker-result-v2',
  ),
}).strict()

const qualificationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_COMPATIBILITY_QUALIFICATION_VERSION,
  ),
  source: z.literal(
    'canonical_sam3_1_vertex_source_checkpoint_qualification_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  status: z.literal('qualified_for_private_image_build'),
  qualificationId: safeId,
  qualificationVersion: z.literal(2),
  candidate: canonicalSam31SourceRuntimeCandidateSchema,
  ingestReceipt: canonicalSam31PrivateArtifactIngestReceiptSchema,
  workerRequest: canonicalSam31VertexSourceCheckpointWorkerRequestSchema,
  workerResult: canonicalSam31VertexSourceCheckpointWorkerResultSchema,
  admission: canonicalSam31VertexQualificationAdmissionSchema,
  execution: canonicalSam31VertexQualificationExecutionSchema,
  terminalReconciliation:
    canonicalSam31VertexQualificationTerminalResultSchema,
  providerUsage: canonicalSam31VertexQualificationProviderUsageSchema,
  platformStop: canonicalSam31VertexQualificationPlatformStopSchema,
  currentAccountRateAuthority:
    canonicalCurrentGoogleCloudVertexA100RateAuthoritySchema,
  qualificationCostReceipt:
    canonicalSam31VertexQualificationCostReceiptSchema,
  securityComplianceClearance:
    canonicalSam31QualificationSecurityClearanceSchema,
  exactEvidenceRefs: z.object({
    workerRequestRef: requestRefSchema,
    workerResultRef: resultRefSchema,
    admissionRef: evidenceRefSchema,
    executionRef: evidenceRefSchema,
    cloudTerminalObservationRef: evidenceRefSchema,
    providerUsageEvidenceRef: evidenceRefSchema,
    platformStopEvidenceRef: evidenceRefSchema,
    currentAccountRateAuthorityRef: evidenceRefSchema,
    qualificationCostReceiptRef: evidenceRefSchema,
    securityComplianceClearanceRef: evidenceRefSchema,
  }).strict(),
  qualificationTruth: z.object({
    officialSam31SourceAndCheckpointReread: z.literal(true),
    exactVertexRequestResultAdmissionExecutionAndTerminalReread:
      z.literal(true),
    exactA10080GbExecutionVerified: z.literal(true),
    actualCudaModelInferenceExecuted: z.literal(true),
    completeForwardPropagationExecuted: z.literal(true),
    deterministicRepeatedProbeVerified: z.literal(true),
    strictCheckpointLoadVerified: z.literal(true),
    networkEgressObserved: z.literal(false),
    cpuOnlyModelExecutionObserved: z.literal(false),
    cpuVideoDecodeFallbackObserved: z.literal(false),
    quantizationOrResolutionReductionUsed: z.literal(false),
    automaticRetryUsed: z.literal(false),
    persistentGpuResourceObserved: z.literal(false),
    activeA100GpuInstancesAfterObservation: z.literal(0),
    billingAccountEffectiveRateAndUsageReread: z.literal(true),
    cloudInvoiceReconciliationStillRequired: z.literal(true),
    legacyBatchRequestOrResultCastOrRelabelUsed: z.literal(false),
  }).strict(),
  authority: z.object({
    sourceCheckpointQualificationGranted: z.literal(true),
    privateImageBuildReviewEligible: z.literal(true),
    imageBuildStarted: z.literal(false),
    productionRuntimeDispatchAuthorized: z.literal(false),
    customerMediaProcessed: z.literal(false),
    customerCreditsMutated: z.literal(false),
    customerBillingAuthorityGranted: z.literal(false),
    qaApproved: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  qualifiedAt: timestamp,
}).strict()

export const canonicalSam31VertexCompatibilityQualificationSchema =
  qualificationWithoutHashSchema.extend({ qualificationHash: rawSha256 })
    .strict()
export type CanonicalSam31VertexCompatibilityQualification = z.infer<
  typeof canonicalSam31VertexCompatibilityQualificationSchema
>

const releaseWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_QUALIFICATION_RELEASE_VERSION,
  ),
  source: z.literal(
    'canonical_sam3_1_vertex_source_checkpoint_qualification_release_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  status: z.literal('qualified_for_private_image_build'),
  qualificationId: safeId,
  qualificationVersion: z.literal(2),
  sourceCheckpointQualificationRef: z.object({
    id: safeId,
    version: z.literal(2),
    schemaVersion: z.literal(
      CANONICAL_SAM3_1_VERTEX_COMPATIBILITY_QUALIFICATION_VERSION,
    ),
    contentHash: prefixedSha256,
  }).strict(),
  qualification: canonicalSam31VertexCompatibilityQualificationSchema,
  exactCanonicalPrivateReread: z.literal(true),
  vertexEvidenceKeptDistinctFromHistoricalBatchEvidence: z.literal(true),
  sourceCheckpointQualificationGranted: z.literal(true),
  privateImageBuildReviewEligible: z.literal(true),
  imageBuildStarted: z.literal(false),
  runtimeReleaseGranted: z.literal(false),
  customerMediaProcessed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  customerBillingAuthorityGranted: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionReady: z.literal(false),
  releasedAt: timestamp,
}).strict().superRefine((value, context) => {
  if (
    value.qualificationId !== value.qualification.qualificationId
    || value.sourceCheckpointQualificationRef.id !== value.qualificationId
    || value.sourceCheckpointQualificationRef.contentHash !==
      `sha256:${value.qualification.qualificationHash}`
  ) context.addIssue({
    code: 'custom',
    message: 'Vertex SAM 3.1 release crossed qualification identity.',
  })
})

export const canonicalSam31VertexQualificationReleaseSchema =
  releaseWithoutHashSchema.extend({ releaseHash: rawSha256 }).strict()
export type CanonicalSam31VertexQualificationRelease = z.infer<
  typeof canonicalSam31VertexQualificationReleaseSchema
>

export interface CanonicalSam31VertexQualificationReleaseObjectReadPort {
  rereadQualificationRelease(input: {
    readonly sourceCheckpointQualificationRef: {
      readonly id: string
      readonly version: 2
      readonly schemaVersion:
        typeof CANONICAL_SAM3_1_VERTEX_COMPATIBILITY_QUALIFICATION_VERSION
      readonly contentHash: string
    }
  }): Promise<CanonicalSam31VertexQualificationRelease | null>
}

type EvidenceRef = z.infer<typeof evidenceRefSchema>

export interface CanonicalSam31VertexQualificationReleaseReadPort {
  rereadCandidate(input: { readonly requestRef: EvidenceRef }): Promise<unknown>
  rereadIngestReceipt(input: {
    readonly requestRef: EvidenceRef
  }): Promise<unknown>
  rereadWorkerRequest(input: { readonly requestRef: EvidenceRef }): Promise<unknown>
  rereadWorkerResult(input: {
    readonly resultRef: EvidenceRef
    readonly workerRequestRef: EvidenceRef
    readonly executionRef: EvidenceRef
  }): Promise<unknown>
  rereadAdmission(input: { readonly admissionRef: EvidenceRef }): Promise<unknown>
  rereadExecution(input: { readonly executionRef: EvidenceRef }): Promise<unknown>
  rereadTerminalReconciliation(input: {
    readonly terminalReconciliationRef: EvidenceRef
  }): Promise<unknown>
  rereadProviderUsage(input: { readonly providerUsageRef: EvidenceRef }): Promise<unknown>
  rereadPlatformStop(input: { readonly platformStopRef: EvidenceRef }): Promise<unknown>
  rereadCurrentAccountRate(input: { readonly rateRef: EvidenceRef }): Promise<unknown>
  rereadQualificationCostReceipt(input: { readonly costRef: EvidenceRef }): Promise<unknown>
  rereadSecurityComplianceClearance(input: { readonly clearanceRef: EvidenceRef }): Promise<unknown>
}

const compileRequestSchema = z.object({
  qualificationId: safeId,
  workerRequestRef: evidenceRefSchema,
  workerResultRef: evidenceRefSchema,
  admissionRef: evidenceRefSchema,
  executionRef: evidenceRefSchema,
  terminalReconciliationRef: evidenceRefSchema,
  providerUsageRef: evidenceRefSchema,
  platformStopRef: evidenceRefSchema,
  currentAccountRateRef: evidenceRefSchema,
  qualificationCostReceiptRef: evidenceRefSchema,
  securityComplianceClearanceRef: evidenceRefSchema,
}).strict()

export function assertCanonicalSam31VertexCompatibilityQualification(
  value: unknown,
): CanonicalSam31VertexCompatibilityQualification {
  assertPlainSerializedData(value, 'sam31_vertex_compatibility_qualification')
  const parsed = canonicalSam31VertexCompatibilityQualificationSchema
    .parse(value)
  const { qualificationHash, ...payload } = parsed
  if (qualificationHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex SAM 3.1 qualification hash is invalid.')
  }
  return parsed
}

export function assertCanonicalSam31VertexQualificationRelease(
  value: unknown,
): CanonicalSam31VertexQualificationRelease {
  assertPlainSerializedData(value, 'sam31_vertex_qualification_release')
  const parsed = canonicalSam31VertexQualificationReleaseSchema.parse(value)
  const { releaseHash, ...payload } = parsed
  if (releaseHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex SAM 3.1 qualification release hash is invalid.')
  }
  assertCanonicalSam31VertexCompatibilityQualification(parsed.qualification)
  return parsed
}

export function createCanonicalSam31VertexQualificationReleaseOwner(input: {
  readonly readPort: CanonicalSam31VertexQualificationReleaseReadPort
  readonly releaseObjectPort: CanonicalCreateOnlyJsonObjectPort
  readonly now?: () => string
}) {
  assertDependencies(input)
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_VERTEX_QUALIFICATION_RELEASE_VERSION,
    async compileAndPersist(untrusted: unknown): Promise<
      CanonicalSam31VertexQualificationRelease
    > {
      assertPlainSerializedData(untrusted, 'sam31_vertex_release_request')
      const request = compileRequestSchema.parse(untrusted)
      const values = await Promise.all([
        input.readPort.rereadWorkerRequest({
          requestRef: request.workerRequestRef,
        }),
        input.readPort.rereadWorkerResult({
          resultRef: request.workerResultRef,
          workerRequestRef: request.workerRequestRef,
          executionRef: request.executionRef,
        }),
        input.readPort.rereadAdmission({ admissionRef: request.admissionRef }),
        input.readPort.rereadExecution({ executionRef: request.executionRef }),
        input.readPort.rereadTerminalReconciliation({
          terminalReconciliationRef: request.terminalReconciliationRef,
        }),
        input.readPort.rereadProviderUsage({
          providerUsageRef: request.providerUsageRef,
        }),
        input.readPort.rereadPlatformStop({
          platformStopRef: request.platformStopRef,
        }),
        input.readPort.rereadCurrentAccountRate({
          rateRef: request.currentAccountRateRef,
        }),
        input.readPort.rereadQualificationCostReceipt({
          costRef: request.qualificationCostReceiptRef,
        }),
        input.readPort.rereadSecurityComplianceClearance({
          clearanceRef: request.securityComplianceClearanceRef,
        }),
      ])
      const workerRequest =
        assertCanonicalSam31VertexSourceCheckpointWorkerRequest(values[0])
      const candidate = assertCanonicalSam31SourceRuntimeCandidate(
        await input.readPort.rereadCandidate({
          requestRef: request.workerRequestRef,
        }),
      )
      const ingestReceipt = assertCanonicalSam31PrivateArtifactIngestReceipt(
        await input.readPort.rereadIngestReceipt({
          requestRef: request.workerRequestRef,
        }),
      )
      const evidence = parseEvidence(values)
      assertExactReferences(request, workerRequest, evidence)
      assertLineage({
        qualificationId: request.qualificationId,
        candidate,
        ingestReceipt,
        workerRequest,
        ...evidence,
      })
      const qualifiedAt = timestamp.parse(now())
      if (
        Date.parse(qualifiedAt) < Date.parse(evidence.terminal.observedAt)
        || Date.parse(qualifiedAt) < Date.parse(evidence.clearance.approvedAt)
        || Date.parse(qualifiedAt) > Date.parse(evidence.clearance.validUntil)
      ) throw new Error('Vertex SAM 3.1 qualification evidence is stale.')
      const qualificationPayload = qualificationWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_VERTEX_COMPATIBILITY_QUALIFICATION_VERSION,
        source:
          'canonical_sam3_1_vertex_source_checkpoint_qualification_owner',
        evidenceClass: 'canonical_private_reread',
        status: 'qualified_for_private_image_build',
        qualificationId: request.qualificationId,
        qualificationVersion: 2,
        candidate,
        ingestReceipt,
        workerRequest,
        workerResult: evidence.workerResult,
        admission: evidence.admission,
        execution: evidence.execution,
        terminalReconciliation: evidence.terminal,
        providerUsage: evidence.providerUsage,
        platformStop: evidence.platformStop,
        currentAccountRateAuthority: evidence.rate,
        qualificationCostReceipt: evidence.cost,
        securityComplianceClearance: evidence.clearance,
        exactEvidenceRefs: {
          workerRequestRef: {
            ...request.workerRequestRef,
            version: 2,
            schemaVersion: workerRequest.schemaVersion,
          },
          workerResultRef: {
            ...request.workerResultRef,
            schemaVersion: evidence.workerResult.schemaVersion,
          },
          admissionRef: request.admissionRef,
          executionRef: request.executionRef,
          cloudTerminalObservationRef:
            evidence.terminal.cloudTerminalObservationRef,
          providerUsageEvidenceRef: request.providerUsageRef,
          platformStopEvidenceRef: request.platformStopRef,
          currentAccountRateAuthorityRef: request.currentAccountRateRef,
          qualificationCostReceiptRef: request.qualificationCostReceiptRef,
          securityComplianceClearanceRef:
            request.securityComplianceClearanceRef,
        },
        qualificationTruth: {
          officialSam31SourceAndCheckpointReread: true,
          exactVertexRequestResultAdmissionExecutionAndTerminalReread: true,
          exactA10080GbExecutionVerified: true,
          actualCudaModelInferenceExecuted: true,
          completeForwardPropagationExecuted: true,
          deterministicRepeatedProbeVerified: true,
          strictCheckpointLoadVerified: true,
          networkEgressObserved: false,
          cpuOnlyModelExecutionObserved: false,
          cpuVideoDecodeFallbackObserved: false,
          quantizationOrResolutionReductionUsed: false,
          automaticRetryUsed: false,
          persistentGpuResourceObserved: false,
          activeA100GpuInstancesAfterObservation: 0,
          billingAccountEffectiveRateAndUsageReread: true,
          cloudInvoiceReconciliationStillRequired: true,
          legacyBatchRequestOrResultCastOrRelabelUsed: false,
        },
        authority: {
          sourceCheckpointQualificationGranted: true,
          privateImageBuildReviewEligible: true,
          imageBuildStarted: false,
          productionRuntimeDispatchAuthorized: false,
          customerMediaProcessed: false,
          customerCreditsMutated: false,
          customerBillingAuthorityGranted: false,
          qaApproved: false,
          publicDeliveryAuthorized: false,
          productionReady: false,
        },
        qualifiedAt,
      })
      const qualification =
        canonicalSam31VertexCompatibilityQualificationSchema.parse({
          ...qualificationPayload,
          qualificationHash: sha256AuthorityValue(qualificationPayload),
        })
      const releasePayload = releaseWithoutHashSchema.parse({
        schemaVersion: CANONICAL_SAM3_1_VERTEX_QUALIFICATION_RELEASE_VERSION,
        source:
          'canonical_sam3_1_vertex_source_checkpoint_qualification_release_owner',
        evidenceClass: 'canonical_private_reread',
        status: 'qualified_for_private_image_build',
        qualificationId: qualification.qualificationId,
        qualificationVersion: 2,
        sourceCheckpointQualificationRef: {
          id: qualification.qualificationId,
          version: 2,
          schemaVersion: qualification.schemaVersion,
          contentHash: `sha256:${qualification.qualificationHash}`,
        },
        qualification,
        exactCanonicalPrivateReread: true,
        vertexEvidenceKeptDistinctFromHistoricalBatchEvidence: true,
        sourceCheckpointQualificationGranted: true,
        privateImageBuildReviewEligible: true,
        imageBuildStarted: false,
        runtimeReleaseGranted: false,
        customerMediaProcessed: false,
        customerCreditsMutated: false,
        customerBillingAuthorityGranted: false,
        qaApproved: false,
        publicDeliveryAuthorized: false,
        productionReady: false,
        releasedAt: qualifiedAt,
      })
      const release = canonicalSam31VertexQualificationReleaseSchema.parse({
        ...releasePayload,
        releaseHash: sha256AuthorityValue(releasePayload),
      })
      await persistAndReread(input.releaseObjectPort, release)
      return release
    },
  })
}

function parseEvidence(values: readonly unknown[]) {
  const workerResult =
    assertCanonicalSam31VertexSourceCheckpointWorkerResult(values[1])
  const admission = assertCanonicalSam31VertexQualificationAdmission(values[2])
  const execution = assertCanonicalSam31VertexQualificationExecution(values[3])
  const terminal = assertHashed(
    canonicalSam31VertexQualificationTerminalResultSchema,
    values[4],
    'resultHash',
  )
  const providerUsage = assertHashed(
    canonicalSam31VertexQualificationProviderUsageSchema,
    values[5],
    'evidenceHash',
  )
  const platformStop = assertHashed(
    canonicalSam31VertexQualificationPlatformStopSchema,
    values[6],
    'evidenceHash',
  )
  const rate = assertCanonicalCurrentGoogleCloudVertexA100RateAuthority(
    values[7], terminal.observedAt,
  )
  const cost = assertHashed(
    canonicalSam31VertexQualificationCostReceiptSchema,
    values[8],
    'receiptHash',
  )
  const clearance = assertCanonicalSam31QualificationSecurityClearance(
    values[9],
  )
  return {
    workerResult, admission, execution, terminal,
    providerUsage, platformStop, rate, cost, clearance,
  }
}

function assertExactReferences(
  request: z.infer<typeof compileRequestSchema>,
  workerRequest: ReturnType<
    typeof assertCanonicalSam31VertexSourceCheckpointWorkerRequest
  >,
  evidence: ReturnType<typeof parseEvidence>,
) {
  assertRef(request.workerRequestRef, workerRequest.qualificationId,
    workerRequest.requestHash, 2)
  assertRef(request.workerResultRef,
    `sam31-vertex-worker-result-${evidence.workerResult.resultHash.slice(0, 32)}`,
    evidence.workerResult.resultHash)
  assertRef(request.admissionRef, evidence.admission.attemptId,
    evidence.admission.admissionHash)
  assertRef(request.executionRef, evidence.execution.executionId,
    evidence.execution.executionHash, 2)
  assertRef(request.terminalReconciliationRef,
    `sam31-vertex-terminal-reconciliation-${evidence.terminal.resultHash.slice(0, 32)}`,
    evidence.terminal.resultHash)
  assertRef(request.providerUsageRef,
    `sam31-vertex-provider-usage-${evidence.providerUsage.evidenceHash.slice(0, 32)}`,
    evidence.providerUsage.evidenceHash)
  assertRef(request.platformStopRef,
    `sam31-vertex-platform-stop-${evidence.platformStop.evidenceHash.slice(0, 32)}`,
    evidence.platformStop.evidenceHash)
  assertRef(request.currentAccountRateRef, evidence.rate.rateAuthorityId,
    evidence.rate.rateAuthorityHash, evidence.rate.rateAuthorityVersion)
  assertRef(request.qualificationCostReceiptRef, evidence.cost.receiptId,
    evidence.cost.receiptHash)
  assertRef(request.securityComplianceClearanceRef,
    evidence.clearance.clearanceId, evidence.clearance.clearanceHash)
}

function assertLineage(input: {
  qualificationId: string
  candidate: ReturnType<typeof assertCanonicalSam31SourceRuntimeCandidate>
  ingestReceipt: ReturnType<
    typeof assertCanonicalSam31PrivateArtifactIngestReceipt
  >
  workerRequest: ReturnType<
    typeof assertCanonicalSam31VertexSourceCheckpointWorkerRequest
  >
} & ReturnType<typeof parseEvidence>) {
  const runs = input.workerResult.deterministicRuns
  const exactRun = runs.length === input.workerRequest.runtime.repeatedProbeRunCount
    && runs.every((run) =>
      run.sessionStarted
      && run.promptAdded
      && run.completeForwardPropagationExecuted
      && run.sessionClosed
      && run.outputMasksWereCudaTensorsBeforeDigest
      && run.outputDigestSha256 ===
        input.workerResult.deterministicOutputDigestSha256)
  if (
    input.workerRequest.qualificationId !== input.qualificationId
    || input.workerResult.qualificationId !== input.qualificationId
    || input.clearance.qualificationId !== input.qualificationId
    || input.workerRequest.candidateRef.candidateHash !==
      input.candidate.candidateHash
    || input.ingestReceipt.candidateRef.candidateHash !==
      input.candidate.candidateHash
    || input.workerRequest.ingestReceiptRef.contentHash !==
      `sha256:${input.ingestReceipt.ingestReceiptHash}`
    || !sameRef(input.workerResult.requestRef,
      ref(input.workerRequest.qualificationId,
        input.workerRequest.requestHash, 2))
    || input.workerResult.attemptId !== input.admission.attemptId
    || input.admission.attemptId !== input.execution.attemptId
    || input.execution.attemptId !== input.terminal.attemptId
    || input.workerResult.attemptId !== input.terminal.attemptId
    || !sameRef(input.admission.workerRequestRef,
      ref(input.workerRequest.qualificationId,
        input.workerRequest.requestHash, 2))
    || !sameRef(input.execution.admissionRef,
      ref(input.admission.attemptId, input.admission.admissionHash))
    || input.terminal.disposition !== 'terminal'
    || input.terminal.providerState !== 'JOB_STATE_SUCCEEDED'
    || input.terminal.terminalOutcome !== 'completed'
    || !input.terminal.sourceCheckpointQualificationEvidenceReady
    || input.terminal.sourceCheckpointQualificationGranted
    || input.terminal.activeA100GpuInstancesAfterObservation !== 0
    || input.workerRequest.runtime.executionTarget !==
      'google_cloud_vertex_custom_job_a2_ultra'
    || input.workerResult.runtime.executionTarget !==
      'google_cloud_vertex_custom_job_a2_ultra'
    || input.workerResult.runtime.observedGpuName !== 'NVIDIA A100-SXM4-80GB'
    || !input.workerResult.actualCudaModelInferenceExecuted
    || input.workerResult.runtime.cpuOnlyModelExecutionObserved
    || input.workerResult.runtime.cpuVideoDecodeFallbackObserved
    || input.workerResult.runtime.quantizationOrResolutionReductionUsed
    || input.workerResult.runtime.networkEgressObserved
    || input.workerResult.runtime.persistentResourceObserved
    || !input.workerResult.deterministicOutputDigestMatchedEveryRun
    || !exactRun
    || !sameRef(input.providerUsage.executionRef,
      ref(input.execution.executionId, input.execution.executionHash, 2))
    || !sameRef(input.platformStop.executionRef,
      ref(input.execution.executionId, input.execution.executionHash, 2))
    || !sameRef(input.cost.executionRef,
      ref(input.execution.executionId, input.execution.executionHash, 2))
    || input.providerUsage.providerInferenceOrSubstantiveWorkOutcome !==
      'executed'
    || input.platformStop.activeA100GpuInstancesAfterObservation !== 0
    || input.cost.terminalOutcome !== 'completed'
    || input.cost.providerInferenceOrSubstantiveWorkOutcome !== 'executed'
    || !input.cost.billingAccountEffectiveVertexUsageSkuSetUsed
    || input.cost.customerEligibleToolCostCredits !== 0
    || !sameRef(input.clearance.workerRequestRef,
      ref(input.workerRequest.qualificationId,
        input.workerRequest.requestHash, 2))
    || !sameRef(input.clearance.ingestReceiptRef,
      ref(input.ingestReceipt.ingestReceiptId,
        input.ingestReceipt.ingestReceiptHash))
  ) throw new Error('Vertex SAM 3.1 qualification lineage is incomplete.')
}

function assertHashed<
  T extends Record<K, string>,
  K extends 'resultHash' | 'evidenceHash' | 'receiptHash',
>(schema: z.ZodType<T>, value: unknown, key: K): T {
  assertPlainSerializedData(value, `sam31_vertex_${key}`)
  const parsed = schema.parse(value)
  const payload = { ...parsed } as Record<string, unknown>
  const hash = payload[key]
  delete payload[key]
  if (hash !== sha256AuthorityValue(payload)) {
    throw new Error(`Vertex SAM 3.1 ${key} is invalid.`)
  }
  return parsed
}

async function persistAndReread(
  port: CanonicalCreateOnlyJsonObjectPort,
  release: CanonicalSam31VertexQualificationRelease,
) {
  const body = Buffer.from(stableAuthorityStringify(release), 'utf8')
  const path = releasePath(release.qualificationId)
  await port.createOnly({
    objectPath: path,
    body,
    contentSha256: createHash('sha256').update(body).digest('hex'),
  })
  const reread = await port.readExact(path)
  if (!reread || !reread.equals(body)) {
    throw new Error('Vertex SAM 3.1 release reread changed.')
  }
  assertCanonicalSam31VertexQualificationRelease(
    JSON.parse(reread.toString('utf8')),
  )
}

export function canonicalSam31VertexQualificationReleasePath(
  qualificationId: string,
) {
  return 'private/sam3_1/source-checkpoint-qualification/v2/releases/'
    + `${sha256AuthorityValue(safeId.parse(qualificationId))}.json`
}

export function createCanonicalSam31VertexQualificationReleaseObjectReadPort(
  input: { readonly objectPort: CanonicalCreateOnlyJsonObjectPort },
): CanonicalSam31VertexQualificationReleaseObjectReadPort {
  if (typeof input.objectPort?.readExact !== 'function') {
    throw new Error('Vertex SAM 3.1 release object read port is invalid.')
  }
  return Object.freeze({
    async rereadQualificationRelease({ sourceCheckpointQualificationRef }: {
      readonly sourceCheckpointQualificationRef: {
        readonly id: string
        readonly version: 2
        readonly schemaVersion:
          typeof CANONICAL_SAM3_1_VERTEX_COMPATIBILITY_QUALIFICATION_VERSION
        readonly contentHash: string
      }
    }) {
      const expected = z.object({
        id: safeId,
        version: z.literal(2),
        schemaVersion: z.literal(
          CANONICAL_SAM3_1_VERTEX_COMPATIBILITY_QUALIFICATION_VERSION,
        ),
        contentHash: prefixedSha256,
      }).strict().parse(sourceCheckpointQualificationRef)
      const body = await input.objectPort.readExact(
        canonicalSam31VertexQualificationReleasePath(expected.id),
      )
      if (!body) return null
      let value: unknown
      try { value = JSON.parse(body.toString('utf8')) } catch {
        throw new Error('Vertex SAM 3.1 release JSON is invalid.')
      }
      const release = assertCanonicalSam31VertexQualificationRelease(value)
      if (
        release.sourceCheckpointQualificationRef.id !== expected.id
        || release.sourceCheckpointQualificationRef.version !==
          expected.version
        || release.sourceCheckpointQualificationRef.schemaVersion !==
          expected.schemaVersion
        || release.sourceCheckpointQualificationRef.contentHash !==
          expected.contentHash
        || stableAuthorityStringify(release) !== body.toString('utf8')
      ) throw new Error('Vertex SAM 3.1 release object reference changed.')
      return release
    },
  })
}

function releasePath(qualificationId: string) {
  return canonicalSam31VertexQualificationReleasePath(qualificationId)
}

function ref(id: string, hash: string, version = 1): EvidenceRef {
  return evidenceRefSchema.parse({
    id,
    version,
    contentHash: `sha256:${hash}`,
  })
}

function assertRef(
  value: EvidenceRef,
  id: string,
  hash: string,
  version = 1,
) {
  if (!sameRef(value, ref(id, hash, version))) {
    throw new Error('Vertex SAM 3.1 release reference is invalid.')
  }
}

function sameRef(left: EvidenceRef, right: EvidenceRef) {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function assertDependencies(input: {
  readPort: CanonicalSam31VertexQualificationReleaseReadPort
  releaseObjectPort: CanonicalCreateOnlyJsonObjectPort
}) {
  const read = input.readPort
  if (
    typeof read?.rereadCandidate !== 'function'
    || typeof read?.rereadIngestReceipt !== 'function'
    || typeof read?.rereadWorkerRequest !== 'function'
    || typeof read?.rereadWorkerResult !== 'function'
    || typeof read?.rereadAdmission !== 'function'
    || typeof read?.rereadExecution !== 'function'
    || typeof read?.rereadTerminalReconciliation !== 'function'
    || typeof read?.rereadProviderUsage !== 'function'
    || typeof read?.rereadPlatformStop !== 'function'
    || typeof read?.rereadCurrentAccountRate !== 'function'
    || typeof read?.rereadQualificationCostReceipt !== 'function'
    || typeof read?.rereadSecurityComplianceClearance !== 'function'
    || typeof input.releaseObjectPort?.createOnly !== 'function'
    || typeof input.releaseObjectPort?.readExact !== 'function'
  ) throw new Error('Vertex SAM 3.1 release dependencies are invalid.')
}
