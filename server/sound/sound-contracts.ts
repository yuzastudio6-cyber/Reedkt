import { z } from 'zod'
import {
  timelineRateDisplayFps,
  timelineRatesEqual,
  timelineRateSchema,
} from '../edit-skills/core/timeline-rate'
import type {
  SkillQualificationStatus,
} from '../edit-skills/core/edit-skill-ids'

export type SoundRequestedMode = 'planning' | 'fixture' | 'private_internal' | 'production'

export interface CompositeSoundExecutionPolicy {
  schemaVersion: 'composite-sound-execution-policy-v1'
  parentJobType: string
  parentMayExecuteDirectly: false
  childRoutesMustBeExactAndModeQualified: true
  privateInternalExecution: 'admit_only_when_every_required_child_route_is_qualified'
  fixtureExecution: 'admit_fixture_routes_and_internal_routes'
  productionExecution: 'admit_only_production_qualified_child_routes'
  completionPolicy: 'all_required_units_or_typed_partial_result'
}

export const CANONICAL_SOUND_REQUEST_SCHEMA_VERSION = 'canonical-sound-request-v1' as const
export const CANONICAL_SOUND_RESULT_SCHEMA_VERSION = 'canonical-sound-result-v1' as const

const safeId = z.string().trim().min(1).max(180)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'), 'Unsafe identity sequence.')
const sha256 = z.string().regex(/^[a-f0-9]{64}$/)
const boundedText = z.string().trim().min(1).max(2_000)
const safeStorageId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'), 'Unsafe storage identity sequence.')

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
  storageObjectId: safeStorageId,
  private: z.literal(true),
  contentType: z.string().trim().min(1).max(120),
  durationFrames: z.number().int().positive().optional(),
  timelineRate: timelineRateSchema.optional(),
}).strict()

export type SoundArtifactRef = z.infer<typeof soundArtifactRefSchema>

export const soundVisualDependencySchema = z.object({
  artifact: soundArtifactRefSchema,
  visualVersion: z.number().int().positive(),
  visualHash: sha256,
  timingManifestHash: sha256,
  originalApprovedVisual: z.literal(true),
  timelineRange: soundFrameRangeSchema.optional(),
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

const soundOperationDirectiveSchema = z.object({
  directiveId: safeId,
  operation,
  targetRangeId: safeId.optional(),
  eventAnchorId: safeId.optional(),
  sourceArtifactIds: z.array(safeId).max(16).optional(),
  parameters: z.object({
    trimSourceStartFrame: z.number().int().nonnegative().optional(),
    targetDurationFrames: z.number().int().positive().optional(),
    gainDb: z.number().min(-48).max(18).optional(),
    fadeInFrames: z.number().int().nonnegative().optional(),
    fadeOutFrames: z.number().int().nonnegative().optional(),
    loopCrossfadeFrames: z.number().int().positive().optional(),
    tempoRatio: z.number().min(0.5).max(2).optional(),
    pitchSemitones: z.number().min(-12).max(12).optional(),
    syncToleranceFrames: z.number().int().nonnegative().max(120).optional(),
    dialogueSourceArtifactId: safeId.optional(),
    sourceGainDb: z.record(safeId, z.number().min(-48).max(18)).optional(),
    proxyPreRollFrames: z.number().int().nonnegative().max(10_000).optional(),
    proxyPostRollFrames: z.number().int().nonnegative().max(10_000).optional(),
  }).strict(),
}).strict()

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
  operationDirectives: z.array(soundOperationDirectiveSchema).max(256).optional(),
  requestedOutcome: boundedText,
  requiredDeliverables: z.array(safeId).min(1).max(64),
  sourceMediaRefs: z.array(soundArtifactRefSchema).max(2_000),
  sourceAudioRefs: z.array(soundArtifactRefSchema).max(2_000),
  visualDependencies: z.array(soundVisualDependencySchema).max(2_000),
  timelineManifestRef: soundArtifactRefSchema,
  timelineManifestHash: sha256,
  timelineRate: timelineRateSchema,
  timelineManifestRate: timelineRateSchema,
  timelineFps: z.number().positive().max(240).optional(),
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
  if (!timelineRatesEqual(request.timelineRate, request.timelineManifestRate)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Timeline manifest rate mismatch.' })
  }
  if (request.timelineManifestRef.timelineRate &&
    !timelineRatesEqual(request.timelineRate, request.timelineManifestRef.timelineRate)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Timeline artifact rate mismatch.' })
  }
  if (request.timelineFps !== undefined &&
    Math.abs(request.timelineFps - timelineRateDisplayFps(request.timelineRate)) > 1e-9) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Display FPS does not match the exact timeline rate.' })
  }
  const sourceIds = new Set([
    ...request.sourceAudioRefs.map((item) => item.artifactId),
    ...request.referenceSoundInputs.map((item) => item.artifactId),
  ])
  const rangeIds = new Set(request.assignmentScope.authorizedAudioWriteRanges.map((item) => item.rangeId))
  const eventIds = new Set(request.eventAnchors.map((item) => item.anchorId))
  const directiveKeys = new Set<string>()
  for (const directive of request.operationDirectives ?? []) {
    if (!request.requestedOperations.includes(directive.operation)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `Operation directive ${directive.directiveId} was not requested.` })
    }
    if (directive.targetRangeId && !rangeIds.has(directive.targetRangeId)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `Operation directive ${directive.directiveId} references an unauthorized range.` })
    }
    if (directive.eventAnchorId && !eventIds.has(directive.eventAnchorId)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `Operation directive ${directive.directiveId} references an unknown event.` })
    }
    if (directive.sourceArtifactIds?.some((artifactId) => !sourceIds.has(artifactId))) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `Operation directive ${directive.directiveId} references an unauthorized source.` })
    }
    const key = `${directive.operation}:${directive.targetRangeId ?? '*'}:${directive.eventAnchorId ?? '*'}`
    if (directiveKeys.has(key)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `Operation directives collide at ${key}.` })
    }
    directiveKeys.add(key)
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
  selectedSourceArtifactId: safeId.optional(),
  sourceVisualHash: sha256.optional(),
  sourceVisualArtifactId: safeId.optional(),
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

const compiledSoundMixRenderSpecSchema = z.object({
  schemaVersion: z.literal('compiled-sound-mix-render-spec-v1'),
  renderSpecId: safeId,
  cueId: safeId,
  targetRange: soundFrameRangeSchema,
  timelineRate: timelineRateSchema,
  gainEnvelope: z.array(z.object({
    frame: z.number().int().nonnegative(),
    gainDb: z.number().min(-96).max(24),
  }).strict()).min(2).max(512),
  fadeInFrames: z.number().int().nonnegative(),
  fadeOutFrames: z.number().int().nonnegative(),
  protectedSpeechRanges: z.array(soundFrameRangeSchema).max(512),
  dialogueDuckingDb: z.number().min(-48).max(0),
  duckAttackFrames: z.number().int().nonnegative(),
  duckReleaseFrames: z.number().int().nonnegative(),
  eqProfile: z.enum(['neutral', 'speech_safe', 'distance_rolloff', 'impact_control', 'room_match']),
  dynamicsProfile: z.enum(['none', 'gentle_compression', 'peak_limiter']),
  perspectiveProfile: z.enum(['close', 'medium', 'distant']),
  roomProfile: z.enum(['dry', 'source_room', 'small_room', 'large_room', 'exterior']),
  pan: z.number().min(-1).max(1),
  headroomDb: z.number().min(0.1).max(24),
  sourceArtifactIds: z.array(safeId).min(1).max(128),
  renderSpecHash: sha256,
}).strict()

export type CompiledSoundMixRenderSpec = z.infer<typeof compiledSoundMixRenderSpecSchema>

export interface SoundStepOutputBundle {
  schemaVersion: 'sound-step-output-bundle-v1'
  unitId: string
  stepKey: string
  declaredOutputBindings: string[]
  outputsByBinding: Record<string, unknown>
  outputArtifactRefs: SoundArtifactRef[]
  bundleHash: string
}

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
    'declared', 'implementation_pending', 'planning_qualified',
    'internal_execution_qualified', 'production_qualified', 'blocked', 'retired',
  ]),
  toolRouteBindings: z.array(soundToolRouteBindingSchema).min(1).max(32),
  status: z.enum(['planned', 'completed', 'partial', 'no_sound', 'blocked', 'needs_visual_revision', 'stale']),
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
  soundDna: z.object({
    schemaVersion: z.literal('sound-dna-v1'),
    measured: z.record(z.string(), z.unknown()),
    declared: z.record(z.string(), z.unknown()),
    sourceArtifactIds: z.array(safeId).min(1).max(128),
    evidenceHash: sha256,
  }).strict().optional(),
  synchronizationPlacements: z.array(z.object({
    placementId: safeId,
    cueId: safeId,
    sourceArtifactId: safeId,
    requestedEventFrame: z.number().int().nonnegative(),
    detectedTransientFrame: z.number().int().nonnegative(),
    appliedOffsetFrames: z.number().int(),
    resultingTransientFrame: z.number().int().nonnegative(),
    residualErrorFrames: z.number().int().nonnegative(),
    timelineRate: timelineRateSchema,
    placementManifestHash: sha256,
  }).strict()).max(10_000).optional(),
  executionUnits: z.array(z.object({
    unitId: safeId,
    operationSpecHash: sha256,
    routeKey: safeId,
    routeVersion: safeId,
    routeHash: sha256,
    status: z.enum(['completed', 'no_sound', 'planning_only', 'failed', 'blocked']),
    targetRange: soundFrameRangeSchema,
    outputArtifactIds: z.array(safeId).max(128),
    mutationReceiptIds: z.array(safeId).max(128),
    providerAttemptIds: z.array(safeId).max(128),
    failureCode: safeId.optional(),
    receiptHash: sha256,
  }).strict()).max(10_000).optional(),
  mutationReceipts: z.array(z.object({
    mutationReceiptId: safeId,
    unitId: safeId,
    artifactId: safeId,
    range: soundFrameRangeSchema,
    sourceArtifactIds: z.array(safeId).max(128),
    sourceHashes: z.array(sha256).max(128),
    outputHash: sha256,
    sourceUnchanged: z.literal(true),
    receiptHash: sha256,
  }).strict()).max(10_000).optional(),
  revisionEvidence: z.object({
    previousRequestId: safeId,
    invalidatedRanges: z.array(soundFrameRangeSchema).min(1).max(512),
    preservedArtifactIds: z.array(safeId).max(10_000),
    preservedExecutionUnitIds: z.array(safeId).max(10_000),
    replacementCueIds: z.array(safeId).max(10_000),
    replacedUnitIds: z.array(safeId).max(10_000),
    unaffectedArtifactsReused: z.boolean(),
  }).strict().optional(),
  candidateProcessingReceipts: z.array(z.object({
    receiptId: safeId,
    unitId: safeId,
    candidateArtifactId: safeId,
    processedArtifactIds: z.array(safeId).min(1).max(32),
    studyEvidenceHash: sha256,
    qaEvidenceHash: sha256,
    eligibleForSelection: z.boolean(),
    receiptHash: sha256,
  }).strict()).max(512).optional(),
  candidateSelectionRecord: z.object({
    recordId: safeId,
    unitId: safeId,
    candidateArtifactIds: z.array(safeId).min(1).max(128),
    selectedArtifactId: safeId,
    selectionPolicyKey: safeId,
    recordHash: sha256,
  }).strict().optional(),
  mixRenderSpecifications: z.array(compiledSoundMixRenderSpecSchema).max(10_000).optional(),
  fallbackEvidence: z.array(z.object({
    fallbackEvidenceId: safeId,
    unitId: safeId,
    failedRouteKey: safeId,
    failedRouteVersion: safeId,
    failureCode: safeId,
    decision: z.enum(['blocked', 'use_declared_fallback', 'no_sound']),
    selectedFallbackRouteKey: safeId.optional(),
    selectedFallbackRouteVersion: safeId.optional(),
    freshApprovalRequired: z.boolean(),
    reconciliationCompleted: z.boolean(),
    evidenceHash: sha256,
  }).strict()).max(10_000).optional(),
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
  timelineRate: timelineRateSchema,
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
    routeExecutionId: safeId,
    elapsedMilliseconds: z.number().int().nonnegative(),
    actualCreditsCharged: z.number().nonnegative(),
    actualLocalInfrastructureCostUsd: z.number().nonnegative(),
    providerCostEvidenceId: safeId.optional(),
    providerAttemptId: safeId.optional(),
    providerAttemptStatus: safeId.optional(),
    providerAttemptIds: z.array(safeId).max(10_000).optional(),
    toolRuntimeEvidenceIds: z.array(safeId).max(128),
    outputArtifactHashes: z.array(sha256).max(128),
    stepOutputBundles: z.array(z.object({
      schemaVersion: z.literal('sound-step-output-bundle-v1'),
      unitId: safeId,
      stepKey: safeId,
      declaredOutputBindings: z.array(safeId).max(128),
      outputsByBinding: z.record(safeId, z.unknown()),
      outputArtifactRefs: z.array(soundArtifactRefSchema).max(128),
      bundleHash: sha256,
    }).strict()).max(10_000),
    stepEvidence: z.array(z.object({
      stepKey: safeId,
      toolKey: safeId,
      operationKey: safeId,
      unitId: safeId,
      status: z.enum(['completed', 'skipped_optional', 'skipped_condition', 'failed', 'blocked_dependency']),
      startedAt: z.string().datetime().optional(),
      completedAt: z.string().datetime().optional(),
      elapsedMilliseconds: z.number().int().nonnegative(),
      outputArtifactIds: z.array(safeId).max(128),
      outputArtifactHashes: z.array(sha256).max(128),
      outputBindingKeys: z.array(safeId).max(128),
      evidenceRefs: z.array(safeId).max(128),
      operationSpecHash: sha256,
      operationReceiptHash: sha256.optional(),
      failureCode: safeId.optional(),
    }).strict()).max(10_000),
  }).strict().optional(),
  finalCompositionHandoff: z.object({
    handoffId: safeId,
    soundArtifactIds: z.array(safeId).max(128),
    finalSoundArtifactReferences: z.array(soundArtifactRefSchema).max(128),
    intentionalNoSound: z.boolean(),
    authorizedRanges: z.array(soundFrameRangeSchema).max(512),
    cueManifestId: safeId,
    mixManifestId: safeId,
    qaEvidenceHash: sha256,
    timelineManifestHash: sha256,
    timelineRate: timelineRateSchema,
    finalRenderOwnedBySound: z.literal(false),
  }).strict().optional(),
}).strict().superRefine((result, context) => {
  if (result.status === 'completed') {
    if (!result.finalCompositionHandoff ||
      result.finalCompositionHandoff.finalSoundArtifactReferences.length === 0 ||
      result.finalCompositionHandoff.intentionalNoSound) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Completed Sound execution requires at least one exact final Sound artifact reference.',
      })
    }
  }
  if (result.status === 'no_sound' && result.finalCompositionHandoff &&
    !result.finalCompositionHandoff.intentionalNoSound) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'No-Sound handoff must be explicitly intentional.',
    })
  }
})

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

export function soundQualificationMode(request: CanonicalSoundRequest): SoundRequestedMode {
  return request.requiredQualificationMode
}

export function qualificationFromRequest(
  request: CanonicalSoundRequest,
): SkillQualificationStatus | undefined {
  return request.requiredQualificationMode === 'planning' ? 'planning_qualified' : undefined
}
