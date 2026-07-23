import { createHash } from 'node:crypto'

import { z } from 'zod'

import type { MotionStudioMusicFoleyCandidateRequestV1 } from '../../../src/types/motion-studio'
import { motionStudioMusicFoleyCandidateRequestV1Schema } from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import { readCanonicalPrivateAudioArtifact } from '../../services/canonical-private-audio-artifact-storage'
import { stableAuthorityStringify } from '../../services/private-edit-authority-store'
import {
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_PROTOCOL,
  openPrivateOfflineMediaBinaryRuntime,
  readPersistedOfflineMediaBinaryRuntimeAuthority,
} from '../../tool-execution/media-binary-execution'
import {
  MOTION_STUDIO_SYNCHRONIZED_FOLEY_OBJECTIVE_QA_PROFILE,
  analyzeMotionStudioSynchronizedFoleyObjectiveCandidate,
} from '../foley-production/synchronized-foley-objective-qa-readiness'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioProviderCandidateIngestEvidence,
  MOTION_STUDIO_PROVIDER_CANDIDATE_EVIDENCE_CLASSES,
  motionStudioProviderCandidateIngestEvidenceV2Schema,
  type MotionStudioProviderCandidateIngestEvidenceV2,
} from './canonical-provider-candidate-ingest'
import { parseMotionStudioPcmWave } from './pcm-wave'

export const MOTION_STUDIO_PROVIDER_CANDIDATE_OBJECTIVE_QA_SCHEMA_VERSION =
  'motion-studio.provider-candidate-objective-qa.v2' as const
export const MOTION_STUDIO_GENERATED_MUSIC_OBJECTIVE_QA_PROFILE =
  'motion_studio_generated_music_actual_candidate_objective_qa_v1' as const

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const isoDateSchema = z.string().datetime({ offset: true })
const evidenceClassSchema = z.enum(MOTION_STUDIO_PROVIDER_CANDIDATE_EVIDENCE_CLASSES)
const fpsSchema = z.union([z.literal(24), z.literal(30)])
const frameRangeSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrame: z.number().int().positive(),
}).strict().refine((value) => value.endFrame > value.startFrame)

const musicObjectiveGates = [
  'canonical_candidate_lineage',
  'provider_attempt_and_cost_lineage',
  'normalization_lineage',
  'private_audio_integrity',
  'format_and_duration',
  'non_silent_signal',
  'sample_peak_and_clipping',
  'ebu_r128_measurement',
  'private_create_only_readback',
  'deterministic_replay',
] as const
const musicReviewGates = [
  'creative_cue_and_picture_fit',
  'originality_and_no_copy',
  'musical_continuity',
  'speech_safety_and_loudness',
  'candidate_rights_and_provenance',
  'human_listening_review',
] as const
const foleyObjectiveGates = [
  'canonical_candidate_lineage',
  'provider_attempt_and_cost_lineage',
  'normalization_lineage',
  'request_integrity',
  'source_video_binding',
  'private_audio_integrity',
  'format_and_duration',
  'non_silent_signal',
  'transient_detection',
  'expected_event_coverage',
  'frame_alignment',
  'unplanned_event_control',
  'sample_peak_and_clipping',
  'speech_window_energy',
  'private_create_only_readback',
  'deterministic_replay',
] as const
const foleyReviewGates = [
  'visible_event_semantics',
  'forbidden_content_semantics',
  'room_and_style_fit',
  'candidate_rights_and_provenance',
  'human_listening_review',
] as const
const allGateNames = [
  ...new Set([
    ...musicObjectiveGates,
    ...musicReviewGates,
    ...foleyObjectiveGates,
    ...foleyReviewGates,
  ]),
] as [string, ...string[]]

const gateResultSchema = z.object({
  gate: z.enum(allGateNames),
  class: z.enum(['objective', 'semantic_rights_or_human']),
  result: z.enum(['passed', 'not_evaluated']),
  blocking: z.literal(true),
  evidenceDigest: digestSchema,
  note: z.string().trim().min(1).max(500),
}).strict()

const musicRequestAuthoritySchema = z.object({
  intent: z.literal('generated_music_candidate'),
  requestId: stableIdSchema,
  requestDigest: digestSchema,
  approvedSnapshotId: stableIdSchema,
  approvedSnapshotDigest: digestSchema,
  approvedWorkItemId: stableIdSchema,
  idempotencyKeyHash: digestSchema,
  musicBibleArtifactVersionId: stableIdSchema,
  musicBibleContentDigest: digestSchema,
  cueId: stableIdSchema,
  pictureLockArtifactVersionId: stableIdSchema,
  pictureLockContentDigest: digestSchema,
  timingAuthorityDigest: digestSchema,
  range: frameRangeSchema,
  fps: fpsSchema,
  durationFrames: z.number().int().positive().max(900),
}).strict()

const foleyRequestAuthoritySchema = z.object({
  intent: z.literal('synchronized_foley_candidate'),
  requestId: stableIdSchema,
  requestDigest: digestSchema,
  approvedSnapshotId: stableIdSchema,
  approvedSnapshotDigest: digestSchema,
  approvedWorkItemId: stableIdSchema,
  idempotencyKeyHash: digestSchema,
  soundEventId: stableIdSchema,
  sourceVideoAssetVersionId: stableIdSchema,
  sourceVideoContentDigest: digestSchema,
  pictureLockArtifactVersionId: stableIdSchema,
  pictureLockContentDigest: digestSchema,
  timingAuthorityDigest: digestSchema,
  range: frameRangeSchema,
  fps: fpsSchema,
  durationFrames: z.number().int().positive().max(900),
  expectedHitFrames: z.array(z.number().int().nonnegative()).min(1).max(16).readonly(),
  speechFrameRanges: z.array(frameRangeSchema).max(32).readonly(),
}).strict()

export const motionStudioProviderCandidateRequestAuthoritySchema = z.discriminatedUnion('intent', [
  musicRequestAuthoritySchema,
  foleyRequestAuthoritySchema,
])
const requestAuthoritySchema = motionStudioProviderCandidateRequestAuthoritySchema

export type MotionStudioProviderCandidateRequestAuthority =
  z.infer<typeof motionStudioProviderCandidateRequestAuthoritySchema>

const musicAnalysisSchema = z.object({
  intent: z.literal('generated_music_candidate'),
  profileId: z.literal(MOTION_STUDIO_GENERATED_MUSIC_OBJECTIVE_QA_PROFILE),
  sampleRateHertz: z.literal(48_000),
  channelCount: z.literal(2),
  bitsPerSample: z.literal(16),
  sampleCountPerChannel: z.number().int().positive().max(1_440_000),
  durationMilliseconds: z.number().int().positive().max(30_000),
  rmsDbfs: z.number().finite().max(0),
  samplePeakDbfs: z.number().finite().max(-1),
  clippingSampleCount: z.literal(0),
  integratedLufs: z.number().finite(),
  loudnessRangeLu: z.number().finite().nonnegative(),
  truePeakDbfs: z.number().finite().max(0),
  measurementAttestationDigest: digestSchema,
  measurementResultDigest: digestSchema,
  analysisDigest: digestSchema,
  deterministicReplayVerified: z.literal(true),
}).strict()

const bestUsableTrimSchema = z.object({
  candidateStartFrame: z.number().int().nonnegative(),
  candidateHitFrame: z.number().int().nonnegative(),
  candidateEndFrame: z.number().int().positive(),
  hitOffsetInsideTrimFrames: z.number().int().nonnegative(),
  placementCorrectionFrames: z.number().int(),
  fadeInFrames: z.literal(1),
  fadeOutFrames: z.literal(2),
  timelineStartFrame: z.number().int(),
  timelineHitFrame: z.number().int().nonnegative(),
  timelineEndFrame: z.number().int(),
}).strict()

const foleyAnalysisSchema = z.object({
  intent: z.literal('synchronized_foley_candidate'),
  profileId: z.literal(MOTION_STUDIO_SYNCHRONIZED_FOLEY_OBJECTIVE_QA_PROFILE),
  sampleRateHertz: z.literal(48_000),
  channelCount: z.literal(2),
  bitsPerSample: z.literal(16),
  sampleCountPerChannel: z.number().int().positive().max(1_440_000),
  durationMilliseconds: z.number().int().positive().max(30_000),
  durationFrames: z.number().int().positive().max(900),
  overallRmsDbfs: z.number().finite().max(0),
  samplePeakDbfs: z.number().finite().max(-1),
  clippingSampleCount: z.literal(0),
  adaptiveTransientThresholdDbfs: z.number().finite().max(0),
  detectedTransientFrames: z.array(z.number().int().nonnegative()).min(1).max(64).readonly(),
  expectedHitCount: z.number().int().positive().max(16),
  maximumAbsoluteAlignmentOffsetFrames: z.number().int().min(0).max(2),
  unplannedTransientCount: z.literal(0),
  speechWindowRawRmsDbfs: z.number().finite().nullable(),
  speechWindowProjectedMixRmsDbfs: z.number().finite().max(-30).nullable(),
  bestUsableTrim: bestUsableTrimSchema,
  analysisDigest: digestSchema,
  deterministicReplayVerified: z.literal(true),
}).strict()

const analysisSchema = z.discriminatedUnion('intent', [musicAnalysisSchema, foleyAnalysisSchema])

export const motionStudioProviderCandidateObjectiveQaV2Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_PROVIDER_CANDIDATE_OBJECTIVE_QA_SCHEMA_VERSION),
  evidenceId: stableIdSchema,
  evidenceClass: evidenceClassSchema,
  state: z.enum([
    'contract_path_objective_qa_proven_non_promotable',
    'actual_private_candidate_objective_qa_complete_review_evidence_pending',
  ]),
  createdAt: isoDateSchema,
  intent: z.enum(['generated_music_candidate', 'synchronized_foley_candidate']),
  workspaceId: stableIdSchema,
  projectId: stableIdSchema,
  editSessionId: stableIdSchema,
  productionId: stableIdSchema,
  approvedSnapshotId: stableIdSchema,
  approvedSnapshotDigest: digestSchema,
  sourceIngestEvidenceId: stableIdSchema,
  sourceIngestEvidenceDigest: digestSchema,
  canonicalReceiptDigest: digestSchema,
  requestAuthority: requestAuthoritySchema,
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
    providerRequestPayloadDigest: digestSchema,
    projectDataPolicyDigest: digestSchema,
    providerAccountPolicyDigest: digestSchema,
    providerResponseUsageDigest: digestSchema,
    oneUseDispatchEvidenceDigest: digestSchema,
    terminalEvidenceDigest: digestSchema,
  }).strict(),
  candidate: z.object({
    privateObjectIdentityHash: digestSchema,
    mimeType: z.literal('audio/wav'),
    codec: z.literal('pcm_s16le'),
    sampleRateHertz: z.literal(48_000),
    channelCount: z.literal(2),
    bitsPerSample: z.literal(16),
    sampleCountPerChannel: z.number().int().positive().max(1_440_000),
    durationMilliseconds: z.number().int().positive().max(30_000),
    byteLength: z.number().int().min(44).max(24 * 1024 * 1024),
    sha256: digestSchema,
    privateCreateOnlyReadbackVerified: z.literal(true),
  }).strict(),
  normalization: z.object({
    canonicalOperationId: z.literal(OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg),
    recipeProfileId: z.enum([
      'approved_generated_music_candidate_normalization_v1',
      'approved_synchronized_foley_candidate_normalization_v1',
    ]),
    runtimeAuthorityHash: digestSchema,
    runtimeImageIdentityHash: digestSchema,
    normalizationAttestationDigest: digestSchema,
    deterministicReplayVerified: z.literal(true),
  }).strict(),
  analysis: analysisSchema,
  qa: z.object({
    gateResults: z.array(gateResultSchema).min(16).max(21).readonly(),
    objectiveGateCount: z.number().int().min(10).max(16),
    pendingSemanticRightsAndHumanGateCount: z.number().int().min(5).max(6),
    objectiveQaPassed: z.literal(true),
    actualProviderCandidateQaComplete: z.boolean(),
    semanticAndCreativeEvidenceComplete: z.literal(false),
    rightsAndProvenanceReviewComplete: z.literal(false),
    humanReviewComplete: z.literal(false),
    readyForEvidenceCollection: z.boolean(),
    readyForHumanReview: z.literal(false),
    selectionEligible: z.literal(false),
    finalMixEligible: z.literal(false),
    timelineEligible: z.literal(false),
    qaDigest: digestSchema,
  }).strict(),
  cost: z.object({
    providerCostMicros: z.number().int().min(0),
    providerWorkerInfrastructureCostMicros: z.number().int().min(0),
    providerAttemptTotalInternalProductionCostMicros: z.number().int().min(0),
    providerAttemptCostEvidenceDigest: digestSchema,
    providerAttemptCostEvidenceActual: z.boolean(),
    normalizationInfrastructureCostState: z.literal('canonical_observed_resource_evidence_required'),
    normalizationInfrastructureCostMicros: z.null(),
    objectiveQaInfrastructureCostState: z.literal('canonical_observed_resource_evidence_required'),
    objectiveQaInfrastructureCostMicros: z.null(),
    fullCandidateCostReconciled: z.literal(false),
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletMutationPerformed: z.literal(false),
    billingMutationPerformed: z.literal(false),
  }).strict(),
  persistence: z.object({
    privateLocalOnly: z.literal(true),
    createOnly: z.literal(true),
    evidenceRecordPersisted: z.literal(true),
    providerUrlPersisted: z.literal(false),
    localPathProjected: z.literal(false),
    evidenceObjectIdentityHash: digestSchema,
  }).strict(),
  sideEffects: z.object({
    privateArtifactReadCount: z.literal(1),
    providerSubmissionCountByQa: z.literal(0),
    secretPayloadReadCountByQa: z.literal(0),
    objectiveQaEvidenceWriteCount: z.literal(1),
    semanticReviewDecisionCount: z.literal(0),
    humanReviewDecisionCount: z.literal(0),
    selectionCount: z.literal(0),
    finalMixMutationCount: z.literal(0),
    timelineMutationCount: z.literal(0),
    renderCount: z.literal(0),
    exportCount: z.literal(0),
    remoteMutationCount: z.literal(0),
  }).strict(),
  readiness: z.object({
    contractPathProofOnly: z.boolean(),
    actualPrivateProviderCandidatePresent: z.boolean(),
    canonicalProviderAttemptAuthorityPresent: z.boolean(),
    deterministicObjectiveQaPathProven: z.literal(true),
    objectiveQaComplete: z.boolean(),
    semanticRightsAndHumanReviewsComplete: z.literal(false),
    readyForSelectionDecision: z.literal(false),
    ms012dAccepted: z.literal(false),
    productReady: z.literal(false),
  }).strict(),
  immutable: z.literal(true),
  evidenceDigest: digestSchema,
}).strict().superRefine((value, context) => {
  const actual = value.evidenceClass === 'canonical_backend_verified_runtime'
  const expectedState = actual
    ? 'actual_private_candidate_objective_qa_complete_review_evidence_pending'
    : 'contract_path_objective_qa_proven_non_promotable'
  if (
    value.state !== expectedState ||
    value.qa.actualProviderCandidateQaComplete !== actual ||
    value.qa.readyForEvidenceCollection !== actual ||
    value.readiness.contractPathProofOnly !== !actual ||
    value.readiness.actualPrivateProviderCandidatePresent !== actual ||
    value.readiness.canonicalProviderAttemptAuthorityPresent !== actual ||
    value.readiness.objectiveQaComplete !== actual ||
    value.cost.providerAttemptCostEvidenceActual !== actual
  ) {
    context.addIssue({
      code: 'custom',
      path: ['evidenceClass'],
      message: 'Candidate objective-QA provenance cannot be promoted or relabelled.',
    })
  }
  if (value.intent !== value.requestAuthority.intent || value.intent !== value.analysis.intent) {
    context.addIssue({ code: 'custom', path: ['intent'], message: 'Candidate QA intent must match request and analysis.' })
    return
  }
  const objective = value.intent === 'generated_music_candidate'
    ? musicObjectiveGates
    : foleyObjectiveGates
  const pending = value.intent === 'generated_music_candidate' ? musicReviewGates : foleyReviewGates
  const expected = [...objective, ...pending]
  if (
    value.qa.gateResults.map((entry) => entry.gate).join('|') !== expected.join('|') ||
    value.qa.objectiveGateCount !== objective.length ||
    value.qa.pendingSemanticRightsAndHumanGateCount !== pending.length
  ) {
    context.addIssue({ code: 'custom', path: ['qa', 'gateResults'], message: 'Candidate QA gates must preserve the exact intent-specific order.' })
  }
  value.qa.gateResults.forEach((entry, index) => {
    const shouldPass = index < objective.length
    if (
      entry.class !== (shouldPass ? 'objective' : 'semantic_rights_or_human') ||
      entry.result !== (shouldPass ? 'passed' : 'not_evaluated')
    ) {
      context.addIssue({ code: 'custom', path: ['qa', 'gateResults', index], message: 'Candidate QA result crossed its objective/review boundary.' })
    }
  })
})

export type MotionStudioProviderCandidateObjectiveQaV2 =
  z.infer<typeof motionStudioProviderCandidateObjectiveQaV2Schema>

/** @deprecated Use the provenance-hardened V2 schema and type. */
export const motionStudioProviderCandidateObjectiveQaV1Schema =
  motionStudioProviderCandidateObjectiveQaV2Schema
/** @deprecated Use MotionStudioProviderCandidateObjectiveQaV2. */
export type MotionStudioProviderCandidateObjectiveQaV1 =
  MotionStudioProviderCandidateObjectiveQaV2

export async function executeMotionStudioProviderCandidateObjectiveQa(input: {
  ingestEvidence: MotionStudioProviderCandidateIngestEvidenceV2
  request: MotionStudioMusicFoleyCandidateRequestV1
  fps: 24 | 30
  expectedHitFrames?: readonly number[]
  speechFrameRanges?: readonly { startFrame: number; endFrame: number }[]
  localStorageRoot: string
  createdAt: string
}): Promise<MotionStudioProviderCandidateObjectiveQaV2> {
  assertMotionStudioProviderCandidateIngestEvidence(input.ingestEvidence)
  const ingest = motionStudioProviderCandidateIngestEvidenceV2Schema.parse(input.ingestEvidence)
  const request = motionStudioMusicFoleyCandidateRequestV1Schema.parse(input.request) as
    MotionStudioMusicFoleyCandidateRequestV1
  const createdAt = exactIso(input.createdAt)
  if (Date.parse(createdAt) < Date.parse(ingest.createdAt)) {
    invalid('Candidate objective QA cannot predate private candidate ingest.')
  }
  if (!/^\/tmp\/reeditpro-motion-studio-provider-candidate-ingest-[A-Za-z0-9._-]+$/u
    .test(input.localStorageRoot)) {
    invalid('Candidate objective QA requires the exact bounded private-ingest root.')
  }
  if (
    !ingest.readiness.readyForObjectiveQa ||
    ingest.readiness.actualCandidateObjectiveQaComplete ||
    ingest.readiness.selectionEligible || ingest.readiness.finalMixEligible ||
    ingest.readiness.timelineEligible
  ) blocked('Candidate objective QA requires the exact normalized, unreviewed ingest state.')

  const requestDigest = sha256CanonicalJson(request)
  assertRequestLineage({ ingest, request, requestDigest, fps: input.fps })
  const requestAuthority = createRequestAuthority({
    request,
    requestDigest,
    fps: input.fps,
    expectedHitFrames: input.expectedHitFrames,
    speechFrameRanges: input.speechFrameRanges,
  })
  const stored = await readCanonicalPrivateAudioArtifact({
    localStorageRoot: input.localStorageRoot,
    privateObjectIdentityHash: ingest.normalizedArtifact.privateObjectIdentityHash,
  })
  if (
    !stored || stored.sha256 !== ingest.normalizedArtifact.sha256 ||
    stored.byteLength !== ingest.normalizedArtifact.byteLength
  ) blocked('Candidate objective QA private artifact failed exact checksum readback.')
  const wave = parseMotionStudioPcmWave(stored.bytes)
  if (
    wave.sampleRateHertz !== ingest.normalizedArtifact.sampleRateHertz ||
    wave.channelCount !== ingest.normalizedArtifact.channelCount ||
    wave.bitsPerSample !== ingest.normalizedArtifact.bitsPerSample ||
    wave.sampleCountPerChannel !== ingest.normalizedArtifact.sampleCountPerChannel ||
    wave.durationMilliseconds !== ingest.normalizedArtifact.durationMilliseconds
  ) blocked('Candidate objective QA private artifact changed canonical PCM facts.')

  const runtimeAuthority = await readPersistedOfflineMediaBinaryRuntimeAuthority()
  if (
    !runtimeAuthority || !runtimeAuthority.readiness.privateInternalExecutionReady ||
    runtimeAuthority.authorityHash !== ingest.normalization.runtimeAuthorityHash ||
    runtimeAuthority.image.imageIdentityHash !== ingest.normalization.runtimeImageIdentityHash ||
    runtimeAuthority.readiness.productReady || runtimeAuthority.readiness.finalExportReady
  ) blocked('Candidate objective QA requires the exact private runtime authority used at normalization.')

  const evidenceObjectIdentityHash = sha256CanonicalJson({
    domain: 'motion_studio_provider_candidate_objective_qa_v2',
    evidenceClass: ingest.evidenceClass,
    sourceIngestEvidenceDigest: ingest.evidenceDigest,
    requestDigest,
    requestAuthority,
    normalizedArtifactSha256: stored.sha256,
    runtimeAuthorityHash: runtimeAuthority.authorityHash,
  })
  const persisted = await readMotionStudioProviderCandidateObjectiveQaEvidence({
    localStorageRoot: input.localStorageRoot,
    evidenceObjectIdentityHash,
  })
  if (persisted) {
    assertReplay({ persisted, evidenceObjectIdentityHash, ingest, requestDigest })
    return persisted
  }

  let analysis: z.infer<typeof analysisSchema>
  if (request.intent === 'generated_music_candidate') {
    analysis = await analyzeMusic({
      requestAuthority: musicRequestAuthoritySchema.parse(requestAuthority),
      wave,
      storedBytes: stored.bytes,
    })
  } else {
    analysis = analyzeFoley({
      request,
      requestAuthority: foleyRequestAuthoritySchema.parse(requestAuthority),
      storedBytes: stored.bytes,
    })
  }
  const gateResults = createGateResults({
    intent: request.intent,
    evidenceClass: ingest.evidenceClass,
    ingestEvidenceDigest: ingest.evidenceDigest,
    requestDigest,
    candidateSha256: stored.sha256,
    analysisDigest: analysis.analysisDigest,
  })
  const qaDigest = sha256CanonicalJson(gateResults)
  const actualProviderEvidence = ingest.evidenceClass === 'canonical_backend_verified_runtime'
  const base = {
    schemaVersion: MOTION_STUDIO_PROVIDER_CANDIDATE_OBJECTIVE_QA_SCHEMA_VERSION,
    evidenceId: `ms012d-provider-candidate-objective-qa-${evidenceObjectIdentityHash.slice(0, 24)}`,
    evidenceClass: ingest.evidenceClass,
    state: actualProviderEvidence
      ? 'actual_private_candidate_objective_qa_complete_review_evidence_pending' as const
      : 'contract_path_objective_qa_proven_non_promotable' as const,
    createdAt,
    intent: request.intent,
    workspaceId: ingest.workspaceId,
    projectId: ingest.projectId,
    editSessionId: ingest.editSessionId,
    productionId: ingest.productionId,
    approvedSnapshotId: ingest.approvedSnapshotId,
    approvedSnapshotDigest: ingest.approvedSnapshotDigest,
    sourceIngestEvidenceId: ingest.evidenceId,
    sourceIngestEvidenceDigest: ingest.evidenceDigest,
    canonicalReceiptDigest: ingest.canonicalReceiptDigest,
    requestAuthority,
    providerAttempt: {
      approvedPackageId: ingest.providerAttempt.approvedPackageId,
      approvedPackageDigest: ingest.providerAttempt.approvedPackageDigest,
      approvedWorkItemId: ingest.providerAttempt.approvedWorkItemId,
      queueJobId: ingest.providerAttempt.queueJobId,
      queueAttemptId: ingest.providerAttempt.queueAttemptId,
      claimId: ingest.providerAttempt.claimId,
      leaseId: ingest.providerAttempt.leaseId,
      idempotencyKeyHash: ingest.providerAttempt.idempotencyKeyHash,
      providerOperationId: ingest.providerAttempt.providerOperationId,
      providerRouteId: ingest.providerAttempt.providerRouteId,
      providerModelId: ingest.providerAttempt.providerModelId,
      providerRequestPayloadDigest: ingest.providerAttempt.providerRequestPayloadDigest,
      projectDataPolicyDigest: ingest.providerAttempt.projectDataPolicyDigest,
      providerAccountPolicyDigest: ingest.providerAttempt.providerAccountPolicyDigest,
      providerResponseUsageDigest: ingest.providerAttempt.providerResponseUsageDigest,
      oneUseDispatchEvidenceDigest: ingest.providerAttempt.oneUseDispatchEvidenceDigest,
      terminalEvidenceDigest: ingest.providerAttempt.terminalEvidenceDigest,
    },
    candidate: ingest.normalizedArtifact,
    normalization: {
      canonicalOperationId: ingest.normalization.canonicalOperationId,
      recipeProfileId: ingest.normalization.recipeProfileId,
      runtimeAuthorityHash: ingest.normalization.runtimeAuthorityHash,
      runtimeImageIdentityHash: ingest.normalization.runtimeImageIdentityHash,
      normalizationAttestationDigest: ingest.normalization.normalizationAttestationDigest,
      deterministicReplayVerified: ingest.normalization.deterministicReplayVerified,
    },
    analysis,
    qa: {
      gateResults,
      objectiveGateCount: request.intent === 'generated_music_candidate'
        ? musicObjectiveGates.length
        : foleyObjectiveGates.length,
      pendingSemanticRightsAndHumanGateCount: request.intent === 'generated_music_candidate'
        ? musicReviewGates.length
        : foleyReviewGates.length,
      objectiveQaPassed: true as const,
      actualProviderCandidateQaComplete: actualProviderEvidence,
      semanticAndCreativeEvidenceComplete: false as const,
      rightsAndProvenanceReviewComplete: false as const,
      humanReviewComplete: false as const,
      readyForEvidenceCollection: actualProviderEvidence,
      readyForHumanReview: false as const,
      selectionEligible: false as const,
      finalMixEligible: false as const,
      timelineEligible: false as const,
      qaDigest,
    },
    cost: {
      providerCostMicros: ingest.cost.providerCostMicros,
      providerWorkerInfrastructureCostMicros:
        ingest.cost.providerWorkerInfrastructureCostMicros,
      providerAttemptTotalInternalProductionCostMicros:
        ingest.cost.providerAttemptTotalInternalProductionCostMicros,
      providerAttemptCostEvidenceDigest: ingest.cost.providerAttemptCostEvidenceDigest,
      providerAttemptCostEvidenceActual: actualProviderEvidence,
      normalizationInfrastructureCostState:
        'canonical_observed_resource_evidence_required' as const,
      normalizationInfrastructureCostMicros: null,
      objectiveQaInfrastructureCostState:
        'canonical_observed_resource_evidence_required' as const,
      objectiveQaInfrastructureCostMicros: null,
      fullCandidateCostReconciled: false as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletMutationPerformed: false as const,
      billingMutationPerformed: false as const,
    },
    persistence: {
      privateLocalOnly: true as const,
      createOnly: true as const,
      evidenceRecordPersisted: true as const,
      providerUrlPersisted: false as const,
      localPathProjected: false as const,
      evidenceObjectIdentityHash,
    },
    sideEffects: {
      privateArtifactReadCount: 1 as const,
      providerSubmissionCountByQa: 0 as const,
      secretPayloadReadCountByQa: 0 as const,
      objectiveQaEvidenceWriteCount: 1 as const,
      semanticReviewDecisionCount: 0 as const,
      humanReviewDecisionCount: 0 as const,
      selectionCount: 0 as const,
      finalMixMutationCount: 0 as const,
      timelineMutationCount: 0 as const,
      renderCount: 0 as const,
      exportCount: 0 as const,
      remoteMutationCount: 0 as const,
    },
    readiness: {
      contractPathProofOnly: !actualProviderEvidence,
      actualPrivateProviderCandidatePresent: actualProviderEvidence,
      canonicalProviderAttemptAuthorityPresent: actualProviderEvidence,
      deterministicObjectiveQaPathProven: true as const,
      objectiveQaComplete: actualProviderEvidence,
      semanticRightsAndHumanReviewsComplete: false as const,
      readyForSelectionDecision: false as const,
      ms012dAccepted: false as const,
      productReady: false as const,
    },
    immutable: true as const,
  }
  const evidence = deepFreeze(motionStudioProviderCandidateObjectiveQaV2Schema.parse({
    ...base,
    evidenceDigest: sha256CanonicalJson(base),
  }))
  await persistEvidence(input.localStorageRoot, evidence)
  return evidence
}

export function assertMotionStudioProviderCandidateObjectiveQa(
  input: MotionStudioProviderCandidateObjectiveQaV2,
): void {
  const parsed = motionStudioProviderCandidateObjectiveQaV2Schema.parse(input)
  const base = { ...parsed } as Record<string, unknown>
  delete base.evidenceDigest
  if (
    sha256CanonicalJson(base) !== parsed.evidenceDigest ||
    sha256CanonicalJson(parsed.qa.gateResults) !== parsed.qa.qaDigest ||
    !parsed.qa.objectiveQaPassed ||
    parsed.qa.semanticAndCreativeEvidenceComplete ||
    parsed.qa.rightsAndProvenanceReviewComplete || parsed.qa.humanReviewComplete ||
    parsed.qa.readyForHumanReview || parsed.qa.selectionEligible ||
    parsed.qa.finalMixEligible || parsed.qa.timelineEligible ||
    parsed.readiness.semanticRightsAndHumanReviewsComplete ||
    parsed.readiness.readyForSelectionDecision || parsed.readiness.ms012dAccepted ||
    parsed.readiness.productReady || parsed.sideEffects.semanticReviewDecisionCount !== 0 ||
    parsed.sideEffects.humanReviewDecisionCount !== 0 || parsed.sideEffects.selectionCount !== 0 ||
    parsed.sideEffects.finalMixMutationCount !== 0 || parsed.sideEffects.timelineMutationCount !== 0 ||
    parsed.sideEffects.renderCount !== 0 || parsed.sideEffects.exportCount !== 0 ||
    parsed.sideEffects.remoteMutationCount !== 0
  ) blocked('Provider candidate objective-QA evidence crossed its review or promotion boundary.')
}

function createRequestAuthority(input: {
  request: MotionStudioMusicFoleyCandidateRequestV1
  requestDigest: string
  fps: 24 | 30
  expectedHitFrames?: readonly number[]
  speechFrameRanges?: readonly { startFrame: number; endFrame: number }[]
}): z.infer<typeof requestAuthoritySchema> {
  const request = input.request
  const durationFrames = request.range.endFrame - request.range.startFrame
  if (request.intent === 'generated_music_candidate') {
    if (input.expectedHitFrames?.length || input.speechFrameRanges?.length) {
      invalid('Generated-music objective QA does not accept Foley timing evidence.')
    }
    return musicRequestAuthoritySchema.parse({
      intent: request.intent,
      requestId: request.musicRequestId,
      requestDigest: input.requestDigest,
      approvedSnapshotId: request.approval.approvedSnapshotId,
      approvedSnapshotDigest: request.approval.approvedSnapshotDigest,
      approvedWorkItemId: request.work.approvedWorkItemId,
      idempotencyKeyHash: request.work.idempotencyKeyHash,
      musicBibleArtifactVersionId: request.musicBibleArtifactVersion.versionId,
      musicBibleContentDigest: request.musicBibleContentDigest,
      cueId: request.cue.cueId,
      pictureLockArtifactVersionId: request.pictureLockArtifactVersion.versionId,
      pictureLockContentDigest: request.pictureLockContentDigest,
      timingAuthorityDigest: request.timingAuthorityDigest,
      range: { startFrame: request.range.startFrame, endFrame: request.range.endFrame },
      fps: input.fps,
      durationFrames,
    })
  }
  return foleyRequestAuthoritySchema.parse({
    intent: request.intent,
    requestId: request.foleyRequestId,
    requestDigest: input.requestDigest,
    approvedSnapshotId: request.approval.approvedSnapshotId,
    approvedSnapshotDigest: request.approval.approvedSnapshotDigest,
    approvedWorkItemId: request.work.approvedWorkItemId,
    idempotencyKeyHash: request.work.idempotencyKeyHash,
    soundEventId: request.soundEvent.soundEventId,
    sourceVideoAssetVersionId: request.sourceVideoAssetVersion.assetVersionId,
    sourceVideoContentDigest: request.sourceVideoAssetVersion.contentDigest,
    pictureLockArtifactVersionId: request.pictureLockArtifactVersion.versionId,
    pictureLockContentDigest: request.pictureLockContentDigest,
    timingAuthorityDigest: request.timingAuthorityDigest,
    range: { startFrame: request.range.startFrame, endFrame: request.range.endFrame },
    fps: input.fps,
    durationFrames,
    expectedHitFrames: input.expectedHitFrames ?? [],
    speechFrameRanges: input.speechFrameRanges ?? [],
  })
}

function assertRequestLineage(input: {
  ingest: MotionStudioProviderCandidateIngestEvidenceV2
  request: MotionStudioMusicFoleyCandidateRequestV1
  requestDigest: string
  fps: 24 | 30
}): void {
  const request = input.request
  const requestId = request.intent === 'generated_music_candidate'
    ? request.musicRequestId
    : request.foleyRequestId
  const durationFrames = request.range.endFrame - request.range.startFrame
  const exactSamples = durationFrames * (48_000 / input.fps)
  if (
    request.intent !== input.ingest.intent ||
    request.workspaceId !== input.ingest.workspaceId ||
    request.projectId !== input.ingest.projectId ||
    request.editSessionId !== input.ingest.editSessionId ||
    request.productionId !== input.ingest.productionId ||
    requestId !== input.ingest.providerAttempt.sourceRequestId ||
    input.requestDigest !== input.ingest.providerAttempt.sourceRequestDigest ||
    request.approval.approvedSnapshotId !== input.ingest.approvedSnapshotId ||
    request.approval.approvedSnapshotDigest !== input.ingest.approvedSnapshotDigest ||
    request.work.approvedWorkItemId !== input.ingest.providerAttempt.approvedWorkItemId ||
    request.work.idempotencyKeyHash !== input.ingest.providerAttempt.idempotencyKeyHash ||
    !Number.isSafeInteger(exactSamples) || exactSamples <= 0 ||
    exactSamples !== input.ingest.normalizedArtifact.sampleCountPerChannel ||
    durationFrames > input.fps * 30
  ) blocked('Candidate objective QA requires exact request, attempt, timing and artifact lineage.')
}

async function analyzeMusic(input: {
  requestAuthority: z.infer<typeof musicRequestAuthoritySchema>
  wave: ReturnType<typeof parseMotionStudioPcmWave>
  storedBytes: Buffer
}): Promise<z.infer<typeof musicAnalysisSchema>> {
  const metrics = sampleMetrics(input.wave.interleavedSamples)
  if (metrics.rmsDbfs < -60) blocked('Generated-music candidate is effectively silent.')
  if (metrics.samplePeakDbfs > -1 || metrics.clippingSampleCount !== 0) {
    blocked('Generated-music candidate exceeds the fixed sample-peak or clipping ceiling.')
  }
  const runtime = await openPrivateOfflineMediaBinaryRuntime()
  const measurementRequest = {
    schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
    toolId: 'ffmpeg' as const,
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.measureStorytellingAudioMix,
    payload: {
      measurementProfileId: 'motion_studio_storytelling_ebur128_v1' as const,
      expectedSampleRateHertz: 48_000 as const,
      expectedChannelCount: 2 as const,
      emitMachineJsonOnly: true as const,
      mimeType: 'audio/wav' as const,
      sourceByteLength: input.storedBytes.byteLength,
      sourceSha256: sha256(input.storedBytes),
      sourceBytesBase64: input.storedBytes.toString('base64'),
      expectedSampleCountPerChannel: input.wave.sampleCountPerChannel,
    },
  }
  const measurement = await runtime.execute(measurementRequest)
  const replay = await runtime.execute(measurementRequest)
  if (sha256CanonicalJson(measurement.resultJson.document) !==
      sha256CanonicalJson(replay.resultJson.document)) {
    blocked('Generated-music objective measurement changed on deterministic replay.')
  }
  const document = measurement.resultJson.document
  const analysisBase = {
    intent: 'generated_music_candidate' as const,
    profileId: MOTION_STUDIO_GENERATED_MUSIC_OBJECTIVE_QA_PROFILE,
    sampleRateHertz: 48_000 as const,
    channelCount: 2 as const,
    bitsPerSample: 16 as const,
    sampleCountPerChannel: input.wave.sampleCountPerChannel,
    durationMilliseconds: input.wave.durationMilliseconds,
    rmsDbfs: metrics.rmsDbfs,
    samplePeakDbfs: metrics.samplePeakDbfs,
    clippingSampleCount: 0 as const,
    integratedLufs: document.integratedLufs,
    loudnessRangeLu: document.loudnessRangeLu,
    truePeakDbfs: document.truePeakDbfs,
    measurementAttestationDigest: measurement.attestation.attestationHash,
    measurementResultDigest: measurement.resultJson.sha256,
    deterministicReplayVerified: true as const,
  }
  return musicAnalysisSchema.parse({
    ...analysisBase,
    analysisDigest: sha256CanonicalJson({
      ...analysisBase,
      requestAuthority: input.requestAuthority,
    }),
  })
}

function analyzeFoley(input: {
  request: Extract<MotionStudioMusicFoleyCandidateRequestV1, { intent: 'synchronized_foley_candidate' }>
  requestAuthority: z.infer<typeof foleyRequestAuthoritySchema>
  storedBytes: Buffer
}): z.infer<typeof foleyAnalysisSchema> {
  const result = analyzeMotionStudioSynchronizedFoleyObjectiveCandidate({
    request: input.request,
    normalizedWavBytes: input.storedBytes,
    fps: input.requestAuthority.fps,
    expectedHitFrames: input.requestAuthority.expectedHitFrames,
    speechFrameRanges: input.requestAuthority.speechFrameRanges,
  })
  const analysis = result.analysis
  const maximumAbsoluteAlignmentOffsetFrames = Math.max(
    ...analysis.expectedHits.map((entry) => Math.abs(entry.offsetFrames)),
  )
  return foleyAnalysisSchema.parse({
    intent: 'synchronized_foley_candidate',
    profileId: MOTION_STUDIO_SYNCHRONIZED_FOLEY_OBJECTIVE_QA_PROFILE,
    sampleRateHertz: 48_000,
    channelCount: 2,
    bitsPerSample: 16,
    sampleCountPerChannel: analysis.sampleCountPerChannel,
    durationMilliseconds: analysis.durationMilliseconds,
    durationFrames: analysis.durationFrames,
    overallRmsDbfs: analysis.overallRmsDbfs,
    samplePeakDbfs: analysis.samplePeakDbfs,
    clippingSampleCount: analysis.clippingSampleCount,
    adaptiveTransientThresholdDbfs: analysis.adaptiveTransientThresholdDbfs,
    detectedTransientFrames: analysis.detectedTransientFrames,
    expectedHitCount: analysis.expectedHits.length,
    maximumAbsoluteAlignmentOffsetFrames,
    unplannedTransientCount: analysis.unplannedTransientFrames.length,
    speechWindowRawRmsDbfs: analysis.speechWindowRawRmsDbfs,
    speechWindowProjectedMixRmsDbfs: analysis.speechWindowProjectedMixRmsDbfs,
    bestUsableTrim: analysis.bestUsableTrim,
    analysisDigest: analysis.analysisDigest,
    deterministicReplayVerified: result.deterministicReplayVerified,
  })
}

function createGateResults(input: {
  intent: MotionStudioMusicFoleyCandidateRequestV1['intent']
  evidenceClass: MotionStudioProviderCandidateIngestEvidenceV2['evidenceClass']
  ingestEvidenceDigest: string
  requestDigest: string
  candidateSha256: string
  analysisDigest: string
}): MotionStudioProviderCandidateObjectiveQaV2['qa']['gateResults'] {
  const objective = input.intent === 'generated_music_candidate'
    ? musicObjectiveGates
    : foleyObjectiveGates
  const pending = input.intent === 'generated_music_candidate' ? musicReviewGates : foleyReviewGates
  return [
    ...objective.map((gate) => ({
      gate,
      class: 'objective' as const,
      result: 'passed' as const,
      blocking: true as const,
      evidenceDigest: sha256CanonicalJson({ gate, ...input, result: 'passed' }),
      note: input.evidenceClass === 'canonical_backend_verified_runtime'
        ? 'The exact admitted private provider candidate passed this deterministic objective gate.'
        : 'The non-promotable contract-path fixture passed this deterministic path gate.',
    })),
    ...pending.map((gate) => ({
      gate,
      class: 'semantic_rights_or_human' as const,
      result: 'not_evaluated' as const,
      blocking: true as const,
      evidenceDigest: sha256CanonicalJson({ gate, ...input, result: 'not_evaluated' }),
      note: 'Requires exact semantic, rights/provenance, picture-context, and human review evidence.',
    })),
  ]
}

function sampleMetrics(samples: Int16Array): {
  rmsDbfs: number
  samplePeakDbfs: number
  clippingSampleCount: number
} {
  if (samples.length === 0) return { rmsDbfs: -120, samplePeakDbfs: -120, clippingSampleCount: 0 }
  let sumSquares = 0
  let peak = 0
  let clippingSampleCount = 0
  for (const sample of samples) {
    const magnitude = Math.abs(sample)
    const linear = magnitude / 32_768
    sumSquares += linear * linear
    peak = Math.max(peak, linear)
    if (magnitude >= 32_767) clippingSampleCount += 1
  }
  return {
    rmsDbfs: rounded(linearToDb(Math.sqrt(sumSquares / samples.length))),
    samplePeakDbfs: rounded(linearToDb(peak)),
    clippingSampleCount,
  }
}

async function persistEvidence(
  root: string,
  evidence: MotionStudioProviderCandidateObjectiveQaV2,
): Promise<void> {
  const identity = evidence.persistence.evidenceObjectIdentityHash
  const relativePath = `motion-studio/provider-candidate-objective-qa/${identity.slice(0, 2)}/${identity}.json`
  const bytes = Buffer.from(`${stableAuthorityStringify(evidence)}\n`, 'utf8')
  await writePrivateFileCreateOnlyWithinRoot({ rootPath: root, relativePath, content: bytes })
  const stored = await readPrivateFileIfExistsWithinRoot({ rootPath: root, relativePath })
  if (!stored || !stored.equals(bytes)) {
    blocked('Provider candidate objective-QA evidence changed after create-only persistence.')
  }
}

export async function readMotionStudioProviderCandidateObjectiveQaEvidence(
  input: {
    localStorageRoot: string
    evidenceObjectIdentityHash: string
  },
): Promise<MotionStudioProviderCandidateObjectiveQaV2 | null> {
  if (!/^\/tmp\/reeditpro-motion-studio-provider-candidate-ingest-[A-Za-z0-9._-]+$/u
    .test(input.localStorageRoot)) {
    invalid('Candidate objective QA requires the exact bounded private-ingest root.')
  }
  if (!/^[a-f0-9]{64}$/u.test(input.evidenceObjectIdentityHash)) {
    invalid('Provider candidate objective-QA evidence identity is invalid.')
  }
  const identity = input.evidenceObjectIdentityHash
  const relativePath = `motion-studio/provider-candidate-objective-qa/${identity.slice(0, 2)}/${identity}.json`
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath,
  })
  if (!bytes) return null
  let decoded: unknown
  try {
    decoded = JSON.parse(bytes.toString('utf8'))
  } catch {
    blocked('Persisted provider candidate objective-QA evidence is not canonical JSON.')
  }
  const evidence = deepFreeze(motionStudioProviderCandidateObjectiveQaV2Schema.parse(decoded))
  assertMotionStudioProviderCandidateObjectiveQa(evidence)
  const canonicalBytes = Buffer.from(`${stableAuthorityStringify(evidence)}\n`, 'utf8')
  if (!bytes.equals(canonicalBytes)) {
    blocked('Persisted provider candidate objective-QA evidence is not canonical serialization.')
  }
  return evidence
}

function assertReplay(input: {
  persisted: MotionStudioProviderCandidateObjectiveQaV2
  evidenceObjectIdentityHash: string
  ingest: MotionStudioProviderCandidateIngestEvidenceV2
  requestDigest: string
}): void {
  if (
    input.persisted.persistence.evidenceObjectIdentityHash !== input.evidenceObjectIdentityHash ||
    input.persisted.sourceIngestEvidenceDigest !== input.ingest.evidenceDigest ||
    input.persisted.evidenceClass !== input.ingest.evidenceClass ||
    input.persisted.canonicalReceiptDigest !== input.ingest.canonicalReceiptDigest ||
    input.persisted.requestAuthority.requestDigest !== input.requestDigest
  ) blocked('Persisted provider candidate objective-QA evidence changed exact replay authority.')
}

function exactIso(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    invalid('Provider candidate objective-QA time must be canonical ISO-8601.')
  }
  return value
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}
function linearToDb(value: number): number {
  return 20 * Math.log10(Math.max(value, Number.EPSILON))
}
function rounded(value: number): number { return Number(value.toFixed(9)) }
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
    requiredGate: 'motion_studio_provider_candidate_objective_qa',
  })
}
