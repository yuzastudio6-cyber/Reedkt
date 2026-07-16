import { z } from 'zod'

import {
  CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_CHUNKS,
  CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_FRAMES,
  CANONICAL_PRIVATE_LONG_FORM_MINIMUM_FRAMES,
  CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES,
} from '../../src/types/canonical-private-composition-capacity'

const identity = z.string().min(1).max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => value === value.trim() && !value.includes('..'))
const sha = z.string().regex(/^[a-f0-9]{64}$/)
const timestamp = z.string().datetime({ offset: true })

export const runCanonicalPrivateLongFormMergeSchema = z.object({
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  jobId: identity,
  grantId: identity,
  purpose: z.literal('execute_canonical_private_long_form_merge'),
  idempotencyKey: z.string().min(8).max(240).refine((value) => value === value.trim()),
}).strict()

const chunkInputSchema = z.object({
  outputKey: identity,
  chunkIndex: z.number().int().min(1).max(CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_CHUNKS),
  chunkCount: z.number().int().min(2).max(CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_CHUNKS),
  globalStartFrame: z.number().int().nonnegative(),
  globalEndFrameExclusive: z.number().int().positive()
    .max(CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_FRAMES),
  durationFrames: z.number().int().positive()
    .max(CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES),
  sourceSequenceItemIds: z.array(identity).min(1).max(8)
    .refine((values) => new Set(values).size === values.length),
  sourceCleanupDecisionIds: z.array(identity).min(1).max(8)
    .refine((values) => new Set(values).size === values.length),
  artifactId: identity,
  artifactVersion: z.number().int().positive(),
  sha256: sha,
  byteLength: z.number().int().min(1_024).max(256 * 1024 * 1024),
  sourceExecutionAttemptId: identity,
  sourceLeaseImmutableHash: sha,
  dependencyReadEvidenceHash: sha,
}).strict().superRefine((chunk, context) => {
  if (
    chunk.globalEndFrameExclusive - chunk.globalStartFrame !== chunk.durationFrames ||
    chunk.sourceSequenceItemIds.length !== chunk.sourceCleanupDecisionIds.length ||
    chunk.chunkIndex > chunk.chunkCount
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Long-form chunk input is not duration and source-lineage preserving.',
    })
  }
})

const qaSchema = z.object({
  independentFfprobeExecuted: z.literal(true),
  binaryVersion: z.literal('8.1.2'),
  videoCodecName: z.literal('h264'),
  pixelFormat: z.literal('yuv420p'),
  colorSpace: z.literal('bt709'),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  fps: z.number().positive(),
  frameCount: z.number().int().positive(),
  audioCodecName: z.literal('aac'),
  audioSampleRate: z.literal(48_000),
  audioChannels: z.number().int().min(1).max(2),
  approvedDurationSeconds: z.number().positive(),
  actualDurationSeconds: z.number().positive(),
  maximumDurationDriftFrames: z.literal(2),
  durationDriftFrames: z.number().int().min(0).max(2),
  finalQaGatesPassed: z.literal(true),
  reportSha256: sha,
}).strict()

export const canonicalPrivateLongFormMergeResponseSchema = z.object({
  schemaVersion: z.literal('canonical-private-long-form-merge-execution-response-v1'),
  source: z.literal('canonical_private_long_form_merge_execution_coordinator'),
  purpose: z.literal('execute_canonical_private_long_form_merge'),
  identity: z.object({
    workspaceId: identity,
    projectId: identity,
    editSessionId: identity,
    snapshotId: identity,
    jobId: identity,
    approvedWorkItemId: identity,
    expectedAssetId: identity,
    dispatchGrantId: identity,
  }).strict(),
  tool: z.object({
    canonicalToolId: z.literal('remotion'),
    operationId: z.literal('tool.remotion.render_approved_composition.v1'),
    compositionProfileId: z.literal('approved_4k_composition_chunk_merge_final_v1'),
    longFormCapacityProfileId: z.literal('canonical_private_4k_chunk_merge_1920_frames_v1'),
    actualRemotionOperationCompleted: z.literal(true),
    inputKind: z.literal('qa_passed_dependency_artifact'),
    dependencyArtifactRead: z.literal(true),
    dependencyInputMode: z.literal('server_injected_private_stream_v1'),
    approvedChunkDependencyRead: z.literal(true),
    approvedChunkInputMode: z.literal('server_injected_private_stream_v1'),
    approvedChunkCount: z.number().int().min(2).max(8),
    approvedChunkOrderApplied: z.literal(true),
    approvedChunkFrameContinuityApplied: z.literal(true),
    approvedChunkAudioPreserved: z.literal(true),
    approvedChunkBoundaryAuthorityRead: z.literal(true),
    approvedChunkHardCutsApplied: z.literal(true),
    renderPurpose: z.literal('private_4k_delivery_master_v1'),
    deliveryProfileId: z.literal('uhd_2160'),
    immutableSourceMasterNoProxyPolicyVerified: z.literal(true),
    originalApprovedEstimateAndReservationReused: z.literal(true),
    secondEstimateCreated: z.literal(false),
    secondReservationCreated: z.literal(false),
    exportCreditMutationPerformed: z.literal(false),
    privateFinalCompositionExecuted: z.literal(true),
    providerCallMade: z.literal(false),
    publicDeliveryExecuted: z.literal(false),
  }).strict(),
  inputs: z.object({
    chunks: z.array(chunkInputSchema).min(2).max(8),
    combinedChunkByteLength: z.number().int().positive().max(640 * 1024 * 1024),
    chunkDependencySetEvidenceHash: sha,
    transitionPolicy: z.literal('approved_hard_cuts_only'),
    chunkBoundaryTransitionCount: z.number().int().min(1).max(7),
    frameContinuityPolicy: z.literal('exact_integer_frame_boundaries_v1'),
    audioPolicy: z.literal('preserve_approved_chunk_audio'),
  }).strict(),
  lease: z.object({
    leaseId: identity,
    attemptNumber: z.number().int().positive().max(10),
    immutableLeaseHash: sha,
    executionAttemptId: identity,
    runnerClass: z.literal('offline_remotion_render_execution_v1'),
    executionStartedAt: timestamp,
    executionCommitAuthorizedAt: timestamp,
    executionCompletedAt: timestamp,
    credentialReturned: z.literal(false),
    credentialHashReturned: z.literal(false),
  }).strict(),
  runtime: z.object({
    runtimeAuthorityHash: sha,
    imageIdentityHash: sha,
    executionAttestationHash: sha,
    requestEnvelopeSha256: sha,
    resultSha256: sha,
    packageName: z.literal('remotion+@remotion/renderer'),
    packageVersion: z.literal('4.0.487'),
    privateInternalFinalCompositionReady: z.literal(true),
    privateInternalLongFormMergeReady: z.literal(true),
    productReady: z.literal(false),
    externalBetaReady: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  qa: qaSchema,
  finalArtifactQa: qaSchema,
  result: z.object({
    artifactId: identity,
    qaEvaluationId: identity,
    reconciliationId: identity,
    artifactVersion: z.number().int().positive(),
    assetRole: z.literal('final'),
    contentType: z.literal('video/mp4'),
    sha256: sha,
    byteLength: z.number().int().positive().max(256 * 1024 * 1024),
    privateObjectIdentityHash: sha,
    qaOutcome: z.literal('passed'),
    reconciliationDecision: z.literal('test_merged_not_live_authorized'),
    privateFinalArtifactRecorded: z.literal(true),
    publicDeliveryAuthorized: z.literal(false),
    settlementAuthorized: z.literal(false),
  }).strict(),
  replay: z.object({
    dispatchConsumptionReplayed: z.boolean(),
    executionFenceBeginReplayed: z.boolean(),
    executionFenceCompleteReplayed: z.boolean(),
    artifactRecordReplayed: z.boolean(),
    qaRecordReplayed: z.boolean(),
    reconciliationReplayed: z.boolean(),
    sameIdempotentAttemptOnly: z.literal(true),
  }).strict(),
  permissions: z.object({
    furtherWorkerDispatch: z.literal(false),
    providerCall: z.literal(false),
    sourceObjectRead: z.literal(false),
    furtherRender: z.literal(false),
    publicDelivery: z.literal(false),
    creditSpend: z.literal(false),
    walletMutation: z.literal(false),
    settlement: z.literal(false),
  }).strict(),
  persistence: z.object({
    privateLocalCreateOnlyArtifact: z.literal(true),
    contentAddressedArtifactAuthority: z.literal(true),
    actualRunEvidenceVerified: z.literal(true),
    actualQaEvidenceVerified: z.literal(true),
    checksumProtectedAuthority: z.literal(true),
    mediaOutputStreamed: z.literal(true),
    largeMediaOutputOverLegacyBufferVerified: z.boolean(),
    distributedAuthority: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
  completedAt: timestamp,
  responseHash: sha,
  testOnly: z.literal(true),
}).strict().superRefine((response, context) => {
  const chunks = response.inputs.chunks
  const flattenedSourceIds = chunks.flatMap((chunk) => chunk.sourceSequenceItemIds)
  const flattenedCleanupIds = chunks.flatMap((chunk) => chunk.sourceCleanupDecisionIds)
  let expectedStart = 0
  let valid = chunks.length === response.tool.approvedChunkCount
  chunks.forEach((chunk, index) => {
    valid = valid &&
      chunk.chunkIndex === index + 1 &&
      chunk.chunkCount === chunks.length &&
      chunk.globalStartFrame === expectedStart
    expectedStart = chunk.globalEndFrameExclusive
  })
  valid = valid &&
    expectedStart >= CANONICAL_PRIVATE_LONG_FORM_MINIMUM_FRAMES &&
    expectedStart <= CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_FRAMES &&
    flattenedSourceIds.length >= 2 && flattenedSourceIds.length <= 8 &&
    new Set(flattenedSourceIds).size === flattenedSourceIds.length &&
    flattenedCleanupIds.length === flattenedSourceIds.length &&
    new Set(flattenedCleanupIds).size === flattenedCleanupIds.length &&
    response.inputs.combinedChunkByteLength === chunks.reduce(
      (total, chunk) => total + chunk.byteLength,
      0,
    ) &&
    response.qa.frameCount === expectedStart &&
    response.runtime.resultSha256 === response.result.sha256 &&
    response.inputs.chunkBoundaryTransitionCount === chunks.length - 1
  if (!valid) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['inputs', 'chunks'],
      message: 'Long-form merge response lost contiguous approved chunk lineage.',
    })
  }
})

export type RunCanonicalPrivateLongFormMergeInput = z.infer<
  typeof runCanonicalPrivateLongFormMergeSchema
>
export type CanonicalPrivateLongFormMergeResponse = z.infer<
  typeof canonicalPrivateLongFormMergeResponseSchema
>
