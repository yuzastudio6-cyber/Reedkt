import { z } from 'zod'

import { canonicalPrivateToolDispatchCredentialSchema } from './canonical-private-tool-dispatch-schemas'
import { canonicalWorkerLeaseCredentialSchema } from './canonical-worker-lease-authority-schemas'

const identity = z.string().min(1).max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => value === value.trim() && !value.includes('..'))
const sha = z.string().regex(/^[a-f0-9]{64}$/)
const timestamp = z.string().datetime({ offset: true })

const approvedVoiceTracksSchema = z.array(z.object({
  sourceSequenceItemId: identity,
  outputKey: identity,
  durationFrames: z.number().int().positive().max(240),
  voiceArtifactId: identity,
  voiceSha256: sha,
  voiceByteLength: z.number().int().min(44).max(2 * 1024 * 1024),
  voiceDependencyReadEvidenceHash: sha,
}).strict()).min(1).max(8)

const approvedHardCutTransitionsSchema = z.array(z.object({
  transitionTimingItemId: identity,
  refinedTransitionTimingItemId: identity,
  fromSegmentId: identity,
  toSegmentId: identity,
  fromSourceSequenceItemId: identity,
  toSourceSequenceItemId: identity,
  boundaryFrame: z.number().int().min(1).max(239),
}).strict()).min(1).max(7)

export const runCanonicalPrivateFinalCompositionSchema = z.object({
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  jobId: identity,
  grantId: identity,
  purpose: z.literal('execute_canonical_private_final_composition'),
  idempotencyKey: z.string().min(8).max(240).refine((value) => value === value.trim()),
}).strict()

export const canonicalPrivateFinalCompositionAuthoritySchema = z.object({
  leaseId: identity,
  leaseCredential: canonicalWorkerLeaseCredentialSchema,
  dispatchCredential: canonicalPrivateToolDispatchCredentialSchema,
}).strict()

const finalCompositionDependencyInputsSchema = z.object({
  sourceTrimArtifactId: identity, sourceTrimSha256: sha,
  sourceTrimByteLength: z.number().int().positive().max(1024 * 1024),
  sourceTrimDependencyReadEvidenceHash: sha,
  captionArtifactId: identity, captionSha256: sha,
  captionByteLength: z.number().int().positive().max(8 * 1024 * 1024),
  captionDependencyReadEvidenceHash: sha,
  voiceTracks: approvedVoiceTracksSchema.optional(),
}).strict()

const captionTrackDependencyInputsSchema = z.object({
  sourceTrimArtifactId: identity, sourceTrimSha256: sha,
  sourceTrimByteLength: z.number().int().positive().max(1024 * 1024),
  sourceTrimDependencyReadEvidenceHash: sha,
  captionOverlays: z.array(z.object({
    outputKey: identity,
    startFrame: z.number().int().nonnegative(),
    endFrameExclusive: z.number().int().positive(),
    captionArtifactId: identity,
    captionSha256: sha,
    captionByteLength: z.number().int().positive().max(8 * 1024 * 1024),
    captionDependencyReadEvidenceHash: sha,
  }).strict()).min(2).max(7),
  voiceTracks: approvedVoiceTracksSchema.optional(),
}).strict()

const singleSourceFinalCompositionInputsSchema = finalCompositionDependencyInputsSchema.extend({
  sourceSequenceItemId: identity, sourceMediaAssetId: identity,
  sourceSha256: sha, sourceByteLength: z.number().int().positive().max(16 * 1024 * 1024),
  sourceReadEvidenceHash: sha,
  sourceCleanupDecisionId: identity,
  sourceStartFrame: z.number().int().nonnegative(),
  sourceEndFrameExclusive: z.number().int().positive(),
}).strict()

const sourceSequenceFinalCompositionInputsSchema = finalCompositionDependencyInputsSchema.extend({
  sources: z.array(z.object({
    sourceSequenceItemId: identity,
    sourceMediaAssetId: identity,
    sourceSha256: sha,
    sourceByteLength: z.number().int().positive().max(16 * 1024 * 1024),
    sourceReadEvidenceHash: sha,
    sourceCleanupDecisionId: identity,
    sourceStartFrame: z.number().int().nonnegative(),
    sourceEndFrameExclusive: z.number().int().positive(),
    timelineStartFrame: z.number().int().nonnegative(),
    timelineEndFrameExclusive: z.number().int().positive(),
  }).strict()).min(2).max(8),
  transitionPolicy: z.literal('approved_hard_cuts_only'),
  hardCutTransitions: approvedHardCutTransitionsSchema,
  combinedSourceByteLength: z.number().int().positive().max(20 * 1024 * 1024),
  sourceSequenceReadEvidenceHash: sha,
}).strict()

const singleSourceCaptionTrackFinalCompositionInputsSchema = captionTrackDependencyInputsSchema.extend({
  sourceSequenceItemId: identity, sourceMediaAssetId: identity,
  sourceSha256: sha, sourceByteLength: z.number().int().positive().max(16 * 1024 * 1024),
  sourceReadEvidenceHash: sha,
  sourceCleanupDecisionId: identity,
  sourceStartFrame: z.number().int().nonnegative(),
  sourceEndFrameExclusive: z.number().int().positive(),
}).strict()

const sourceSequenceCaptionTrackFinalCompositionInputsSchema = captionTrackDependencyInputsSchema.extend({
  sources: z.array(z.object({
    sourceSequenceItemId: identity,
    sourceMediaAssetId: identity,
    sourceSha256: sha,
    sourceByteLength: z.number().int().positive().max(16 * 1024 * 1024),
    sourceReadEvidenceHash: sha,
    sourceCleanupDecisionId: identity,
    sourceStartFrame: z.number().int().nonnegative(),
    sourceEndFrameExclusive: z.number().int().positive(),
    timelineStartFrame: z.number().int().nonnegative(),
    timelineEndFrameExclusive: z.number().int().positive(),
  }).strict()).min(2).max(8),
  transitionPolicy: z.literal('approved_hard_cuts_only'),
  hardCutTransitions: approvedHardCutTransitionsSchema,
  combinedSourceByteLength: z.number().int().positive().max(20 * 1024 * 1024),
  sourceSequenceReadEvidenceHash: sha,
}).strict()

export const canonicalPrivateFinalCompositionResponseSchema = z.object({
  schemaVersion: z.literal('canonical-private-final-composition-execution-response-v2'),
  source: z.literal('canonical_private_final_composition_execution_coordinator'),
  purpose: z.literal('execute_canonical_private_final_composition'),
  identity: z.object({
    workspaceId: identity, projectId: identity, editSessionId: identity, snapshotId: identity,
    jobId: identity, approvedWorkItemId: identity, expectedAssetId: identity, dispatchGrantId: identity,
  }).strict(),
  tool: z.object({
    canonicalToolId: z.literal('remotion'),
    operationId: z.literal('tool.remotion.render_approved_composition.v1'),
    compositionProfileId: z.enum([
      'approved_source_caption_final_v1',
      'approved_source_sequence_caption_final_v1',
      'approved_source_caption_track_final_v1',
      'approved_source_sequence_caption_track_final_v1',
    ]),
    actualRemotionOperationCompleted: z.literal(true),
    approvedSourceObjectRead: z.literal(true),
    approvedSourceTrimDependencyRead: z.literal(true),
    approvedSourceTrimFramesApplied: z.literal(true),
    approvedHardCutTransitionAuthorityRead: z.boolean(),
    approvedHardCutTransitionsApplied: z.boolean(),
    approvedCaptionDependencyRead: z.literal(true),
    approvedCaptionTrackTimingApplied: z.boolean(),
    audioPolicy: z.enum([
      'preserve_source',
      'preserve_source_sequence',
      'replace_with_approved_voice_tracks',
    ]),
    sourceAudioPreserved: z.boolean(),
    approvedVoiceTrackDependencyRead: z.boolean(),
    approvedVoiceTrackReplacementApplied: z.boolean(),
    privateFinalCompositionExecuted: z.literal(true),
    providerCallMade: z.literal(false),
    publicDeliveryExecuted: z.literal(false),
  }).strict(),
  inputs: z.union([
    singleSourceFinalCompositionInputsSchema,
    sourceSequenceFinalCompositionInputsSchema,
    singleSourceCaptionTrackFinalCompositionInputsSchema,
    sourceSequenceCaptionTrackFinalCompositionInputsSchema,
  ]),
  lease: z.object({
    leaseId: identity, attemptNumber: z.number().int().positive().max(10), immutableLeaseHash: sha,
    executionAttemptId: identity, runnerClass: z.literal('offline_remotion_render_execution_v1'),
    executionStartedAt: timestamp, executionCommitAuthorizedAt: timestamp, executionCompletedAt: timestamp,
    credentialReturned: z.literal(false), credentialHashReturned: z.literal(false),
  }).strict(),
  runtime: z.object({
    runtimeAuthorityHash: sha, imageIdentityHash: sha, executionAttestationHash: sha,
    requestEnvelopeSha256: sha, resultSha256: sha,
    packageName: z.literal('remotion+@remotion/renderer'), packageVersion: z.literal('4.0.487'),
    privateInternalFinalCompositionReady: z.literal(true),
    productReady: z.literal(false), externalBetaReady: z.literal(false), productionReady: z.literal(false),
  }).strict(),
  qa: z.object({
    independentFfprobeExecuted: z.literal(true), binaryVersion: z.literal('8.1.2'),
    videoCodecName: z.literal('h264'), pixelFormat: z.literal('yuv420p'), colorSpace: z.literal('bt709'),
    width: z.number().int().positive(), height: z.number().int().positive(),
    fps: z.number().positive(), frameCount: z.number().int().positive(),
    audioCodecName: z.literal('aac'), audioSampleRate: z.literal(48_000),
    audioChannels: z.number().int().min(1).max(2),
    approvedDurationSeconds: z.number().positive(), actualDurationSeconds: z.number().positive(),
    maximumDurationDriftFrames: z.literal(2), durationDriftFrames: z.number().int().min(0).max(2),
    finalQaGatesPassed: z.literal(true), reportSha256: sha,
  }).strict(),
  result: z.object({
    artifactId: identity, qaEvaluationId: identity, reconciliationId: identity,
    artifactVersion: z.number().int().positive(), assetRole: z.literal('final'),
    contentType: z.literal('video/mp4'), sha256: sha,
    byteLength: z.number().int().positive().max(16 * 1024 * 1024),
    privateObjectIdentityHash: sha, qaOutcome: z.literal('passed'),
    reconciliationDecision: z.literal('test_merged_not_live_authorized'),
    privateFinalArtifactRecorded: z.literal(true), publicDeliveryAuthorized: z.literal(false),
    settlementAuthorized: z.literal(false),
  }).strict(),
  replay: z.object({
    dispatchConsumptionReplayed: z.boolean(), executionFenceBeginReplayed: z.boolean(),
    executionFenceCompleteReplayed: z.boolean(), artifactRecordReplayed: z.boolean(),
    qaRecordReplayed: z.boolean(), reconciliationReplayed: z.boolean(), sameIdempotentAttemptOnly: z.literal(true),
  }).strict(),
  permissions: z.object({
    furtherWorkerDispatch: z.literal(false), providerCall: z.literal(false), sourceObjectRead: z.literal(false),
    furtherRender: z.literal(false), publicDelivery: z.literal(false), creditSpend: z.literal(false),
    walletMutation: z.literal(false), settlement: z.literal(false),
  }).strict(),
  persistence: z.object({
    privateLocalCreateOnlyArtifact: z.literal(true), contentAddressedArtifactAuthority: z.literal(true),
    actualRunEvidenceVerified: z.literal(true), actualQaEvidenceVerified: z.literal(true),
    checksumProtectedAuthority: z.literal(true), distributedAuthority: z.literal(false), productionAuthority: z.literal(false),
  }).strict(),
  completedAt: timestamp,
  responseHash: sha,
  testOnly: z.literal(true),
}).strict().superRefine((value, context) => {
  const replacement = value.tool.audioPolicy === 'replace_with_approved_voice_tracks'
  const voiceTracks = value.inputs.voiceTracks
  const sequenceProfile = value.tool.compositionProfileId.includes('source_sequence')
  const preservedPolicyMatchesProfile = sequenceProfile
    ? value.tool.audioPolicy === 'preserve_source_sequence'
    : value.tool.audioPolicy === 'preserve_source'
  if (
    replacement
      ? (
          value.tool.sourceAudioPreserved || !value.tool.approvedVoiceTrackDependencyRead ||
          !value.tool.approvedVoiceTrackReplacementApplied || !voiceTracks?.length
        )
      : (
          !preservedPolicyMatchesProfile || !value.tool.sourceAudioPreserved ||
          value.tool.approvedVoiceTrackDependencyRead ||
          value.tool.approvedVoiceTrackReplacementApplied || voiceTracks !== undefined
        )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['tool', 'audioPolicy'],
      message: 'Final-composition audio policy and source-bound voice evidence diverged.',
    })
  }
  const sequenceInputs = 'sources' in value.inputs
  let hardCutEvidenceValid: boolean
  if ('sources' in value.inputs) {
    const sequence = value.inputs
    const timingIds = new Set<string>()
    const refinedTimingIds = new Set<string>()
    hardCutEvidenceValid =
      value.tool.approvedHardCutTransitionAuthorityRead &&
      value.tool.approvedHardCutTransitionsApplied &&
      sequence.transitionPolicy === 'approved_hard_cuts_only' &&
      sequence.hardCutTransitions.length === sequence.sources.length - 1 &&
      sequence.hardCutTransitions.every((transition, index) => {
        const fromSource = sequence.sources[index]
        const toSource = sequence.sources[index + 1]
        const unique =
          !timingIds.has(transition.transitionTimingItemId) &&
          !refinedTimingIds.has(transition.refinedTransitionTimingItemId)
        timingIds.add(transition.transitionTimingItemId)
        refinedTimingIds.add(transition.refinedTransitionTimingItemId)
        return unique && Boolean(
          fromSource && toSource &&
          transition.fromSourceSequenceItemId === fromSource.sourceSequenceItemId &&
          transition.toSourceSequenceItemId === toSource.sourceSequenceItemId &&
          transition.boundaryFrame === fromSource.timelineEndFrameExclusive &&
          transition.boundaryFrame === toSource.timelineStartFrame
        )
      })
  } else {
    hardCutEvidenceValid =
      !value.tool.approvedHardCutTransitionAuthorityRead &&
      !value.tool.approvedHardCutTransitionsApplied
  }
  if (
    sequenceProfile !== sequenceInputs ||
    !hardCutEvidenceValid
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['tool', 'approvedHardCutTransitionsApplied'],
      message: 'Final-composition hard-cut evidence diverged from the approved sequence profile.',
    })
  }
})

export type RunCanonicalPrivateFinalCompositionInput = z.infer<typeof runCanonicalPrivateFinalCompositionSchema>
export type CanonicalPrivateFinalCompositionAuthority = z.infer<typeof canonicalPrivateFinalCompositionAuthoritySchema>
export type CanonicalPrivateFinalCompositionResponse = z.infer<typeof canonicalPrivateFinalCompositionResponseSchema>
