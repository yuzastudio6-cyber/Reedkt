import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  assertCanonicalSam31PrivateArtifactIngestReceipt,
  type CanonicalSam31PrivateArtifactIngestReceipt,
} from '../model-artifacts/canonical-sam3_1-private-artifact-ingest'
import {
  CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_VERSION,
  assertCanonicalSam31SourceCheckpointQualification,
  assertCanonicalSam31SourceCheckpointQualificationWorkerRequest,
  canonicalSam31SourceCheckpointQualificationSchema,
  compileCanonicalSam31SourceCheckpointQualification,
  createCanonicalSam31SourceCheckpointQualificationObservation,
  type CanonicalSam31SourceCheckpointQualificationWorkerRequest,
} from '../model-artifacts/canonical-sam3_1-source-checkpoint-qualification'
import {
  CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
  assertCanonicalSam31SourceRuntimeCandidate,
  type CanonicalSam31SourceRuntimeCandidate,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31QualificationA100JobObservation,
  type CanonicalSam31QualificationA100JobObservation,
} from './canonical-sam3_1-source-checkpoint-qualification-a100-phase'
import {
  assertCanonicalSam31QualificationResultEvidence,
  type CanonicalSam31QualificationResultEvidence,
} from './canonical-sam3_1-source-checkpoint-qualification-result-owner'
import {
  assertCanonicalSam31QualificationTerminalEvidence,
  type CanonicalSam31QualificationTerminalEvidence,
} from './canonical-sam3_1-source-checkpoint-qualification-terminal-evidence-owner'
import { assertPlainSerializedData } from
  './canonical-professional-gpu-job-lifecycle-service'
import { sha256AuthorityValue, stableAuthorityStringify } from
  './private-edit-authority-store'

export const CANONICAL_SAM3_1_QUALIFICATION_SECURITY_CLEARANCE_VERSION =
  'canonical-sam3_1-source-checkpoint-security-compliance-clearance-v1' as const
export const CANONICAL_SAM3_1_QUALIFICATION_RELEASE_VERSION =
  'canonical-sam3_1-source-checkpoint-qualification-release-v1' as const

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
type EvidenceRef = z.infer<typeof evidenceRefSchema>
const candidateRefSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
  ),
  candidateHash: rawSha256,
}).strict()

const securityClearanceWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_QUALIFICATION_SECURITY_CLEARANCE_VERSION,
  ),
  source: z.literal(
    'canonical_sam3_1_security_legal_privacy_compliance_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  clearanceId: safeId,
  clearanceVersion: z.literal(1),
  qualificationId: safeId,
  candidateRef: candidateRefSchema,
  ingestReceiptRef: evidenceRefSchema,
  workerRequestRef: evidenceRefSchema,
  termsAcceptanceRef: evidenceRefSchema,
  reviewedEvidenceRefs: z.object({
    legalReviewRef: evidenceRefSchema,
    privacyReviewRef: evidenceRefSchema,
    tradeControlsReviewRef: evidenceRefSchema,
    sourceLicenseReviewRef: evidenceRefSchema,
    checkpointLicenseReviewRef: evidenceRefSchema,
    sourceMalwareScanRef: evidenceRefSchema,
    checkpointMalwareScanRef: evidenceRefSchema,
    sourceIngestSecurityReviewRef: evidenceRefSchema,
    checkpointIngestSecurityReviewRef: evidenceRefSchema,
    sourceCodeStaticSecurityReviewRef: evidenceRefSchema,
    unsignedSourceRevisionAcceptanceRef: evidenceRefSchema,
    checkpointWeightsOnlyInspectionRef: evidenceRefSchema,
  }).strict(),
  decisions: z.object({
    sourceLicenseReviewedForApprovedUse: z.literal(true),
    checkpointLicenseReviewedForApprovedUse: z.literal(true),
    privacyReviewApprovedForPrivateQualification: z.literal(true),
    tradeControlsReviewApprovedForPrivateQualification: z.literal(true),
    sourceMalwareScanPassed: z.literal(true),
    checkpointMalwareScanPassed: z.literal(true),
    sourceStaticSecurityReviewPassed: z.literal(true),
    checkpointStaticSecurityReviewPassed: z.literal(true),
    unsignedSourceRevisionAccepted: z.literal(true),
    noOpenHighOrCriticalSecurityFinding: z.literal(true),
    checkpointWeightsOnlyResultMustBeCorroboratedByWorker: z.literal(true),
    checkpointTensorAllowlistMustBeCorroboratedByWorker: z.literal(true),
    executablePickleTrustGranted: z.literal(false),
    checkpointRedistributionAuthorized: z.literal(false),
  }).strict(),
  authority: z.object({
    authenticatedReviewOwnersReread: z.literal(true),
    privateSourceCheckpointQualificationOnly: z.literal(true),
    customerMediaProcessingAuthorized: z.literal(false),
    runtimeImageReleaseAuthorized: z.literal(false),
    customerCreditsMutated: z.literal(false),
    customerBillingAuthorityGranted: z.literal(false),
    qaApproved: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  approvedAt: timestamp,
  validUntil: timestamp,
}).strict().superRefine((value, context) => {
  if (Date.parse(value.validUntil) <= Date.parse(value.approvedAt)) {
    context.addIssue({
      code: 'custom',
      message: 'SAM 3.1 security clearance validity is invalid.',
    })
  }
})

export const canonicalSam31QualificationSecurityClearanceSchema =
  securityClearanceWithoutHashSchema.extend({
    clearanceHash: rawSha256,
  }).strict()
export type CanonicalSam31QualificationSecurityClearance = z.infer<
  typeof canonicalSam31QualificationSecurityClearanceSchema
>

const releaseWithoutHashSchema = z.object({
  schemaVersion: z.literal(CANONICAL_SAM3_1_QUALIFICATION_RELEASE_VERSION),
  source: z.literal(
    'canonical_sam3_1_source_checkpoint_qualification_release_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  status: z.literal('qualified_for_private_image_build'),
  qualificationId: safeId,
  qualificationVersion: z.literal(1),
  workerRequestRef: evidenceRefSchema,
  resultEvidenceRef: evidenceRefSchema,
  terminalEvidenceRef: evidenceRefSchema,
  terminalJobObservationRef: evidenceRefSchema,
  securityComplianceClearanceRef: evidenceRefSchema,
  sourceCheckpointQualificationRef: z.object({
    id: safeId,
    version: z.literal(1),
    schemaVersion: z.literal(
      CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_VERSION,
    ),
    contentHash: prefixedSha256,
  }).strict(),
  qualification: canonicalSam31SourceCheckpointQualificationSchema,
  exactCandidateIngestRequestResultTerminalAndClearanceReread: z.literal(true),
  exactAttemptJobImageCheckpointProbeAndCostLineage: z.literal(true),
  legalPrivacyTradeSecurityAndMalwareClearanceVerified: z.literal(true),
  deterministicA100CompatibilityProbeVerified: z.literal(true),
  terminalScaleToZeroVerified: z.literal(true),
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
    || value.qualification.status !== 'qualified_for_private_image_build'
    || !value.qualification.authority.privateImageBuildReviewEligible
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 qualification release lost its qualification.',
  })
})

export const canonicalSam31QualificationReleaseSchema =
  releaseWithoutHashSchema.extend({ releaseHash: rawSha256 }).strict()
export type CanonicalSam31QualificationRelease = z.infer<
  typeof canonicalSam31QualificationReleaseSchema
>

export interface CanonicalSam31QualificationReleaseReadPort {
  rereadWorkerRequest(input: { readonly ref: EvidenceRef }): Promise<unknown>
  rereadCandidate(input: {
    readonly ref: z.infer<typeof candidateRefSchema>
  }): Promise<unknown>
  rereadIngestReceipt(input: { readonly ref: EvidenceRef }): Promise<unknown>
  rereadResultEvidence(input: { readonly ref: EvidenceRef }): Promise<unknown>
  rereadTerminalEvidence(input: { readonly ref: EvidenceRef }): Promise<unknown>
  rereadTerminalJobObservation(input: {
    readonly ref: EvidenceRef
  }): Promise<unknown>
  rereadSecurityComplianceClearance(input: {
    readonly ref: EvidenceRef
  }): Promise<unknown>
}

const releaseRequestSchema = z.object({
  qualificationId: safeId,
  workerRequestRef: evidenceRefSchema,
  resultEvidenceRef: evidenceRefSchema,
  terminalEvidenceRef: evidenceRefSchema,
  securityComplianceClearanceRef: evidenceRefSchema,
}).strict()

/**
 * Structural sealer only. Authority comes from the authenticated read port and
 * the exact review-record lineage that the release owner rereads.
 */
export function sealCanonicalSam31QualificationSecurityClearance(
  value: z.input<typeof securityClearanceWithoutHashSchema>,
): CanonicalSam31QualificationSecurityClearance {
  assertPlainSerializedData(value, 'sam31_security_compliance_clearance_input')
  const payload = securityClearanceWithoutHashSchema.parse(value)
  return canonicalSam31QualificationSecurityClearanceSchema.parse({
    ...payload,
    clearanceHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31QualificationSecurityClearance(
  value: unknown,
): CanonicalSam31QualificationSecurityClearance {
  assertPlainSerializedData(value, 'sam31_security_compliance_clearance')
  const parsed = canonicalSam31QualificationSecurityClearanceSchema.parse(value)
  const { clearanceHash, ...payload } = parsed
  if (clearanceHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 security clearance hash is invalid.')
  }
  return parsed
}

export function assertCanonicalSam31QualificationRelease(
  value: unknown,
): CanonicalSam31QualificationRelease {
  assertPlainSerializedData(value, 'sam31_qualification_release')
  const parsed = canonicalSam31QualificationReleaseSchema.parse(value)
  const { releaseHash, ...payload } = parsed
  if (releaseHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 qualification release hash is invalid.')
  }
  assertCanonicalSam31SourceCheckpointQualification(parsed.qualification)
  return parsed
}

export function createCanonicalSam31QualificationReleaseOwner(input: {
  readonly readPort: CanonicalSam31QualificationReleaseReadPort
  readonly releaseObjectPort: CanonicalCreateOnlyJsonObjectPort
  readonly now?: () => string
}) {
  assertDependencies(input)
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    async compileAndPersist(request: {
      readonly qualificationId: string
      readonly workerRequestRef: EvidenceRef
      readonly resultEvidenceRef: EvidenceRef
      readonly terminalEvidenceRef: EvidenceRef
      readonly securityComplianceClearanceRef: EvidenceRef
    }): Promise<CanonicalSam31QualificationRelease> {
      assertPlainSerializedData(request, 'sam31_qualification_release_request')
      const parsedRequest = releaseRequestSchema.parse(request)
      const qualificationId = parsedRequest.qualificationId
      const requestRef = parsedRequest.workerRequestRef
      const resultRef = parsedRequest.resultEvidenceRef
      const terminalRef = parsedRequest.terminalEvidenceRef
      const clearanceRef = parsedRequest.securityComplianceClearanceRef
      const [workerRequestValue, resultValue, terminalValue, clearanceValue] =
        await Promise.all([
          input.readPort.rereadWorkerRequest({ ref: requestRef }),
          input.readPort.rereadResultEvidence({ ref: resultRef }),
          input.readPort.rereadTerminalEvidence({ ref: terminalRef }),
          input.readPort.rereadSecurityComplianceClearance({
            ref: clearanceRef,
          }),
        ])
      const workerRequest =
        assertCanonicalSam31SourceCheckpointQualificationWorkerRequest(
          workerRequestValue,
        )
      const result = assertCanonicalSam31QualificationResultEvidence(
        resultValue,
      )
      const terminal = assertCanonicalSam31QualificationTerminalEvidence(
        terminalValue,
      )
      const clearance = assertCanonicalSam31QualificationSecurityClearance(
        clearanceValue,
      )
      assertRef(requestRef, workerRequest.qualificationId,
        workerRequest.requestHash)
      assertRef(resultRef, result.attemptId, result.evidenceHash)
      assertRef(terminalRef, terminal.attemptId, terminal.evidenceHash)
      assertRef(clearanceRef, clearance.clearanceId, clearance.clearanceHash)
      const [candidateValue, ingestValue, jobObservationValue] =
        await Promise.all([
          input.readPort.rereadCandidate({ ref: workerRequest.candidateRef }),
          input.readPort.rereadIngestReceipt({
            ref: ref(
              workerRequest.ingestReceiptRef.id,
              workerRequest.ingestReceiptRef.contentHash.slice(
                'sha256:'.length,
              ),
            ),
          }),
          input.readPort.rereadTerminalJobObservation({
            ref: terminal.terminalJobObservationRef,
          }),
        ])
      const candidate = assertCanonicalSam31SourceRuntimeCandidate(
        candidateValue,
      )
      const ingest = assertCanonicalSam31PrivateArtifactIngestReceipt(
        ingestValue,
      )
      const jobObservation =
        assertCanonicalSam31QualificationA100JobObservation(
          jobObservationValue,
        )
      assertLineage({
        qualificationId,
        candidate,
        ingest,
        workerRequest,
        result,
        terminal,
        jobObservation,
        clearance,
      })
      const releasedAt = timestamp.parse(now())
      assertFresh({ releasedAt, workerRequest, result, terminal, clearance })
      const workerEvidence = {
        request: workerRequest,
        result: result.workerResult,
        qualificationJobRef: terminalRef,
        qualificationAttemptRef: terminal.admissionRef,
        qualificationResultRuntimeRef: terminal.workerResultRef,
        qualificationLogRef: terminal.qualificationLogRef,
        qualificationJobTerminalObservationRef:
          terminal.terminalJobObservationRef,
        internalCostReceiptRef: terminal.internalCostReceiptRef,
        deterministicProbeResultRef: evidenceRefSchema.parse({
          id: `${qualificationId}:deterministic-probe`,
          version: 1,
          contentHash:
            `sha256:${result.workerResult.deterministicOutputDigestSha256}`,
        }),
        terminalJobObservation: {
          immutableImageDigest:
            result.workerResult.qualificationImage.immutableImageDigest,
          jobSucceeded: true as const,
          networkEgressDisabled: true as const,
          automaticRetryCount: jobObservation.configuredAutomaticRetryCount,
          requestObjectReread: true as const,
          requestCheckpointAndFixtureMountsReadOnly: true as const,
          resultMountCreateOnly: true as const,
          resultObjectCreateOnlyAndReread: true as const,
        },
        securityAndCompliance: {
          sourceLicenseReviewedForApprovedUse:
            clearance.decisions.sourceLicenseReviewedForApprovedUse,
          checkpointLicenseReviewedForApprovedUse:
            clearance.decisions.checkpointLicenseReviewedForApprovedUse,
          privacyReviewApprovedForPrivateQualification:
            clearance.decisions.privacyReviewApprovedForPrivateQualification,
          tradeControlsReviewApprovedForPrivateQualification:
            clearance.decisions
              .tradeControlsReviewApprovedForPrivateQualification,
          sourceMalwareScanPassed:
            clearance.decisions.sourceMalwareScanPassed,
          checkpointMalwareScanPassed:
            clearance.decisions.checkpointMalwareScanPassed,
          sourceStaticSecurityReviewPassed:
            clearance.decisions.sourceStaticSecurityReviewPassed,
          checkpointWeightsOnlyLoadPassed:
            result.workerResult.artifactVerification
              .weightsOnlyCheckpointInspectionExecuted,
          checkpointTensorAndMetadataAllowlistPassed:
            result.workerResult.artifactVerification
              .unsafeCheckpointGlobalCount === 0,
          executablePickleTrustGranted: false as const,
          checkpointRedistributionAuthorized: false as const,
        },
        qualifiedAt: releasedAt,
      }
      const observation =
        createCanonicalSam31SourceCheckpointQualificationObservation(
          workerEvidence,
        )
      const qualification = compileCanonicalSam31SourceCheckpointQualification({
        candidate,
        ingestReceipt: ingest,
        observation,
        workerEvidence,
      })
      const payload = releaseWithoutHashSchema.parse({
        schemaVersion: CANONICAL_SAM3_1_QUALIFICATION_RELEASE_VERSION,
        source:
          'canonical_sam3_1_source_checkpoint_qualification_release_owner',
        evidenceClass: 'canonical_private_reread',
        status: 'qualified_for_private_image_build',
        qualificationId,
        qualificationVersion: 1,
        workerRequestRef: requestRef,
        resultEvidenceRef: resultRef,
        terminalEvidenceRef: terminalRef,
        terminalJobObservationRef: terminal.terminalJobObservationRef,
        securityComplianceClearanceRef: clearanceRef,
        sourceCheckpointQualificationRef: {
          id: qualification.qualificationId,
          version: 1,
          schemaVersion:
            CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_VERSION,
          contentHash: `sha256:${qualification.qualificationHash}`,
        },
        qualification,
        exactCandidateIngestRequestResultTerminalAndClearanceReread: true,
        exactAttemptJobImageCheckpointProbeAndCostLineage: true,
        legalPrivacyTradeSecurityAndMalwareClearanceVerified: true,
        deterministicA100CompatibilityProbeVerified: true,
        terminalScaleToZeroVerified: true,
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
        releasedAt,
      })
      const release = canonicalSam31QualificationReleaseSchema.parse({
        ...payload,
        releaseHash: sha256AuthorityValue(payload),
      })
      await persistExact(input.releaseObjectPort, release)
      return release
    },
  })
}

function assertLineage(input: {
  qualificationId: string
  candidate: CanonicalSam31SourceRuntimeCandidate
  ingest: CanonicalSam31PrivateArtifactIngestReceipt
  workerRequest: CanonicalSam31SourceCheckpointQualificationWorkerRequest
  result: CanonicalSam31QualificationResultEvidence
  terminal: CanonicalSam31QualificationTerminalEvidence
  jobObservation: CanonicalSam31QualificationA100JobObservation
  clearance: CanonicalSam31QualificationSecurityClearance
}): void {
  const requestRef = ref(
    input.workerRequest.qualificationId,
    input.workerRequest.requestHash,
  )
  const ingestRef = ref(
    input.ingest.ingestReceiptId,
    input.ingest.ingestReceiptHash,
  )
  const reviews = input.clearance.reviewedEvidenceRefs
  if (
    input.workerRequest.qualificationId !== input.qualificationId
    || input.result.qualificationId !== input.qualificationId
    || input.terminal.qualificationId !== input.qualificationId
    || input.clearance.qualificationId !== input.qualificationId
    || input.candidate.candidateHash !==
      input.workerRequest.candidateRef.candidateHash
    || input.candidate.schemaVersion !==
      input.workerRequest.candidateRef.schemaVersion
    || !sameRef(input.workerRequest.ingestReceiptRef, ingestRef)
    || input.ingest.candidateRef.candidateHash !== input.candidate.candidateHash
    || !sameRef(input.result.workerRequestRef, requestRef)
    || !sameRef(input.terminal.resultEvidenceRef,
      ref(input.result.attemptId, input.result.evidenceHash))
    || !sameRef(input.terminal.workerResultRef, input.result.workerResultRef)
    || !sameRef(input.terminal.terminalJobObservationRef,
      ref(input.jobObservation.attemptId, input.jobObservation.observationHash))
    || input.jobObservation.disposition !==
      'job_succeeded_pending_result_reread'
    || input.jobObservation.batchState !== 'SUCCEEDED'
    || input.jobObservation.configuredAutomaticRetryCount !== 0
    || !input.jobObservation.exactCreateConfigurationEchoVerified
    || !input.jobObservation.exactImmutableImageDigestVerified
    || !input.jobObservation.exactAttemptSubdirectoryMountVerified
    || !input.jobObservation.terminalObservationPersistedCreateOnly
    || input.terminal.batchState !== 'SUCCEEDED'
    || input.terminal.taskState !== 'SUCCEEDED'
    || !input.terminal.terminalWorkerStoppedVerified
    || input.terminal.activeGpuResourcesAfterTerminalObservation !== 0
    || !input.terminal.exactJobTaskResultLogUsageAndAccountPriceLineage
    || !sameRef(input.clearance.workerRequestRef, requestRef)
    || !sameRef(input.clearance.ingestReceiptRef, ingestRef)
    || input.clearance.candidateRef.candidateHash !== input.candidate.candidateHash
    || !sameRef(input.clearance.termsAcceptanceRef,
      input.ingest.termsAcceptanceRef)
    || !sameRef(reviews.sourceLicenseReviewRef,
      input.ingest.sourceArchive.licenseRef)
    || !sameRef(reviews.checkpointLicenseReviewRef,
      input.ingest.checkpoint.licenseRef)
    || !sameRef(reviews.sourceMalwareScanRef,
      input.ingest.sourceArchive.malwareScanRef)
    || !sameRef(reviews.checkpointMalwareScanRef,
      input.ingest.checkpoint.malwareScanRef)
    || !sameRef(reviews.sourceIngestSecurityReviewRef,
      input.ingest.sourceArchive.securityReviewRef)
    || !sameRef(reviews.checkpointIngestSecurityReviewRef,
      input.ingest.checkpoint.securityReviewRef)
    || !sameRef(reviews.sourceCodeStaticSecurityReviewRef,
      input.workerRequest.sourceCodeSecurityReviewRef)
    || !sameRef(reviews.unsignedSourceRevisionAcceptanceRef,
      input.ingest.sourceArchive.unsignedSourceRevisionAcceptanceRef)
    || !sameRef(reviews.checkpointWeightsOnlyInspectionRef,
      input.workerRequest.checkpoint.weightsOnlyInspectionRef)
    || !input.result.workerResult.artifactVerification
      .weightsOnlyCheckpointInspectionExecuted
    || input.result.workerResult.artifactVerification
      .unsafeCheckpointGlobalCount !== 0
    || input.result.workerResult.runtime.networkEgressObserved
    || input.result.workerResult.runtime.developerMachineExecutionObserved
    || input.result.workerResult.runtime.cpuOnlyModelExecutionObserved
    || input.result.workerResult.runtime.quantizationOrResolutionReductionUsed
    || input.terminal.sourceCheckpointQualificationGranted
    || input.terminal.runtimeReleaseGranted
  ) throw new Error('SAM 3.1 qualification release lineage is incomplete.')
}

function assertFresh(input: {
  releasedAt: string
  workerRequest: CanonicalSam31SourceCheckpointQualificationWorkerRequest
  result: CanonicalSam31QualificationResultEvidence
  terminal: CanonicalSam31QualificationTerminalEvidence
  clearance: CanonicalSam31QualificationSecurityClearance
}): void {
  const released = Date.parse(input.releasedAt)
  if (
    released < Date.parse(input.workerRequest.issuedAt)
    || released < Date.parse(input.result.observedAt)
    || released < Date.parse(input.terminal.observedAt)
    || released < Date.parse(input.clearance.approvedAt)
    || released > Date.parse(input.clearance.validUntil)
  ) throw new Error('SAM 3.1 qualification release evidence is stale.')
}

async function persistExact(
  port: CanonicalCreateOnlyJsonObjectPort,
  release: CanonicalSam31QualificationRelease,
): Promise<void> {
  const body = Buffer.from(stableAuthorityStringify(release), 'utf8')
  const path = 'private/sam3_1/source-checkpoint-qualification/v1/releases/'
    + `${sha256AuthorityValue(release.qualificationId)}.json`
  await port.createOnly({
    objectPath: path,
    body,
    contentSha256: createHash('sha256').update(body).digest('hex'),
  })
  const reread = await port.readExact(path)
  if (!reread || !reread.equals(body)) {
    throw new Error('SAM 3.1 qualification release reread changed.')
  }
  assertCanonicalSam31QualificationRelease(JSON.parse(reread.toString('utf8')))
}

function assertRef(value: EvidenceRef, id: string, hash: string): void {
  if (value.id !== id || value.version !== 1
    || value.contentHash !== `sha256:${hash}`) {
    throw new Error('SAM 3.1 qualification release reference is invalid.')
  }
}

function sameRef(
  left: { readonly id: string; readonly version: number; readonly contentHash: string },
  right: { readonly id: string; readonly version: number; readonly contentHash: string },
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function ref(id: string, hash: string): EvidenceRef {
  return evidenceRefSchema.parse({
    id,
    version: 1,
    contentHash: `sha256:${hash}`,
  })
}

function assertDependencies(input: {
  readPort: CanonicalSam31QualificationReleaseReadPort
  releaseObjectPort: CanonicalCreateOnlyJsonObjectPort
}): void {
  const read = input.readPort
  if (
    typeof read?.rereadWorkerRequest !== 'function'
    || typeof read?.rereadCandidate !== 'function'
    || typeof read?.rereadIngestReceipt !== 'function'
    || typeof read?.rereadResultEvidence !== 'function'
    || typeof read?.rereadTerminalEvidence !== 'function'
    || typeof read?.rereadTerminalJobObservation !== 'function'
    || typeof read?.rereadSecurityComplianceClearance !== 'function'
    || typeof input.releaseObjectPort?.createOnly !== 'function'
    || typeof input.releaseObjectPort?.readExact !== 'function'
  ) throw new Error('SAM 3.1 qualification release dependencies invalid.')
}
