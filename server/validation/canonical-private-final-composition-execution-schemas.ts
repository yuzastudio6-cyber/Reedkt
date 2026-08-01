import { z } from 'zod'

import {
  CANONICAL_PRIVATE_COMPOSITION_MINIMUM_FRAMES,
  CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_FRAMES,
  CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES,
  CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES,
  CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_HARD_CUTS,
  CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_ITEMS,
  CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID,
  CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MAXIMUM_CHUNKS,
  CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MAXIMUM_FRAMES,
  CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID,
  CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_MAXIMUM_CHUNKS,
  CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_MAXIMUM_FRAMES,
} from '../../src/types/canonical-private-composition-capacity'
import { REEDITPRO_SOURCE_MEDIA_MAX_BYTES } from '../../src/types/large-media'
import {
  OFFLINE_MEDIA_BINARY_STREAMING_MAXIMUM_AUDIO_OUTPUT_BYTES,
  OFFLINE_MEDIA_BINARY_STREAMING_MAXIMUM_OUTPUT_BYTES,
} from '../tool-execution/media-binary-execution/offline-media-binary-types'
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

const approvedVoiceTracksSchema = z.array(z.object({
  sourceSequenceItemId: identity,
  outputKey: identity,
  durationFrames: z.number().int().positive()
    .max(CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES),
  voiceArtifactId: identity,
  voiceSha256: sha,
  voiceByteLength: z.number().int().min(44)
    .max(OFFLINE_MEDIA_BINARY_STREAMING_MAXIMUM_AUDIO_OUTPUT_BYTES),
  voiceDependencyReadEvidenceHash: sha,
}).strict()).min(1).max(8)

const approvedSupplementalAudioTracksSchema = z.array(z.object({
  outputKey: identity,
  attachmentId: identity,
  markerId: identity,
  markerType: z.enum(['music', 'sfx']),
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive()
    .max(CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES),
  fillPolicy: z.enum(['loop_or_trim_to_window', 'trim_without_loop']),
  mixProfileId: z.enum([
    'speech_safe_uploaded_music_bed_v1',
    'narration_protected_uploaded_sfx_v1',
  ]),
  audioArtifactId: identity,
  audioSha256: sha,
  audioByteLength: z.number().int().min(44)
    .max(OFFLINE_MEDIA_BINARY_STREAMING_MAXIMUM_AUDIO_OUTPUT_BYTES),
  audioDependencyReadEvidenceHash: sha,
}).strict().superRefine((track, context) => {
  const policyMatches = track.markerType === 'music'
    ? (
        track.fillPolicy === 'loop_or_trim_to_window' &&
        track.mixProfileId === 'speech_safe_uploaded_music_bed_v1'
      )
    : (
        track.fillPolicy === 'trim_without_loop' &&
        track.mixProfileId === 'narration_protected_uploaded_sfx_v1'
      )
  if (track.endFrameExclusive <= track.startFrame || !policyMatches) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endFrameExclusive'],
      message: 'Supplemental audio placement and mix policy are inconsistent.',
    })
  }
})).min(1).max(16).superRefine((tracks, context) => {
  for (const field of ['outputKey', 'attachmentId', 'markerId'] as const) {
    if (new Set(tracks.map((track) => track[field])).size !== tracks.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: 'Supplemental audio identities must be unique.',
      })
    }
  }
  tracks.forEach((track, index) => {
    const previous = tracks[index - 1]
    if (
      previous &&
      (
        track.startFrame < previous.startFrame ||
        (
          track.startFrame === previous.startFrame &&
          track.markerId.localeCompare(previous.markerId) < 0
        )
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [index, 'startFrame'],
        message: 'Supplemental audio placements must retain canonical order.',
      })
    }
  })
})

const approvedLivingFrameOverlaysSchema = z.array(z.object({
  sceneId: identity,
  layerId: identity,
  startFrame: z.number().int().nonnegative()
    .max(CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES - 1),
  endFrameExclusive: z.number().int().positive()
    .max(CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES),
  motionSpecDigestSha256: sha,
  depthStyle: z.enum([
    'flat',
    'shallow_2_5d',
    'deep_multiplane',
  ]),
  cameraOrSourceAttentionApplied: z.boolean(),
  manifestArtifactId: identity,
  manifestSha256: sha,
  manifestByteLength: z.number().int().positive().max(1024 * 1024),
  manifestDependencyReadEvidenceHash: sha,
  componentArtifactId: identity,
  componentSha256: sha,
  componentByteLength: z.number().int().min(67).max(16 * 1024 * 1024),
  componentDependencyReadEvidenceHash: sha,
}).strict()).min(1).max(16).superRefine((overlays, context) => {
  for (
    const field of [
      'sceneId',
      'layerId',
      'manifestArtifactId',
      'componentArtifactId',
    ] as const
  ) {
    if (new Set(overlays.map((overlay) => overlay[field])).size !== overlays.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: 'Living Frame overlay identities must be unique.',
      })
    }
  }
  overlays.forEach((overlay, index) => {
    const previous = overlays[index - 1]
    if (
      overlay.endFrameExclusive <= overlay.startFrame ||
      (
        previous &&
        (
          overlay.startFrame < previous.startFrame ||
          (
            overlay.startFrame === previous.startFrame &&
            overlay.layerId.localeCompare(previous.layerId) <= 0
          )
        )
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [index, 'startFrame'],
        message: 'Living Frame overlays must retain their approved timeline order.',
      })
    }
  })
})

const approvedColorSourceSchema = z.object({
  sourceSequenceItemId: identity,
  outputKey: identity,
  sourceCleanupDecisionId: identity,
  originalSourceStartFrame: z.number().int().nonnegative(),
  originalSourceEndFrameExclusive: z.number().int().positive(),
  compositionStartFrame: z.literal(0),
  compositionEndFrameExclusive: z.number().int().positive()
    .max(CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES),
  durationFrames: z.number().int().positive()
    .max(CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES),
  colorGradeStyle: z.enum(['clean_natural', 'premium_clean']),
  intensity: z.enum(['subtle', 'balanced']),
  approvedColorOperationIds: z.array(identity).min(1).max(32)
    .refine((value) => new Set(value).size === value.length),
  approvedColorOperationKinds: z.array(z.enum([
    'clarity',
    'contrast_curve',
    'exposure_correction',
    'highlight_recovery',
    'look_transform',
    'qa_histogram_check',
    'saturation',
    'shot_matching',
    'white_balance',
  ])).min(6).max(8).refine((value) => new Set(value).size === value.length),
  referenceSourceSequenceItemId: identity.optional(),
  referenceOutputKey: identity.optional(),
  referenceDurationFrames: z.number().int().positive()
    .max(CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES).optional(),
  outputColorSpace: z.literal('bt709'),
  outputPixelFormat: z.literal('yuv420p'),
  colorArtifactId: identity,
  colorSha256: sha,
  colorByteLength: z.number().int().min(64)
    .max(OFFLINE_MEDIA_BINARY_STREAMING_MAXIMUM_OUTPUT_BYTES),
  colorDependencyReadEvidenceHash: sha,
}).strict()

const approvedHardCutTransitionsSchema = z.array(z.object({
  transitionTimingItemId: identity,
  refinedTransitionTimingItemId: identity,
  fromSegmentId: identity,
  toSegmentId: identity,
  fromSourceSequenceItemId: identity,
  toSourceSequenceItemId: identity,
  boundaryFrame: z.number().int().min(1)
    .max(CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES - 1),
}).strict()).min(1).max(CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_HARD_CUTS)

const approvedBoundedSourceTransitionsSchema = z.array(z.object({
  transitionTimingItemId: identity,
  refinedTransitionTimingItemId: identity,
  fromSegmentId: identity,
  toSegmentId: identity,
  fromSourceSequenceItemId: identity,
  toSourceSequenceItemId: identity,
  boundaryFrame: z.number().int().min(1)
    .max(CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES - 1),
  transitionType: z.enum(['hard_cut', 'smooth_panel_dip']),
  startFrame: z.number().int().nonnegative()
    .max(CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES - 1),
  endFrameExclusive: z.number().int().nonnegative()
    .max(CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES),
  durationFrames: z.number().int().nonnegative()
    .max(CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES),
  visualCurve: z.enum(['none', 'linear_dip_to_panel']),
  audioPolicy: z.literal('hard_cut_at_boundary'),
}).strict()).min(1).max(CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_HARD_CUTS)
  .refine((transitions) => transitions.some((transition) =>
    transition.transitionType === 'smooth_panel_dip'), {
    message: 'Bounded source-transition evidence requires at least one panel dip.',
  })

const sourceSequenceInputSchema = z.object({
  sourceSequenceItemId: identity,
  sourceMediaAssetId: identity,
  sourceSha256: sha,
  sourceByteLength: z.number().int().positive().max(REEDITPRO_SOURCE_MEDIA_MAX_BYTES),
  sourceReadEvidenceHash: sha,
  sourceStagingEvidenceHash: sha,
  sourceCleanupDecisionId: identity,
  sourceStartFrame: z.number().int().nonnegative(),
  sourceEndFrameExclusive: z.number().int().positive(),
  timelineStartFrame: z.number().int().nonnegative()
    .max(CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES - 1),
  timelineEndFrameExclusive: z.number().int().positive()
    .max(CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES),
}).strict().superRefine((value, context) => {
  const sourceDurationFrames = value.sourceEndFrameExclusive - value.sourceStartFrame
  const timelineDurationFrames = value.timelineEndFrameExclusive - value.timelineStartFrame
  if (
    sourceDurationFrames <= 0 || timelineDurationFrames <= 0 ||
    sourceDurationFrames !== timelineDurationFrames ||
    timelineDurationFrames > CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['timelineEndFrameExclusive'],
      message: 'Source-sequence evidence must preserve one bounded source-operation duration.',
    })
  }
})

const sourceSequenceInputsSchema = z.array(sourceSequenceInputSchema).min(2)
  .max(CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_ITEMS)
  .superRefine((sources, context) => {
    let expectedTimelineStartFrame = 0
    sources.forEach((source, index) => {
      if (source.timelineStartFrame !== expectedTimelineStartFrame) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, 'timelineStartFrame'],
          message: 'Source-sequence evidence must be contiguous from frame zero.',
        })
      }
      expectedTimelineStartFrame = source.timelineEndFrameExclusive
    })
  })

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
  supplementalAudioTracks: approvedSupplementalAudioTracksSchema.optional(),
  livingFrameOverlays: approvedLivingFrameOverlaysSchema.optional(),
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
  }).strict()).min(1).max(7),
  voiceTracks: approvedVoiceTracksSchema.optional(),
  supplementalAudioTracks: approvedSupplementalAudioTracksSchema.optional(),
  livingFrameOverlays: approvedLivingFrameOverlaysSchema.optional(),
}).strict()

const singleSourceFinalCompositionInputsSchema = finalCompositionDependencyInputsSchema.extend({
  sourceSequenceItemId: identity, sourceMediaAssetId: identity,
  sourceSha256: sha,
  sourceByteLength: z.number().int().positive().max(REEDITPRO_SOURCE_MEDIA_MAX_BYTES),
  sourceReadEvidenceHash: sha,
  sourceStagingEvidenceHash: sha,
  sourceCleanupDecisionId: identity,
  sourceStartFrame: z.number().int().nonnegative(),
  sourceEndFrameExclusive: z.number().int().positive(),
  colorSource: approvedColorSourceSchema.optional(),
}).strict()

const sourceSequenceFinalCompositionInputsBaseSchema =
finalCompositionDependencyInputsSchema.extend({
  sources: sourceSequenceInputsSchema,
  combinedSourceByteLength: z.number().int().positive().max(REEDITPRO_SOURCE_MEDIA_MAX_BYTES * 8),
  sourceSequenceReadEvidenceHash: sha,
  colorSources: z.array(approvedColorSourceSchema).min(2).max(8).optional(),
}).strict()
const sourceSequenceFinalCompositionHardCutInputsSchema =
  sourceSequenceFinalCompositionInputsBaseSchema.extend({
    transitionPolicy: z.literal('approved_hard_cuts_only'),
    hardCutTransitions: approvedHardCutTransitionsSchema,
  }).strict()
const sourceSequenceFinalCompositionBoundedTransitionInputsSchema =
  sourceSequenceFinalCompositionInputsBaseSchema.extend({
    transitionPolicy: z.literal('approved_bounded_source_transitions_v1'),
    sourceTransitions: approvedBoundedSourceTransitionsSchema,
  }).strict()
const sourceSequenceFinalCompositionInputsSchema = z.discriminatedUnion(
  'transitionPolicy',
  [
    sourceSequenceFinalCompositionHardCutInputsSchema,
    sourceSequenceFinalCompositionBoundedTransitionInputsSchema,
  ],
)

const singleSourceCaptionTrackFinalCompositionInputsSchema = captionTrackDependencyInputsSchema.extend({
  sourceSequenceItemId: identity, sourceMediaAssetId: identity,
  sourceSha256: sha,
  sourceByteLength: z.number().int().positive().max(REEDITPRO_SOURCE_MEDIA_MAX_BYTES),
  sourceReadEvidenceHash: sha,
  sourceStagingEvidenceHash: sha,
  sourceCleanupDecisionId: identity,
  sourceStartFrame: z.number().int().nonnegative(),
  sourceEndFrameExclusive: z.number().int().positive(),
  colorSource: approvedColorSourceSchema.optional(),
}).strict()

const sourceSequenceCaptionTrackFinalCompositionInputsBaseSchema =
captionTrackDependencyInputsSchema.extend({
  sources: sourceSequenceInputsSchema,
  combinedSourceByteLength: z.number().int().positive().max(REEDITPRO_SOURCE_MEDIA_MAX_BYTES * 8),
  sourceSequenceReadEvidenceHash: sha,
  colorSources: z.array(approvedColorSourceSchema).min(2).max(8).optional(),
}).strict()
const sourceSequenceCaptionTrackFinalCompositionHardCutInputsSchema =
  sourceSequenceCaptionTrackFinalCompositionInputsBaseSchema.extend({
    transitionPolicy: z.literal('approved_hard_cuts_only'),
    hardCutTransitions: approvedHardCutTransitionsSchema,
  }).strict()
const sourceSequenceCaptionTrackFinalCompositionBoundedTransitionInputsSchema =
  sourceSequenceCaptionTrackFinalCompositionInputsBaseSchema.extend({
    transitionPolicy: z.literal('approved_bounded_source_transitions_v1'),
    sourceTransitions: approvedBoundedSourceTransitionsSchema,
  }).strict()
const sourceSequenceCaptionTrackFinalCompositionInputsSchema =
  z.discriminatedUnion('transitionPolicy', [
    sourceSequenceCaptionTrackFinalCompositionHardCutInputsSchema,
    sourceSequenceCaptionTrackFinalCompositionBoundedTransitionInputsSchema,
  ])

export const canonicalPrivateFinalCompositionResponseSchema = z.object({
  schemaVersion: z.literal('canonical-private-final-composition-execution-response-v6'),
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
    approvedSourceInputMode: z.literal('server_injected_private_stream_v1'),
    approvedSourceStagingCleaned: z.literal(true),
    approvedSourceCapacityEvidenceHash: sha,
    approvedSourceTrimDependencyRead: z.literal(true),
    approvedSourceTrimFramesApplied: z.literal(true),
    approvedHardCutTransitionAuthorityRead: z.boolean(),
    approvedHardCutTransitionsApplied: z.boolean(),
    approvedBoundedSourceTransitionAuthorityRead: z.boolean(),
    approvedSmoothPanelDipsApplied: z.boolean(),
    approvedTransitionAudioHardCutsPreserved: z.boolean(),
    approvedCaptionDependencyRead: z.literal(true),
    approvedCaptionTrackTimingApplied: z.boolean(),
    audioPolicy: z.enum([
      'preserve_source',
      'preserve_source_sequence',
      'replace_with_approved_voice_tracks',
    ]),
    sourceAudioPreserved: z.boolean(),
    approvedVoiceTrackDependencyRead: z.boolean(),
    approvedVoiceTrackDependencyInputMode: z.enum([
      'not_applicable',
      'server_injected_private_stream_v1',
    ]),
    approvedVoiceTrackReplacementApplied: z.boolean(),
    approvedSupplementalAudioDependencyRead: z.boolean(),
    approvedSupplementalAudioDependencyInputMode: z.enum([
      'not_applicable',
      'server_injected_private_stream_v1',
    ]),
    approvedSupplementalAudioTimelineApplied: z.boolean(),
    approvedSupplementalAudioSpeechSafeMixApplied: z.boolean(),
    approvedLivingFrameLayerManifestDependencyRead: z.boolean(),
    approvedLivingFrameOverlayDependencyRead: z.boolean(),
    approvedLivingFrameOverlayTimelineApplied: z.boolean(),
    approvedLivingFrameOverlayBelowCaptionsApplied: z.boolean(),
    approvedLivingFrameDeterministicMotionApplied: z.boolean(),
    approvedLivingFrameAdaptiveDepthStyleApplied: z.boolean(),
    approvedLivingFrameCameraOrSourceAttentionApplied: z.boolean(),
    approvedColorDependencyRead: z.boolean(),
    approvedColorDependencyInputMode: z.enum([
      'not_applicable',
      'server_injected_private_stream_v1',
    ]),
    approvedColorIntermediateApplied: z.boolean(),
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
    byteLength: z.number().int().positive().max(256 * 1024 * 1024),
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
          value.tool.approvedVoiceTrackDependencyInputMode !== 'server_injected_private_stream_v1' ||
          !value.tool.approvedVoiceTrackReplacementApplied || !voiceTracks?.length
        )
      : (
          !preservedPolicyMatchesProfile || !value.tool.sourceAudioPreserved ||
          value.tool.approvedVoiceTrackDependencyRead ||
          value.tool.approvedVoiceTrackDependencyInputMode !== 'not_applicable' ||
          value.tool.approvedVoiceTrackReplacementApplied || voiceTracks !== undefined
        )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['tool', 'audioPolicy'],
      message: 'Final-composition audio policy and source-bound voice evidence diverged.',
    })
  }
  const supplementalAudioTracks = value.inputs.supplementalAudioTracks
  const supplementalAudioEnabled = Boolean(supplementalAudioTracks?.length)
  if (
    value.tool.approvedSupplementalAudioDependencyRead !== supplementalAudioEnabled ||
    value.tool.approvedSupplementalAudioTimelineApplied !== supplementalAudioEnabled ||
    value.tool.approvedSupplementalAudioSpeechSafeMixApplied !== supplementalAudioEnabled ||
    value.tool.approvedSupplementalAudioDependencyInputMode !== (
      supplementalAudioEnabled
        ? 'server_injected_private_stream_v1'
        : 'not_applicable'
    ) ||
    supplementalAudioTracks?.some((track) =>
      track.endFrameExclusive > value.qa.frameCount)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['tool', 'approvedSupplementalAudioTimelineApplied'],
      message:
        'Final-composition supplemental-audio evidence diverged from its approved Edit Brief timeline.',
    })
  }
  const livingFrameOverlays = value.inputs.livingFrameOverlays
  const livingFrameEnabled = Boolean(livingFrameOverlays?.length)
  if (
    value.tool.approvedLivingFrameLayerManifestDependencyRead !==
      livingFrameEnabled ||
    value.tool.approvedLivingFrameOverlayDependencyRead !==
      livingFrameEnabled ||
    value.tool.approvedLivingFrameOverlayTimelineApplied !==
      livingFrameEnabled ||
    value.tool.approvedLivingFrameOverlayBelowCaptionsApplied !==
      livingFrameEnabled ||
    value.tool.approvedLivingFrameDeterministicMotionApplied !==
      livingFrameEnabled ||
    value.tool.approvedLivingFrameAdaptiveDepthStyleApplied !==
      livingFrameEnabled ||
    value.tool.approvedLivingFrameCameraOrSourceAttentionApplied !==
      Boolean(
        livingFrameOverlays?.some(
          (overlay) =>
            overlay.cameraOrSourceAttentionApplied,
        ),
      ) ||
    livingFrameOverlays?.some((overlay) =>
      overlay.endFrameExclusive > value.qa.frameCount)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['tool', 'approvedLivingFrameOverlayTimelineApplied'],
      message:
        'Final-composition Living Frame evidence diverged from its approved layer timeline.',
    })
  }
  const sequenceInputs = 'sources' in value.inputs
  const colorSource = 'colorSource' in value.inputs ? value.inputs.colorSource : undefined
  const colorSources = 'colorSources' in value.inputs ? value.inputs.colorSources : undefined
  let colorEvidenceValid =
    !colorSource && !colorSources &&
    !value.tool.approvedColorDependencyRead && !value.tool.approvedColorIntermediateApplied &&
    value.tool.approvedColorDependencyInputMode === 'not_applicable'
  if (colorSource && !('sources' in value.inputs)) {
    colorEvidenceValid =
      !sequenceProfile && replacement &&
      value.tool.approvedColorDependencyRead &&
      value.tool.approvedColorDependencyInputMode === 'server_injected_private_stream_v1' &&
      value.tool.approvedColorIntermediateApplied &&
      colorSource.sourceSequenceItemId === value.inputs.sourceSequenceItemId &&
      colorSource.sourceCleanupDecisionId === value.inputs.sourceCleanupDecisionId &&
      colorSource.originalSourceStartFrame === value.inputs.sourceStartFrame &&
      colorSource.originalSourceEndFrameExclusive === value.inputs.sourceEndFrameExclusive &&
      colorSource.originalSourceEndFrameExclusive - colorSource.originalSourceStartFrame ===
        colorSource.durationFrames &&
      colorSource.compositionEndFrameExclusive === colorSource.durationFrames &&
      colorSource.referenceSourceSequenceItemId === undefined &&
      colorSource.referenceOutputKey === undefined &&
      colorSource.referenceDurationFrames === undefined &&
      !colorSource.approvedColorOperationKinds.includes('shot_matching')
  }
  if (colorSources && 'sources' in value.inputs) {
    const sourceInputs = value.inputs.sources
    const outputKeys = new Set<string>()
    colorEvidenceValid =
      sequenceProfile && replacement &&
      value.tool.approvedColorDependencyRead &&
      value.tool.approvedColorDependencyInputMode === 'server_injected_private_stream_v1' &&
      value.tool.approvedColorIntermediateApplied &&
      colorSources.length === sourceInputs.length &&
      colorSources.every((candidate, index) => {
        const source = sourceInputs[index]!
        const baseline = colorSources[0]!
        const referenceFields = [
          candidate.referenceSourceSequenceItemId,
          candidate.referenceOutputKey,
          candidate.referenceDurationFrames,
        ]
        const referencesValid = index === 0
          ? referenceFields.every((entry) => entry === undefined) &&
            !candidate.approvedColorOperationKinds.includes('shot_matching')
          : candidate.referenceSourceSequenceItemId === baseline.sourceSequenceItemId &&
            candidate.referenceOutputKey === baseline.outputKey &&
            candidate.referenceDurationFrames === baseline.durationFrames &&
            candidate.approvedColorOperationKinds.includes('shot_matching')
        const valid = !outputKeys.has(candidate.outputKey) && referencesValid &&
          candidate.sourceSequenceItemId === source.sourceSequenceItemId &&
          candidate.sourceCleanupDecisionId === source.sourceCleanupDecisionId &&
          candidate.originalSourceStartFrame === source.sourceStartFrame &&
          candidate.originalSourceEndFrameExclusive === source.sourceEndFrameExclusive &&
          candidate.originalSourceEndFrameExclusive - candidate.originalSourceStartFrame ===
            candidate.durationFrames &&
          candidate.compositionStartFrame === 0 &&
          candidate.compositionEndFrameExclusive === candidate.durationFrames
        outputKeys.add(candidate.outputKey)
        return valid
      })
  }
  if (!colorEvidenceValid) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['tool', 'approvedColorIntermediateApplied'],
      message: 'Final-composition professional color evidence diverged from its source-bound intermediate.',
    })
  }
  let transitionEvidenceValid: boolean
  if ('sources' in value.inputs) {
    const sequence = value.inputs
    const timingIds = new Set<string>()
    const refinedTimingIds = new Set<string>()
    const exactHardCutsValid = (
      transitions: z.infer<typeof approvedHardCutTransitionsSchema>,
    ) => transitions.length === sequence.sources.length - 1 &&
      transitions.every((transition, index) => {
        const fromSource = sequence.sources[index]
        const toSource = sequence.sources[index + 1]
        const unique =
          !timingIds.has(transition.transitionTimingItemId) &&
          !refinedTimingIds.has(transition.refinedTransitionTimingItemId)
        timingIds.add(transition.transitionTimingItemId)
        refinedTimingIds.add(transition.refinedTransitionTimingItemId)
        const commonValid = unique && Boolean(
          fromSource && toSource &&
          transition.fromSourceSequenceItemId === fromSource.sourceSequenceItemId &&
          transition.toSourceSequenceItemId === toSource.sourceSequenceItemId &&
          transition.boundaryFrame === fromSource.timelineEndFrameExclusive &&
          transition.boundaryFrame === toSource.timelineStartFrame
        )
        return commonValid
      })
    const exactBoundedTransitionsValid = (
      transitions: z.infer<typeof approvedBoundedSourceTransitionsSchema>,
    ) => {
      let previousEndFrameExclusive = 0
      return transitions.length === sequence.sources.length - 1 &&
        transitions.every((transition, index) => {
          const fromSource = sequence.sources[index]
          const toSource = sequence.sources[index + 1]
          const unique =
            !timingIds.has(transition.transitionTimingItemId) &&
            !refinedTimingIds.has(transition.refinedTransitionTimingItemId)
          timingIds.add(transition.transitionTimingItemId)
          refinedTimingIds.add(transition.refinedTransitionTimingItemId)
          const commonValid = unique && Boolean(
            fromSource && toSource &&
            transition.fromSourceSequenceItemId ===
              fromSource.sourceSequenceItemId &&
            transition.toSourceSequenceItemId ===
              toSource.sourceSequenceItemId &&
            transition.boundaryFrame === fromSource.timelineEndFrameExclusive &&
            transition.boundaryFrame === toSource.timelineStartFrame
          )
        const panelDurationFrames = Math.round(value.qa.fps * 0.4)
        const panelStartFrame =
          transition.boundaryFrame - Math.floor(panelDurationFrames / 2)
        const hardCutValid =
          transition.transitionType === 'hard_cut' &&
          transition.startFrame === transition.boundaryFrame &&
          transition.endFrameExclusive === transition.boundaryFrame &&
          transition.durationFrames === 0 &&
          transition.visualCurve === 'none'
        const panelDipValid =
          transition.transitionType === 'smooth_panel_dip' &&
          transition.startFrame === panelStartFrame &&
          transition.endFrameExclusive === panelStartFrame +
            panelDurationFrames &&
          transition.durationFrames === panelDurationFrames &&
          transition.visualCurve === 'linear_dip_to_panel' &&
          transition.startFrame >= (fromSource?.timelineStartFrame ?? -1) &&
          transition.endFrameExclusive <=
            (toSource?.timelineEndFrameExclusive ?? -1)
        const nonOverlapping =
          transition.startFrame >= previousEndFrameExclusive
        previousEndFrameExclusive = transition.endFrameExclusive
        return commonValid && transition.audioPolicy ===
          'hard_cut_at_boundary' && nonOverlapping &&
          (hardCutValid || panelDipValid)
        })
    }
    const exactTransitionsValid =
      sequence.transitionPolicy === 'approved_hard_cuts_only'
        ? exactHardCutsValid(sequence.hardCutTransitions)
        : exactBoundedTransitionsValid(sequence.sourceTransitions)
    transitionEvidenceValid =
      value.tool.approvedTransitionAudioHardCutsPreserved &&
      exactTransitionsValid &&
      (sequence.transitionPolicy === 'approved_hard_cuts_only'
        ? (
            value.tool.approvedHardCutTransitionAuthorityRead &&
            value.tool.approvedHardCutTransitionsApplied &&
            !value.tool.approvedBoundedSourceTransitionAuthorityRead &&
            !value.tool.approvedSmoothPanelDipsApplied
          )
        : (
            !value.tool.approvedHardCutTransitionAuthorityRead &&
            !value.tool.approvedHardCutTransitionsApplied &&
            value.tool.approvedBoundedSourceTransitionAuthorityRead &&
            value.tool.approvedSmoothPanelDipsApplied &&
            sequence.sourceTransitions.some((transition) =>
              transition.transitionType === 'smooth_panel_dip')
          ))
  } else {
    transitionEvidenceValid =
      !value.tool.approvedHardCutTransitionAuthorityRead &&
      !value.tool.approvedHardCutTransitionsApplied &&
      !value.tool.approvedBoundedSourceTransitionAuthorityRead &&
      !value.tool.approvedSmoothPanelDipsApplied &&
      !value.tool.approvedTransitionAudioHardCutsPreserved
  }
  if (
    sequenceProfile !== sequenceInputs ||
    !transitionEvidenceValid
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['tool', 'approvedTransitionAudioHardCutsPreserved'],
      message: 'Final-composition transition evidence diverged from the approved sequence profile.',
    })
  }
})

export const runCanonicalPrivateCompositionChunkSchema = z.object({
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  jobId: identity,
  grantId: identity,
  purpose: z.literal('execute_canonical_private_composition_chunk'),
  idempotencyKey: z.string().min(8).max(240).refine((value) => value === value.trim()),
}).strict()

const canonicalPrivateCompositionChunkAuthorityBase = z.object({
  chunkIndex: z.number().int().min(1),
  chunkCount: z.number().int().min(2),
  globalStartFrame: z.number().int().nonnegative(),
  globalEndFrameExclusive: z.number().int().positive(),
  durationFrames: z.number().int()
    .min(CANONICAL_PRIVATE_COMPOSITION_MINIMUM_FRAMES),
  outputKey: identity,
})

export const canonicalPrivateCompositionChunkAuthoritySchema = z.discriminatedUnion(
  'profileId',
  [
    canonicalPrivateCompositionChunkAuthorityBase.extend({
      profileId: z.literal('canonical_private_4k_chunk_merge_1920_frames_v1'),
      chunkIndex: z.number().int().min(1).max(8),
      chunkCount: z.number().int().min(2).max(8),
      globalStartFrame: z.number().int().nonnegative()
        .max(CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_FRAMES - 1),
      globalEndFrameExclusive: z.number().int().positive()
        .max(CANONICAL_PRIVATE_LONG_FORM_MAXIMUM_FRAMES),
      durationFrames: z.number().int()
        .min(CANONICAL_PRIVATE_COMPOSITION_MINIMUM_FRAMES)
        .max(CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES),
    }).strict(),
    canonicalPrivateCompositionChunkAuthorityBase.extend({
      profileId: z.literal(
        CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID,
      ),
      chunkIndex: z.number().int().min(1)
        .max(CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MAXIMUM_CHUNKS),
      chunkCount: z.number().int().min(2)
        .max(CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MAXIMUM_CHUNKS),
      globalStartFrame: z.number().int().nonnegative()
        .max(CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MAXIMUM_FRAMES - 1),
      globalEndFrameExclusive: z.number().int().positive()
        .max(CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_MAXIMUM_FRAMES),
      durationFrames: z.number().int()
        .min(CANONICAL_PRIVATE_COMPOSITION_MINIMUM_FRAMES)
        .max(CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES),
      sourceSliceKey: identity,
      sourceStartFrame: z.number().int().nonnegative(),
      sourceEndFrameExclusive: z.number().int().positive(),
    }).strict(),
    canonicalPrivateCompositionChunkAuthorityBase.extend({
      profileId: z.literal(
        CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID,
      ),
      chunkIndex: z.number().int().min(1)
        .max(CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_MAXIMUM_CHUNKS),
      chunkCount: z.number().int().min(2)
        .max(CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_MAXIMUM_CHUNKS),
      globalStartFrame: z.number().int().nonnegative()
        .max(CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_MAXIMUM_FRAMES - 1),
      globalEndFrameExclusive: z.number().int().positive()
        .max(CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_MAXIMUM_FRAMES),
      durationFrames: z.number().int()
        .min(CANONICAL_PRIVATE_COMPOSITION_MINIMUM_FRAMES)
        .max(CANONICAL_PRIVATE_SOURCE_SEGMENT_MAXIMUM_FRAMES),
      sourceSliceKey: identity,
      sourceStartFrame: z.number().int().nonnegative(),
      sourceEndFrameExclusive: z.number().int().positive(),
    }).strict(),
  ],
).superRefine((value, context) => {
  if (
    value.globalEndFrameExclusive - value.globalStartFrame !== value.durationFrames ||
    value.chunkIndex > value.chunkCount ||
    ((value.profileId ===
      CANONICAL_PRIVATE_SOURCE_SLICE_LONG_FORM_CAPACITY_PROFILE_ID ||
      value.profileId ===
        CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID) && (
      value.sourceEndFrameExclusive - value.sourceStartFrame !== value.durationFrames ||
      value.sourceSliceKey !==
        `source-slice-${value.chunkIndex}-of-${value.chunkCount}`
    ))
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['globalEndFrameExclusive'],
      message: 'Composition chunk authority is not duration preserving.',
    })
  }
})

export const canonicalPrivateCompositionChunkResponseSchema = z.object({
  schemaVersion: z.literal('canonical-private-composition-chunk-execution-response-v1'),
  source: z.literal('canonical_private_composition_chunk_execution_coordinator'),
  purpose: z.literal('execute_canonical_private_composition_chunk'),
  identity: z.object({
    workspaceId: identity, projectId: identity, editSessionId: identity, snapshotId: identity,
    jobId: identity, approvedWorkItemId: identity, expectedAssetId: identity, dispatchGrantId: identity,
  }).strict(),
  chunkAuthority: canonicalPrivateCompositionChunkAuthoritySchema,
  tool: z.object({
    canonicalToolId: z.literal('remotion'),
    operationId: z.literal('tool.remotion.render_approved_composition.v1'),
    compositionProfileId: z.enum([
      'approved_source_caption_track_final_v1',
      'approved_source_sequence_caption_track_final_v1',
    ]),
    actualRemotionOperationCompleted: z.literal(true),
    approvedSourceObjectRead: z.literal(true),
    approvedSourceInputMode: z.literal('server_injected_private_stream_v1'),
    approvedSourceStagingCleaned: z.literal(true),
    approvedSourceCapacityEvidenceHash: sha,
    approvedSourceTrimDependencyRead: z.literal(true),
    approvedSourceTrimFramesApplied: z.literal(true),
    approvedHardCutTransitionAuthorityRead: z.boolean(),
    approvedHardCutTransitionsApplied: z.boolean(),
    approvedBoundedSourceTransitionAuthorityRead: z.boolean(),
    approvedSmoothPanelDipsApplied: z.boolean(),
    approvedTransitionAudioHardCutsPreserved: z.boolean(),
    approvedCaptionDependencyRead: z.literal(true),
    approvedCaptionTrackTimingApplied: z.literal(true),
    audioPolicy: z.enum([
      'preserve_source',
      'preserve_source_sequence',
      'replace_with_approved_voice_tracks',
    ]),
    sourceAudioPreserved: z.boolean(),
    approvedVoiceTrackDependencyRead: z.boolean(),
    approvedVoiceTrackDependencyInputMode: z.enum([
      'not_applicable',
      'server_injected_private_stream_v1',
    ]),
    approvedVoiceTrackReplacementApplied: z.boolean(),
    approvedSupplementalAudioDependencyRead: z.boolean(),
    approvedSupplementalAudioDependencyInputMode: z.enum([
      'not_applicable',
      'server_injected_private_stream_v1',
    ]),
    approvedSupplementalAudioTimelineApplied: z.boolean(),
    approvedSupplementalAudioSpeechSafeMixApplied: z.boolean(),
    approvedLivingFrameLayerManifestDependencyRead: z.boolean(),
    approvedLivingFrameOverlayDependencyRead: z.boolean(),
    approvedLivingFrameOverlayTimelineApplied: z.boolean(),
    approvedLivingFrameOverlayBelowCaptionsApplied: z.boolean(),
    approvedLivingFrameDeterministicMotionApplied: z.boolean(),
    approvedLivingFrameAdaptiveDepthStyleApplied: z.boolean(),
    approvedLivingFrameCameraOrSourceAttentionApplied: z.boolean(),
    approvedColorDependencyRead: z.boolean(),
    approvedColorDependencyInputMode: z.enum([
      'not_applicable',
      'server_injected_private_stream_v1',
    ]),
    approvedColorIntermediateApplied: z.boolean(),
    renderPurpose: z.literal('private_4k_delivery_master_v1'),
    deliveryProfileId: z.literal('uhd_2160'),
    immutableSourceMasterNoProxyPolicyVerified: z.literal(true),
    originalApprovedEstimateAndReservationReused: z.literal(true),
    secondEstimateCreated: z.literal(false),
    secondReservationCreated: z.literal(false),
    exportCreditMutationPerformed: z.literal(false),
    privateCompositionChunkExecuted: z.literal(true),
    providerCallMade: z.literal(false),
    publicDeliveryExecuted: z.literal(false),
  }).strict(),
  inputs: z.union([
    singleSourceCaptionTrackFinalCompositionInputsSchema,
    sourceSequenceCaptionTrackFinalCompositionHardCutInputsSchema,
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
    artifactVersion: z.number().int().positive(), assetRole: z.literal('processed'),
    contentType: z.literal('video/mp4'), sha256: sha,
    byteLength: z.number().int().positive().max(256 * 1024 * 1024),
    privateObjectIdentityHash: sha, qaOutcome: z.literal('passed'),
    reconciliationDecision: z.literal('test_merged_not_live_authorized'),
    privateTestDependencySatisfied: z.literal(true),
    liveRuntimeDependencySatisfied: z.literal(false),
    finalRenderAuthorized: z.literal(false),
  }).strict(),
  attemptCost: privateInternalAttemptCostEvidenceResultSchema.optional(),
  replay: z.object({
    dispatchConsumptionReplayed: z.boolean(), executionFenceBeginReplayed: z.boolean(),
    executionFenceCompleteReplayed: z.boolean(), artifactRecordReplayed: z.boolean(),
    qaRecordReplayed: z.boolean(), reconciliationReplayed: z.boolean(),
    attemptCostEvidenceReplayed: z.boolean().optional(), sameIdempotentAttemptOnly: z.literal(true),
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
  const costRequired = value.chunkAuthority.profileId ===
    CANONICAL_PRIVATE_SOURCE_SLICE_MEZZANINE_CAPACITY_PROFILE_ID
  const cost = value.attemptCost?.evidence
  const sequenceProfile = value.tool.compositionProfileId ===
    'approved_source_sequence_caption_track_final_v1'
  const transitionEvidenceValid = sequenceProfile
    ? (
        'sources' in value.inputs &&
        value.inputs.transitionPolicy === 'approved_hard_cuts_only' &&
        value.tool.approvedHardCutTransitionAuthorityRead &&
        value.tool.approvedHardCutTransitionsApplied &&
        !value.tool.approvedBoundedSourceTransitionAuthorityRead &&
        !value.tool.approvedSmoothPanelDipsApplied &&
        value.tool.approvedTransitionAudioHardCutsPreserved
      )
    : (
        !('sources' in value.inputs) &&
        !value.tool.approvedHardCutTransitionAuthorityRead &&
        !value.tool.approvedHardCutTransitionsApplied &&
        !value.tool.approvedBoundedSourceTransitionAuthorityRead &&
        !value.tool.approvedSmoothPanelDipsApplied &&
        !value.tool.approvedTransitionAudioHardCutsPreserved
      )
  const supplementalAudioAbsent =
    value.inputs.supplementalAudioTracks === undefined &&
    !value.tool.approvedSupplementalAudioDependencyRead &&
    value.tool.approvedSupplementalAudioDependencyInputMode === 'not_applicable' &&
    !value.tool.approvedSupplementalAudioTimelineApplied &&
    !value.tool.approvedSupplementalAudioSpeechSafeMixApplied
  const livingFrameOverlaysAbsent =
    value.inputs.livingFrameOverlays === undefined &&
    !value.tool.approvedLivingFrameLayerManifestDependencyRead &&
    !value.tool.approvedLivingFrameOverlayDependencyRead &&
    !value.tool.approvedLivingFrameOverlayTimelineApplied &&
    !value.tool.approvedLivingFrameOverlayBelowCaptionsApplied &&
    !value.tool.approvedLivingFrameDeterministicMotionApplied &&
    !value.tool.approvedLivingFrameAdaptiveDepthStyleApplied &&
    !value.tool.approvedLivingFrameCameraOrSourceAttentionApplied
  if (
    value.chunkAuthority.globalEndFrameExclusive - value.chunkAuthority.globalStartFrame !==
      value.chunkAuthority.durationFrames ||
    value.chunkAuthority.chunkIndex > value.chunkAuthority.chunkCount ||
    costRequired !== Boolean(cost) ||
    costRequired !== (value.replay.attemptCostEvidenceReplayed !== undefined) ||
    !transitionEvidenceValid ||
    !supplementalAudioAbsent ||
    !livingFrameOverlaysAbsent ||
    (cost && (
      cost.identity.toolId !== 'remotion' ||
      cost.identity.workloadProfileId !==
        PRIVATE_INTERNAL_ATTEMPT_COST_PROFILE_IDS.remotionFourKSourceSliceChunk ||
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
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['chunkAuthority'],
      message: 'Composition chunk authority or scoped internal-cost evidence is invalid.',
    })
  }
})

export type RunCanonicalPrivateFinalCompositionInput = z.infer<typeof runCanonicalPrivateFinalCompositionSchema>
export type CanonicalPrivateFinalCompositionAuthority = z.infer<typeof canonicalPrivateFinalCompositionAuthoritySchema>
export type CanonicalPrivateFinalCompositionResponse = z.infer<typeof canonicalPrivateFinalCompositionResponseSchema>
export type RunCanonicalPrivateCompositionChunkInput = z.infer<typeof runCanonicalPrivateCompositionChunkSchema>
export type CanonicalPrivateCompositionChunkAuthority = z.infer<
  typeof canonicalPrivateCompositionChunkAuthoritySchema
>
export type CanonicalPrivateCompositionChunkResponse = z.infer<typeof canonicalPrivateCompositionChunkResponseSchema>
