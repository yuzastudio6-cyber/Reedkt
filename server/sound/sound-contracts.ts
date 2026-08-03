import { z } from 'zod'
import type {
  SkillQualificationStatus,
  SkillRequestedMode,
} from '../../src/types/skill-capability-manifest'

export const CANONICAL_SOUND_REQUEST_SCHEMA_VERSION = 'canonical-sound-request-v1' as const
export const CANONICAL_SOUND_RESULT_SCHEMA_VERSION = 'canonical-sound-result-v1' as const

const safeId = z.string().trim().min(1).max(180)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'), 'Unsafe identity sequence.')
const sha256 = z.string().regex(/^[a-f0-9]{64}$/)
const boundedText = z.string().trim().min(1).max(2_000)

export const soundFrameRangeSchema = z.object({
  rangeId: safeId,
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
}).strict().superRefine((range, context) => {
  if (range.endFrameExclusive <= range.startFrame) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Range end must exceed start.' })
  }
})

export type SoundFrameRange = z.infer<typeof soundFrameRangeSchema>

export const soundArtifactRefSchema = z.object({
  artifactId: safeId,
  artifactType: safeId,
  version: z.number().int().positive(),
  checksumSha256: sha256,
  storageObjectId: safeId,
  private: z.literal(true),
  contentType: z.string().trim().min(1).max(120),
  durationFrames: z.number().int().positive().optional(),
}).strict()

export type SoundArtifactRef = z.infer<typeof soundArtifactRefSchema>

export const soundVisualDependencySchema = z.object({
  artifact: soundArtifactRefSchema,
  visualVersion: z.number().int().positive(),
  visualHash: sha256,
  timingManifestHash: sha256,
  originalApprovedVisual: z.literal(true),
}).strict()

export type SoundVisualDependency = z.infer<typeof soundVisualDependencySchema>

export const soundEventAnchorSchema = z.object({
  anchorId: safeId,
  eventType: safeId,
  frame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive().optional(),
  sceneId: safeId.optional(),
  clipId: safeId.optional(),
  material: z.string().trim().max(120).optional(),
  perspective: z.enum(['close', 'medium', 'distant', 'offscreen']).optional(),
  environment: z.string().trim().max(160).optional(),
  importance: z.enum(['background', 'support', 'foreground', 'hero']),
  soundWouldImproveEdit: z.boolean(),
}).strict()

export type SoundEventAnchor = z.infer<typeof soundEventAnchorSchema>

export const soundAssignmentScopeSchema = z.object({
  assignmentMode: z.enum(['scene', 'clip', 'range', 'multi_range', 'whole_video']),
  inspectWholeVideo: z.boolean(),
  inspectRanges: z.array(soundFrameRangeSchema).max(512),
  authorizedAudioWriteRanges: z.array(soundFrameRangeSchema).max(512),
  authorizedVisualWriteRanges: z.array(soundFrameRangeSchema).max(512),
  sceneIds: z.array(safeId).max(512),
  clipIds: z.array(safeId).max(2_000),
  lockedAudioTracks: z.array(safeId).max(256),
  lockedVisualLayers: z.array(safeId).max(512),
  targetAudioTracks: z.array(safeId).max(256),
  targetVisualLayers: z.array(safeId).max(512),
  contextHandles: z.array(z.object({
    contextHandleId: safeId,
    authorizedRange: soundFrameRangeSchema,
    purpose: z.enum(['sound_tail', 'neighbor_context', 'crossfade']),
  }).strict()).max(128),
  soundTailPolicy: z.enum([
    'end_within_authorized_range',
    'use_authorized_context_handle',
    'request_range_extension',
    'return_boundary_conflict',
  ]),
  parentAuthorityHash: sha256,
  sourceTimelineVersion: z.number().int().positive(),
  sourceTimelineHash: sha256,
  sourceArtifactVersions: z.array(z.object({
    artifactId: safeId,
    version: z.number().int().positive(),
    checksumSha256: sha256,
  }).strict()).min(1).max(2_000),
  manifestHash: sha256,
}).strict()

export type SoundAssignmentScope = z.infer<typeof soundAssignmentScopeSchema>

export const soundPeerAuthoritySchema = z.object({
  parentWorkItemId: safeId,
  parentAuthorityHash: sha256,
  callerOwnedAudioRanges: z.array(soundFrameRangeSchema).max(512),
  callerOwnedVisualRanges: z.array(soundFrameRangeSchema).max(512),
  ancestorSkillKeys: z.array(safeId).max(64),
  callerManifestHash: sha256,
}).strict()

const operation = z.enum([
  'study', 'design', 'preserve_source', 'search_library', 'extract_source',
  'generate_video_conditioned', 'generate_text_conditioned', 'generate_foley',
  'generate_ambience', 'repair', 'clean_dialogue', 'reduce_noise', 'trim',
  'fade', 'gain', 'normalize', 'resample', 'convert_channels', 'loop',
  'time_stretch', 'pitch_shift', 'sync', 'align_transient', 'mix',
  'render_stem', 'qa', 'revise', 'handoff', 'propose_visual_retime',
])

export type SoundRequestedOperation = z.infer<typeof operation>

const requestedMode = z.enum(['planning', 'fixture', 'private_internal', 'production'])

export const canonicalSoundRequestSchema = z.object({
  schemaVersion: z.literal(CANONICAL_SOUND_REQUEST_SCHEMA_VERSION),
  requestId: safeId,
  callerType: z.enum([
    'head_of_orchestra', 'living_frame', 'three_d', 'motion_design',
    'transitions', 'graphic_design', 'typed_peer_skill',
  ]),
  orchestraRunId: safeId.optional(),
  peerAuthority: soundPeerAuthoritySchema.optional(),
  callerSkillKey: safeId,
  callerSkillVersion: safeId,
  callerManifestHash: sha256.optional(),
  requestedCapabilityKey: safeId,
  requestedJobType: safeId,
  soundSkillKey: z.literal('sound'),
  soundSkillVersion: safeId,
  soundManifestHash: sha256,
  assignmentScope: soundAssignmentScopeSchema,
  requestedOperations: z.array(operation).min(1).max(64),
  requestedOutcome: boundedText,
  requiredDeliverables: z.array(safeId).min(1).max(64),
  sourceMediaRefs: z.array(soundArtifactRefSchema).max(2_000),
  sourceAudioRefs: z.array(soundArtifactRefSchema).max(2_000),
  visualDependencies: z.array(soundVisualDependencySchema).max(2_000),
  timelineManifestRef: soundArtifactRefSchema,
  timelineManifestHash: sha256,
  timelineFps: z.number().positive().max(240),
  transcriptSpeechEvidenceRef: soundArtifactRefSchema.optional(),
  musicContext: z.object({
    artifact: soundArtifactRefSchema,
    contextHash: sha256,
    readOnly: z.literal(true),
    approvedForTechnicalProcessing: z.boolean(),
    allowedAutomation: z.array(z.enum(['duck', 'fade', 'collision_avoidance'])).max(3),
  }).strict().optional(),
  completedSkillWork: z.array(z.object({
    skillKey: safeId,
    skillVersion: safeId,
    artifact: soundArtifactRefSchema,
  }).strict()).max(2_000),
  eventAnchors: z.array(soundEventAnchorSchema).max(10_000),
  userSoundPreferences: z.object({
    enableSoundDesign: z.boolean(),
    preserveNaturalSound: z.boolean(),
    preserveEmotionalSilence: z.boolean(),
    avoidLoudSoundUnderSpeech: z.boolean(),
    maximumCueDensityPerMinute: z.number().int().min(0).max(120),
    preferredPerspective: z.enum(['natural', 'close', 'cinematic', 'restrained']),
  }).strict(),
  referenceSoundInputs: z.array(soundArtifactRefSchema).max(32),
  qualityPolicy: z.object({
    qaDepth: z.enum(['standard', 'strong', 'studio']),
    sampleRate: z.union([z.literal(44_100), z.literal(48_000)]),
    channelLayout: z.enum(['mono', 'stereo']),
    maximumTruePeakDbtp: z.number().min(-12).max(-0.1),
    targetLoudnessLufs: z.number().min(-36).max(-8),
    speechClarityWins: z.literal(true),
  }).strict(),
  costPolicy: z.object({
    maximumCredits: z.number().nonnegative().max(10_000_000),
    candidateCount: z.number().int().min(1).max(4),
    allowProviderGeneration: z.boolean(),
    lowerCostAlternativesRequired: z.literal(true),
  }).strict(),
  latencyPolicy: z.object({
    maximumExpectedSeconds: z.number().int().positive().max(86_400),
    allowAsyncProviderJob: z.boolean(),
  }).strict(),
  providerPolicyEvidence: z.object({
    profileKey: safeId,
    profileVersion: safeId,
    privacyApproved: z.boolean(),
    commercialTermsApproved: z.boolean(),
    retentionApproved: z.boolean(),
    qualificationEvidenceIds: z.array(safeId).max(64),
  }).strict().optional(),
  executionAuthority: z.object({
    requestedMode,
    approvedPlanSnapshotId: safeId.optional(),
    approvedPlanSnapshotHash: sha256.optional(),
    creditReservationId: safeId.optional(),
    approvalStatus: z.enum(['not_required_for_planning', 'approved']),
    creditStatus: z.enum(['not_required', 'reserved']),
    privateOutputScopeId: safeId.optional(),
  }).strict(),
  idempotencyKey: safeId,
  attemptId: safeId,
  requiredQualificationMode: requestedMode,
  dependencyChain: z.array(safeId).max(64),
}).strict().superRefine((request, context) => {
  const peer = request.callerType !== 'head_of_orchestra'
  if (peer && !request.peerAuthority) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Peer Sound requests require peerAuthority.' })
  }
  if (!peer && !request.orchestraRunId) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Head Sound requests require orchestraRunId.' })
  }
  const executing = request.executionAuthority.requestedMode === 'private_internal' ||
    request.executionAuthority.requestedMode === 'production'
  if (executing && (
    !request.executionAuthority.approvedPlanSnapshotId ||
    !request.executionAuthority.approvedPlanSnapshotHash ||
    !request.executionAuthority.privateOutputScopeId ||
    request.executionAuthority.approvalStatus !== 'approved'
  )) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Sound execution requires an approved snapshot and private output scope.',
    })
  }
  if (request.costPolicy.allowProviderGeneration && executing && (
    !request.executionAuthority.creditReservationId ||
    request.executionAuthority.creditStatus !== 'reserved'
  )) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Paid/provider Sound execution requires an active credit reservation.',
    })
  }
  if (request.timelineManifestRef.checksumSha256 !== request.timelineManifestHash) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Timeline manifest hash mismatch.' })
  }
})

export type CanonicalSoundRequest = z.infer<typeof canonicalSoundRequestSchema>

const cueDecision = z.object({
  cueRequestId: safeId,
  decision: z.enum(['accepted', 'adjusted', 'merged', 'replaced', 'rejected', 'blocked']),
  reason: boundedText,
  resultingCueId: safeId.optional(),
}).strict()

const soundCue = z.object({
  cueId: safeId,
  eventAnchorId: safeId.optional(),
  startFrame: z.number().int().nonnegative(),
  hitFrame: z.number().int().nonnegative().optional(),
  endFrameExclusive: z.number().int().positive(),
  acquisitionDecision: z.enum([
    'preserve_project_source', 'internal_library', 'project_source_extraction',
    'generate_original', 'no_sound',
  ]),
  miniSkillKey: safeId,
  layerRole: z.enum([
    'background_texture', 'subtle_support', 'foreground_action', 'hero_impact',
    'transition_accent', 'room_tone', 'repair_layer',
  ]),
  storyReason: boundedText,
  sourceVisualHash: sha256.optional(),
  staleIfVisualChanges: z.boolean(),
}).strict().superRefine((cue, context) => {
  if (cue.endFrameExclusive <= cue.startFrame) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Cue end must exceed start.' })
  }
})

export type CanonicalSoundCue = z.infer<typeof soundCue>

const mixAutomation = z.object({
  cueId: safeId,
  baseGainDb: z.number().min(-96).max(24),
  gainEnvelope: z.array(z.object({
    frame: z.number().int().nonnegative(),
    gainDb: z.number().min(-96).max(24),
  }).strict()).min(2).max(512),
  fadeInFrames: z.number().int().nonnegative(),
  fadeOutFrames: z.number().int().nonnegative(),
  dialogueDuckingDb: z.number().min(-48).max(0),
  duckAttackFrames: z.number().int().nonnegative(),
  duckReleaseFrames: z.number().int().nonnegative(),
  protectedSpeechRanges: z.array(soundFrameRangeSchema).max(512),
  musicInteractionPolicy: z.enum(['none', 'avoid_accents', 'duck_approved_music', 'fade_approved_music']),
  eqProfile: z.enum(['neutral', 'speech_safe', 'distance_rolloff', 'impact_control', 'room_match']),
  dynamicsProfile: z.enum(['none', 'gentle_compression', 'peak_limiter']),
  pan: z.number().min(-1).max(1),
  distance: z.enum(['close', 'medium', 'distant']),
  roomMatch: z.enum(['dry', 'source_room', 'small_room', 'large_room', 'exterior']),
  headroomDb: z.number().min(0.1).max(24),
}).strict()

export type SoundMixAutomation = z.infer<typeof mixAutomation>

const soundToolOperationBindingSchema = z.object({
  toolKey: safeId,
  toolVersion: safeId,
  toolManifestHash: sha256,
  operationKey: safeId,
  operationVersion: safeId,
  operationProfileKey: safeId,
  operationProfileVersion: safeId,
  qualificationEvidenceRefs: z.array(safeId).max(128),
  rateCardSnapshotId: safeId.optional(),
  licenseEvidenceRef: safeId.optional(),
}).strict()

export const soundToolRouteBindingSchema = z.object({
  routeKey: safeId,
  routeVersion: safeId,
  routeHash: sha256,
  qualificationEvidenceRefs: z.array(safeId).max(128),
  toolOperations: z.array(soundToolOperationBindingSchema).min(1).max(128),
}).strict()

export const canonicalSoundResultSchema = z.object({
  schemaVersion: z.literal(CANONICAL_SOUND_RESULT_SCHEMA_VERSION),
  requestId: safeId,
  soundSkillKey: z.literal('sound'),
  soundSkillVersion: safeId,
  soundManifestHash: sha256,
  capabilityEntryKey: safeId,
  qualificationStatusUsed: z.enum([
    'declared', 'planning_qualified', 'fixture_qualified',
    'private_internal_qualified', 'production_qualified', 'blocked', 'deprecated',
  ]),
  toolRouteBindings: z.array(soundToolRouteBindingSchema).min(1).max(32),
  status: z.enum(['planned', 'completed', 'no_sound', 'blocked', 'needs_visual_revision', 'stale']),
  studyReport: z.record(z.string(), z.unknown()).optional(),
  soundDesignPlan: z.record(z.string(), z.unknown()).optional(),
  cueManifest: z.object({
    cueManifestId: safeId,
    version: z.number().int().positive(),
    cues: z.array(soundCue).max(10_000),
  }).strict(),
  mixAutomationManifest: z.object({
    mixManifestId: safeId,
    version: z.number().int().positive(),
    automations: z.array(mixAutomation).max(10_000),
  }).strict(),
  qaReport: z.record(z.string(), z.unknown()),
  candidateAssetVersions: z.array(soundArtifactRefSchema).max(128),
  selectedAssetVersions: z.array(soundArtifactRefSchema).max(128),
  privateSoundStemArtifacts: z.array(soundArtifactRefSchema).max(128),
  modifiedAudioRanges: z.array(soundFrameRangeSchema).max(512),
  modifiedVisualRanges: z.array(soundFrameRangeSchema).max(512),
  proposedVisualRevisions: z.array(z.object({
    proposalId: safeId,
    range: soundFrameRangeSchema,
    requestedChange: z.enum(['slow', 'extend', 'shorten', 'move']),
    reason: boundedText,
    routeThroughHead: z.literal(true),
  }).strict()).max(128),
  sourceVisualHashes: z.array(sha256).max(2_000),
  sourceAudioHashes: z.array(sha256).max(2_000),
  sourceTimingHash: sha256,
  callerReceipt: z.object({
    receiptId: safeId,
    callerType: safeId,
    callerSkillKey: safeId,
    parentWorkItemId: safeId.optional(),
    authorityHash: sha256,
    authorityEscalated: z.literal(false),
    requestResolved: z.boolean(),
    finalRenderOwnedBySound: z.literal(false),
    musicCompositionPerformed: z.literal(false),
  }).strict(),
  acceptedCueRequests: z.array(cueDecision).max(10_000),
  mergedCueRequests: z.array(cueDecision).max(10_000),
  rejectedCueRequests: z.array(cueDecision).max(10_000),
  blockedCueRequests: z.array(cueDecision).max(10_000),
  unresolvedDependencies: z.array(safeId).max(512),
  staleIfSourceChanges: z.literal(true),
  approvalStatus: z.enum(['not_required_for_planning', 'approved', 'blocked']),
  creditStatus: z.enum(['estimate_only', 'reserved', 'not_required', 'blocked']),
  providerStatus: z.enum(['not_needed', 'planned', 'fixture_qualified', 'submitted', 'succeeded', 'failed', 'unknown', 'blocked']),
  workerStatus: z.enum(['not_needed', 'planned', 'completed', 'failed', 'blocked']),
  artifactStatus: z.enum(['none', 'planned', 'private_ready', 'failed', 'blocked']),
  qaStatus: z.enum(['not_run', 'planned', 'passed', 'warning', 'failed', 'blocked']),
  finalHandoffTargets: z.array(z.enum(['head_of_orchestra', 'final_composition'])).max(2),
  actualExecutionEvidence: z.object({
    elapsedMilliseconds: z.number().int().nonnegative(),
    actualCreditsCharged: z.number().nonnegative(),
    providerCostEvidenceId: safeId.optional(),
    toolRuntimeEvidenceIds: z.array(safeId).max(128),
  }).strict().optional(),
}).strict()

export type CanonicalSoundResult = z.infer<typeof canonicalSoundResultSchema>

const forbiddenKeys = [
  /raw.*prompt/i,
  /credential/i,
  /api.*key/i,
  /secret/i,
  /signed.*url/i,
  /^url$/i,
  /local.*path/i,
  /shell/i,
  /executable/i,
  /ffmpeg.*arg/i,
  /filter.*graph/i,
  /provider.*transport/i,
]

function inspectForbidden(value: unknown, path: string, errors: string[]): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectForbidden(item, `${path}[${index}]`, errors))
    return
  }
  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (forbiddenKeys.some((pattern) => pattern.test(key))) errors.push(`forbidden_key:${path}.${key}`)
      inspectForbidden(item, `${path}.${key}`, errors)
    }
    return
  }
  if (typeof value === 'string' && (
    /^(?:https?|file):\/\//i.test(value) ||
    value.startsWith('/') ||
    /^[A-Za-z]:\\/.test(value)
  )) {
    errors.push(`forbidden_location:${path}`)
  }
}

export function parseCanonicalSoundRequest(input: unknown): CanonicalSoundRequest {
  const errors: string[] = []
  inspectForbidden(input, 'request', errors)
  if (errors.length > 0) throw new Error(`Unsafe canonical Sound request: ${errors.join(', ')}`)
  return canonicalSoundRequestSchema.parse(input)
}

export function parseCanonicalSoundResult(input: unknown): CanonicalSoundResult {
  return canonicalSoundResultSchema.parse(input)
}

export function soundQualificationMode(request: CanonicalSoundRequest): SkillRequestedMode {
  return request.requiredQualificationMode
}

export function qualificationFromRequest(
  request: CanonicalSoundRequest,
): SkillQualificationStatus | undefined {
  return request.requiredQualificationMode === 'planning' ? 'planning_qualified' : undefined
}
