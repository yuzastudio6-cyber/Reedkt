import { z } from 'zod'

import {
  CANONICAL_SAM3_1_OPERATION_ID,
  CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
  assertCanonicalSam31SourceRuntimeCandidate,
} from './canonical-sam3_1-source-runtime-candidate'
import {
  CANONICAL_SAM3_1_PRIVATE_ARTIFACT_INGEST_VERSION,
  assertCanonicalSam31PrivateArtifactIngestReceipt,
} from './canonical-sam3_1-private-artifact-ingest'
import {
  CANONICAL_SAM3_1_VERTEX_COMPATIBILITY_QUALIFICATION_VERSION,
  assertCanonicalSam31VertexQualificationRelease,
  type CanonicalSam31VertexQualificationRelease,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-vertex-release-owner'
import { assertPlainSerializedData } from
  '../services/canonical-professional-gpu-job-lifecycle-service'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'

export const CANONICAL_SAM3_1_VERTEX_IMAGE_BUILD_BINDING_VERSION =
  'canonical-sam3_1-image-build-artifact-binding-v3' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const positiveInteger = z.number().int().positive().safe()
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
const qualificationRefSchema = evidenceRefSchema.extend({
  version: z.literal(2),
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_COMPATIBILITY_QUALIFICATION_VERSION,
  ),
}).strict()

const withoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_VERTEX_IMAGE_BUILD_BINDING_VERSION,
  ),
  source: z.literal(
    'canonical_sam3_1_vertex_image_build_artifact_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  status: z.literal('private_artifacts_admitted'),
  operationId: z.literal(CANONICAL_SAM3_1_OPERATION_ID),
  candidateRef: z.object({
    schemaVersion: z.literal(
      CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
    ),
    candidateHash: rawSha256,
  }).strict(),
  ingestReceiptRef: z.object({
    id: safeId,
    version: z.literal(1),
    schemaVersion: z.literal(
      CANONICAL_SAM3_1_PRIVATE_ARTIFACT_INGEST_VERSION,
    ),
    contentHash: prefixedSha256,
  }).strict(),
  sourceCheckpointQualificationRef: qualificationRefSchema,
  termsAcceptanceRef: evidenceRefSchema,
  sourceArchive: z.object({
    repository: z.literal('https://github.com/facebookresearch/sam3.git'),
    revision: z.literal('96914d2425f90a64f45ca977c2b5165418099543'),
    artifactRef: evidenceRefSchema,
    byteLength: z.literal(73_605_120),
    sha256: z.literal(
      '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a',
    ),
    licenseRef: evidenceRefSchema,
    securityReviewRef: evidenceRefSchema,
    malwareScanRef: evidenceRefSchema,
  }).strict(),
  checkpoint: z.object({
    repository: z.literal('facebook/sam3.1'),
    revision: z.literal('daa63191845a41281374e725f4c9e51c7a824460'),
    fileName: z.literal('sam3.1_multiplex.pt'),
    artifactRef: evidenceRefSchema,
    manifestRef: evidenceRefSchema,
    byteLength: positiveInteger.min(3_000_000_000).max(5_000_000_000),
    sha256: rawSha256,
    licenseRef: evidenceRefSchema,
    securityReviewRef: evidenceRefSchema,
    malwareScanRef: evidenceRefSchema,
    checkpointBytesIncludedInImageBuildCapsule: z.literal(false),
    checkpointRereadOnlyAtQualifiedRuntime: z.literal(true),
  }).strict(),
  vertexQualificationEvidenceRefs: z.object({
    workerRequestRef: evidenceRefSchema,
    workerResultRef: evidenceRefSchema,
    admissionRef: evidenceRefSchema,
    executionRef: evidenceRefSchema,
    terminalReconciliationRef: evidenceRefSchema,
    providerUsageEvidenceRef: evidenceRefSchema,
    platformStopEvidenceRef: evidenceRefSchema,
    currentAccountRateAuthorityRef: evidenceRefSchema,
    qualificationCostReceiptRef: evidenceRefSchema,
    securityComplianceClearanceRef: evidenceRefSchema,
  }).strict(),
  qualificationTruth: z.object({
    exactVertexA100ExecutionReread: z.literal(true),
    actualCudaModelInferenceExecuted: z.literal(true),
    completeForwardPropagationExecuted: z.literal(true),
    deterministicRepeatedProbeVerified: z.literal(true),
    strictCheckpointLoadVerified: z.literal(true),
    cpuOnlySubstantiveExecutionObserved: z.literal(false),
    cpuVideoDecodeFallbackObserved: z.literal(false),
    legacyBatchCastOrRelabelUsed: z.literal(false),
    scaleFromZeroVerified: z.literal(true),
    accountEffectivePricingReread: z.literal(true),
  }).strict(),
  privacyBoundary: z.object({
    sourceOrCheckpointStorageCoordinateIncluded: z.literal(false),
    bucketObjectGenerationEtagIncluded: z.literal(false),
    checkpointBytesIncluded: z.literal(false),
    providerOrRepositoryTokenIncluded: z.literal(false),
    browserOrCallerDataIncluded: z.literal(false),
    opaqueEvidenceRefsOnly: z.literal(true),
  }).strict(),
  authority: z.object({
    sanitizedBuildBindingOnly: z.literal(true),
    privateArtifactIngestReread: z.literal(true),
    sourceCheckpointQualificationReread: z.literal(true),
    imageBuildAuthorized: z.literal(false),
    imageBuildStarted: z.literal(false),
    runtimeAuthorized: z.literal(false),
    checkpointRedistributionAuthorized: z.literal(false),
    customerCreditsMutated: z.literal(false),
    qaApproved: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
}).strict().superRefine((value, context) => {
  if (
    value.vertexQualificationEvidenceRefs.workerRequestRef.version !== 2
    || value.sourceCheckpointQualificationRef.id !==
      value.vertexQualificationEvidenceRefs.workerRequestRef.id
  ) context.addIssue({
    code: 'custom',
    message: 'Vertex SAM 3.1 build binding lost qualification lineage.',
  })
})

export const canonicalSam31VertexImageBuildBindingSchema =
  withoutHashSchema.extend({ bindingHash: rawSha256 }).strict()
export type CanonicalSam31VertexImageBuildBinding = z.infer<
  typeof canonicalSam31VertexImageBuildBindingSchema
>

export function createCanonicalSam31VertexImageBuildBinding(input: {
  readonly release: CanonicalSam31VertexQualificationRelease
}): CanonicalSam31VertexImageBuildBinding {
  const release = assertCanonicalSam31VertexQualificationRelease(input.release)
  const candidate = assertCanonicalSam31SourceRuntimeCandidate(
    release.qualification.candidate,
  )
  const ingest = assertCanonicalSam31PrivateArtifactIngestReceipt(
    release.qualification.ingestReceipt,
  )
  if (
    release.status !== 'qualified_for_private_image_build'
    || !release.sourceCheckpointQualificationGranted
    || !release.privateImageBuildReviewEligible
    || release.imageBuildStarted
    || release.runtimeReleaseGranted
    || release.customerCreditsMutated
    || release.productionReady
    || ingest.candidateRef.candidateHash !== candidate.candidateHash
  ) throw new Error('Vertex SAM 3.1 qualification is not build-admissible.')
  const exact = release.qualification.exactEvidenceRefs
  const payload = withoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_VERTEX_IMAGE_BUILD_BINDING_VERSION,
    source: 'canonical_sam3_1_vertex_image_build_artifact_owner',
    evidenceClass: 'canonical_private_reread',
    status: 'private_artifacts_admitted',
    operationId: candidate.operationId,
    candidateRef: ingest.candidateRef,
    ingestReceiptRef: {
      id: ingest.ingestReceiptId,
      version: ingest.ingestReceiptVersion,
      schemaVersion: ingest.schemaVersion,
      contentHash: `sha256:${ingest.ingestReceiptHash}`,
    },
    sourceCheckpointQualificationRef:
      release.sourceCheckpointQualificationRef,
    termsAcceptanceRef: ingest.termsAcceptanceRef,
    sourceArchive: {
      repository: ingest.sourceArchive.repository,
      revision: ingest.sourceArchive.revision,
      artifactRef: ingest.sourceArchive.artifactRef,
      byteLength: ingest.sourceArchive.coordinate.byteLength,
      sha256: ingest.sourceArchive.coordinate.sha256,
      licenseRef: ingest.sourceArchive.licenseRef,
      securityReviewRef: ingest.sourceArchive.securityReviewRef,
      malwareScanRef: ingest.sourceArchive.malwareScanRef,
    },
    checkpoint: {
      repository: ingest.checkpoint.repository,
      revision: ingest.checkpoint.revision,
      fileName: ingest.checkpoint.fileName,
      artifactRef: ingest.checkpoint.artifactRef,
      manifestRef: ingest.checkpoint.manifestRef,
      byteLength: ingest.checkpoint.coordinate.byteLength,
      sha256: ingest.checkpoint.coordinate.sha256,
      licenseRef: ingest.checkpoint.licenseRef,
      securityReviewRef: ingest.checkpoint.securityReviewRef,
      malwareScanRef: ingest.checkpoint.malwareScanRef,
      checkpointBytesIncludedInImageBuildCapsule: false,
      checkpointRereadOnlyAtQualifiedRuntime: true,
    },
    vertexQualificationEvidenceRefs: {
      workerRequestRef: plainRef(exact.workerRequestRef),
      workerResultRef: plainRef(exact.workerResultRef),
      admissionRef: exact.admissionRef,
      executionRef: exact.executionRef,
      terminalReconciliationRef: {
        id: `sam31-vertex-terminal-reconciliation-${release.qualification
          .terminalReconciliation.resultHash.slice(0, 32)}`,
        version: 1,
        contentHash:
          `sha256:${release.qualification.terminalReconciliation.resultHash}`,
      },
      providerUsageEvidenceRef: exact.providerUsageEvidenceRef,
      platformStopEvidenceRef: exact.platformStopEvidenceRef,
      currentAccountRateAuthorityRef: exact.currentAccountRateAuthorityRef,
      qualificationCostReceiptRef: exact.qualificationCostReceiptRef,
      securityComplianceClearanceRef: exact.securityComplianceClearanceRef,
    },
    qualificationTruth: {
      exactVertexA100ExecutionReread: true,
      actualCudaModelInferenceExecuted: true,
      completeForwardPropagationExecuted: true,
      deterministicRepeatedProbeVerified: true,
      strictCheckpointLoadVerified: true,
      cpuOnlySubstantiveExecutionObserved: false,
      cpuVideoDecodeFallbackObserved: false,
      legacyBatchCastOrRelabelUsed: false,
      scaleFromZeroVerified: true,
      accountEffectivePricingReread: true,
    },
    privacyBoundary: {
      sourceOrCheckpointStorageCoordinateIncluded: false,
      bucketObjectGenerationEtagIncluded: false,
      checkpointBytesIncluded: false,
      providerOrRepositoryTokenIncluded: false,
      browserOrCallerDataIncluded: false,
      opaqueEvidenceRefsOnly: true,
    },
    authority: {
      sanitizedBuildBindingOnly: true,
      privateArtifactIngestReread: true,
      sourceCheckpointQualificationReread: true,
      imageBuildAuthorized: false,
      imageBuildStarted: false,
      runtimeAuthorized: false,
      checkpointRedistributionAuthorized: false,
      customerCreditsMutated: false,
      qaApproved: false,
      productionReady: false,
    },
  })
  return canonicalSam31VertexImageBuildBindingSchema.parse({
    ...payload,
    bindingHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31VertexImageBuildBinding(
  value: unknown,
): CanonicalSam31VertexImageBuildBinding {
  assertPlainSerializedData(value, 'sam31_vertex_image_build_binding')
  const parsed = canonicalSam31VertexImageBuildBindingSchema.parse(value)
  const { bindingHash, ...payload } = parsed
  if (bindingHash !== sha256AuthorityValue(payload)) {
    throw new Error('Vertex SAM 3.1 build binding hash is invalid.')
  }
  return parsed
}

function plainRef(value: {
  readonly id: string
  readonly version: number
  readonly contentHash: string
}) {
  return {
    id: value.id,
    version: value.version,
    contentHash: value.contentHash,
  }
}
