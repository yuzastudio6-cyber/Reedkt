import { z } from 'zod'

import {
  CANONICAL_SAM3_1_PRIVATE_ARTIFACT_INGEST_VERSION,
  assertCanonicalSam31PrivateArtifactIngestReceipt,
  type CanonicalSam31PrivateArtifactIngestReceipt,
} from './canonical-sam3_1-private-artifact-ingest'
import {
  CANONICAL_SAM3_1_OPERATION_ID,
  CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
  assertCanonicalSam31SourceRuntimeCandidate,
  type CanonicalSam31SourceRuntimeCandidate,
} from './canonical-sam3_1-source-runtime-candidate'
import {
  assertPlainSerializedData,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

export const CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_VERSION =
  'canonical-sam3_1-source-checkpoint-compatibility-qualification-v1' as const

const QUALIFICATION_BASE_IMAGE_DIGEST =
  'sha256:b85566342b86d13a67712e9315d40cdc2dad7f8d86df1aff3831f80835edbcca' as const
const SOURCE_SHA256 =
  '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a' as const
const GPU_DECODE_PATCH_SHA256 =
  'daf5dfb59dbe6809eb2731b43e13d91b1679c271f0f4af11962236ffe83eb6ca' as const
const EMPTY_EVIDENCE_SHA256 = '0'.repeat(64)
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const nonnegativeInteger = z.number().int().nonnegative().safe()
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()

const observationSchema = z.object({
  evidenceClass: z.enum([
    'synthetic_contract_fixture',
    'canonical_private_reread',
  ]),
  qualificationId: safeId,
  qualificationVersion: z.literal(1),
  qualificationJobRef: evidenceRefSchema,
  qualificationAttemptRef: evidenceRefSchema,
  qualificationResultRuntimeRef: evidenceRefSchema,
  qualificationLogRef: evidenceRefSchema,
  internalCostReceiptRef: evidenceRefSchema,
  dependencyClosureRef: evidenceRefSchema,
  dependencyLockSha256: sha256,
  dependencyClosureReceiptSha256: sha256,
  dependencyWheelManifestSha256: sha256,
  patchApplicationReceiptRef: evidenceRefSchema,
  patchedSourceArchiveRef: evidenceRefSchema,
  patchedSourceArchiveSha256: z.literal(
    'b692268f0e295673d5c5cc2fc14e7813847effc5e371e32cb18c1861b4c8adfb',
  ),
  sourceCodeSecurityReviewRef: evidenceRefSchema,
  checkpointWeightsOnlyInspectionRef: evidenceRefSchema,
  deterministicProbeFixtureRef: evidenceRefSchema,
  deterministicProbeResultRef: evidenceRefSchema,
  securityAndCompliance: z.object({
    sourceLicenseReviewedForApprovedUse: z.boolean(),
    checkpointLicenseReviewedForApprovedUse: z.boolean(),
    privacyReviewApprovedForPrivateQualification: z.boolean(),
    tradeControlsReviewApprovedForPrivateQualification: z.boolean(),
    sourceMalwareScanPassed: z.boolean(),
    checkpointMalwareScanPassed: z.boolean(),
    sourceStaticSecurityReviewPassed: z.boolean(),
    checkpointWeightsOnlyLoadPassed: z.boolean(),
    checkpointTensorAndMetadataAllowlistPassed: z.boolean(),
    executablePickleTrustGranted: z.literal(false),
    checkpointRedistributionAuthorized: z.literal(false),
  }).strict(),
  qualificationRuntime: z.object({
    executionTarget: z.literal('google_cloud_batch_a2_ultra_job'),
    machineType: z.literal('a2-ultragpu-1g'),
    accelerator: z.literal('nvidia_a100_80gb'),
    allocatedGpuCount: z.literal(1),
    baseImageDigest: z.literal(QUALIFICATION_BASE_IMAGE_DIGEST),
    pythonVersion: z.literal('3.12'),
    torchVersion: z.literal('2.10.0'),
    torchvisionVersion: z.literal('0.25.0'),
    torchcodecVersion: z.literal('0.10.0'),
    cudaVersion: z.literal('12.8'),
    fixedBuilder: z.literal('build_sam3_multiplex_video_predictor'),
    networkEgressAllowed: z.literal(false),
    developerMachineExecutionAllowed: z.literal(false),
    callerCommandModuleClassModelOrCheckpointAccepted: z.literal(false),
    sourceCheckpointAndDependencyMountsReadOnly: z.literal(true),
    automaticRetryAfterUnknownOutcomeAllowed: z.literal(false),
  }).strict(),
  compatibilityProbe: z.object({
    exactSourceArchiveReread: z.boolean(),
    exactPatchedSourceArchiveReread: z.boolean(),
    exactCheckpointRereadBeforeAndAfter: z.boolean(),
    exactDependencyWheelAndNativeClosureReread: z.boolean(),
    sourcePatchApplicationReceiptReread: z.boolean(),
    weightsOnlyCheckpointInspectionExecuted: z.boolean(),
    fixedBuilderImportedFromPinnedSource: z.boolean(),
    fixedBuilderCalledExactlyOnce: z.boolean(),
    checkpointLoadedExactlyOnce: z.boolean(),
    strictCheckpointLoadRequested: z.boolean(),
    missingCheckpointKeyCount: nonnegativeInteger,
    unexpectedCheckpointKeyCount: nonnegativeInteger,
    checkpointKeyCount: nonnegativeInteger,
    modelStateKeyCount: nonnegativeInteger,
    checkpointKeySetSha256: sha256,
    modelStateKeySetSha256: sha256,
    checkpointAndModelKeySetsExact: z.boolean(),
    startSessionAddPromptPropagateAndCloseExecuted: z.boolean(),
    actualCudaModelInferenceExecuted: z.boolean(),
    bfloat16AutocastExecuted: z.boolean(),
    outputMaskShapeMatchedProbeFrames: z.boolean(),
    outputObjectIdsMatchedProbePrompt: z.boolean(),
    outputMasksWereCudaTensorsBeforeSerialization: z.boolean(),
    deterministicRepeatedProbeRunCount: nonnegativeInteger,
    deterministicOutputDigestSha256: sha256,
    deterministicOutputDigestMatchedEveryRun: z.boolean(),
    cpuOnlyModelExecutionObserved: z.literal(false),
    quantizationOrResolutionReductionUsed: z.literal(false),
    providerInferenceExecuted: z.literal(false),
  }).strict(),
  qualifiedAt: timestamp,
}).strict()

export type CanonicalSam31SourceCheckpointQualificationObservation = z.infer<
  typeof observationSchema
>

const qualificationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_VERSION,
  ),
  source: z.literal(
    'canonical_sam3_1_source_checkpoint_qualification_owner',
  ),
  evidenceClass: z.enum([
    'synthetic_contract_fixture',
    'canonical_private_reread',
  ]),
  status: z.enum([
    'contract_only',
    'qualified_for_private_image_build',
  ]),
  qualificationId: safeId,
  qualificationVersion: z.literal(1),
  operationId: z.literal(CANONICAL_SAM3_1_OPERATION_ID),
  candidateRef: z.object({
    schemaVersion: z.literal(
      CANONICAL_SAM3_1_SOURCE_RUNTIME_CANDIDATE_VERSION,
    ),
    candidateHash: sha256,
  }).strict(),
  officialArtifactPublicationRef: z.object({
    id: safeId,
    version: z.literal(1),
    schemaVersion: z.literal(
      'canonical-sam3_1-official-artifact-publication-receipt-v1',
    ),
    contentHash: prefixedSha256,
  }).strict(),
  ingestReceiptRef: z.object({
    id: safeId,
    version: z.literal(1),
    schemaVersion: z.literal(
      CANONICAL_SAM3_1_PRIVATE_ARTIFACT_INGEST_VERSION,
    ),
    contentHash: prefixedSha256,
  }).strict(),
  termsAcceptanceRef: evidenceRefSchema,
  sourceArchive: z.object({
    revision: z.literal(
      '96914d2425f90a64f45ca977c2b5165418099543',
    ),
    artifactRef: evidenceRefSchema,
    byteLength: positiveInteger,
    sha256: sha256,
    licenseRef: evidenceRefSchema,
    securityReviewRef: evidenceRefSchema,
    malwareScanRef: evidenceRefSchema,
    gpuDecodePatchSha256: z.literal(GPU_DECODE_PATCH_SHA256),
  }).strict(),
  checkpoint: z.object({
    repositoryRevision: z.literal(
      'daa63191845a41281374e725f4c9e51c7a824460',
    ),
    fileName: z.literal('sam3.1_multiplex.pt'),
    artifactRef: evidenceRefSchema,
    byteLength: positiveInteger,
    sha256: sha256,
    manifestRef: evidenceRefSchema,
    licenseRef: evidenceRefSchema,
    securityReviewRef: evidenceRefSchema,
    malwareScanRef: evidenceRefSchema,
  }).strict(),
  controlledObservation: observationSchema.omit({
    evidenceClass: true,
    qualificationId: true,
    qualificationVersion: true,
    qualifiedAt: true,
  }).strict(),
  authority: z.object({
    qualificationEvidenceOnly: z.literal(true),
    securityLicenseAndCompatibilityQualified: z.boolean(),
    privateImageBuildReviewEligible: z.boolean(),
    imageBuildStarted: z.literal(false),
    runtimeDispatchAuthorized: z.literal(false),
    customerCreditsMutated: z.literal(false),
    customerBillingAuthorityGranted: z.literal(false),
    qaApproved: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  qualifiedAt: timestamp,
}).strict().superRefine((record, context) => {
  const canonical = record.evidenceClass === 'canonical_private_reread'
  const security = record.controlledObservation.securityAndCompliance
  const probe = record.controlledObservation.compatibilityProbe
  if (
    record.controlledObservation.patchedSourceArchiveRef.contentHash !==
      `sha256:${record.controlledObservation.patchedSourceArchiveSha256}`
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 patched source evidence does not bind exact bytes.',
  })
  const canonicalEvidence =
    record.status === 'qualified_for_private_image_build'
    && record.sourceArchive.byteLength === 73_605_120
    && record.sourceArchive.sha256 === SOURCE_SHA256
    && record.sourceArchive.artifactRef.contentHash ===
      `sha256:${record.sourceArchive.sha256}`
    && record.checkpoint.byteLength >= 3_000_000_000
    && record.checkpoint.byteLength <= 5_000_000_000
    && record.checkpoint.artifactRef.contentHash ===
      `sha256:${record.checkpoint.sha256}`
    && security.sourceLicenseReviewedForApprovedUse
    && security.checkpointLicenseReviewedForApprovedUse
    && security.privacyReviewApprovedForPrivateQualification
    && security.tradeControlsReviewApprovedForPrivateQualification
    && security.sourceMalwareScanPassed
    && security.checkpointMalwareScanPassed
    && security.sourceStaticSecurityReviewPassed
    && security.checkpointWeightsOnlyLoadPassed
    && security.checkpointTensorAndMetadataAllowlistPassed
    && probe.exactSourceArchiveReread
    && probe.exactPatchedSourceArchiveReread
    && probe.exactCheckpointRereadBeforeAndAfter
    && probe.exactDependencyWheelAndNativeClosureReread
    && probe.sourcePatchApplicationReceiptReread
    && probe.weightsOnlyCheckpointInspectionExecuted
    && probe.fixedBuilderImportedFromPinnedSource
    && probe.fixedBuilderCalledExactlyOnce
    && probe.checkpointLoadedExactlyOnce
    && probe.strictCheckpointLoadRequested
    && probe.missingCheckpointKeyCount === 0
    && probe.unexpectedCheckpointKeyCount === 0
    && probe.checkpointKeyCount > 0
    && probe.checkpointKeyCount === probe.modelStateKeyCount
    && probe.checkpointKeySetSha256 === probe.modelStateKeySetSha256
    && probe.checkpointAndModelKeySetsExact
    && probe.startSessionAddPromptPropagateAndCloseExecuted
    && probe.actualCudaModelInferenceExecuted
    && probe.bfloat16AutocastExecuted
    && probe.outputMaskShapeMatchedProbeFrames
    && probe.outputObjectIdsMatchedProbePrompt
    && probe.outputMasksWereCudaTensorsBeforeSerialization
    && probe.deterministicRepeatedProbeRunCount >= 3
    && probe.deterministicOutputDigestSha256 !== EMPTY_EVIDENCE_SHA256
    && probe.deterministicOutputDigestMatchedEveryRun
    && record.authority.securityLicenseAndCompatibilityQualified
    && record.authority.privateImageBuildReviewEligible
  const contractEvidence = record.status === 'contract_only'
    && !security.sourceLicenseReviewedForApprovedUse
    && !security.checkpointLicenseReviewedForApprovedUse
    && !security.privacyReviewApprovedForPrivateQualification
    && !security.tradeControlsReviewApprovedForPrivateQualification
    && !security.sourceMalwareScanPassed
    && !security.checkpointMalwareScanPassed
    && !security.sourceStaticSecurityReviewPassed
    && !security.checkpointWeightsOnlyLoadPassed
    && !security.checkpointTensorAndMetadataAllowlistPassed
    && !probe.exactSourceArchiveReread
    && !probe.exactPatchedSourceArchiveReread
    && !probe.exactCheckpointRereadBeforeAndAfter
    && !probe.exactDependencyWheelAndNativeClosureReread
    && !probe.sourcePatchApplicationReceiptReread
    && !probe.weightsOnlyCheckpointInspectionExecuted
    && !probe.fixedBuilderImportedFromPinnedSource
    && !probe.fixedBuilderCalledExactlyOnce
    && !probe.checkpointLoadedExactlyOnce
    && !probe.strictCheckpointLoadRequested
    && probe.missingCheckpointKeyCount === 0
    && probe.unexpectedCheckpointKeyCount === 0
    && probe.checkpointKeyCount === 0
    && probe.modelStateKeyCount === 0
    && !probe.checkpointAndModelKeySetsExact
    && !probe.startSessionAddPromptPropagateAndCloseExecuted
    && !probe.actualCudaModelInferenceExecuted
    && !probe.bfloat16AutocastExecuted
    && !probe.outputMaskShapeMatchedProbeFrames
    && !probe.outputObjectIdsMatchedProbePrompt
    && !probe.outputMasksWereCudaTensorsBeforeSerialization
    && probe.deterministicRepeatedProbeRunCount === 0
    && probe.deterministicOutputDigestSha256 === EMPTY_EVIDENCE_SHA256
    && !probe.deterministicOutputDigestMatchedEveryRun
    && !record.authority.securityLicenseAndCompatibilityQualified
    && !record.authority.privateImageBuildReviewEligible
  if (canonical ? !canonicalEvidence : !contractEvidence) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 source/checkpoint qualification is not admissible.',
  })
})

export const canonicalSam31SourceCheckpointQualificationSchema =
  qualificationWithoutHashSchema.extend({ qualificationHash: sha256 }).strict()
export type CanonicalSam31SourceCheckpointQualification = z.infer<
  typeof canonicalSam31SourceCheckpointQualificationSchema
>

export function compileCanonicalSam31SourceCheckpointQualification(input: {
  readonly candidate: CanonicalSam31SourceRuntimeCandidate
  readonly ingestReceipt: CanonicalSam31PrivateArtifactIngestReceipt
  readonly observation: CanonicalSam31SourceCheckpointQualificationObservation
}): CanonicalSam31SourceCheckpointQualification {
  const candidate = assertCanonicalSam31SourceRuntimeCandidate(input.candidate)
  const ingest = assertCanonicalSam31PrivateArtifactIngestReceipt(
    input.ingestReceipt,
  )
  assertPlainSerializedData(input.observation,
    'sam3_1_source_checkpoint_qualification_observation')
  const observation = observationSchema.parse(input.observation)
  if (
    candidate.candidateHash !== ingest.candidateRef.candidateHash
    || candidate.schemaVersion !== ingest.candidateRef.schemaVersion
    || candidate.operationId !== ingest.operationId
    || observation.evidenceClass !== ingest.evidenceClass
  ) throw new Error('SAM 3.1 qualification crossed candidate or ingest.')
  const {
    evidenceClass,
    qualificationId,
    qualificationVersion,
    qualifiedAt,
    ...controlledObservation
  } = observation
  const canonical = evidenceClass === 'canonical_private_reread'
  const payload = qualificationWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_VERSION,
    source: 'canonical_sam3_1_source_checkpoint_qualification_owner',
    evidenceClass,
    status: canonical
      ? 'qualified_for_private_image_build'
      : 'contract_only',
    qualificationId,
    qualificationVersion,
    operationId: candidate.operationId,
    candidateRef: ingest.candidateRef,
    officialArtifactPublicationRef: ingest.officialArtifactPublicationRef,
    ingestReceiptRef: {
      id: ingest.ingestReceiptId,
      version: ingest.ingestReceiptVersion,
      schemaVersion: ingest.schemaVersion,
      contentHash: `sha256:${ingest.ingestReceiptHash}`,
    },
    termsAcceptanceRef: ingest.termsAcceptanceRef,
    sourceArchive: {
      revision: ingest.sourceArchive.revision,
      artifactRef: ingest.sourceArchive.artifactRef,
      byteLength: ingest.sourceArchive.coordinate.byteLength,
      sha256: ingest.sourceArchive.coordinate.sha256,
      licenseRef: ingest.sourceArchive.licenseRef,
      securityReviewRef: ingest.sourceArchive.securityReviewRef,
      malwareScanRef: ingest.sourceArchive.malwareScanRef,
      gpuDecodePatchSha256: GPU_DECODE_PATCH_SHA256,
    },
    checkpoint: {
      repositoryRevision: ingest.checkpoint.revision,
      fileName: ingest.checkpoint.fileName,
      artifactRef: ingest.checkpoint.artifactRef,
      byteLength: ingest.checkpoint.coordinate.byteLength,
      sha256: ingest.checkpoint.coordinate.sha256,
      manifestRef: ingest.checkpoint.manifestRef,
      licenseRef: ingest.checkpoint.licenseRef,
      securityReviewRef: ingest.checkpoint.securityReviewRef,
      malwareScanRef: ingest.checkpoint.malwareScanRef,
    },
    controlledObservation,
    authority: {
      qualificationEvidenceOnly: true,
      securityLicenseAndCompatibilityQualified: canonical,
      privateImageBuildReviewEligible: canonical,
      imageBuildStarted: false,
      runtimeDispatchAuthorized: false,
      customerCreditsMutated: false,
      customerBillingAuthorityGranted: false,
      qaApproved: false,
      publicDeliveryAuthorized: false,
      productionReady: false,
    },
    qualifiedAt,
  })
  return canonicalSam31SourceCheckpointQualificationSchema.parse({
    ...payload,
    qualificationHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31SourceCheckpointQualification(
  value: unknown,
): CanonicalSam31SourceCheckpointQualification {
  assertPlainSerializedData(value, 'sam3_1_source_checkpoint_qualification')
  const parsed = canonicalSam31SourceCheckpointQualificationSchema.parse(value)
  const { qualificationHash, ...payload } = parsed
  if (qualificationHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 source/checkpoint qualification hash is invalid.')
  }
  return parsed
}

export function canonicalSam31SourceCheckpointQualificationRef(
  value: unknown,
): {
  readonly id: string
  readonly version: 1
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_SOURCE_CHECKPOINT_QUALIFICATION_VERSION
  readonly contentHash: `sha256:${string}`
} {
  const qualification = assertCanonicalSam31SourceCheckpointQualification(
    value,
  )
  return Object.freeze({
    id: qualification.qualificationId,
    version: qualification.qualificationVersion,
    schemaVersion: qualification.schemaVersion,
    contentHash: `sha256:${qualification.qualificationHash}`,
  })
}
