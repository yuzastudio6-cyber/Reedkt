import { createHash } from 'node:crypto'
import { z } from 'zod'

import {
  VISUAL_INTELLIGENCE_CAPABILITY_ID,
  VISUAL_INTELLIGENCE_MEDIA_RESOLUTION,
  VISUAL_INTELLIGENCE_MODEL_ID,
  VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID,
  VISUAL_INTELLIGENCE_PROVIDER_ID,
  VISUAL_INTELLIGENCE_QUALITY_PROFILE,
  VISUAL_INTELLIGENCE_THINKING_LEVEL,
} from '../../src/types/visual-intelligence'
import {
  CANONICAL_RATIONAL_SOURCE_FRAME_MAPPING_POLICY,
  mapCanonicalSourceFrameRangeToMasterTiming,
} from './canonical-rational-source-frame-mapping'

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256Schema = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const safeIdSchema = z.string().trim()
  .min(1)
  .max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
const frameSchema = z.number().int().nonnegative()
const decisionBasisSchema = z.enum([
  'content_understanding',
  'resolved_embedded_instruction',
])

const transcriptCoverageWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    'canonical-source-audio-complete-timeline-coverage-v1',
  ),
  coveredStartFrame: z.literal(0),
  coveredEndFrameExclusive: z.number().int().positive(),
  completeAudioTimelineProcessed: z.literal(true),
  speechSegmentsMayOmitSilence: z.literal(true),
  embeddedInstructionDetectionRequired: z.literal(true),
}).strict()

export const canonicalSourceLedTranscriptCoverageSchema =
transcriptCoverageWithoutDigestSchema.extend({
  coverageDigestSha256: sha256Schema,
}).strict()

const visualCoverageWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    'canonical-source-visual-complete-timeline-window-coverage-v1',
  ),
  profileId: z.literal(
    'approved_source_cleanup_complete_timeline_windows_v1',
  ),
  coveredStartFrame: z.literal(0),
  coveredEndFrameExclusive: z.number().int().positive(),
  maximumWindowFrames: z.literal(240),
  targetSamplesPerWindow: z.literal(4),
  windowCount: z.number().int().positive().max(256),
  sampledFrameCount: z.number().int().positive().max(1_024),
  gapCount: z.literal(0),
  completeTimelineWindowCoverage: z.literal(true),
  everyTimelineFrameInspected: z.literal(false),
  modelInspectsOnlySampledFrames: z.literal(true),
  unsampledContentInspectionClaimAllowed: z.literal(false),
}).strict()

const visualCoverageSchema = visualCoverageWithoutDigestSchema.extend({
  coverageDigestSha256: sha256Schema,
}).strict()

const apiVisualCoverageWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    'canonical-source-visual-whole-video-provider-sampling-coverage-v2',
  ),
  profileId: z.literal('qwen37_whole_source_video_2fps_v1'),
  coveredStartFrame: z.literal(0),
  coveredEndFrameExclusive: z.number().int().positive(),
  maximumWindowFrames: z.literal(240),
  windowCount: z.number().int().positive().max(1_000),
  gapCount: z.literal(0),
  wholeFinalizedVideoObjectSuppliedToProvider: z.literal(true),
  requestedFramesPerSecond: z.literal(2),
  allTimelineIntervalsRequested: z.literal(true),
  providerFrameSamplingExpected: z.literal(true),
  providerMayEvenlyResampleWhenInternalLimitReached: z.literal(true),
  exactProviderSampleFramesKnown: z.literal(false),
  everyTimelineFrameInspected: z.literal(false),
  completeTimePixelInspectionClaimAllowed: z.literal(false),
  providerVisualPreprocessingExpected: z.literal(true),
  providerAudioUnderstandingClaimAllowed: z.literal(false),
  completeAudioTranscriptSuppliedToHeadReasonerSeparately: z.literal(true),
}).strict()

const apiVisualCoverageSchema = apiVisualCoverageWithoutDigestSchema.extend({
  coverageDigestSha256: sha256Schema,
}).strict()

const apiV2VisualCoverageWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    'canonical-source-visual-gapless-input-set-provider-sampling-coverage-v3',
  ),
  profileId: z.literal('qwen37_gapless_source_video_set_2fps_v2'),
  coveredStartFrame: z.literal(0),
  coveredEndFrameExclusive: z.number().int().positive(),
  maximumWindowFrames: z.literal(240),
  windowCount: z.number().int().positive().max(1_000),
  gapCount: z.literal(0),
  analysisRepresentation: z.enum([
    'exact_finalized_source_object',
    'gapless_stream_copy_analysis_shard_set',
  ]),
  inputObjectCount: z.number().int().positive().max(64),
  everyInputObjectSuppliedToProvider: z.literal(true),
  completeGaplessSourceTimelineRepresentationSupplied: z.literal(true),
  exactSourceToInputMappingRereadVerified: z.literal(true),
  originalFinalizedSourceRemainsFinalEditAuthority: z.literal(true),
  requestedFramesPerSecond: z.literal(2),
  allTimelineIntervalsRequested: z.literal(true),
  providerFrameSamplingExpected: z.literal(true),
  providerMayEvenlyResampleWhenInternalLimitReached: z.literal(true),
  exactProviderSampleFramesKnown: z.literal(false),
  everyTimelineFrameInspected: z.literal(false),
  completeTimePixelInspectionClaimAllowed: z.literal(false),
  providerVisualPreprocessingExpected: z.literal(true),
  providerAudioUnderstandingClaimAllowed: z.literal(false),
  completeAudioTranscriptSuppliedToHeadReasonerSeparately: z.literal(true),
}).strict()

const apiV2VisualCoverageSchema = apiV2VisualCoverageWithoutDigestSchema.extend({
  coverageDigestSha256: sha256Schema,
}).strict()

const visualIntelligenceCoverageWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    'canonical-source-visual-intelligence-semantic-coverage-v4',
  ),
  profileId: z.literal(
    'visual_intelligence_source_edit_planning_professional_high_v1',
  ),
  coveredStartFrame: z.literal(0),
  coveredEndFrameExclusive: z.number().int().positive(),
  maximumWindowFrames: z.literal(240),
  windowCount: z.number().int().positive().max(10_000),
  gapCount: z.literal(0),
  completeSourceRangeRequested: z.literal(true),
  completeRequestedRangeSemanticCoverage: z.literal(true),
  orderedGaplessObservationPartition: z.literal(true),
  deterministicGpuEvidenceUsed: z.literal(true),
  providerVisualPreprocessingExpected: z.literal(true),
  everyTimelineFrameInspected: z.literal(false),
  completeTimePixelInspectionClaimAllowed: z.literal(false),
  providerAudioUnderstandingClaimAllowed: z.literal(false),
  completeAudioTranscriptSuppliedToHeadReasonerSeparately: z.literal(true),
}).strict()

const visualIntelligenceCoverageSchema =
  visualIntelligenceCoverageWithoutDigestSchema.extend({
    coverageDigestSha256: sha256Schema,
  }).strict()

const transcriptSegmentSchema = z.object({
  segmentId: safeIdSchema,
  startFrame: frameSchema,
  endFrameExclusive: z.number().int().positive(),
  text: z.string().trim().min(1).max(2_000),
  confidenceBasisPoints: z.number().int().min(0).max(10_000),
  wordsVerified: z.boolean(),
}).strict().superRefine((segment, context) => {
  if (segment.endFrameExclusive <= segment.startFrame) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Transcript segments require a positive frame range.',
    })
  }
})

const visualObservationSchema = z.object({
  observationId: safeIdSchema,
  startFrame: frameSchema,
  endFrameExclusive: z.number().int().positive(),
  sourceFunction: z.enum([
    'hook',
    'active_action',
    'setup',
    'dialogue',
    'reaction',
    'detail',
    'transition',
    'idle',
    'unusable',
    'uncertain',
  ]),
  actionIntensity: z.enum(['none', 'low', 'medium', 'high']),
  editUsability: z.enum(['strong', 'usable', 'weak', 'reject']),
  cameraStability: z.enum(['stable', 'usable_motion', 'unstable', 'uncertain']),
  continuity: z.enum(['continuous', 'discontinuous', 'uncertain']),
  confidenceBasisPoints: z.number().int().min(0).max(10_000),
  sampledFrameNumbers: z.array(frameSchema).min(1).max(4),
}).strict().superRefine((observation, context) => {
  if (observation.endFrameExclusive <= observation.startFrame) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Visual observations require a positive frame range.',
    })
  }
  if (
    new Set(observation.sampledFrameNumbers).size !==
      observation.sampledFrameNumbers.length
    || observation.sampledFrameNumbers.some((frame, index) =>
      frame < observation.startFrame
      || frame >= observation.endFrameExclusive
      || (index > 0 && frame <= observation.sampledFrameNumbers[index - 1]!))
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Visual sample frames must be unique, ordered, and inside their complete-time window.',
    })
  }
})

const apiVisualObservationSchema = z.object({
  observationId: safeIdSchema,
  windowIndex: z.number().int().positive().max(1_000),
  startFrame: frameSchema,
  endFrameExclusive: z.number().int().positive(),
  sourceFunction: z.enum([
    'hook',
    'active_action',
    'setup',
    'dialogue',
    'reaction',
    'detail',
    'transition',
    'idle',
    'unusable',
    'uncertain',
  ]),
  actionIntensity: z.enum(['none', 'low', 'medium', 'high']),
  editUsability: z.enum(['strong', 'usable', 'weak', 'reject']),
  cameraStability: z.enum([
    'stable',
    'usable_motion',
    'unstable',
    'uncertain',
  ]),
  continuity: z.enum(['continuous', 'discontinuous', 'uncertain']),
  confidenceBasisPoints: z.number().int().min(100).max(10_000),
  providerObservationScope: z.literal(
    'whole_video_input_at_requested_sampling_cadence',
  ),
  exactProviderSampleFramesKnown: z.literal(false),
}).strict().superRefine((observation, context) => {
  if (observation.endFrameExclusive <= observation.startFrame) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Managed API visual observations require a positive frame range.',
    })
  }
})

const apiV2VisualObservationSchema = z.object({
  observationId: safeIdSchema,
  windowIndex: z.number().int().positive().max(1_000),
  startFrame: frameSchema,
  endFrameExclusive: z.number().int().positive(),
  sourceFunction: z.enum([
    'hook',
    'active_action',
    'setup',
    'dialogue',
    'reaction',
    'detail',
    'transition',
    'idle',
    'unusable',
    'uncertain',
  ]),
  actionIntensity: z.enum(['none', 'low', 'medium', 'high']),
  editUsability: z.enum(['strong', 'usable', 'weak', 'reject']),
  cameraStability: z.enum([
    'stable',
    'usable_motion',
    'unstable',
    'uncertain',
  ]),
  continuity: z.enum(['continuous', 'discontinuous', 'uncertain']),
  confidenceBasisPoints: z.number().int().min(100).max(10_000),
  providerObservationScope: z.literal(
    'gapless_ordered_source_timeline_at_requested_sampling_cadence',
  ),
  exactProviderSampleFramesKnown: z.literal(false),
}).strict().superRefine((observation, context) => {
  if (observation.endFrameExclusive <= observation.startFrame) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Managed API v2 visual observations require a positive frame range.',
    })
  }
})

const apiEvidenceRefSchema = z.object({
  id: safeIdSchema,
  version: z.number().int().positive(),
  contentHash: prefixedSha256Schema,
}).strict()

const visualIntelligenceObservationSchema = z.object({
  observationId: safeIdSchema,
  windowIndex: z.number().int().positive().max(10_000),
  startFrame: frameSchema,
  endFrameExclusive: z.number().int().positive(),
  sourceFunction: z.enum([
    'hook',
    'active_action',
    'setup',
    'dialogue',
    'reaction',
    'detail',
    'transition',
    'idle',
    'unusable',
    'uncertain',
  ]),
  actionIntensity: z.enum(['none', 'low', 'medium', 'high']),
  editUsability: z.enum(['strong', 'usable', 'weak', 'reject']),
  cameraStability: z.enum([
    'stable',
    'usable_motion',
    'unstable',
    'uncertain',
  ]),
  continuity: z.enum(['continuous', 'discontinuous', 'uncertain']),
  confidenceBasisPoints: z.number().int().min(100).max(10_000),
  evidenceRefs: z.array(apiEvidenceRefSchema).min(1).max(512),
  providerObservationScope: z.literal(
    'complete_source_range_semantic_partition',
  ),
  exactProviderSampleFramesKnown: z.literal(false),
}).strict().superRefine((observation, context) => {
  if (
    observation.endFrameExclusive <= observation.startFrame
    || observation.endFrameExclusive - observation.startFrame > 240
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Visual Intelligence observations require a positive bounded source window.',
    })
  }
})

const localVisualEvidenceSchema = z.object({
  status: z.literal('completed'),
  modelId: z.literal('qwen2.5-vl-7b-instruct-4bit'),
  modelDigestSha256: sha256Schema,
  runtimeVersion: z.literal('mlx-vlm-0.6.5'),
  observationDigestSha256: sha256Schema,
  observations: z.array(visualObservationSchema).min(1).max(256),
  coverage: visualCoverageSchema,
  rawFramesPersisted: z.literal(false),
  rawModelOutputPersisted: z.literal(false),
  modelDownloadPerformed: z.literal(false),
  networkAttempted: z.literal(false),
}).strict()

export const canonicalSourceLedManagedApiVisualEvidenceSchema = z.object({
  status: z.literal('completed'),
  evidenceMode: z.literal('managed_qwen37_api_whole_video_v1'),
  providerCapabilityId: z.literal('qwen_3_7_api_visual_understanding'),
  providerOperationId: z.literal('source_private_video_understanding'),
  providerOperationVersion: z.literal('source-private-video-understanding-v1'),
  providerBoundary: z.literal('qwen_model_studio_visual_understanding_api_boundary'),
  providerId: z.literal('alibaba_cloud_model_studio'),
  providerModel: z.literal('qwen3.7-plus-2026-05-26'),
  workRequestRef: apiEvidenceRefSchema,
  dispatchAdmissionRef: apiEvidenceRefSchema,
  lifecycleResultRef: apiEvidenceRefSchema,
  providerAttemptRef: apiEvidenceRefSchema,
  providerCostAttemptRef: apiEvidenceRefSchema,
  observationDigestSha256: sha256Schema,
  observations: z.array(apiVisualObservationSchema).min(1).max(1_000),
  coverage: apiVisualCoverageSchema,
  providerCallMade: z.literal(true),
  providerInferenceOutcome: z.literal('executed'),
  selfHostedQwenRuntimeUsed: z.literal(false),
  localQwen25VlRuntimeUsed: z.literal(false),
  signedReadUrlPersisted: z.literal(false),
  signedReadUrlReturned: z.literal(false),
  rawModelOutputPersisted: z.literal(false),
}).strict()

export const canonicalSourceLedManagedApiV2VisualEvidenceSchema = z.object({
  status: z.literal('completed'),
  evidenceMode: z.literal('managed_qwen37_api_gapless_input_set_v2'),
  providerCapabilityId: z.literal('qwen_3_7_api_visual_understanding'),
  providerOperationId: z.literal('source_private_video_understanding'),
  providerOperationVersion: z.literal('source-private-video-understanding-v2'),
  providerBoundary: z.literal('qwen_model_studio_visual_understanding_api_boundary'),
  providerId: z.literal('alibaba_cloud_model_studio'),
  providerModel: z.literal('qwen3.7-plus-2026-05-26'),
  providerDeploymentScope: z.literal('global'),
  analysisInputManifestRef: apiEvidenceRefSchema,
  workRequestRef: apiEvidenceRefSchema,
  dispatchAdmissionRef: apiEvidenceRefSchema,
  lifecycleResultRef: apiEvidenceRefSchema,
  providerAttemptRef: apiEvidenceRefSchema,
  providerCostAttemptRef: apiEvidenceRefSchema,
  runtimeReleaseRef: apiEvidenceRefSchema,
  providerUsageRateAuthorityRef: apiEvidenceRefSchema,
  providerUsageCostRef: apiEvidenceRefSchema,
  providerUsageCostRereadVerified: z.literal(true),
  observationDigestSha256: sha256Schema,
  observations: z.array(apiV2VisualObservationSchema).min(1).max(1_000),
  coverage: apiV2VisualCoverageSchema,
  providerCallMade: z.literal(true),
  providerInferenceOutcome: z.literal('executed'),
  selfHostedQwenRuntimeUsed: z.literal(false),
  localQwen25VlRuntimeUsed: z.literal(false),
  signedReadUrlPersisted: z.literal(false),
  signedReadUrlReturned: z.literal(false),
  rawModelOutputPersisted: z.literal(false),
  analysisObjectsUsedForFinalEdit: z.literal(false),
}).strict()

export const canonicalSourceLedVisualIntelligenceEvidenceSchema = z.object({
  status: z.literal('completed'),
  evidenceMode: z.literal('visual_intelligence_gemini_pro_high_v1'),
  providerCapabilityId: z.literal(VISUAL_INTELLIGENCE_CAPABILITY_ID),
  providerSkillId: z.literal('visual_intelligence.analyze_media'),
  operation: z.literal('analyze_media'),
  profile: z.literal('source_edit_planning'),
  providerAdapterId: z.literal(VISUAL_INTELLIGENCE_PROVIDER_ADAPTER_ID),
  providerId: z.literal(VISUAL_INTELLIGENCE_PROVIDER_ID),
  providerModel: z.literal(VISUAL_INTELLIGENCE_MODEL_ID),
  qualityProfile: z.literal(VISUAL_INTELLIGENCE_QUALITY_PROFILE),
  thinkingLevel: z.literal(VISUAL_INTELLIGENCE_THINKING_LEVEL),
  mediaResolution: z.literal(VISUAL_INTELLIGENCE_MEDIA_RESOLUTION),
  requestRef: apiEvidenceRefSchema,
  reportRef: apiEvidenceRefSchema,
  admissionRef: apiEvidenceRefSchema,
  providerReleaseRef: apiEvidenceRefSchema,
  costEvidenceRef: apiEvidenceRefSchema,
  observationDigestSha256: sha256Schema,
  observations: z.array(visualIntelligenceObservationSchema).min(1).max(10_000),
  coverage: visualIntelligenceCoverageSchema,
  lifecycleInvocationDisposition: z.enum(['completed', 'cache_replay']),
  providerCallMadeDuringInvocation: z.boolean(),
  costSettledDuringInvocation: z.boolean(),
  exactImmutableReportRereadVerified: z.literal(true),
  applicationDefaultCredentialsUsed: z.literal(true),
  accountEffectiveBillingRateUsed: z.literal(true),
  publicListPriceUsedAsSettlementAuthority: z.literal(false),
  providerVisualPreprocessingExpected: z.literal(true),
  completeTimePixelInspectionClaimAllowed: z.literal(false),
  selfHostedQwenRuntimeUsed: z.literal(false),
  managedQwenApiUsed: z.literal(false),
  localQwen25VlRuntimeUsed: z.literal(false),
  signedReadUrlPersisted: z.literal(false),
  signedReadUrlReturned: z.literal(false),
  rawModelOutputPersisted: z.literal(false),
}).strict().superRefine((value, context) => {
  const fresh = value.lifecycleInvocationDisposition === 'completed'
  if (
    value.providerCallMadeDuringInvocation !== fresh
    || value.costSettledDuringInvocation !== fresh
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Visual Intelligence invocation and cost disposition do not reconcile.',
    })
  }
})

const sourceFrameAuthorityWithoutDigestSchema = z.object({
  schemaVersion: z.literal('canonical-source-rational-frame-authority-v1'),
  frameDomain: z.literal('exact_source_frame_index'),
  fpsNumerator: z.number().int().positive(),
  fpsDenominator: z.number().int().positive(),
  frameCount: z.number().int().positive(),
  timeBaseNumerator: z.number().int().positive(),
  timeBaseDenominator: z.number().int().positive(),
  constantFrameRate: z.literal(true),
  masterTimingMapping: z.object({
    destinationFpsNumerator: z.literal(30),
    destinationFpsDenominator: z.literal(1),
    mappingPolicy: z.literal(CANONICAL_RATIONAL_SOURCE_FRAME_MAPPING_POLICY),
    durationPreserved: z.literal(true),
    callerRetimeAllowed: z.literal(false),
    sourceFramesMayBeRelabeledAsMasterFrames: z.literal(false),
  }).strict(),
}).strict()

export const canonicalSourceLedSourceFrameAuthoritySchema =
  sourceFrameAuthorityWithoutDigestSchema.extend({
    sourceFrameAuthorityDigestSha256: sha256Schema,
  }).strict()

export const canonicalSourceLedTranscriptEvidenceSchema = z.object({
  status: z.enum(['completed', 'no_speech']),
  modelId: z.enum([
    'faster-whisper-small',
    'faster-whisper-large-v3',
  ]),
  modelDigestSha256: sha256Schema,
  runtimeVersion: z.literal('faster-whisper-1.2.1'),
  transcriptDigestSha256: sha256Schema,
  segments: z.array(transcriptSegmentSchema).max(20_000),
  coverage: canonicalSourceLedTranscriptCoverageSchema,
  rawAudioPersisted: z.literal(false),
  modelDownloadPerformed: z.literal(false),
  networkAttempted: z.literal(false),
}).strict()

const resolvedEmbeddedInstructionSchema = z.object({
  instructionId: safeIdSchema,
  instructionType: z.enum([
    'delete_previous_part',
    'delete_current_take',
    'restart_from_here',
    'use_later_take',
    'keep_part',
    'remove_part',
    'custom_edit_direction',
  ]),
  targetRelation: z.enum([
    'previous_context',
    'current_take',
    'following_take',
    'whole_source',
    'custom',
  ]),
  transcriptSegmentId: safeIdSchema,
  spokenStartFrame: frameSchema,
  spokenEndFrameExclusive: z.number().int().positive(),
  targetStartFrame: frameSchema,
  targetEndFrameExclusive: z.number().int().positive(),
  reason: z.string().trim().min(1).max(1_000),
  confidenceBasisPoints: z.number().int().min(7_000).max(10_000),
  evidenceIds: z.array(safeIdSchema).min(1).max(128),
  appliedDecisionIds: z.array(safeIdSchema).min(1).max(128),
  spokenRemarkRemovalDecisionId: safeIdSchema,
  classifiedAsEditorDirected: z.literal(true),
  interpretationStatus: z.literal('resolved'),
  userReviewRequired: z.literal(false),
}).strict().superRefine((instruction, context) => {
  if (
    instruction.spokenEndFrameExclusive <= instruction.spokenStartFrame
    || instruction.targetEndFrameExclusive <= instruction.targetStartFrame
    || !instruction.evidenceIds.includes(instruction.transcriptSegmentId)
    || new Set(instruction.evidenceIds).size !== instruction.evidenceIds.length
    || new Set(instruction.appliedDecisionIds).size !==
      instruction.appliedDecisionIds.length
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Resolved embedded edit instructions require exact spoken, target, evidence, and applied-decision lineage.',
    })
  }
})

const selectedRangeSchema = z.object({
  rangeId: safeIdSchema,
  startFrame: frameSchema,
  endFrameExclusive: z.number().int().positive(),
  role: z.enum(['opening', 'action', 'main_story', 'closing']),
  reason: z.string().trim().min(1).max(1_000),
  confidenceBasisPoints: z.number().int().min(6_000).max(10_000),
  phraseBoundaryAligned: z.literal(true),
  preservesSourceMeaning: z.literal(true),
  userReviewRequired: z.literal(false),
  evidenceIds: z.array(safeIdSchema).min(1).max(128),
  keepReasonCodes: z.array(z.enum([
    'strong_hook',
    'clear_explanation',
    'emotional_moment',
    'proof_or_evidence',
    'source_context_required',
    'good_visual_moment',
    'good_audio_moment',
    'key_story_beat',
    'cta',
    'transition_context',
  ])).min(1).max(16),
  removedContextCodes: z.array(z.enum([
    'dead_space',
    'long_silence',
    'filler_words',
    'false_start',
    'repeated_take',
    'duplicate_point',
    'mistake',
    'off_topic',
    'weak_explanation',
    'bad_audio',
    'bad_visual',
    'shaky_or_blurry',
    'setup_cleanup',
    'pacing_drag',
  ])).max(16),
  decisionBasis: decisionBasisSchema,
  instructionIds: z.array(safeIdSchema).max(32),
  timeOnlyDecision: z.literal(false),
}).strict().superRefine((selection, context) => {
  if (selection.endFrameExclusive <= selection.startFrame) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selected source ranges require a positive frame range.',
    })
  }
  if (new Set(selection.evidenceIds).size !== selection.evidenceIds.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selected source evidence identities must be unique.',
    })
  }
  if (
    new Set(selection.instructionIds).size !== selection.instructionIds.length
    || (
      selection.decisionBasis === 'content_understanding'
        ? selection.instructionIds.length !== 0
        : selection.instructionIds.length === 0
    )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selected source ranges must distinguish content understanding from resolved embedded instructions.',
    })
  }
})

const removedRangeSchema = z.object({
  rangeId: safeIdSchema,
  startFrame: frameSchema,
  endFrameExclusive: z.number().int().positive(),
  reason: z.string().trim().min(1).max(1_000),
  confidenceBasisPoints: z.number().int().min(6_000).max(10_000),
  phraseBoundaryAligned: z.literal(true),
  preservesSourceMeaning: z.literal(true),
  userReviewRequired: z.literal(false),
  evidenceIds: z.array(safeIdSchema).min(1).max(128),
  reasonCodes: z.array(z.enum([
    'dead_space',
    'long_silence',
    'filler_words',
    'false_start',
    'repeated_take',
    'duplicate_point',
    'mistake',
    'off_topic',
    'weak_explanation',
    'bad_audio',
    'bad_visual',
    'shaky_or_blurry',
    'setup_cleanup',
    'pacing_drag',
    'resolved_embedded_instruction',
  ])).min(1).max(16),
  decisionBasis: decisionBasisSchema,
  instructionIds: z.array(safeIdSchema).max(32),
  timeOnlyDecision: z.literal(false),
}).strict().superRefine((removal, context) => {
  if (
    removal.endFrameExclusive <= removal.startFrame
    || new Set(removal.evidenceIds).size !== removal.evidenceIds.length
    || new Set(removal.instructionIds).size !== removal.instructionIds.length
    || (
      removal.decisionBasis === 'content_understanding'
        ? removal.instructionIds.length !== 0
        : removal.instructionIds.length === 0
    )
    || (
      removal.decisionBasis === 'resolved_embedded_instruction'
      && !removal.reasonCodes.includes('resolved_embedded_instruction')
    )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Removed source ranges require explicit non-temporal evidence and exact instruction lineage when applicable.',
    })
  }
})

const sourceAnalysisSchema = z.object({
  sourceSequenceItemId: safeIdSchema,
  mediaAssetId: safeIdSchema,
  uploadedOrder: z.number().int().min(1).max(8),
  checksumSha256: sha256Schema,
  byteLength: z.number().int().positive(),
  durationFrames: z.number().int().positive(),
  sourceFrameAuthority: canonicalSourceLedSourceFrameAuthoritySchema.optional(),
  transcript: canonicalSourceLedTranscriptEvidenceSchema,
  visual: z.union([
    localVisualEvidenceSchema,
    canonicalSourceLedManagedApiVisualEvidenceSchema,
    canonicalSourceLedManagedApiV2VisualEvidenceSchema,
    canonicalSourceLedVisualIntelligenceEvidenceSchema,
  ]),
  selectedRanges: z.array(selectedRangeSchema).min(1).max(128),
  removedRanges: z.array(removedRangeSchema).max(129),
  embeddedEditInstructions: z.array(
    resolvedEmbeddedInstructionSchema,
  ).max(128),
}).strict()

export const canonicalSourceLedContentAnalysisSourceInputSchema =
  sourceAnalysisSchema.omit({
    selectedRanges: true,
    removedRanges: true,
    embeddedEditInstructions: true,
  }).strict()

const reasoningSchema = z.object({
  status: z.literal('completed'),
  routeId: z.enum(['kimi_k3_primary', 'gpt_5_6_terra_fallback']),
  providerModel: z.enum(['kimi-k3', 'gpt-5.6-terra']),
  credentialSource: z.literal('google_secret_manager_pinned_version'),
  credentialVersion: z.number().int().positive(),
  providerCallMade: z.literal(true),
  modelCallMade: z.literal(true),
  attemptDigestSha256: sha256Schema,
  structuredResultDigestSha256: sha256Schema,
  completeSourceCoverageConfirmed: z.literal(true),
  allTimelineIntervalsReviewed: z.literal(true),
  embeddedInstructionsEvaluated: z.literal(true),
  timeOnlyCutDecisionsAllowed: z.literal(false),
  fallbackFromAttemptDigestSha256: sha256Schema.optional(),
  rawProviderResponsePersisted: z.literal(false),
}).strict().superRefine((reasoning, context) => {
  if (
    reasoning.routeId === 'kimi_k3_primary'
      ? reasoning.providerModel !== 'kimi-k3'
        || reasoning.fallbackFromAttemptDigestSha256 !== undefined
      : reasoning.providerModel !== 'gpt-5.6-terra'
        || reasoning.fallbackFromAttemptDigestSha256 === undefined
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Source-edit reasoning route and provider lineage must match.',
    })
  }
})

const evidenceWithoutDigestSchema = z.object({
  schemaVersion: z.enum([
    'canonical-source-led-content-analysis-evidence-v2',
    'canonical-source-led-content-analysis-evidence-v3',
    'canonical-source-led-content-analysis-evidence-v4',
    'canonical-source-led-content-analysis-evidence-v5',
  ]),
  source: z.literal('server_private_source_understanding_pipeline'),
  identity: z.object({
    workspaceId: safeIdSchema,
    projectId: safeIdSchema,
    editSessionId: safeIdSchema,
    analysisRunId: safeIdSchema,
    userInstructionDigestSha256: sha256Schema,
    fps: z.literal(30),
  }).strict(),
  sources: z.array(sourceAnalysisSchema).min(1).max(8),
  reasoning: reasoningSchema,
  summary: z.object({
    selectedSourceCount: z.number().int().positive().max(8),
    selectedRangeCount: z.number().int().positive().max(512),
    selectedTotalFrames: z.number().int().positive(),
    originalTotalFrames: z.number().int().positive(),
    originalTotalTimelineFrames: z.number().int().positive().optional(),
    selectedTotalTimelineFrames: z.number().int().positive().optional(),
    rationalSourceFrameMappingVerified: z.literal(true).optional(),
    sourceOrderPreserved: z.literal(true),
    everySelectionEvidenceBound: z.literal(true),
    everyRemovalEvidenceBound: z.literal(true),
    completeSourceCoverageVerified: z.literal(true),
    allTimelineIntervalsReviewed: z.literal(true),
    embeddedInstructionsEvaluated: z.literal(true),
    embeddedInstructionCount: z.number().int().nonnegative().max(1_024),
    unresolvedEmbeddedInstructionCount: z.literal(0),
    timeOnlyCutDecisionCount: z.literal(0),
    meaningPreservationPassed: z.literal(true),
    userReviewRequired: z.literal(false),
  }).strict(),
  boundaries: z.object({
    privateEvidence: z.literal(true),
    sourceBytesSerialized: z.literal(false),
    localPathsSerialized: z.literal(false),
    rawModelOutputSerialized: z.literal(false),
    rawChatUsedAsWorkerInstruction: z.literal(false),
    planPublished: z.literal(false),
    approvalGranted: z.literal(false),
    executionStarted: z.literal(false),
    customerChargeCreated: z.literal(false),
    publicDeliveryCreated: z.literal(false),
    productionAuthority: z.literal(false),
  }).strict(),
}).strict()

export const canonicalSourceLedContentAnalysisEvidenceSchema =
  evidenceWithoutDigestSchema.extend({
    evidenceDigestSha256: sha256Schema,
  }).strict()

export type CanonicalSourceLedContentAnalysisEvidence = z.infer<
  typeof canonicalSourceLedContentAnalysisEvidenceSchema
>

export type CanonicalSourceLedContentAnalysisEvidenceInput = z.input<
  typeof evidenceWithoutDigestSchema
>

export type CanonicalSourceLedContentAnalysisSourceInput =
  Omit<
    CanonicalSourceLedContentAnalysisEvidenceInput['sources'][number],
    'selectedRanges' | 'removedRanges' | 'embeddedEditInstructions'
  >

export type CanonicalSourceLedSourceFrameAuthority = z.infer<
  typeof canonicalSourceLedSourceFrameAuthoritySchema
>

export function createCanonicalSourceLedSourceFrameAuthority(input: {
  readonly fpsNumerator: number
  readonly fpsDenominator: number
  readonly frameCount: number
  readonly timeBaseNumerator: number
  readonly timeBaseDenominator: number
}): CanonicalSourceLedSourceFrameAuthority {
  const payload = sourceFrameAuthorityWithoutDigestSchema.parse({
    schemaVersion: 'canonical-source-rational-frame-authority-v1',
    frameDomain: 'exact_source_frame_index',
    ...input,
    constantFrameRate: true,
    masterTimingMapping: {
      destinationFpsNumerator: 30,
      destinationFpsDenominator: 1,
      mappingPolicy: CANONICAL_RATIONAL_SOURCE_FRAME_MAPPING_POLICY,
      durationPreserved: true,
      callerRetimeAllowed: false,
      sourceFramesMayBeRelabeledAsMasterFrames: false,
    },
  })
  return canonicalSourceLedSourceFrameAuthoritySchema.parse({
    ...payload,
    sourceFrameAuthorityDigestSha256: sha256(stableStringify(payload)),
  })
}

export function createCanonicalSourceLedContentAnalysisEvidence(
  input: CanonicalSourceLedContentAnalysisEvidenceInput,
  options: {
    readonly historicalReadOnly?: true
  } = {},
): CanonicalSourceLedContentAnalysisEvidence {
  if (
    input.schemaVersion !== 'canonical-source-led-content-analysis-evidence-v5'
    && options.historicalReadOnly !== true
  ) {
    throw new Error(
      'Fresh source-analysis evidence must use Visual Intelligence v5; v2-v4 are immutable historical-read-only schemas.',
    )
  }
  const parsed = evidenceWithoutDigestSchema.parse(input)
  const evidence = canonicalSourceLedContentAnalysisEvidenceSchema.parse({
    ...parsed,
    evidenceDigestSha256: sha256(stableStringify(parsed)),
  })
  verifyCanonicalSourceLedContentAnalysisEvidence(evidence)
  return evidence
}

export function verifyCanonicalSourceLedContentAnalysisEvidence(
  input: unknown,
): CanonicalSourceLedContentAnalysisEvidence {
  const evidence = canonicalSourceLedContentAnalysisEvidenceSchema.parse(input)
  const withoutDigest = { ...evidence }
  Reflect.deleteProperty(withoutDigest, 'evidenceDigestSha256')
  if (
    evidence.evidenceDigestSha256 !==
      sha256(stableStringify(withoutDigest))
  ) {
    throw new Error(
      'Source-led content-analysis evidence failed immutable digest verification.',
    )
  }

  const sourceIds = new Set<string>()
  const mediaIds = new Set<string>()
  let originalTotalFrames = 0
  let selectedTotalFrames = 0
  let originalTotalTimelineFrames = 0
  let selectedTotalTimelineFrames = 0
  let selectedRangeCount = 0
  let embeddedInstructionCount = 0
  const expectedVisualEvidenceMode = evidence.schemaVersion ===
    'canonical-source-led-content-analysis-evidence-v5'
    ? 'visual_intelligence_gemini_pro_high_v1'
    : evidence.schemaVersion === 'canonical-source-led-content-analysis-evidence-v4'
      ? 'managed_qwen37_api_gapless_input_set_v2'
    : evidence.schemaVersion === 'canonical-source-led-content-analysis-evidence-v3'
      ? 'managed_qwen37_api_whole_video_v1'
      : 'historical_local_qwen25vl'
  if (
    evidence.sources.some((source) => {
      const actualMode = 'evidenceMode' in source.visual
        ? source.visual.evidenceMode
        : 'historical_local_qwen25vl'
      return actualMode !== expectedVisualEvidenceMode
        || ([
          'canonical-source-led-content-analysis-evidence-v4',
          'canonical-source-led-content-analysis-evidence-v5',
        ].includes(evidence.schemaVersion)) !==
          Boolean(source.sourceFrameAuthority)
    })
  ) {
    throw new Error(
      'Source-led content-analysis evidence version does not match its visual-specialist route.',
    )
  }
  evidence.sources.forEach((source, index) => {
    if (
      source.uploadedOrder !== index + 1
      || sourceIds.has(source.sourceSequenceItemId)
      || mediaIds.has(source.mediaAssetId)
    ) {
      throw new Error(
        'Source-led content-analysis evidence lost exact source order or identity uniqueness.',
      )
    }
    sourceIds.add(source.sourceSequenceItemId)
    mediaIds.add(source.mediaAssetId)
    originalTotalFrames += source.durationFrames
    selectedRangeCount += source.selectedRanges.length
    embeddedInstructionCount += source.embeddedEditInstructions.length
    selectedTotalFrames += source.selectedRanges.reduce(
      (sum, selection) =>
        sum + selection.endFrameExclusive - selection.startFrame,
      0,
    )
    if (source.sourceFrameAuthority) {
      const {
        sourceFrameAuthorityDigestSha256,
        ...sourceFrameAuthorityWithoutDigest
      } = source.sourceFrameAuthority
      if (
        sourceFrameAuthorityDigestSha256 !==
          sha256(stableStringify(sourceFrameAuthorityWithoutDigest))
        || source.sourceFrameAuthority.frameCount !== source.durationFrames
      ) {
        throw new Error(
          `Source ${index + 1} lost exact rational source-frame authority.`,
        )
      }
      const authority = {
        fpsNumerator: source.sourceFrameAuthority.fpsNumerator,
        fpsDenominator: source.sourceFrameAuthority.fpsDenominator,
        frameCount: source.sourceFrameAuthority.frameCount,
        timeBaseNumerator: source.sourceFrameAuthority.timeBaseNumerator,
        timeBaseDenominator: source.sourceFrameAuthority.timeBaseDenominator,
        constantFrameRate: true as const,
      }
      originalTotalTimelineFrames +=
        mapCanonicalSourceFrameRangeToMasterTiming({
          sourceStartFrame: 0,
          sourceEndFrameExclusive: source.durationFrames,
          source: authority,
          master: { fpsNumerator: 30, fpsDenominator: 1 },
        }).masterDurationFrames
      selectedTotalTimelineFrames += source.selectedRanges.reduce(
        (total, range) => total +
          mapCanonicalSourceFrameRangeToMasterTiming({
            sourceStartFrame: range.startFrame,
            sourceEndFrameExclusive: range.endFrameExclusive,
            source: authority,
            master: { fpsNumerator: 30, fpsDenominator: 1 },
          }).masterDurationFrames,
        0,
      )
    }
    const {
      coverageDigestSha256: transcriptCoverageDigest,
      ...transcriptCoverageWithoutDigest
    } = source.transcript.coverage
    const {
      coverageDigestSha256: visualCoverageDigest,
      ...visualCoverageWithoutDigest
    } = source.visual.coverage
    if (
      (
        source.transcript.status === 'no_speech'
          ? source.transcript.segments.length !== 0
          : source.transcript.segments.length === 0
      )
      || source.transcript.transcriptDigestSha256 !==
        sha256(stableStringify(source.transcript.segments))
      || source.visual.observationDigestSha256 !==
        sha256(stableStringify(source.visual.observations))
      || transcriptCoverageDigest !==
        sha256(stableStringify(transcriptCoverageWithoutDigest))
      || visualCoverageDigest !==
        sha256(stableStringify(visualCoverageWithoutDigest))
      || source.transcript.coverage.coveredEndFrameExclusive !==
        source.durationFrames
      || source.visual.coverage.coveredEndFrameExclusive !==
        source.durationFrames
      || source.visual.coverage.windowCount !==
        source.visual.observations.length
      || (
        'sampledFrameCount' in source.visual.coverage
        && source.visual.coverage.sampledFrameCount !==
          source.visual.observations.reduce(
            (sum, observation) =>
              sum + ('sampledFrameNumbers' in observation
                ? observation.sampledFrameNumbers.length
                : 0),
            0,
          )
      )
      || (
        'evidenceMode' in source.visual
        && (
          source.visual.coverage.windowCount !==
            source.visual.observations.length
          || source.visual.observations.some(
            (observation, observationIndex) =>
              observation.windowIndex !== observationIndex + 1,
          )
        )
      )
    ) {
      throw new Error(
        `Source ${index + 1} has an invalid selected range, transcript state, or evidence digest.`,
      )
    }
    assertOrderedRanges(
      source.transcript.segments,
      source.durationFrames,
      `Source ${index + 1} transcript`,
    )
    assertOrderedRanges(
      source.visual.observations,
      source.durationFrames,
      `Source ${index + 1} visual evidence`,
    )
    assertCompleteTimelineWindows(
      source.visual.observations,
      source.durationFrames,
      `Source ${index + 1} visual evidence`,
    )
    assertOrderedSelections(
      source.selectedRanges,
      source.durationFrames,
      `Source ${index + 1} selected ranges`,
    )
    assertOrderedSelections(
      source.removedRanges,
      source.durationFrames,
      `Source ${index + 1} removed ranges`,
    )
    verifySourceUnderstanding(source, index + 1)
  })
  if (
    evidence.summary.selectedSourceCount !== evidence.sources.length
    || evidence.summary.selectedRangeCount !== selectedRangeCount
    || evidence.summary.originalTotalFrames !== originalTotalFrames
    || evidence.summary.selectedTotalFrames !== selectedTotalFrames
    || evidence.summary.embeddedInstructionCount !==
      embeddedInstructionCount
    || ([
      'canonical-source-led-content-analysis-evidence-v4',
      'canonical-source-led-content-analysis-evidence-v5',
    ].includes(evidence.schemaVersion)
      ? evidence.summary.originalTotalTimelineFrames !==
          originalTotalTimelineFrames
        || evidence.summary.selectedTotalTimelineFrames !==
          selectedTotalTimelineFrames
        || evidence.summary.rationalSourceFrameMappingVerified !== true
      : evidence.summary.originalTotalTimelineFrames !== undefined
        || evidence.summary.selectedTotalTimelineFrames !== undefined
        || evidence.summary.rationalSourceFrameMappingVerified !== undefined)
    || evidence.reasoning.structuredResultDigestSha256 !==
      sha256(stableStringify(structuredSelectionProjection(evidence)))
  ) {
    throw new Error(
      'Source-led content-analysis summary does not match exact source selections.',
    )
  }
  return evidence
}

function assertOrderedSelections(
  values: Array<{
    rangeId: string
    startFrame: number
    endFrameExclusive: number
  }>,
  durationFrames: number,
  label: string,
): void {
  const rangeIds = new Set<string>()
  let previousEnd = -1
  for (const value of values) {
    if (
      rangeIds.has(value.rangeId)
      || value.startFrame < previousEnd
      || value.endFrameExclusive > durationFrames
    ) {
      throw new Error(
        `${label} contains a duplicate, overlapping, unordered, or out-of-range item.`,
      )
    }
    rangeIds.add(value.rangeId)
    previousEnd = value.endFrameExclusive
  }
}

function assertOrderedRanges(
  values: Array<{ startFrame: number; endFrameExclusive: number }>,
  durationFrames: number,
  label: string,
): void {
  let previousStart = -1
  for (const value of values) {
    if (
      value.startFrame < previousStart
      || value.endFrameExclusive > durationFrames
    ) {
      throw new Error(`${label} contains an unordered or out-of-range item.`)
    }
    previousStart = value.startFrame
  }
}

function assertCompleteTimelineWindows(
  values: Array<{ startFrame: number; endFrameExclusive: number }>,
  durationFrames: number,
  label: string,
): void {
  let cursor = 0
  for (const value of values) {
    if (
      value.startFrame !== cursor
      || value.endFrameExclusive <= value.startFrame
      || value.endFrameExclusive - value.startFrame > 240
    ) {
      throw new Error(
        `${label} does not provide exact bounded, gapless complete-time window coverage.`,
      )
    }
    cursor = value.endFrameExclusive
  }
  if (cursor !== durationFrames) {
    throw new Error(`${label} does not cover the complete source timeline.`)
  }
}

function verifySourceUnderstanding(
  source: CanonicalSourceLedContentAnalysisEvidence['sources'][number],
  sourceNumber: number,
): void {
  const evidenceRanges = new Map<string, {
    startFrame: number
    endFrameExclusive: number
  }>([
    ...source.transcript.segments.map((segment) => [
      segment.segmentId,
      {
        startFrame: segment.startFrame,
        endFrameExclusive: segment.endFrameExclusive,
      },
    ] as const),
    ...source.visual.observations.map((observation) => [
      observation.observationId,
      {
        startFrame: observation.startFrame,
        endFrameExclusive: observation.endFrameExclusive,
      },
    ] as const),
  ])
  const instructions = new Map(
    source.embeddedEditInstructions.map((instruction) => [
      instruction.instructionId,
      instruction,
    ]),
  )
  if (instructions.size !== source.embeddedEditInstructions.length) {
    throw new Error(
      `Source ${sourceNumber} contains duplicate embedded edit instructions.`,
    )
  }
  const decisions = [
    ...source.selectedRanges.map((range) => ({ ...range, action: 'keep' as const })),
    ...source.removedRanges.map((range) => ({ ...range, action: 'remove' as const })),
  ]
  const decisionsById = new Map(decisions.map((decision) => [
    decision.rangeId,
    decision,
  ]))
  if (decisionsById.size !== decisions.length) {
    throw new Error(`Source ${sourceNumber} contains duplicate decision IDs.`)
  }
  let cursor = 0
  for (const decision of [...decisions].sort(
    (left, right) => left.startFrame - right.startFrame,
  )) {
    if (
      decision.startFrame !== cursor
      || decision.endFrameExclusive <= decision.startFrame
      || decision.endFrameExclusive > source.durationFrames
    ) {
      throw new Error(
        `Source ${sourceNumber} keep/remove decisions do not exactly partition the complete timeline.`,
      )
    }
    cursor = decision.endFrameExclusive
    const referencedEvidence = decision.evidenceIds.map((evidenceId) =>
      evidenceRanges.get(evidenceId))
    if (referencedEvidence.some((evidence) => !evidence)) {
      throw new Error(
        `Source ${sourceNumber} decision ${decision.rangeId} references unverified evidence.`,
      )
    }
    if (
      decision.decisionBasis === 'content_understanding'
      && !referencedEvidence.some((evidence) => evidence && rangesOverlap(
        decision.startFrame,
        decision.endFrameExclusive,
        evidence.startFrame,
        evidence.endFrameExclusive,
      ))
    ) {
      throw new Error(
        `Source ${sourceNumber} decision ${decision.rangeId} is not grounded in overlapping content evidence.`,
      )
    }
    if (
      decision.decisionBasis === 'resolved_embedded_instruction'
      && decision.instructionIds.some((instructionId) => {
        const instruction = instructions.get(instructionId)
        return !instruction
          || !instruction.appliedDecisionIds.includes(decision.rangeId)
          || !(
            rangesOverlap(
              decision.startFrame,
              decision.endFrameExclusive,
              instruction.targetStartFrame,
              instruction.targetEndFrameExclusive,
            )
            || (
              instruction.spokenRemarkRemovalDecisionId === decision.rangeId
              && decision.startFrame <= instruction.spokenStartFrame
              && decision.endFrameExclusive >=
                instruction.spokenEndFrameExclusive
            )
          )
      })
    ) {
      throw new Error(
        `Source ${sourceNumber} decision ${decision.rangeId} is not bound to its resolved embedded instruction target.`,
      )
    }
  }
  if (cursor !== source.durationFrames) {
    throw new Error(
      `Source ${sourceNumber} decisions omit part of the original source timeline.`,
    )
  }

  for (const instruction of source.embeddedEditInstructions) {
    const transcript = source.transcript.segments.find(
      (segment) => segment.segmentId === instruction.transcriptSegmentId,
    )
    const spokenRemoval = decisionsById.get(
      instruction.spokenRemarkRemovalDecisionId,
    )
    if (
      !transcript
      || transcript.startFrame !== instruction.spokenStartFrame
      || transcript.endFrameExclusive !== instruction.spokenEndFrameExclusive
      || instruction.targetEndFrameExclusive > source.durationFrames
      || instruction.evidenceIds.some((evidenceId) =>
        !evidenceRanges.has(evidenceId))
      || instruction.appliedDecisionIds.some((decisionId) => {
        const decision = decisionsById.get(decisionId)
        return !decision || !decision.instructionIds.includes(
          instruction.instructionId,
        )
      })
      || !spokenRemoval
      || spokenRemoval.action !== 'remove'
      || spokenRemoval.startFrame > instruction.spokenStartFrame
      || spokenRemoval.endFrameExclusive < instruction.spokenEndFrameExclusive
      || !spokenRemoval.instructionIds.includes(instruction.instructionId)
    ) {
      throw new Error(
        `Source ${sourceNumber} embedded instruction ${instruction.instructionId} lost exact transcript, target, or editor-remark removal lineage.`,
      )
    }
  }
}

function rangesOverlap(
  leftStart: number,
  leftEnd: number,
  rightStart: number,
  rightEnd: number,
): boolean {
  return leftStart < rightEnd && rightStart < leftEnd
}

function structuredSelectionProjection(
  evidence: CanonicalSourceLedContentAnalysisEvidence,
): Record<string, unknown> {
  return {
    sources: evidence.sources.map((source) => ({
      sourceSequenceItemId: source.sourceSequenceItemId,
      mediaAssetId: source.mediaAssetId,
      uploadedOrder: source.uploadedOrder,
      selectedRanges: source.selectedRanges,
      removedRanges: source.removedRanges,
      embeddedEditInstructions: source.embeddedEditInstructions,
    })),
    sourceOrderPreserved: true,
    completeSourceCoverageVerified: true,
    allTimelineIntervalsReviewed: true,
    embeddedInstructionsEvaluated: true,
    timeOnlyCutDecisionCount: 0,
    meaningPreservationPassed: true,
    userReviewRequired: false,
    reviewReasons: [],
  }
}

export function digestCanonicalSourceLedStructuredSelection(
  value: unknown,
): string {
  return sha256(stableStringify(value))
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`
  }
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
      .map(([key, item]) =>
        `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}
