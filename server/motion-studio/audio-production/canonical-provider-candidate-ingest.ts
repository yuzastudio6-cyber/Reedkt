import { createHash } from 'node:crypto'

import { z } from 'zod'

import { ApiError } from '../../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import {
  persistCanonicalPrivateAudioArtifact,
  readCanonicalPrivateAudioArtifact,
} from '../../services/canonical-private-audio-artifact-storage'
import { stableAuthorityStringify } from '../../services/private-edit-authority-store'
import {
  OFFLINE_GENERATED_MUSIC_CANDIDATE_NORMALIZATION_PROFILE,
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_PROTOCOL,
  OFFLINE_SYNCHRONIZED_FOLEY_CANDIDATE_NORMALIZATION_PROFILE,
  openPrivateOfflineMediaBinaryRuntime,
  readPersistedOfflineMediaBinaryRuntimeAuthority,
  type OfflineGeneratedMusicCandidateNormalizeExecutionResult,
  type OfflineSynchronizedFoleyCandidateNormalizeExecutionResult,
  validateOfflineGeneratedMusicCandidateNormalizeExecutionRequest,
  validateOfflineSynchronizedFoleyCandidateNormalizeExecutionRequest,
} from '../../tool-execution/media-binary-execution'
import { parseMotionStudioPcmWave } from './pcm-wave'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioCanonicalProviderAttemptPort,
  evaluateMotionStudioProviderAttemptReceipt,
  motionStudioProviderAttemptConsumptionExpectationV1Schema,
  type MotionStudioCanonicalProviderAttemptPortV1,
  type MotionStudioProviderAttemptConsumptionExpectationV1,
} from './canonical-provider-attempt-port'

export const MOTION_STUDIO_PROVIDER_CANDIDATE_INGEST_PLAN_SCHEMA_VERSION =
  'motion-studio.provider-candidate-ingest-plan.v1' as const
export const MOTION_STUDIO_PROVIDER_CANDIDATE_INGEST_EVIDENCE_SCHEMA_VERSION =
  'motion-studio.provider-candidate-ingest-evidence.v2' as const
export const MOTION_STUDIO_PROVIDER_CANDIDATE_EVIDENCE_CLASSES = [
  'contract_shaped_server_path_proof_only',
  'canonical_backend_verified_runtime',
] as const

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const isoDateSchema = z.string().datetime({ offset: true })
const evidenceClassSchema = z.enum(MOTION_STUDIO_PROVIDER_CANDIDATE_EVIDENCE_CLASSES)
const receiptAuthorityClassSchema = z.enum([
  'contract_fixture',
  'canonical_backend_verified_runtime',
])

const musicNormalizationPlanSchema = z.object({
  intent: z.literal('generated_music_candidate'),
  recipeProfileId: z.literal(OFFLINE_GENERATED_MUSIC_CANDIDATE_NORMALIZATION_PROFILE),
  expectedDurationMilliseconds: z.number().int().positive().max(30_000),
  maximumDurationMilliseconds: z.literal(30_000),
  maximumDurationDriftMilliseconds: z.number().int().min(0).max(2),
  outputSampleRateHertz: z.literal(48_000),
  outputChannelCount: z.literal(2),
  metadataPolicy: z.literal('strip_all'),
}).strict()

const foleyNormalizationPlanSchema = z.object({
  intent: z.literal('synchronized_foley_candidate'),
  recipeProfileId: z.literal(OFFLINE_SYNCHRONIZED_FOLEY_CANDIDATE_NORMALIZATION_PROFILE),
  fps: z.union([z.literal(24), z.literal(30)]),
  durationFrames: z.number().int().positive().max(900),
  exactOutputSampleCountPerChannel: z.number().int().positive().max(1_800_000),
  outputSampleRateHertz: z.literal(48_000),
  outputChannelCount: z.literal(2),
  metadataPolicy: z.literal('strip_all'),
  silencePaddingAllowed: z.literal(false),
  trimAtMostOneFrameOfExcessAllowed: z.literal(true),
}).strict().superRefine((value, context) => {
  const expectedSamples = value.durationFrames * (48_000 / value.fps)
  if (value.exactOutputSampleCountPerChannel !== expectedSamples) {
    context.addIssue({
      code: 'custom',
      path: ['exactOutputSampleCountPerChannel'],
      message: 'Synchronized-Foley output samples must derive exactly from frame authority.',
    })
  }
})

const normalizationPlanSchema = z.discriminatedUnion('intent', [
  musicNormalizationPlanSchema,
  foleyNormalizationPlanSchema,
])

export const motionStudioProviderCandidateIngestPlanV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_PROVIDER_CANDIDATE_INGEST_PLAN_SCHEMA_VERSION),
  ingestPlanId: stableIdSchema,
  intent: z.enum(['generated_music_candidate', 'synchronized_foley_candidate']),
  expectationId: stableIdSchema,
  expectationDigest: digestSchema,
  workspaceId: stableIdSchema,
  projectId: stableIdSchema,
  editSessionId: stableIdSchema,
  productionId: stableIdSchema,
  approvedSnapshotId: stableIdSchema,
  approvedSnapshotDigest: digestSchema,
  sourceRequestId: stableIdSchema,
  sourceRequestDigest: digestSchema,
  expectedOutputId: stableIdSchema,
  expectedOutputRole: z.enum([
    'generated_instrumental_score_candidate',
    'provider_synchronized_audio_mp4',
  ]),
  expectedMimeType: z.enum(['audio/wav', 'video/mp4']),
  normalization: normalizationPlanSchema,
  rules: z.object({
    canonicalBackendVerifiedReceiptRequired: z.literal(true),
    exactPrivateArtifactReadbackRequired: z.literal(true),
    deterministicReplayRequired: z.literal(true),
    canonicalPcmCreateOnlyPersistenceRequired: z.literal(true),
    observedNormalizationInfrastructureCostRequiredBeforeReconciliation: z.literal(true),
    automaticSelectionAllowed: z.literal(false),
    finalMixAllowed: z.literal(false),
    timelineMutationAllowed: z.literal(false),
  }).strict(),
  immutable: z.literal(true),
  planDigest: digestSchema,
}).strict().superRefine((value, context) => {
  if (value.intent !== value.normalization.intent) {
    context.addIssue({
      code: 'custom',
      path: ['normalization', 'intent'],
      message: 'Candidate ingest normalization must match the exact provider intent.',
    })
  }
  if (
    (value.intent === 'generated_music_candidate' &&
      (value.expectedOutputRole !== 'generated_instrumental_score_candidate' ||
        value.expectedMimeType !== 'audio/wav')) ||
    (value.intent === 'synchronized_foley_candidate' &&
      (value.expectedOutputRole !== 'provider_synchronized_audio_mp4' ||
        value.expectedMimeType !== 'video/mp4'))
  ) {
    context.addIssue({
      code: 'custom',
      path: ['expectedOutputRole'],
      message: 'Candidate ingest output role and media type must match the exact provider intent.',
    })
  }
})

export type MotionStudioProviderCandidateIngestPlanV1 =
  z.infer<typeof motionStudioProviderCandidateIngestPlanV1Schema>

const artifactReadbackMetadataSchema = z.object({
  authorityClass: receiptAuthorityClassSchema,
  workspaceId: stableIdSchema,
  projectId: stableIdSchema,
  editSessionId: stableIdSchema,
  productionId: stableIdSchema,
  approvedSnapshotId: stableIdSchema,
  queueJobId: stableIdSchema,
  queueAttemptId: stableIdSchema,
  claimId: stableIdSchema,
  leaseId: stableIdSchema,
  outputId: stableIdSchema,
  assetId: stableIdSchema,
  assetVersionId: stableIdSchema,
  role: z.enum([
    'generated_instrumental_score_candidate',
    'provider_synchronized_audio_mp4',
  ]),
  mimeType: z.enum(['audio/wav', 'video/mp4']),
  privateObjectIdentityHash: digestSchema,
  contentSha256: digestSchema,
  byteLength: z.number().int().positive().max(128 * 1024 * 1024),
  artifactEvidenceDigest: digestSchema,
  checksumReadbackVerified: z.literal(true),
  createOnly: z.literal(true),
  providerUrlPersisted: z.literal(false),
  localPathProjected: z.literal(false),
  readbackEvidenceDigest: digestSchema,
}).strict()

export type MotionStudioCanonicalProviderArtifactReadback =
  z.infer<typeof artifactReadbackMetadataSchema> & { bytes: Buffer }

export interface MotionStudioCanonicalProviderArtifactReader {
  readExactPrivateArtifact(input: Readonly<{
    authorityClass: 'contract_fixture' | 'canonical_backend_verified_runtime'
    workspaceId: string
    projectId: string
    editSessionId: string
    productionId: string
    approvedSnapshotId: string
    queueJobId: string
    queueAttemptId: string
    claimId: string
    leaseId: string
    outputId: string
    assetId: string
    assetVersionId: string
    role: 'generated_instrumental_score_candidate' | 'provider_synchronized_audio_mp4'
    mimeType: 'audio/wav' | 'video/mp4'
    privateObjectIdentityHash: string
    contentSha256: string
    byteLength: number
    artifactEvidenceDigest: string
  }>): Promise<MotionStudioCanonicalProviderArtifactReadback>
}

export const motionStudioProviderCandidateIngestEvidenceV2Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_PROVIDER_CANDIDATE_INGEST_EVIDENCE_SCHEMA_VERSION),
  evidenceId: stableIdSchema,
  evidenceClass: evidenceClassSchema,
  state: z.enum([
    'contract_path_private_candidate_normalized_objective_qa_test_only',
    'actual_private_candidate_normalized_objective_qa_pending',
  ]),
  createdAt: isoDateSchema,
  ingestPlanId: stableIdSchema,
  ingestPlanDigest: digestSchema,
  expectationId: stableIdSchema,
  expectationDigest: digestSchema,
  canonicalReceiptDigest: digestSchema,
  admissionDigest: digestSchema,
  intent: z.enum(['generated_music_candidate', 'synchronized_foley_candidate']),
  workspaceId: stableIdSchema,
  projectId: stableIdSchema,
  editSessionId: stableIdSchema,
  productionId: stableIdSchema,
  approvedSnapshotId: stableIdSchema,
  approvedSnapshotDigest: digestSchema,
  providerAttempt: z.object({
    approvedPackageId: stableIdSchema,
    approvedPackageDigest: digestSchema,
    approvedWorkItemId: stableIdSchema,
    queueJobId: stableIdSchema,
    queueAttemptId: stableIdSchema,
    claimId: stableIdSchema,
    leaseId: stableIdSchema,
    idempotencyKeyHash: digestSchema,
    providerOperationId: stableIdSchema,
    providerRouteId: stableIdSchema,
    providerModelId: stableIdSchema,
    sourceRequestId: stableIdSchema,
    sourceRequestDigest: digestSchema,
    providerRequestPayloadDigest: digestSchema,
    projectDataPolicyDigest: digestSchema,
    providerAccountPolicyDigest: digestSchema,
    providerResponseUsageDigest: digestSchema,
    oneUseDispatchEvidenceDigest: digestSchema,
    terminalEvidenceDigest: digestSchema,
  }).strict(),
  sourceArtifact: artifactReadbackMetadataSchema,
  normalization: z.object({
    canonicalOperationId: z.literal(OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg),
    recipeProfileId: z.enum([
      OFFLINE_GENERATED_MUSIC_CANDIDATE_NORMALIZATION_PROFILE,
      OFFLINE_SYNCHRONIZED_FOLEY_CANDIDATE_NORMALIZATION_PROFILE,
    ]),
    runtimeAuthorityHash: digestSchema,
    runtimeImageIdentityHash: digestSchema,
    requestEnvelopeSha256: digestSchema,
    normalizationAttestationDigest: digestSchema,
    deterministicReplayVerified: z.literal(true),
  }).strict(),
  normalizedArtifact: z.object({
    privateObjectIdentityHash: digestSchema,
    mimeType: z.literal('audio/wav'),
    codec: z.literal('pcm_s16le'),
    sampleRateHertz: z.literal(48_000),
    channelCount: z.literal(2),
    bitsPerSample: z.literal(16),
    sampleCountPerChannel: z.number().int().positive().max(1_800_000),
    durationMilliseconds: z.number().int().positive().max(30_000),
    byteLength: z.number().int().min(44).max(24 * 1024 * 1024),
    sha256: digestSchema,
    privateCreateOnlyReadbackVerified: z.literal(true),
  }).strict(),
  cost: z.object({
    providerUsageEvidenceDigest: digestSchema,
    providerRateCardDigest: digestSchema,
    providerCostMicros: z.number().int().min(0),
    providerWorkerInfrastructureUsageEvidenceDigest: digestSchema,
    providerWorkerInfrastructureRateCardDigest: digestSchema,
    providerWorkerInfrastructureCostMicros: z.number().int().min(0),
    providerAttemptTotalInternalProductionCostMicros: z.number().int().min(0),
    providerAttemptCostEvidenceDigest: digestSchema,
    providerAttemptCostEvidenceActual: z.boolean(),
    normalizationInfrastructureCostState: z.literal('canonical_observed_resource_evidence_required'),
    normalizationInfrastructureCostMicros: z.null(),
    fullCandidateCostReconciled: z.literal(false),
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletMutationPerformed: z.literal(false),
    billingMutationPerformed: z.literal(false),
  }).strict(),
  readiness: z.object({
    contractPathProofOnly: z.boolean(),
    actualPrivateProviderCandidatePresent: z.boolean(),
    exactProviderArtifactReadbackVerified: z.literal(true),
    canonicalPcmNormalizationComplete: z.literal(true),
    readyForObjectiveQa: z.literal(true),
    actualCandidateObjectiveQaComplete: z.literal(false),
    semanticRightsAndHumanReviewComplete: z.literal(false),
    fullCandidateCostReconciled: z.literal(false),
    readyForHumanReview: z.literal(false),
    selectionEligible: z.literal(false),
    finalMixEligible: z.literal(false),
    timelineEligible: z.literal(false),
    ms012dAccepted: z.literal(false),
    productReady: z.literal(false),
  }).strict(),
  sideEffects: z.object({
    privateArtifactReadCount: z.literal(1),
    secretPayloadReadCountByIngestPort: z.literal(0),
    providerSubmissionCountByIngestPort: z.literal(0),
    normalizedPrivateArtifactWriteCount: z.literal(1),
    evidenceRecordWriteCount: z.literal(1),
    selectionCount: z.literal(0),
    finalMixMutationCount: z.literal(0),
    timelineMutationCount: z.literal(0),
    renderCount: z.literal(0),
    exportCount: z.literal(0),
    remoteMutationCount: z.literal(0),
  }).strict(),
  persistence: z.object({
    privateLocalOnly: z.literal(true),
    createOnly: z.literal(true),
    evidenceRecordPersisted: z.literal(true),
    providerUrlPersisted: z.literal(false),
    localPathProjected: z.literal(false),
    evidenceObjectIdentityHash: digestSchema,
  }).strict(),
  immutable: z.literal(true),
  evidenceDigest: digestSchema,
}).strict().superRefine((value, context) => {
  const actual = value.evidenceClass === 'canonical_backend_verified_runtime'
  const expectedState = actual
    ? 'actual_private_candidate_normalized_objective_qa_pending'
    : 'contract_path_private_candidate_normalized_objective_qa_test_only'
  const expectedReceiptAuthority = actual
    ? 'canonical_backend_verified_runtime'
    : 'contract_fixture'
  if (
    value.state !== expectedState ||
    value.sourceArtifact.authorityClass !== expectedReceiptAuthority ||
    value.readiness.contractPathProofOnly !== !actual ||
    value.readiness.actualPrivateProviderCandidatePresent !== actual ||
    value.cost.providerAttemptCostEvidenceActual !== actual
  ) {
    context.addIssue({
      code: 'custom',
      path: ['evidenceClass'],
      message: 'Candidate ingest evidence provenance cannot be promoted or relabelled.',
    })
  }
})

export type MotionStudioProviderCandidateIngestEvidenceV2 =
  z.infer<typeof motionStudioProviderCandidateIngestEvidenceV2Schema>

/** @deprecated Use the provenance-hardened V2 schema and type. */
export const motionStudioProviderCandidateIngestEvidenceV1Schema =
  motionStudioProviderCandidateIngestEvidenceV2Schema
/** @deprecated Use MotionStudioProviderCandidateIngestEvidenceV2. */
export type MotionStudioProviderCandidateIngestEvidenceV1 =
  MotionStudioProviderCandidateIngestEvidenceV2

export function createMotionStudioProviderCandidateIngestPlan(input: {
  ingestPlanId: string
  expectation: MotionStudioProviderAttemptConsumptionExpectationV1
  normalization: z.input<typeof normalizationPlanSchema>
}): MotionStudioProviderCandidateIngestPlanV1 {
  const expectation = assertExpectation(input.expectation)
  const normalization = normalizationPlanSchema.parse(input.normalization)
  const base = {
    schemaVersion: MOTION_STUDIO_PROVIDER_CANDIDATE_INGEST_PLAN_SCHEMA_VERSION,
    ingestPlanId: input.ingestPlanId,
    intent: expectation.intent,
    expectationId: expectation.expectationId,
    expectationDigest: expectation.expectationDigest,
    workspaceId: expectation.workspaceId,
    projectId: expectation.projectId,
    editSessionId: expectation.editSessionId,
    productionId: expectation.productionId,
    approvedSnapshotId: expectation.approvedSnapshotId,
    approvedSnapshotDigest: expectation.approvedSnapshotDigest,
    sourceRequestId: expectation.sourceRequestId,
    sourceRequestDigest: expectation.sourceRequestDigest,
    expectedOutputId: expectation.expectedOutputId,
    expectedOutputRole: expectation.expectedPrivateOutput.role,
    expectedMimeType: expectation.expectedPrivateOutput.mimeType,
    normalization,
    rules: {
      canonicalBackendVerifiedReceiptRequired: true as const,
      exactPrivateArtifactReadbackRequired: true as const,
      deterministicReplayRequired: true as const,
      canonicalPcmCreateOnlyPersistenceRequired: true as const,
      observedNormalizationInfrastructureCostRequiredBeforeReconciliation: true as const,
      automaticSelectionAllowed: false as const,
      finalMixAllowed: false as const,
      timelineMutationAllowed: false as const,
    },
    immutable: true as const,
  }
  return deepFreeze(motionStudioProviderCandidateIngestPlanV1Schema.parse({
    ...base,
    planDigest: sha256CanonicalJson(base),
  }))
}

type MotionStudioProviderCandidateIngestExecutionInput = {
  plan: MotionStudioProviderCandidateIngestPlanV1
  expectation: MotionStudioProviderAttemptConsumptionExpectationV1
  receipt: MotionStudioCanonicalProviderAttemptPortV1
  artifactReader: MotionStudioCanonicalProviderArtifactReader
  localStorageRoot: string
  createdAt: string
}

export async function executeMotionStudioProviderCandidateIngest(
  input: MotionStudioProviderCandidateIngestExecutionInput,
): Promise<MotionStudioProviderCandidateIngestEvidenceV2> {
  return executeMotionStudioProviderCandidateIngestForEvidenceClass(
    input,
    'canonical_backend_verified_runtime',
  )
}

export async function executeMotionStudioProviderCandidateIngestContractPathProof(
  input: MotionStudioProviderCandidateIngestExecutionInput,
): Promise<MotionStudioProviderCandidateIngestEvidenceV2> {
  return executeMotionStudioProviderCandidateIngestForEvidenceClass(
    input,
    'contract_shaped_server_path_proof_only',
  )
}

async function executeMotionStudioProviderCandidateIngestForEvidenceClass(
  input: MotionStudioProviderCandidateIngestExecutionInput,
  evidenceClass: MotionStudioProviderCandidateIngestEvidenceV2['evidenceClass'],
): Promise<MotionStudioProviderCandidateIngestEvidenceV2> {
  const plan = assertPlan(input.plan)
  const expectation = assertExpectation(input.expectation)
  const receipt = assertMotionStudioCanonicalProviderAttemptPort(input.receipt)
  assertPlanLineage(plan, expectation, receipt)
  const admission = evaluateMotionStudioProviderAttemptReceipt({ expectation, receipt })
  if (evidenceClass === 'canonical_backend_verified_runtime') {
    if (
      receipt.authorityClass !== 'canonical_backend_verified_runtime' ||
      admission.state !== 'admitted_for_private_candidate_ingest' ||
      !admission.readyForPrivateCandidateIngest || admission.blockers.length !== 0
    ) blocked('Canonical provider attempt is not admitted for private candidate ingest.')
  } else if (
    receipt.authorityClass !== 'contract_fixture' ||
    admission.state !== 'not_admitted_contract_fixture' ||
    admission.readyForPrivateCandidateIngest ||
    admission.blockers.length !== 1 ||
    admission.blockers[0] !== 'actual_canonical_backend_receipt_required'
  ) {
    blocked('Contract-path proof requires one explicit non-admitted fixture receipt.')
  }
  if (receipt.terminalOutcome.state !== 'succeeded' || receipt.cost.state !== 'complete') {
    blocked('Candidate ingest requires one succeeded and fully reconciled provider attempt.')
  }
  const createdAt = exactIso(input.createdAt)
  if (Date.parse(createdAt) < Date.parse(receipt.completedAt)) {
    invalid('Candidate ingest evidence cannot predate the canonical provider attempt.')
  }
  if (!/^\/tmp\/reeditpro-motion-studio-provider-candidate-ingest-[A-Za-z0-9._-]+$/u
    .test(input.localStorageRoot)) {
    invalid('Provider candidate ingest requires its bounded server-owned local root.')
  }

  const output = receipt.terminalOutcome.privateOutput
  const readRequest = deepFreeze({
    authorityClass: receipt.authorityClass,
    workspaceId: receipt.workspaceId,
    projectId: receipt.projectId,
    editSessionId: receipt.editSessionId,
    productionId: receipt.productionId,
    approvedSnapshotId: receipt.approvedSnapshotId,
    queueJobId: receipt.queueJobId,
    queueAttemptId: receipt.queueAttemptId,
    claimId: receipt.claimId,
    leaseId: receipt.leaseId,
    outputId: output.outputId,
    assetId: output.assetId,
    assetVersionId: output.assetVersionId,
    role: output.role,
    mimeType: output.mimeType,
    privateObjectIdentityHash: output.privateObjectIdentityHash,
    contentSha256: output.contentSha256,
    byteLength: output.byteLength,
    artifactEvidenceDigest: output.artifactEvidenceDigest,
  })
  const readback = await input.artifactReader.readExactPrivateArtifact(readRequest)
  const { bytes, ...readbackMetadataInput } = readback
  const readbackMetadata = artifactReadbackMetadataSchema.parse(readbackMetadataInput)
  assertReadback(readRequest, readbackMetadata, bytes)

  const runtimeAuthority = await readPersistedOfflineMediaBinaryRuntimeAuthority()
  if (
    !runtimeAuthority || !runtimeAuthority.readiness.privateInternalExecutionReady ||
    runtimeAuthority.readiness.productReady || runtimeAuthority.readiness.finalExportReady ||
    !runtimeAuthority.supportedRecipeProfiles.includes(plan.normalization.recipeProfileId)
  ) blocked('Canonical private FFmpeg runtime does not support the exact candidate recipe.')
  const evidenceObjectIdentityHash = sha256CanonicalJson({
    domain: 'motion_studio_provider_candidate_ingest_evidence_v2',
    evidenceClass,
    planDigest: plan.planDigest,
    receiptDigest: receipt.receiptDigest,
    admissionDigest: admission.admissionDigest,
    sourceReadbackEvidenceDigest: readbackMetadata.readbackEvidenceDigest,
    sourceContentSha256: readbackMetadata.contentSha256,
    runtimeAuthorityHash: runtimeAuthority.authorityHash,
    runtimeImageIdentityHash: runtimeAuthority.image.imageIdentityHash,
    normalizationRecipeProfileId: plan.normalization.recipeProfileId,
  })
  const persistedReplay = await readEvidence(input.localStorageRoot, evidenceObjectIdentityHash)
  if (persistedReplay) {
    assertPersistedReplay({
      evidence: persistedReplay,
      evidenceObjectIdentityHash,
      plan,
      expectation,
      receipt,
      evidenceClass,
      admissionDigest: admission.admissionDigest,
      sourceReadbackEvidenceDigest: readbackMetadata.readbackEvidenceDigest,
      runtimeAuthorityHash: runtimeAuthority.authorityHash,
      runtimeImageIdentityHash: runtimeAuthority.image.imageIdentityHash,
    })
    const replayArtifact = await readCanonicalPrivateAudioArtifact({
      localStorageRoot: input.localStorageRoot,
      privateObjectIdentityHash: persistedReplay.normalizedArtifact.privateObjectIdentityHash,
    })
    if (
      !replayArtifact || replayArtifact.sha256 !== persistedReplay.normalizedArtifact.sha256 ||
      replayArtifact.byteLength !== persistedReplay.normalizedArtifact.byteLength
    ) blocked('Persisted provider candidate replay artifact failed private checksum readback.')
    return persistedReplay
  }
  const runtime = await openPrivateOfflineMediaBinaryRuntime()
  if (runtime.image.imageIdentityHash !== runtimeAuthority.image.imageIdentityHash) {
    blocked('Canonical FFmpeg image changed after candidate-ingest authority was read.')
  }

  let normalized:
    OfflineGeneratedMusicCandidateNormalizeExecutionResult |
    OfflineSynchronizedFoleyCandidateNormalizeExecutionResult
  let replay: typeof normalized
  if (plan.normalization.intent === 'generated_music_candidate') {
    const normalizationRequest = validateOfflineGeneratedMusicCandidateNormalizeExecutionRequest({
        schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
        toolId: 'ffmpeg',
        operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
        payload: {
          recipeProfileId: OFFLINE_GENERATED_MUSIC_CANDIDATE_NORMALIZATION_PROFILE,
          mimeType: 'audio/wav',
          sourceByteLength: readbackMetadata.byteLength,
          sourceSha256: readbackMetadata.contentSha256,
          sourceBytesBase64: bytes.toString('base64'),
          outputContainer: 'wav',
          outputCodec: 'pcm_s16le',
          outputSampleRateHertz: 48_000,
          outputChannelCount: 2,
          maximumDurationMilliseconds: plan.normalization.maximumDurationMilliseconds,
          metadataPolicy: 'strip_all',
          overwriteExistingArtifact: false,
        },
      })
    normalized = await runtime.execute(normalizationRequest)
    replay = await runtime.execute(normalizationRequest)
  } else {
    const normalizationRequest = validateOfflineSynchronizedFoleyCandidateNormalizeExecutionRequest({
        schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
        toolId: 'ffmpeg',
        operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
        payload: {
          recipeProfileId: OFFLINE_SYNCHRONIZED_FOLEY_CANDIDATE_NORMALIZATION_PROFILE,
          mimeType: 'video/mp4',
          sourceByteLength: readbackMetadata.byteLength,
          sourceSha256: readbackMetadata.contentSha256,
          sourceBytesBase64: bytes.toString('base64'),
          fps: plan.normalization.fps,
          durationFrames: plan.normalization.durationFrames,
          exactOutputSampleCountPerChannel: plan.normalization.exactOutputSampleCountPerChannel,
          outputContainer: 'wav',
          outputCodec: 'pcm_s16le',
          outputSampleRateHertz: 48_000,
          outputChannelCount: 2,
          metadataPolicy: 'strip_all',
          silencePaddingAllowed: false,
          trimAtMostOneFrameOfExcessAllowed: true,
          overwriteExistingArtifact: false,
        },
      })
    normalized = await runtime.execute(normalizationRequest)
    replay = await runtime.execute(normalizationRequest)
  }
  if (
    normalized.resultArtifact.sha256 !== replay.resultArtifact.sha256 ||
    !normalized.resultArtifact.bytes.equals(replay.resultArtifact.bytes)
  ) blocked('Provider candidate normalization replay produced different committed bytes.')
  const wave = parseMotionStudioPcmWave(normalized.resultArtifact.bytes)
  assertNormalizedTiming(plan, wave)

  const normalizedPrivateObjectIdentityHash = sha256CanonicalJson({
    domain: 'motion_studio_provider_candidate_normalized_audio_v1',
    planDigest: plan.planDigest,
    receiptDigest: receipt.receiptDigest,
    sourceReadbackEvidenceDigest: readbackMetadata.readbackEvidenceDigest,
    sourceContentSha256: readbackMetadata.contentSha256,
    normalizedSha256: normalized.resultArtifact.sha256,
  })
  await persistCanonicalPrivateAudioArtifact({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: normalizedPrivateObjectIdentityHash,
    bytes: normalized.resultArtifact.bytes,
    expectedSha256: normalized.resultArtifact.sha256,
  })
  const stored = await readCanonicalPrivateAudioArtifact({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: normalizedPrivateObjectIdentityHash,
  })
  if (
    !stored || stored.sha256 !== normalized.resultArtifact.sha256 ||
    stored.byteLength !== normalized.resultArtifact.byteLength ||
    !stored.bytes.equals(normalized.resultArtifact.bytes)
  ) blocked('Normalized provider candidate changed after create-only private persistence.')

  const providerUsageEvidenceDigest = requiredDigest(receipt.cost.providerUsageEvidenceDigest)
  const providerRateCardDigest = requiredDigest(receipt.cost.providerRateCardDigest)
  const providerCostMicros = requiredMicros(receipt.cost.providerCostMicros)
  const infrastructureUsageEvidenceDigest = requiredDigest(
    receipt.cost.infrastructureUsageEvidenceDigest,
  )
  const infrastructureRateCardDigest = requiredDigest(receipt.cost.infrastructureRateCardDigest)
  const infrastructureCostMicros = requiredMicros(receipt.cost.infrastructureCostMicros)
  const attemptTotalMicros = requiredMicros(receipt.cost.totalInternalProductionCostMicros)
  const sourceArtifact = readbackMetadata
  const actualProviderEvidence = evidenceClass === 'canonical_backend_verified_runtime'
  const base = {
    schemaVersion: MOTION_STUDIO_PROVIDER_CANDIDATE_INGEST_EVIDENCE_SCHEMA_VERSION,
    evidenceId: `ms012d-provider-candidate-ingest-${evidenceObjectIdentityHash.slice(0, 28)}`,
    evidenceClass,
    state: actualProviderEvidence
      ? 'actual_private_candidate_normalized_objective_qa_pending' as const
      : 'contract_path_private_candidate_normalized_objective_qa_test_only' as const,
    createdAt,
    ingestPlanId: plan.ingestPlanId,
    ingestPlanDigest: plan.planDigest,
    expectationId: expectation.expectationId,
    expectationDigest: expectation.expectationDigest,
    canonicalReceiptDigest: receipt.receiptDigest,
    admissionDigest: admission.admissionDigest,
    intent: receipt.intent,
    workspaceId: receipt.workspaceId,
    projectId: receipt.projectId,
    editSessionId: receipt.editSessionId,
    productionId: receipt.productionId,
    approvedSnapshotId: receipt.approvedSnapshotId,
    approvedSnapshotDigest: receipt.approvedSnapshotDigest,
    providerAttempt: {
      approvedPackageId: receipt.approvedPackageId,
      approvedPackageDigest: receipt.approvedPackageDigest,
      approvedWorkItemId: receipt.approvedWorkItemId,
      queueJobId: receipt.queueJobId,
      queueAttemptId: receipt.queueAttemptId,
      claimId: receipt.claimId,
      leaseId: receipt.leaseId,
      idempotencyKeyHash: receipt.idempotencyKeyHash,
      providerOperationId: receipt.providerOperationId,
      providerRouteId: receipt.providerRouteId,
      providerModelId: receipt.providerModelId,
      sourceRequestId: receipt.sourceRequestId,
      sourceRequestDigest: receipt.sourceRequestDigest,
      providerRequestPayloadDigest: receipt.providerRequestPayloadDigest,
      projectDataPolicyDigest: receipt.projectDataPolicyDigest,
      providerAccountPolicyDigest: receipt.providerAccountPolicyDigest,
      providerResponseUsageDigest: requiredDigest(
        receipt.terminalOutcome.providerResponseUsageDigest,
      ),
      oneUseDispatchEvidenceDigest: receipt.oneUseDispatchEvidenceDigest,
      terminalEvidenceDigest: receipt.terminalOutcome.terminalEvidenceDigest,
    },
    sourceArtifact,
    normalization: {
      canonicalOperationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
      recipeProfileId: plan.normalization.recipeProfileId,
      runtimeAuthorityHash: runtimeAuthority.authorityHash,
      runtimeImageIdentityHash: runtime.image.imageIdentityHash,
      requestEnvelopeSha256: normalized.evidence.requestEnvelopeSha256,
      normalizationAttestationDigest: normalized.attestation.attestationHash,
      deterministicReplayVerified: true as const,
    },
    normalizedArtifact: {
      privateObjectIdentityHash: normalizedPrivateObjectIdentityHash,
      mimeType: 'audio/wav' as const,
      codec: 'pcm_s16le' as const,
      sampleRateHertz: 48_000 as const,
      channelCount: 2 as const,
      bitsPerSample: 16 as const,
      sampleCountPerChannel: wave.sampleCountPerChannel,
      durationMilliseconds: wave.durationMilliseconds,
      byteLength: stored.byteLength,
      sha256: stored.sha256,
      privateCreateOnlyReadbackVerified: true as const,
    },
    cost: {
      providerUsageEvidenceDigest,
      providerRateCardDigest,
      providerCostMicros,
      providerWorkerInfrastructureUsageEvidenceDigest: infrastructureUsageEvidenceDigest,
      providerWorkerInfrastructureRateCardDigest: infrastructureRateCardDigest,
      providerWorkerInfrastructureCostMicros: infrastructureCostMicros,
      providerAttemptTotalInternalProductionCostMicros: attemptTotalMicros,
      providerAttemptCostEvidenceDigest: receipt.cost.costEvidenceDigest,
      providerAttemptCostEvidenceActual: actualProviderEvidence,
      normalizationInfrastructureCostState: 'canonical_observed_resource_evidence_required' as const,
      normalizationInfrastructureCostMicros: null,
      fullCandidateCostReconciled: false as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletMutationPerformed: false as const,
      billingMutationPerformed: false as const,
    },
    readiness: {
      contractPathProofOnly: !actualProviderEvidence,
      actualPrivateProviderCandidatePresent: actualProviderEvidence,
      exactProviderArtifactReadbackVerified: true as const,
      canonicalPcmNormalizationComplete: true as const,
      readyForObjectiveQa: true as const,
      actualCandidateObjectiveQaComplete: false as const,
      semanticRightsAndHumanReviewComplete: false as const,
      fullCandidateCostReconciled: false as const,
      readyForHumanReview: false as const,
      selectionEligible: false as const,
      finalMixEligible: false as const,
      timelineEligible: false as const,
      ms012dAccepted: false as const,
      productReady: false as const,
    },
    sideEffects: {
      privateArtifactReadCount: 1 as const,
      secretPayloadReadCountByIngestPort: 0 as const,
      providerSubmissionCountByIngestPort: 0 as const,
      normalizedPrivateArtifactWriteCount: 1 as const,
      evidenceRecordWriteCount: 1 as const,
      selectionCount: 0 as const,
      finalMixMutationCount: 0 as const,
      timelineMutationCount: 0 as const,
      renderCount: 0 as const,
      exportCount: 0 as const,
      remoteMutationCount: 0 as const,
    },
    persistence: {
      privateLocalOnly: true as const,
      createOnly: true as const,
      evidenceRecordPersisted: true as const,
      providerUrlPersisted: false as const,
      localPathProjected: false as const,
      evidenceObjectIdentityHash,
    },
    immutable: true as const,
  }
  const evidence = deepFreeze(motionStudioProviderCandidateIngestEvidenceV2Schema.parse({
    ...base,
    evidenceDigest: sha256CanonicalJson(base),
  }))
  await persistEvidence(input.localStorageRoot, evidence)
  return evidence
}

export function assertMotionStudioProviderCandidateIngestEvidence(
  input: MotionStudioProviderCandidateIngestEvidenceV2,
): void {
  const parsed = motionStudioProviderCandidateIngestEvidenceV2Schema.parse(input)
  const base = { ...parsed } as Record<string, unknown>
  delete base.evidenceDigest
  if (
    sha256CanonicalJson(base) !== parsed.evidenceDigest ||
    parsed.readiness.actualCandidateObjectiveQaComplete ||
    parsed.readiness.semanticRightsAndHumanReviewComplete ||
    parsed.readiness.fullCandidateCostReconciled || parsed.readiness.readyForHumanReview ||
    parsed.readiness.selectionEligible || parsed.readiness.finalMixEligible ||
    parsed.readiness.timelineEligible || parsed.readiness.ms012dAccepted ||
    parsed.readiness.productReady || parsed.sideEffects.selectionCount !== 0 ||
    parsed.sideEffects.finalMixMutationCount !== 0 || parsed.sideEffects.timelineMutationCount !== 0 ||
    parsed.sideEffects.renderCount !== 0 || parsed.sideEffects.exportCount !== 0 ||
    parsed.sideEffects.remoteMutationCount !== 0
  ) blocked('Provider candidate ingest evidence crossed its immutable QA, cost or promotion boundary.')
}

function assertPlan(input: MotionStudioProviderCandidateIngestPlanV1) {
  const parsed = motionStudioProviderCandidateIngestPlanV1Schema.parse(input)
  const base = { ...parsed } as Record<string, unknown>
  delete base.planDigest
  if (sha256CanonicalJson(base) !== parsed.planDigest) {
    blocked('Provider candidate ingest plan failed immutable digest verification.')
  }
  return deepFreeze(parsed)
}

function assertExpectation(input: MotionStudioProviderAttemptConsumptionExpectationV1) {
  const parsed = motionStudioProviderAttemptConsumptionExpectationV1Schema.parse(input)
  const base = { ...parsed } as Record<string, unknown>
  delete base.expectationDigest
  if (sha256CanonicalJson(base) !== parsed.expectationDigest) {
    blocked('Provider candidate ingest expectation failed immutable digest verification.')
  }
  return deepFreeze(parsed)
}

function assertPlanLineage(
  plan: MotionStudioProviderCandidateIngestPlanV1,
  expectation: MotionStudioProviderAttemptConsumptionExpectationV1,
  receipt: MotionStudioCanonicalProviderAttemptPortV1,
): void {
  if (
    plan.expectationId !== expectation.expectationId ||
    plan.expectationDigest !== expectation.expectationDigest ||
    plan.intent !== expectation.intent || plan.intent !== receipt.intent ||
    plan.workspaceId !== expectation.workspaceId || plan.workspaceId !== receipt.workspaceId ||
    plan.projectId !== expectation.projectId || plan.projectId !== receipt.projectId ||
    plan.editSessionId !== expectation.editSessionId ||
    plan.editSessionId !== receipt.editSessionId ||
    plan.productionId !== expectation.productionId || plan.productionId !== receipt.productionId ||
    plan.approvedSnapshotId !== expectation.approvedSnapshotId ||
    plan.approvedSnapshotId !== receipt.approvedSnapshotId ||
    plan.approvedSnapshotDigest !== expectation.approvedSnapshotDigest ||
    plan.approvedSnapshotDigest !== receipt.approvedSnapshotDigest ||
    plan.sourceRequestId !== expectation.sourceRequestId ||
    plan.sourceRequestId !== receipt.sourceRequestId ||
    plan.sourceRequestDigest !== expectation.sourceRequestDigest ||
    plan.sourceRequestDigest !== receipt.sourceRequestDigest ||
    plan.expectedOutputId !== expectation.expectedOutputId ||
    plan.expectedOutputId !== receipt.expectedOutputId ||
    plan.expectedOutputRole !== expectation.expectedPrivateOutput.role ||
    plan.expectedMimeType !== expectation.expectedPrivateOutput.mimeType
  ) blocked('Provider candidate ingest must preserve exact plan, expectation and receipt lineage.')
}

function assertReadback(
  expected: Readonly<Record<string, unknown>>,
  actual: z.infer<typeof artifactReadbackMetadataSchema>,
  bytes: Buffer,
): void {
  if (!Buffer.isBuffer(bytes) || bytes.byteLength !== actual.byteLength || sha256(bytes) !== actual.contentSha256) {
    blocked('Canonical private provider artifact bytes failed checksum readback.')
  }
  for (const [key, value] of Object.entries(expected)) {
    if (actual[key as keyof typeof actual] !== value) {
      blocked('Canonical private provider artifact readback changed exact identity or lineage.')
    }
  }
  const expectedReadbackDigest = sha256CanonicalJson({
    domain: 'motion_studio_canonical_provider_artifact_readback_v1',
    ...expected,
  })
  if (actual.readbackEvidenceDigest !== expectedReadbackDigest) {
    blocked('Canonical private provider artifact readback evidence digest is invalid.')
  }
  if (
    (actual.mimeType === 'audio/wav' && !isWave(bytes)) ||
    (actual.mimeType === 'video/mp4' && !isMp4(bytes))
  ) blocked('Canonical private provider artifact media signature does not match its exact role.')
}

function assertNormalizedTiming(
  plan: MotionStudioProviderCandidateIngestPlanV1,
  wave: ReturnType<typeof parseMotionStudioPcmWave>,
): void {
  if (wave.sampleRateHertz !== 48_000 || wave.channelCount !== 2) {
    blocked('Provider candidate normalization changed the canonical PCM format.')
  }
  if (plan.normalization.intent === 'generated_music_candidate') {
    if (
      Math.abs(wave.durationMilliseconds - plan.normalization.expectedDurationMilliseconds) >
        plan.normalization.maximumDurationDriftMilliseconds
    ) blocked('Generated-music candidate normalization changed the approved cue duration.')
    return
  }
  if (wave.sampleCountPerChannel !== plan.normalization.exactOutputSampleCountPerChannel) {
    blocked('Synchronized-Foley candidate normalization changed frame-derived sample authority.')
  }
}

async function persistEvidence(
  root: string,
  evidence: MotionStudioProviderCandidateIngestEvidenceV2,
): Promise<void> {
  const identity = evidence.persistence.evidenceObjectIdentityHash
  const relativePath = `motion-studio/provider-candidate-ingest/${identity.slice(0, 2)}/${identity}.json`
  const bytes = Buffer.from(`${stableAuthorityStringify(evidence)}\n`, 'utf8')
  await writePrivateFileCreateOnlyWithinRoot({ rootPath: root, relativePath, content: bytes })
  const stored = await readPrivateFileIfExistsWithinRoot({ rootPath: root, relativePath })
  if (!stored || !stored.equals(bytes)) {
    blocked('Provider candidate ingest evidence changed after create-only persistence.')
  }
}

async function readEvidence(
  root: string,
  evidenceObjectIdentityHash: string,
): Promise<MotionStudioProviderCandidateIngestEvidenceV2 | null> {
  const relativePath =
    `motion-studio/provider-candidate-ingest/${evidenceObjectIdentityHash.slice(0, 2)}/` +
    `${evidenceObjectIdentityHash}.json`
  const stored = await readPrivateFileIfExistsWithinRoot({ rootPath: root, relativePath })
  if (!stored) return null
  let decoded: unknown
  try {
    decoded = JSON.parse(stored.toString('utf8'))
  } catch {
    blocked('Persisted provider candidate ingest evidence is not canonical JSON.')
  }
  const evidence = deepFreeze(motionStudioProviderCandidateIngestEvidenceV2Schema.parse(decoded))
  assertMotionStudioProviderCandidateIngestEvidence(evidence)
  return evidence
}

function assertPersistedReplay(input: {
  evidence: MotionStudioProviderCandidateIngestEvidenceV2
  evidenceObjectIdentityHash: string
  plan: MotionStudioProviderCandidateIngestPlanV1
  expectation: MotionStudioProviderAttemptConsumptionExpectationV1
  receipt: MotionStudioCanonicalProviderAttemptPortV1
  evidenceClass: MotionStudioProviderCandidateIngestEvidenceV2['evidenceClass']
  admissionDigest: string
  sourceReadbackEvidenceDigest: string
  runtimeAuthorityHash: string
  runtimeImageIdentityHash: string
}): void {
  const evidence = input.evidence
  if (
    evidence.persistence.evidenceObjectIdentityHash !== input.evidenceObjectIdentityHash ||
    evidence.ingestPlanId !== input.plan.ingestPlanId ||
    evidence.ingestPlanDigest !== input.plan.planDigest ||
    evidence.expectationId !== input.expectation.expectationId ||
    evidence.expectationDigest !== input.expectation.expectationDigest ||
    evidence.canonicalReceiptDigest !== input.receipt.receiptDigest ||
    evidence.evidenceClass !== input.evidenceClass ||
    evidence.admissionDigest !== input.admissionDigest ||
    evidence.intent !== input.plan.intent ||
    evidence.sourceArtifact.readbackEvidenceDigest !== input.sourceReadbackEvidenceDigest ||
    evidence.normalization.runtimeAuthorityHash !== input.runtimeAuthorityHash ||
    evidence.normalization.runtimeImageIdentityHash !== input.runtimeImageIdentityHash ||
    evidence.normalization.recipeProfileId !== input.plan.normalization.recipeProfileId
  ) blocked('Persisted provider candidate ingest evidence changed exact replay authority.')
}

function requiredDigest(value: string | null): string {
  if (!value || !/^[a-f0-9]{64}$/u.test(value)) {
    blocked('Provider candidate ingest requires complete attempt cost evidence.')
  }
  return value
}

function requiredMicros(value: number | null): number {
  if (!Number.isSafeInteger(value) || value === null || value < 0) {
    blocked('Provider candidate ingest requires complete integer USD-micro attempt cost.')
  }
  return value
}

function exactIso(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    invalid('Provider candidate ingest requires a canonical UTC timestamp.')
  }
  return value
}

function isWave(bytes: Buffer): boolean {
  return bytes.byteLength >= 44 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
    bytes.subarray(8, 12).toString('ascii') === 'WAVE'
}

function isMp4(bytes: Buffer): boolean {
  return bytes.byteLength >= 32 && bytes.subarray(4, 8).toString('ascii') === 'ftyp'
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

function invalid(message: string): never {
  throw new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): never {
  throw new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'motion_studio_provider_candidate_private_ingest',
  })
}
