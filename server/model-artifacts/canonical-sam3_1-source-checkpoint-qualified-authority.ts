import { z } from 'zod'

import {
  CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_VERSION,
  assertCanonicalSam31SourceCheckpointQualification,
  canonicalSam31SourceCheckpointQualificationRef,
  type CanonicalSam31SourceCheckpointQualification,
} from './canonical-sam3_1-source-checkpoint-qualification'
import {
  CANONICAL_SAM3_1_VERTEX_COMPATIBILITY_QUALIFICATION_VERSION,
  assertCanonicalSam31VertexCompatibilityQualification,
  assertCanonicalSam31VertexQualificationRelease,
  createCanonicalSam31VertexQualificationReleaseObjectReadPort,
  type CanonicalSam31VertexCompatibilityQualification,
  type CanonicalSam31VertexQualificationRelease,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-vertex-release-owner'
import {
  assertCanonicalSam31QualificationRelease,
  createCanonicalSam31QualificationReleaseObjectReadPort,
  type CanonicalSam31QualificationRelease,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-release-owner'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from '../services/canonical-professional-gpu-job-lifecycle-service'

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const baseRefSchema = z.object({
  id: safeId,
  contentHash: prefixedSha256,
}).strict()

export const canonicalSam31SourceCheckpointQualificationReferenceSchema =
  z.discriminatedUnion('schemaVersion', [
    baseRefSchema.extend({
      version: z.literal(1),
      schemaVersion: z.literal(
        CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_VERSION,
      ),
    }).strict(),
    baseRefSchema.extend({
      version: z.literal(2),
      schemaVersion: z.literal(
        CANONICAL_SAM3_1_VERTEX_COMPATIBILITY_QUALIFICATION_VERSION,
      ),
    }).strict(),
  ])

export type CanonicalSam31SourceCheckpointQualificationReference = z.infer<
  typeof canonicalSam31SourceCheckpointQualificationReferenceSchema
>

export type CanonicalSam31QualifiedSourceCheckpointAuthority =
  | CanonicalSam31SourceCheckpointQualification
  | CanonicalSam31VertexCompatibilityQualification

export type CanonicalSam31QualifiedSourceCheckpointRelease =
  | CanonicalSam31QualificationRelease
  | CanonicalSam31VertexQualificationRelease

export function assertCanonicalSam31QualifiedSourceCheckpointAuthority(
  value: unknown,
): CanonicalSam31QualifiedSourceCheckpointAuthority {
  assertPlainSerializedData(value, 'sam31_qualified_source_checkpoint_authority')
  const marker = z.object({
    schemaVersion: z.enum([
      CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_VERSION,
      CANONICAL_SAM3_1_VERTEX_COMPATIBILITY_QUALIFICATION_VERSION,
    ]),
  }).passthrough().parse(value)
  return marker.schemaVersion ===
    CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_VERSION
    ? assertCanonicalSam31SourceCheckpointQualification(value)
    : assertCanonicalSam31VertexCompatibilityQualification(value)
}

export function canonicalSam31QualifiedSourceCheckpointAuthorityRef(
  value: CanonicalSam31QualifiedSourceCheckpointAuthority,
): CanonicalSam31SourceCheckpointQualificationReference {
  const authority = assertCanonicalSam31QualifiedSourceCheckpointAuthority(
    value,
  )
  if (authority.schemaVersion ===
    CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_VERSION) {
    return canonicalSam31SourceCheckpointQualificationReferenceSchema.parse(
      canonicalSam31SourceCheckpointQualificationRef(authority),
    )
  }
  return canonicalSam31SourceCheckpointQualificationReferenceSchema.parse({
    id: authority.qualificationId,
    version: authority.qualificationVersion,
    schemaVersion: authority.schemaVersion,
    contentHash: `sha256:${authority.qualificationHash}`,
  })
}

export function assertCanonicalSam31QualifiedSourceCheckpointRelease(
  value: unknown,
): CanonicalSam31QualifiedSourceCheckpointRelease {
  assertPlainSerializedData(value, 'sam31_qualified_source_checkpoint_release')
  const marker = z.object({
    schemaVersion: z.enum([
      'canonical-sam3_1-source-checkpoint-qualification-release-v1',
      'canonical-sam3_1-source-checkpoint-qualification-release-v2',
    ]),
  }).passthrough().parse(value)
  return marker.schemaVersion ===
    'canonical-sam3_1-source-checkpoint-qualification-release-v1'
    ? assertCanonicalSam31QualificationRelease(value)
    : assertCanonicalSam31VertexQualificationRelease(value)
}

export interface CanonicalSam31QualifiedSourceCheckpointReleaseReadPort {
  rereadQualificationRelease(input: {
    readonly sourceCheckpointQualificationRef:
      CanonicalSam31SourceCheckpointQualificationReference
  }): Promise<CanonicalSam31QualifiedSourceCheckpointRelease | null>
}

export function createCanonicalSam31QualifiedSourceCheckpointReleaseObjectReadPort(
  input: { readonly objectPort: CanonicalCreateOnlyJsonObjectPort },
): CanonicalSam31QualifiedSourceCheckpointReleaseReadPort {
  const historical = createCanonicalSam31QualificationReleaseObjectReadPort(
    input,
  )
  const vertex = createCanonicalSam31VertexQualificationReleaseObjectReadPort(
    input,
  )
  return Object.freeze({
    async rereadQualificationRelease({ sourceCheckpointQualificationRef }) {
      const reference =
        canonicalSam31SourceCheckpointQualificationReferenceSchema.parse(
          sourceCheckpointQualificationRef,
        )
      return reference.version === 1
        ? historical.rereadQualificationRelease({
          sourceCheckpointQualificationRef: reference,
        })
        : vertex.rereadQualificationRelease({
          sourceCheckpointQualificationRef: reference,
        })
    },
  })
}

export function projectCanonicalSam31QualifiedSourceCheckpointRelease(
  value: CanonicalSam31QualifiedSourceCheckpointRelease,
) {
  const release = assertCanonicalSam31QualifiedSourceCheckpointRelease(value)
  const qualification = projectCanonicalSam31QualifiedSourceCheckpointAuthority(
    release.qualification,
  )
  if (release.schemaVersion ===
    'canonical-sam3_1-source-checkpoint-qualification-release-v1') {
    const probe = release.qualification.controlledObservation
      .compatibilityProbe
    return Object.freeze({
      qualification,
      sourceArchive: structuredClone(release.qualification.sourceArchive),
      checkpoint: structuredClone(release.qualification.checkpoint),
      compatibilityProbe: Object.freeze({
        exactDependencyWheelAndNativeClosureReread:
          probe.exactDependencyWheelAndNativeClosureReread,
        strictCheckpointLoadRequested: probe.strictCheckpointLoadRequested,
        missingCheckpointKeyCount: probe.missingCheckpointKeyCount,
        unexpectedCheckpointKeyCount: probe.unexpectedCheckpointKeyCount,
        checkpointAndModelKeySetsExact: probe.checkpointAndModelKeySetsExact,
        actualCudaModelInferenceExecuted:
          probe.actualCudaModelInferenceExecuted,
        bfloat16AutocastExecuted: probe.bfloat16AutocastExecuted,
        outputMasksWereCudaTensorsBeforeSerialization:
          probe.outputMasksWereCudaTensorsBeforeSerialization,
        cpuOnlyModelExecutionObserved: probe.cpuOnlyModelExecutionObserved,
        quantizationOrResolutionReductionUsed:
          probe.quantizationOrResolutionReductionUsed,
      }),
      exactCanonicalReread:
        release.exactCandidateIngestRequestResultTerminalAndClearanceReread
        && release.exactAttemptJobImageCheckpointProbeAndCostLineage,
      deterministicA100CompatibilityProbeVerified:
        release.deterministicA100CompatibilityProbeVerified,
      sourceCheckpointQualificationGranted:
        release.sourceCheckpointQualificationGranted,
    })
  }
  const result = release.qualification.workerResult
  return Object.freeze({
    qualification,
    sourceArchive: structuredClone(
      release.qualification.workerRequest.sourceArchive,
    ),
    checkpoint: structuredClone(release.qualification.workerRequest.checkpoint),
    compatibilityProbe: Object.freeze({
      exactDependencyWheelAndNativeClosureReread:
        result.artifactVerification.exactDependencyWheelAndNativeClosureReread,
      strictCheckpointLoadRequested: result.strictLoad
        .strictCheckpointLoadRequested,
      missingCheckpointKeyCount: result.strictLoad.missingCheckpointKeyCount,
      unexpectedCheckpointKeyCount:
        result.strictLoad.unexpectedCheckpointKeyCount,
      checkpointAndModelKeySetsExact:
        result.strictLoad.checkpointAndModelKeySetsExact,
      actualCudaModelInferenceExecuted:
        result.actualCudaModelInferenceExecuted,
      bfloat16AutocastExecuted: result.runtime.bfloat16AutocastExecuted,
      outputMasksWereCudaTensorsBeforeSerialization: result.deterministicRuns
        .every((run) => run.outputMasksWereCudaTensorsBeforeDigest),
      cpuOnlyModelExecutionObserved:
        result.runtime.cpuOnlyModelExecutionObserved,
      quantizationOrResolutionReductionUsed:
        result.runtime.quantizationOrResolutionReductionUsed,
    }),
    exactCanonicalReread: release.exactCanonicalPrivateReread
      && release.vertexEvidenceKeptDistinctFromHistoricalBatchEvidence,
    deterministicA100CompatibilityProbeVerified:
      release.qualification.qualificationTruth
        .deterministicRepeatedProbeVerified,
    sourceCheckpointQualificationGranted:
      release.sourceCheckpointQualificationGranted,
  })
}

/**
 * Projects only facts shared by the two independently validated qualification
 * generations. It never casts a Vertex v2 record into the historical Batch v1
 * schema and it retains the exact versioned source authority reference.
 */
export function projectCanonicalSam31QualifiedSourceCheckpointAuthority(
  value: CanonicalSam31QualifiedSourceCheckpointAuthority,
) {
  const authority = assertCanonicalSam31QualifiedSourceCheckpointAuthority(
    value,
  )
  if (authority.schemaVersion ===
    CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_VERSION) {
    return Object.freeze({
      authorityRef:
        canonicalSam31QualifiedSourceCheckpointAuthorityRef(authority),
      evidenceClass: authority.evidenceClass,
      status: authority.status,
      candidateRef: structuredClone(authority.candidateRef),
      ingestReceiptRef: structuredClone(authority.ingestReceiptRef),
      runtime: Object.freeze({
        pythonVersion:
          authority.controlledObservation.qualificationRuntime.pythonVersion,
        torchVersion:
          authority.controlledObservation.qualificationRuntime.torchVersion,
        torchvisionVersion:
          authority.controlledObservation.qualificationRuntime
            .torchvisionVersion,
        cudaVersion:
          authority.controlledObservation.qualificationRuntime.cudaVersion,
        torchcodecVersion:
          authority.controlledObservation.qualificationRuntime
            .torchcodecVersion,
        einopsVersion:
          authority.controlledObservation.qualificationRuntime.einopsVersion,
        pycocotoolsVersion:
          authority.controlledObservation.qualificationRuntime
            .pycocotoolsVersion,
      }),
      securityLicenseAndCompatibilityQualified:
        authority.authority.securityLicenseAndCompatibilityQualified,
      privateImageBuildReviewEligible:
        authority.authority.privateImageBuildReviewEligible,
      vertexEvidenceKeptDistinctFromHistoricalBatchEvidence: false as const,
    })
  }
  return Object.freeze({
    authorityRef: canonicalSam31QualifiedSourceCheckpointAuthorityRef(
      authority,
    ),
    evidenceClass: authority.evidenceClass,
    status: authority.status,
    candidateRef: Object.freeze({
      schemaVersion: authority.candidate.schemaVersion,
      candidateHash: authority.candidate.candidateHash,
    }),
    ingestReceiptRef: Object.freeze({
      id: authority.ingestReceipt.ingestReceiptId,
      version: authority.ingestReceipt.ingestReceiptVersion,
      contentHash: `sha256:${authority.ingestReceipt.ingestReceiptHash}`,
    }),
    runtime: Object.freeze({
      pythonVersion: authority.workerResult.runtime.pythonVersion,
      torchVersion: authority.workerResult.runtime.torchVersion,
      torchvisionVersion: authority.workerResult.runtime.torchvisionVersion,
      cudaVersion: authority.workerResult.runtime.cudaVersion,
      torchcodecVersion: authority.workerResult.runtime.torchcodecVersion,
      einopsVersion: authority.workerResult.runtime.einopsVersion,
      pycocotoolsVersion: authority.workerResult.runtime.pycocotoolsVersion,
    }),
    securityLicenseAndCompatibilityQualified:
      authority.qualificationTruth.officialSam31SourceAndCheckpointReread
      && authority.qualificationTruth.strictCheckpointLoadVerified
      && authority.qualificationTruth.actualCudaModelInferenceExecuted
      && authority.securityComplianceClearance.decisions
        .noOpenHighOrCriticalSecurityFinding,
    privateImageBuildReviewEligible:
      authority.authority.privateImageBuildReviewEligible,
    vertexEvidenceKeptDistinctFromHistoricalBatchEvidence: true as const,
  })
}
