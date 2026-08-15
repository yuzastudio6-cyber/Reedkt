import { z } from 'zod'

import { REEDITPRO_SOURCE_MEDIA_MAX_BYTES } from '../../src/types/large-media'
import {
  OFFLINE_MEDIA_BINARY_STREAMING_MAXIMUM_OUTPUT_BYTES,
} from '../tool-execution/media-binary-execution/offline-media-binary-types'
import {
  OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_MAXIMUM_CHUNK_BYTES,
  OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_MAXIMUM_OUTPUT_BYTES,
} from '../tool-execution/media-binary-execution/offline-media-binary-mezzanine-finalization-protocol'
import {
  PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS,
  privateInternalAttemptCostEvidenceResultSchema,
} from '../tool-cost-metering/private-internal-attempt-cost-evidence'
import { canonicalPrivateToolDispatchCredentialSchema } from './canonical-private-tool-dispatch-schemas'
import { canonicalWorkerLeaseCredentialSchema } from './canonical-worker-lease-authority-schemas'

const identity = z.string().min(1).max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => value === value.trim() && !value.includes('..'))
const sha = z.string().regex(/^[a-f0-9]{64}$/)
const timestamp = z.string().datetime({ offset: true })

const toolCommon = z.object({
  canonicalToolId: z.enum(['ffmpeg', 'ffprobe']),
  operationId: identity,
  actualBinaryOperationCompleted: z.literal(true),
  providerCallMade: z.literal(false),
  inputReadEvidenceHash: sha,
  inputArtifactSha256: sha,
  inputArtifactByteLength: z.number().int().positive().max(REEDITPRO_SOURCE_MEDIA_MAX_BYTES),
  renderExecuted: z.literal(false),
  finalExportExecuted: z.literal(false),
})

const streamedSourceEvidence = {
  sourceInputMode: z.literal('server_injected_private_stream_v1'),
  sourceStagingEvidenceHash: sha,
  sourceCapacityEvidenceHash: sha,
  sourceStagingCleaned: z.literal(true),
}

const mediaInputAuthoritySchema = z.discriminatedUnion('inputKind', [
  toolCommon.extend({
    inputKind: z.literal('approved_source_object'),
    sourceObjectRead: z.literal(true),
    dependencyArtifactRead: z.literal(false),
    sourceSequenceItemId: identity,
    sourceBindingHash: sha,
    ...streamedSourceEvidence,
  }).strict(),
  toolCommon.extend({
    inputKind: z.literal('qa_passed_dependency_artifact'),
    sourceObjectRead: z.literal(false),
    dependencyArtifactRead: z.literal(true),
    dependencyInputMode: z.literal('server_injected_private_stream_v1'),
    dependencyArtifactStreamed: z.literal(true),
    inputArtifactId: identity,
    inputDependencyJobId: identity,
  }).strict(),
  toolCommon.extend({
    inputKind: z.literal('approved_edit_brief_audio_attachment'),
    sourceObjectRead: z.literal(false),
    dependencyArtifactRead: z.literal(false),
    editBriefAudioObjectRead: z.literal(true),
    sourceInputMode: z.literal('server_injected_private_stream_v1'),
    attachmentId: identity,
    markerId: identity,
    privateAssetId: identity,
    attachmentMimeType: z.enum([
      'audio/aac', 'audio/mpeg', 'audio/wav', 'audio/x-wav',
    ]),
    recipeProfileId: z.enum([
      'approved_edit_brief_music_bed_wav_v1',
      'approved_edit_brief_sfx_wav_v1',
    ]),
  }).strict(),
  toolCommon.extend({
    inputKind: z.literal('verified_storytelling_speech_provider_output_set'),
    sourceObjectRead: z.literal(false),
    dependencyArtifactRead: z.literal(true),
    dependencyInputMode: z.literal('server_injected_private_stream_v1'),
    dependencyArtifactStreamed: z.literal(true),
    providerDependencyJobId: identity,
    providerAudioArtifactId: identity,
    providerAlignmentArtifactId: identity,
    providerReceiptHash: sha,
    providerOutputSetDigest: sha,
    providerQueueClaimHash: sha,
    sourceAuthorityDigest: sha,
    alignmentArtifactSha256: sha,
    alignmentArtifactByteLength: z.number().int().positive().max(1024 * 1024),
    alignmentReadEvidenceHash: sha,
    normalizationInfrastructureEvidenceHash: sha,
    normalizationInfrastructureRateCardDigest: sha,
    normalizationInfrastructureCostMicros: z.number().int().nonnegative(),
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
  }).strict(),
  toolCommon.extend({
    inputKind: z.literal('verified_visual_calibration_provider_output'),
    sourceObjectRead: z.literal(false),
    dependencyArtifactRead: z.literal(true),
    dependencyInputMode: z.literal('server_injected_private_stream_v1'),
    dependencyArtifactStreamed: z.literal(true),
    providerDependencyJobId: identity,
    providerExpectedAssetId: identity,
    providerArtifactId: identity,
    providerOutputId: identity,
    providerReceiptHash: sha,
    providerOutputSetDigest: sha,
    providerQueueClaimHash: sha,
    providerAttemptCostEvidenceHash: sha,
    providerUsageEvidenceDigest: sha.nullable(),
    providerRateCardDigest: sha,
    providerCostMicros: z.number().int().nonnegative(),
    motionStudioProductionId: identity,
    styleCalibrationPlanId: identity,
    calibrationScenarioId: identity,
    calibrationScenarioKind: z.enum([
      'style_led_motion', 'character_continuity',
      'strict_first_last_frame', 'reference_heavy',
    ]),
    visualCalibrationContextDigest: sha,
    firstFrameAssetId: identity,
    firstFrameAssetVersionId: identity,
    firstFrameSha256: sha,
    firstFrameReadbackEvidenceHash: sha,
    lastFrameAssetId: identity,
    lastFrameAssetVersionId: identity,
    lastFrameSha256: sha,
    lastFrameReadbackEvidenceHash: sha,
    objectiveQaPassed: z.boolean(),
    objectiveQaThresholdVersion: identity,
    objectiveQaCostProfileId: identity,
    qaInfrastructureEvidenceHash: sha,
    qaInfrastructureRateCardDigest: sha,
    qaInfrastructureCostMicros: z.number().int().nonnegative(),
    maximumAuthorizedQaInfrastructureCostMicros:
      z.number().int().positive(),
    providerCostIncludedInQaInfrastructure: z.literal(false),
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
  }).strict(),
  toolCommon.extend({
    inputKind: z.literal('approved_source_and_reference_artifact'),
    sourceObjectRead: z.literal(true),
    dependencyArtifactRead: z.literal(true),
    sourceSequenceItemId: identity,
    sourceBindingHash: sha,
    ...streamedSourceEvidence,
    referenceSourceSequenceItemId: identity,
    referenceOutputKey: identity,
    referenceInputArtifactId: identity,
    referenceInputDependencyJobId: identity,
    referenceInputArtifactSha256: sha,
    referenceInputArtifactByteLength: z.number().int().positive().max(16 * 1024 * 1024),
    referenceInputReadEvidenceHash: sha,
  }).strict(),
  toolCommon.extend({
    inputKind: z.literal('approved_source_and_chunk_dependencies'),
    sourceObjectRead: z.literal(true),
    dependencyArtifactRead: z.literal(true),
    dependencyInputMode: z.literal('server_injected_private_stream_v1'),
    dependencyArtifactStreamed: z.literal(true),
    sourceSequenceItemId: identity,
    sourceBindingHash: sha,
    ...streamedSourceEvidence,
    sourceTrimDependencyArtifactId: identity,
    sourceTrimDependencyJobId: identity,
    sourceTrimDependencyReadEvidenceHash: sha,
    chunkInputCount: z.number().int().min(2).max(16),
    chunkInputArtifactIds: z.array(identity).min(2).max(16),
    chunkInputDependencyJobIds: z.array(identity).min(2).max(16),
    chunkInputSha256s: z.array(sha).min(2).max(16),
    chunkInputByteLengths: z.array(z.number().int().min(1_024)
      .max(OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_MAXIMUM_CHUNK_BYTES))
      .min(2).max(16),
    chunkDependencyReadEvidenceHash: sha,
  }).strict(),
  toolCommon.extend({
    inputKind: z.literal('approved_voice_and_chunk_dependencies'),
    sourceObjectRead: z.literal(false),
    dependencyArtifactRead: z.literal(true),
    dependencyInputMode: z.literal('server_injected_private_stream_v1'),
    dependencyArtifactStreamed: z.literal(true),
    sourceSequenceItemId: identity,
    approvedVoiceOutputKey: identity,
    approvedVoiceArtifactId: identity,
    approvedVoiceDependencyJobId: identity,
    approvedVoiceReadEvidenceHash: sha,
    sourceTrimDependencyArtifactId: identity,
    sourceTrimDependencyJobId: identity,
    sourceTrimDependencyReadEvidenceHash: sha,
    chunkInputCount: z.number().int().min(2).max(16),
    chunkInputArtifactIds: z.array(identity).min(2).max(16),
    chunkInputDependencyJobIds: z.array(identity).min(2).max(16),
    chunkInputSha256s: z.array(sha).min(2).max(16),
    chunkInputByteLengths: z.array(z.number().int().min(1_024)
      .max(OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_MAXIMUM_CHUNK_BYTES))
      .min(2).max(16),
    chunkDependencyReadEvidenceHash: sha,
  }).strict(),
]).superRefine((value, context) => {
  if (
    (
      value.inputKind === 'approved_source_and_chunk_dependencies' ||
      value.inputKind === 'approved_voice_and_chunk_dependencies'
    ) && (
      value.chunkInputArtifactIds.length !== value.chunkInputCount ||
      value.chunkInputDependencyJobIds.length !== value.chunkInputCount ||
      value.chunkInputSha256s.length !== value.chunkInputCount ||
      value.chunkInputByteLengths.length !== value.chunkInputCount
    )
  ) context.addIssue({
    code: z.ZodIssueCode.custom,
    path: ['chunkInputCount'],
    message: 'Mezzanine chunk evidence arrays must match the exact chunk count.',
  })
})

const finalArtifactQaSchema = z.object({
  independentFfprobeExecuted: z.literal(true), binaryVersion: z.literal('8.1.2'),
  videoCodecName: z.literal('h264'), pixelFormat: z.literal('yuv420p'), colorSpace: z.literal('bt709'),
  width: z.number().int().positive(), height: z.number().int().positive(), fps: z.number().positive(),
  frameCount: z.number().int().positive(), audioCodecName: z.literal('aac'),
  audioSampleRate: z.literal(48_000), audioChannels: z.number().int().min(1).max(2),
  approvedDurationSeconds: z.number().positive(), actualDurationSeconds: z.number().positive(),
  maximumDurationDriftFrames: z.literal(2), durationDriftFrames: z.number().int().min(0).max(2),
  finalQaGatesPassed: z.literal(true), reportSha256: sha,
}).strict()

export const runCanonicalPrivateMediaBinarySchema = z.object({
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  jobId: identity,
  grantId: identity,
  purpose: z.literal('execute_canonical_private_media_binary_tool'),
  idempotencyKey: z.string().min(8).max(240).refine((value) => value === value.trim()),
}).strict()

export const canonicalPrivateMediaBinaryAuthoritySchema = z.object({
  leaseId: identity,
  leaseCredential: canonicalWorkerLeaseCredentialSchema,
  dispatchCredential: canonicalPrivateToolDispatchCredentialSchema,
}).strict()

export const canonicalPrivateMediaBinaryResponseSchema = z.object({
  schemaVersion: z.literal('canonical-private-media-binary-execution-response-v4'),
  source: z.literal('canonical_private_media_binary_execution_coordinator'),
  purpose: z.literal('execute_canonical_private_media_binary_tool'),
  identity: z.object({
    workspaceId: identity, projectId: identity, editSessionId: identity, snapshotId: identity,
    jobId: identity, approvedWorkItemId: identity, expectedAssetId: identity, dispatchGrantId: identity,
  }).strict(),
  tool: mediaInputAuthoritySchema,
  finalArtifactQa: finalArtifactQaSchema.nullable(),
  lease: z.object({
    leaseId: identity, executionAttemptId: identity,
    runnerClass: z.literal('offline_media_binary_execution_v1'),
    executionStartedAt: timestamp, executionCompletedAt: timestamp,
  }).strict(),
  runtime: z.object({
    runtimeAuthorityHash: sha, imageIdentityHash: sha, executionAttestationHash: sha,
    requestEnvelopeSha256: sha, resultSha256: sha,
    privateInternalOnly: z.literal(true), productReady: z.literal(false),
    externalBetaReady: z.literal(false), productionReady: z.literal(false),
    finalExportReady: z.literal(false),
  }).strict(),
  result: z.object({
    artifactId: identity, qaEvaluationId: identity, reconciliationId: identity,
    contentType: z.enum([
      'application/json', 'video/x-nut', 'video/x-matroska', 'audio/wav',
      'video/mp4', 'image/png',
    ]),
    sha256: sha,
    byteLength: z.number().int().positive()
      .max(Math.max(
        OFFLINE_MEDIA_BINARY_STREAMING_MAXIMUM_OUTPUT_BYTES,
        OFFLINE_MEDIA_BINARY_MEZZANINE_FINALIZATION_MAXIMUM_OUTPUT_BYTES,
      )),
    outputMode: z.enum(['bounded_buffer_v1', 'server_committed_private_stream_v1']),
    privateObjectIdentityHash: sha,
    qaOutcome: z.literal('passed'),
    reconciliationDecision: z.literal('test_merged_not_live_authorized'),
    privateTestDependencySatisfied: z.literal(true),
    finalRenderAuthorized: z.literal(false),
  }).strict(),
  attemptCost: privateInternalAttemptCostEvidenceResultSchema.optional(),
  replay: z.object({
    dispatchConsumptionReplayed: z.boolean(), executionFenceBeginReplayed: z.boolean(),
    executionFenceCompleteReplayed: z.boolean(), artifactRecordReplayed: z.boolean(),
    qaRecordReplayed: z.boolean(), reconciliationReplayed: z.boolean(),
    attemptCostEvidenceReplayed: z.boolean().optional(),
  }).strict(),
  permissions: z.object({
    furtherWorkerDispatch: z.literal(false), providerCall: z.literal(false),
    furtherSourceObjectRead: z.literal(false), render: z.literal(false), finalExport: z.literal(false),
    creditSpend: z.literal(false), walletMutation: z.literal(false), settlement: z.literal(false),
    delivery: z.literal(false),
  }).strict(),
  persistence: z.object({
    privateLocalCreateOnlyArtifact: z.literal(true), actualRunEvidenceVerified: z.literal(true),
    actualQaEvidenceVerified: z.literal(true), checksumProtectedAuthority: z.literal(true),
    mediaOutputStreamed: z.boolean(),
    largeMediaOutputOverLegacyBufferVerified: z.boolean(),
    distributedAuthority: z.literal(false), productionAuthority: z.literal(false),
  }).strict(),
  completedAt: timestamp,
  responseHash: sha,
  testOnly: z.literal(true),
}).strict().superRefine((value, context) => {
  const costRequired = value.tool.inputKind ===
      'approved_source_and_chunk_dependencies' ||
    value.tool.inputKind === 'approved_voice_and_chunk_dependencies'
  const cost = value.attemptCost?.evidence
  if (
    costRequired !== Boolean(cost) ||
    costRequired !== (value.replay.attemptCostEvidenceReplayed !== undefined) ||
    (cost && (
      cost.identity.toolId !== 'ffmpeg' ||
      cost.identity.workloadProfileId !==
        PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.ffmpegFourKMezzanineFinalization ||
      cost.identity.workspaceId !== value.identity.workspaceId ||
      cost.identity.projectId !== value.identity.projectId ||
      cost.identity.editSessionId !== value.identity.editSessionId ||
      cost.identity.approvedPlanSnapshotId !== value.identity.snapshotId ||
      cost.identity.approvedWorkItemId !== value.identity.approvedWorkItemId ||
      cost.identity.jobId !== value.identity.jobId ||
      cost.identity.executionAttemptId !== value.lease.executionAttemptId ||
      cost.resourceUsage.outputByteLength !== value.result.byteLength ||
      cost.outcome.status !== 'completed' ||
      cost.outcome.failureCategory !== 'none' ||
      !cost.linkedCanonicalOutcomeHash
    ))
  ) context.addIssue({
    code: z.ZodIssueCode.custom,
    path: ['attemptCost'],
    message: 'Media finalization internal-cost evidence is missing or inconsistent.',
  })
})

export type RunCanonicalPrivateMediaBinaryInput = z.infer<typeof runCanonicalPrivateMediaBinarySchema>
export type CanonicalPrivateMediaBinaryAuthority = z.infer<typeof canonicalPrivateMediaBinaryAuthoritySchema>
export type CanonicalPrivateMediaBinaryResponse = z.infer<typeof canonicalPrivateMediaBinaryResponseSchema>
