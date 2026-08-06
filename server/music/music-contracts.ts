import { createHash } from 'node:crypto'
import { z } from 'zod'
import {
  timelineRateDisplayFps,
  timelineRatesEqual,
  timelineRateSchema,
  type TimelineRate,
  type TimelineRoundingMode,
} from '../edit-skills/core/timeline-rate'
import type { SkillQualificationStatus } from '../edit-skills/core/edit-skill-ids'

export const MUSIC_SKILL_VERSION = '3.1.0' as const
export const MUSIC_CONTRACT_VERSION = 'music.skill_contract.v3' as const
export const CANONICAL_MUSIC_REQUEST_SCHEMA_VERSION = 'canonical-music-request-v3' as const
export const CANONICAL_MUSIC_RESULT_SCHEMA_VERSION = 'canonical-music-result-v3' as const
export const RETIRED_MUSIC_V2_IDENTITY = Object.freeze({
  skillVersion: '2.0.0',
  contractVersion: 'music.skill_contract.v2',
  requestSchemaVersion: 'canonical-music-request-v2',
  resultSchemaVersion: 'canonical-music-result-v2',
  status: 'compatibility_only',
} as const)
export const RETIRED_MUSIC_V1_IDENTITY = Object.freeze({
  skillVersion: '1.0.0',
  contractVersion: 'music.skill_contract.v1',
  requestSchemaVersion: 'canonical-music-request-v1',
  resultSchemaVersion: 'canonical-music-result-v1',
  status: 'compatibility_only',
} as const)

export const musicSafeIdSchema = z.string().trim().min(1).max(220)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'), 'Unsafe identity sequence.')
export const musicSha256Schema = z.string().regex(/^[a-f0-9]{64}$/u)
const boundedText = z.string().trim().min(1).max(4_000)
const safeStorageId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'), 'Unsafe storage identity sequence.')

export const musicFrameRangeSchema = z.object({
  rangeId: musicSafeIdSchema,
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
}).strict().superRefine((range, context) => {
  if (range.endFrameExclusive <= range.startFrame) {
    context.addIssue({ code: 'custom', message: 'Music range end must exceed start.' })
  }
})
export type MusicFrameRange = z.infer<typeof musicFrameRangeSchema>

export const musicArtifactRefSchema = z.object({
  artifactId: musicSafeIdSchema,
  artifactType: musicSafeIdSchema,
  version: z.number().int().positive(),
  checksumSha256: musicSha256Schema,
  storageObjectId: safeStorageId,
  private: z.literal(true),
  contentType: z.string().trim().min(1).max(120),
  byteSize: z.number().int().nonnegative().optional(),
  durationFrames: z.number().int().nonnegative().optional(),
  timelineRate: timelineRateSchema.optional(),
  lineageArtifactIds: z.array(musicSafeIdSchema).max(256).optional(),
}).strict()
export type MusicArtifactRef = z.infer<typeof musicArtifactRefSchema>

export const musicEvidenceRefSchema = z.object({
  evidenceId: musicSafeIdSchema,
  evidenceType: musicSafeIdSchema,
  version: z.number().int().positive(),
  evidenceHash: musicSha256Schema,
  evidenceLevel: z.enum(['measured', 'structured', 'user_declared', 'inferred', 'review_required']),
}).strict()
export type MusicEvidenceRef = z.infer<typeof musicEvidenceRefSchema>

export const musicRightsBindingSchema = z.object({
  rightsId: musicSafeIdSchema,
  assetId: musicSafeIdSchema,
  assetVersion: z.number().int().positive(),
  assetHash: musicSha256Schema,
  source: z.enum(['source_media', 'user_upload', 'project_library', 'workspace_library', 'internal_library', 'provider_generated']),
  ownershipDeclaration: z.enum(['user_declared', 'provider_terms', 'project_owned', 'workspace_authorized', 'internal_approved', 'unknown']),
  commercialUse: z.enum(['allowed', 'not_allowed', 'unknown']),
  platformUse: z.enum(['allowed', 'restricted', 'unknown']),
  editingPermission: z.enum(['allowed', 'not_allowed', 'unknown']),
  attributionRequired: z.boolean(),
  crossProjectReuse: z.enum(['allowed', 'not_allowed', 'unknown']),
  crossUserReuse: z.literal(false),
  projectOnly: z.boolean(),
  authorizedProjectIds: z.array(musicSafeIdSchema).max(256),
  authorizedWorkspaceIds: z.array(musicSafeIdSchema).max(256),
  authorizedPlatformIds: z.array(musicSafeIdSchema).max(256),
  expiresAt: z.string().datetime({ offset: true }).optional(),
  evidenceRefs: z.array(musicEvidenceRefSchema).max(64),
}).strict()
export type MusicRightsBinding = z.infer<typeof musicRightsBindingSchema>

export const musicAssetDescriptorSchema = z.object({
  assetId: musicSafeIdSchema,
  assetVersion: z.number().int().positive(),
  assetHash: musicSha256Schema,
  sourceType: z.enum(['source_media', 'user_upload', 'project_library', 'workspace_library', 'internal_library', 'provider_generated']),
  availability: z.enum(['available', 'unavailable', 'unknown']),
  descriptiveEvidenceLevel: z.enum(['measured', 'structured', 'user_declared', 'provider_declared', 'inferred', 'review_required']),
  narrativeFunctions: z.array(z.enum([
    'establish_place', 'establish_tone', 'create_motion', 'support_reflection',
    'increase_anticipation', 'bridge_chapters', 'support_montage', 'hold_continuity',
    'release_tension', 'resolve_ending', 'remain_absent',
  ])).max(16).default([]),
  tempoRangeBpm: z.object({ minimum: z.number().min(20).max(300), maximum: z.number().min(20).max(300) }).strict().optional(),
  energyProfile: z.enum(['low', 'medium', 'high', 'dynamic', 'unknown']).default('unknown'),
  rhythmProfile: z.string().trim().max(500).optional(),
  structuralTags: z.array(z.enum(['clean_intro', 'phrase_entries', 'loopable', 'clean_ending', 'resolved_outro'])).max(16).default([]),
  declaredVocalPolicy: z.enum(['instrumental', 'vocals', 'uncertain']).default('uncertain'),
  continuityFamily: z.string().trim().min(1).max(200).optional(),
  estimatedCredits: z.number().nonnegative().max(10_000_000).default(0),
  evidenceRefs: z.array(musicEvidenceRefSchema).max(64).default([]),
}).strict().superRefine((value, context) => {
  if (value.tempoRangeBpm && value.tempoRangeBpm.maximum < value.tempoRangeBpm.minimum) {
    context.addIssue({ code: 'custom', message: 'Music asset descriptor tempo maximum must be at least its minimum.' })
  }
})
export type MusicAssetDescriptor = z.infer<typeof musicAssetDescriptorSchema>

export const musicAssignmentScopeSchema = z.object({
  assignmentMode: z.enum(['video', 'sequence', 'scene', 'clip', 'range', 'multi_range', 'boundary']),
  authorizedInspectRanges: z.array(musicFrameRangeSchema).min(1).max(2_000),
  authorizedMusicWriteRanges: z.array(musicFrameRangeSchema).max(2_000),
  authorizedMusicTrackIds: z.array(musicSafeIdSchema).max(256),
  authorizedSourceMusicAssetIds: z.array(musicSafeIdSchema).max(2_000),
  mayStudyWholeVideo: z.boolean(),
  mayCreateMusicTrack: z.boolean(),
  mayReplaceExistingMusic: z.boolean(),
  mayUseUserProvidedMusic: z.boolean(),
  mayUseLibraryMusic: z.boolean(),
  mayGenerateMusic: z.boolean(),
  lockedMusicTrackIds: z.array(musicSafeIdSchema).max(256),
  lockedRanges: z.array(musicFrameRangeSchema).max(2_000),
  contextHandleFrames: z.number().int().nonnegative().max(100_000),
  approvedTimelineRef: musicArtifactRefSchema,
  timelineRate: timelineRateSchema,
  parentAuthorityRef: musicSafeIdSchema,
  parentAuthorityHash: musicSha256Schema,
}).strict()
export type MusicAssignmentScope = z.infer<typeof musicAssignmentScopeSchema>

export const MUSIC_JOB_TYPES = [
  'study_video_music_context', 'study_existing_music', 'study_user_provided_music',
  'study_reference_music', 'create_music_reference_dna', 'decide_music_need',
  'decide_music_silence', 'plan_music_narrative_arc', 'plan_music_motif',
  'plan_scene_music', 'plan_boundary_music', 'full_video_music_pass',
  'create_music_cue_sheet', 'select_user_provided_music', 'search_project_music',
  'search_workspace_music', 'search_authorized_music_library', 'generate_original_music',
  'generate_music_variation', 'analyze_music_candidate', 'select_music_candidate',
  'fit_music_to_edit', 'sync_music_to_picture', 'prepare_music_stem',
  'plan_music_mix', 'request_sound_processing', 'support_motion_studio_music',
  'support_living_frame_music', 'support_3d_music', 'support_transition_music',
  'support_graphic_design_music', 'qa_music', 'revise_music',
  'promote_music_library_candidate', 'handoff_music_to_final_composition',
] as const
export type MusicJobType = (typeof MUSIC_JOB_TYPES)[number]

export const musicCueIntentSchema = z.object({
  cueId: musicSafeIdSchema,
  exactRange: musicFrameRangeSchema,
  sceneIds: z.array(musicSafeIdSchema).max(128),
  boundaryIds: z.array(musicSafeIdSchema).max(128),
  narrativeFunction: z.enum([
    'establish_place', 'establish_tone', 'create_motion', 'support_reflection',
    'increase_anticipation', 'bridge_chapters', 'support_montage', 'hold_continuity',
    'release_tension', 'resolve_ending', 'remain_absent',
  ]),
  currentStoryState: boundedText,
  targetStoryState: boundedText,
  cueRole: z.enum(['bed', 'motif', 'accent', 'chapter', 'montage', 'outro', 'silence', 'ambience_only']),
  motifRole: z.enum(['none', 'introduce', 'develop', 'vary', 'return', 'resolve']),
  energyArc: z.enum(['flat_low', 'rise', 'fall', 'rise_and_resolve', 'pulse', 'silence']),
  tempoRangeBpm: z.object({ minimum: z.number().min(20).max(300), maximum: z.number().min(20).max(300) }).strict().optional(),
  harmonicDirection: z.string().trim().max(500),
  instrumentation: z.array(z.string().trim().min(1).max(120)).max(32),
  arrangementDensity: z.enum(['silence', 'minimal', 'sparse', 'moderate', 'dense']),
  rhythmProfile: z.string().trim().max(500),
  vocalPolicy: z.enum(['instrumental_only', 'vocals_allowed', 'vocals_required', 'review_required']),
  lyricPolicy: z.enum(['no_lyrics', 'user_approved_lyrics', 'provider_generated_lyrics', 'review_required']),
  languagePolicy: z.enum(['not_applicable', 'explicit_user_language', 'review_required']),
  protectedSpeechRanges: z.array(musicFrameRangeSchema).max(1_000),
  intentionalNoMusicRanges: z.array(musicFrameRangeSchema).max(1_000),
  syncAnchorFrames: z.array(z.number().int().nonnegative()).max(1_000),
  entryHandleFrames: z.number().int().nonnegative(),
  exitHandleFrames: z.number().int().nonnegative(),
  fadeInFrames: z.number().int().nonnegative(),
  fadeOutFrames: z.number().int().nonnegative(),
  sourceStartSample: z.number().int().nonnegative().optional(),
  sourceEndSampleExclusive: z.number().int().positive().optional(),
  roundingPolicy: z.enum(['floor', 'ceil', 'nearest_half_up']),
  acquisitionPreference: z.enum([
    'professional_order', 'preserve_source', 'user_upload', 'project_library',
    'workspace_library', 'internal_library', 'generate_original', 'no_music', 'ambience_only',
  ]),
  soundProcessingIntent: z.array(z.enum([
    'trim', 'cut', 'fade', 'crossfade', 'gain', 'normalize', 'loop', 'resample',
    'channel_conversion', 'time_stretch', 'pitch_shift', 'place', 'dialogue_ducking',
    'eq', 'dynamics', 'pan', 'stem_rendering', 'technical_qa',
  ])).max(32),
}).strict().superRefine((cue, context) => {
  if (cue.tempoRangeBpm && cue.tempoRangeBpm.maximum < cue.tempoRangeBpm.minimum) {
    context.addIssue({ code: 'custom', message: 'Cue tempo maximum must be at least its minimum.' })
  }
  if ((cue.sourceStartSample === undefined) !== (cue.sourceEndSampleExclusive === undefined)) {
    context.addIssue({ code: 'custom', message: 'Cue source sample range must be complete.' })
  }
  if (cue.sourceStartSample !== undefined && cue.sourceEndSampleExclusive! <= cue.sourceStartSample) {
    context.addIssue({ code: 'custom', message: 'Cue source sample end must exceed start.' })
  }
})
export type CanonicalMusicCueIntent = z.infer<typeof musicCueIntentSchema>

export const musicCueConstraintSchema = z.object({
  constraintId: musicSafeIdSchema,
  authorityMode: z.enum([
    'fully_locked', 'range_locked', 'creative_fields_locked', 'soft_preference', 'advisory',
  ]),
  cue: musicCueIntentSchema,
  lockedCreativeFields: z.array(z.enum([
    'narrativeFunction', 'cueRole', 'motifRole', 'energyArc', 'tempoRangeBpm',
    'harmonicDirection', 'instrumentation', 'arrangementDensity', 'rhythmProfile',
    'vocalPolicy', 'lyricPolicy', 'languagePolicy', 'acquisitionPreference',
    'soundProcessingIntent',
  ])).max(32).default([]),
  mayMergeWithAdjacentSegments: z.boolean().default(false),
  evidenceRefs: z.array(musicEvidenceRefSchema).max(64).default([]),
}).strict()
export type MusicCueConstraint = z.infer<typeof musicCueConstraintSchema>

const callerSchema = z.object({
  callerType: z.enum([
    'head_of_orchestra', 'motion_studio', 'living_frame', 'three_d',
    'transitions', 'graphic_design', 'typed_peer_skill',
  ]),
  callerSkillKey: musicSafeIdSchema,
  callerSkillVersion: musicSafeIdSchema,
  callerManifestHash: musicSha256Schema.optional(),
  parentWorkItemId: musicSafeIdSchema,
  authorityRef: musicSafeIdSchema,
  ancestorSkillKeys: z.array(musicSafeIdSchema).max(64),
  callerOwnedRanges: z.array(musicFrameRangeSchema).max(2_000).optional(),
}).strict()

const approvedSnapshotSchema = z.object({
  snapshotId: musicSafeIdSchema,
  snapshotVersion: z.number().int().positive(),
  snapshotHash: musicSha256Schema,
}).strict()

const timelineBindingSchema = z.object({
  timelineManifestId: musicSafeIdSchema,
  timelineManifestVersion: z.number().int().positive(),
  timelineManifestHash: musicSha256Schema,
  rationalTimelineRate: timelineRateSchema,
  displayFps: z.number().positive().max(240).optional(),
}).strict()

const contextRefsSchema = z.object({
  storyPlanRef: musicEvidenceRefSchema.optional(),
  sceneMapRef: musicEvidenceRefSchema.optional(),
  transcriptRef: musicEvidenceRefSchema.optional(),
  speechRangeRef: musicEvidenceRefSchema.optional(),
  visualIntelligenceRef: musicEvidenceRefSchema.optional(),
  sourceAudioEvidenceRef: musicEvidenceRefSchema.optional(),
  existingMusicManifestRef: musicEvidenceRefSchema.optional(),
  transitionPlanRef: musicEvidenceRefSchema.optional(),
  existingSoundPlanRef: musicEvidenceRefSchema.optional(),
}).strict()

export const canonicalMusicRequestSchema = z.object({
  schemaVersion: z.literal(CANONICAL_MUSIC_REQUEST_SCHEMA_VERSION),
  requestId: musicSafeIdSchema,
  requestVersion: z.literal('3.0.0'),
  caller: callerSchema,
  jobType: z.enum(MUSIC_JOB_TYPES),
  requestedExecutionMode: z.enum(['planning', 'fixture', 'private_internal', 'production']),
  requestedDeliverables: z.array(musicSafeIdSchema).min(1).max(128),
  approvedSnapshotRef: approvedSnapshotSchema,
  timelineBinding: timelineBindingSchema,
  scopeAuthority: musicAssignmentScopeSchema,
  projectBinding: z.object({
    projectId: musicSafeIdSchema,
    workspaceId: musicSafeIdSchema,
    ownerUserId: musicSafeIdSchema,
    platformIds: z.array(musicSafeIdSchema).min(1).max(32),
  }).strict(),
  contextRefs: contextRefsSchema,
  contextEvidence: z.array(musicEvidenceRefSchema).max(2_000),
  userMusicPolicy: z.object({
    musicEnabled: z.boolean(),
    preserveSourceMusic: z.boolean(),
    preserveNaturalSound: z.boolean(),
    protectEmotionalSilence: z.boolean(),
    allowGeneration: z.boolean(),
    instrumentalUnderImportantSpeech: z.literal(true),
    maximumCueCount: z.number().int().nonnegative().max(256),
    maximumCueChangesPerMinute: z.number().nonnegative().max(60),
    customDirectives: z.array(boundedText).max(64),
  }).strict(),
  inputAssetRefs: z.array(musicArtifactRefSchema).max(2_000),
  referenceMusicRefs: z.array(musicArtifactRefSchema).max(64),
  rightsAndProvenanceRefs: z.array(musicRightsBindingSchema).max(2_000),
  musicAssetDescriptors: z.array(musicAssetDescriptorSchema).max(2_000).optional().default([]),
  cueConstraints: z.object({
    requestedCues: z.array(musicCueIntentSchema).max(512),
    lockedCueIds: z.array(musicSafeIdSchema).max(512),
    allowMusicToCombineUnlockedCues: z.boolean(),
    constraints: z.array(musicCueConstraintSchema).max(512).optional().default([]),
  }).strict(),
  proposedCues: z.array(musicCueIntentSchema).max(512).optional().default([]),
  approvalAndBudget: z.object({
    estimateRef: musicSafeIdSchema.optional(),
    reservationRef: musicSafeIdSchema.optional(),
    approvalStatus: z.enum(['not_required_for_planning', 'approved']),
    maximumCandidates: z.number().int().min(1).max(4),
    maximumAttempts: z.number().int().min(1).max(4),
    maximumCredits: z.number().nonnegative().max(10_000_000),
  }).strict(),
  privateOutputScopeId: musicSafeIdSchema.optional(),
  idempotencyKey: musicSafeIdSchema,
}).strict().superRefine((request, context) => {
  if (request.scopeAuthority.approvedTimelineRef.checksumSha256 !== request.timelineBinding.timelineManifestHash) {
    context.addIssue({ code: 'custom', message: 'Approved timeline artifact hash mismatch.' })
  }
  if (!timelineRatesEqual(request.scopeAuthority.timelineRate, request.timelineBinding.rationalTimelineRate)) {
    context.addIssue({ code: 'custom', message: 'Music scope and timeline rates do not match.' })
  }
  if (request.timelineBinding.displayFps !== undefined && Math.abs(
    request.timelineBinding.displayFps - timelineRateDisplayFps(request.timelineBinding.rationalTimelineRate),
  ) > 1e-9) {
    context.addIssue({ code: 'custom', message: 'Display FPS does not match exact Music timeline rate.' })
  }
  const executing = request.requestedExecutionMode !== 'planning'
  if (executing && (
    request.approvalAndBudget.approvalStatus !== 'approved' || !request.privateOutputScopeId
  )) {
    context.addIssue({ code: 'custom', message: 'Music execution requires approved snapshot authority and private output scope.' })
  }
  if (executing && request.userMusicPolicy.allowGeneration && !request.approvalAndBudget.reservationRef) {
    context.addIssue({ code: 'custom', message: 'Music provider-capable execution requires a credit reservation.' })
  }
  const peer = request.caller.callerType !== 'head_of_orchestra'
  if (peer && (!request.caller.callerManifestHash || !request.caller.callerOwnedRanges)) {
    context.addIssue({ code: 'custom', message: 'Peer Music calls require manifest and owned-range evidence.' })
  }
  if (request.caller.ancestorSkillKeys.includes('music')) {
    context.addIssue({ code: 'custom', message: 'Circular Music dependency is not allowed.' })
  }
  const requestedCues = [...request.cueConstraints.requestedCues, ...request.proposedCues]
  // Caller-authored constraints may themselves make a hard cue policy impossible. They are admitted as
  // constraints so the canonical grouping stage can return a typed, evidence-bound policy conflict rather
  // than failing before Music has explained the minimum professionally valid cue set.
  const cueIds = new Set(requestedCues.map((cue) => cue.cueId))
  if (cueIds.size !== requestedCues.length) {
    context.addIssue({ code: 'custom', message: 'Music cue constraint identities must be unique.' })
  }
  if (request.cueConstraints.lockedCueIds.some((cueId) => !cueIds.has(cueId))) {
    context.addIssue({ code: 'custom', message: 'Locked Music cue identity has no matching cue constraint.' })
  }
})
export type CanonicalMusicSkillRequest = z.infer<typeof canonicalMusicRequestSchema>

export function requestedMusicCueConstraints(request: CanonicalMusicSkillRequest): CanonicalMusicCueIntent[] {
  return [...request.cueConstraints.requestedCues, ...request.proposedCues]
}

export function canonicalMusicCueConstraints(request: CanonicalMusicSkillRequest): MusicCueConstraint[] {
  const explicit = request.cueConstraints.constraints
  const explicitCueIds = new Set(explicit.map((constraint) => constraint.cue.cueId))
  const legacy = requestedMusicCueConstraints(request).filter((cue) => !explicitCueIds.has(cue.cueId)).map((cue) => ({
    constraintId: cue.cueId,
    authorityMode: request.cueConstraints.lockedCueIds.includes(cue.cueId)
      ? 'fully_locked' as const : 'soft_preference' as const,
    cue: structuredClone(cue),
    lockedCreativeFields: [] as MusicCueConstraint['lockedCreativeFields'],
    mayMergeWithAdjacentSegments: request.cueConstraints.allowMusicToCombineUnlockedCues,
    evidenceRefs: [] as MusicEvidenceRef[],
  }))
  return [...explicit.map((constraint) => structuredClone(constraint)), ...legacy]
}

export interface MusicSoundtrackSegment {
  segmentId: string
  exactRange: MusicFrameRange
  sourceWriteRangeId: string
  sceneIds: string[]
  classification: 'testimony' | 'speech' | 'emotional_pause' | 'ambience_priority' |
    'transition' | 'chapter' | 'montage' | 'story' | 'unresolved'
  importantSpeech: boolean
  naturalAmbiencePriority: boolean
  intentionalSilenceCandidate: boolean
  transitionBoundaryIds: string[]
  cueConstraintIds: string[]
  locked: boolean
  splitReasons: string[]
  evidenceRefs: string[]
}

export interface MusicSoundtrackSegmentationPlan {
  schemaVersion: 'music-soundtrack-segmentation-plan-v3'
  planId: string
  requestId: string
  timelineHash: string
  timelineRate: TimelineRate
  authorizedWriteRanges: MusicFrameRange[]
  segments: MusicSoundtrackSegment[]
  coverageStatus: 'exact'
  overlapPolicy: 'none_except_typed_crossfade'
  crossfadeOverlaps: Array<{ leftSegmentId: string; rightSegmentId: string; range: MusicFrameRange }>
  unresolvedEvidence: string[]
  planHash: string
}

export interface MusicCueGroupingMember {
  segmentId: string
  exactRange: MusicFrameRange
  classification: MusicSoundtrackSegment['classification']
  decision: MusicNeedDecisionKind
  protectedSpeech: boolean
  naturalAmbiencePriority: boolean
  locked: boolean
  cueConstraintIds: string[]
}

export interface MusicCueGroup {
  groupId: string
  exactRange: MusicFrameRange
  memberSegmentIds: string[]
  members: MusicCueGroupingMember[]
  cueRole: CanonicalMusicCueIntent['cueRole']
  acquisitionFamily: MusicNeedDecisionKind
  motifOrContinuityFamily: string
  narrativePurpose: CanonicalMusicCueIntent['narrativeFunction']
  protectedSpeechBehavior: 'none' | 'instrumental_and_duck' | 'remain_absent'
  mergeReasons: string[]
  nonMergeBoundaryReasons: string[]
  lockedCueConstraintIds: string[]
  noMusicOrSilenceBoundary: boolean
  rightsAndProvenanceConstraintIds: string[]
}

export interface MusicCueGroupingReductionDecision {
  decisionId: string
  action: 'merge_compatible_beds' | 'reuse_continuity_family' | 'remove_decorative_cue' |
    'convert_to_intentional_no_music' | 'convert_to_ambience_only'
  affectedGroupIds: string[]
  resultingGroupId?: string
  reason: string
  decisionHash: string
}

export interface MusicCuePolicyConflict {
  schemaVersion: 'music-cue-policy-conflict-v3'
  conflictId: string
  requestId: string
  requestedMaximumCueCount: number
  requestedMaximumCueChangesPerMinute: number
  minimumPossibleCueCount: number
  minimumPossibleCueChangesPerMinute: number
  hardConstraintIds: string[]
  affectedCueGroupIds: string[]
  affectedSegmentIds: string[]
  requiresNewApprovalOrPolicyRevision: true
  reason: string
  conflictHash: string
}

export interface MusicCrossfadePlan {
  schemaVersion: 'music-crossfade-plan-v3'
  planId: string
  requestId: string
  leftCueId: string
  rightCueId: string
  leftSource: MusicArtifactRef
  rightSource: MusicArtifactRef
  leftSourceRange: MusicFrameRange
  rightSourceRange: MusicFrameRange
  targetOverlapRange: MusicFrameRange
  authorizedWriteRange: MusicFrameRange
  crossfadeDurationFrames: number
  crossfadeDurationSamples: number
  timelineRate: TimelineRate
  sampleRate: 44_100 | 48_000
  curveType: 'equal_power' | 'linear'
  soundRouteIdentity: string
  soundExtensionVersion: string
  planHash: string
}

export interface MusicCrossfadeReceipt {
  schemaVersion: 'music-crossfade-receipt-v3'
  planId: string
  planHash: string
  soundReceiptHash: string
  leftSourceHash: string
  rightSourceHash: string
  outputArtifact: MusicArtifactRef
  measuredQaEvidenceHash: string
  receiptHash: string
}

export interface MusicCueGroupingPlan {
  schemaVersion: 'music-cue-grouping-plan-v3'
  groupingPlanId: string
  requestId: string
  sourceSegmentationArtifactId: string
  sourceSegmentationArtifactHash: string
  sourceSegmentationPlanHash: string
  timelineHash: string
  timelineRate: TimelineRate
  atomicSegmentIds: string[]
  groups: MusicCueGroup[]
  densityCalculation: {
    durationFrames: number
    durationMinutes: number
    cueChangeCount: number
    cueChangesPerMinute: number
  }
  maximumCueCountCalculation: {
    requestedMaximum: number
    actualFinal: number
    satisfied: boolean
  }
  maximumCueChangesPerMinuteCalculation: {
    requestedMaximum: number
    actualFinal: number
    satisfied: boolean
  }
  reductionDecisions: MusicCueGroupingReductionDecision[]
  unresolvedTypedConflictIds: string[]
  groupingHash: string
}

export interface MusicCueConstraintResolution {
  resolutionId: string
  constraintId: string
  authorityMode: MusicCueConstraint['authorityMode']
  decision: 'preserved_exactly' | 'preserved_range' | 'merged_into_segment' | 'split_across_segments' |
    'treated_as_preference' | 'treated_as_advisory' | 'rejected_conflict'
  resultingCueIds: string[]
  resultingRanges: MusicFrameRange[]
  changedFields: string[]
  reason: string
  resolutionHash: string
}

export interface MusicAcceptanceReceipt {
  receiptId: string
  evidenceKey: string
  jobType: MusicJobType
  capabilityKey: string
  capabilityVersion: string
  requestedMode: CanonicalMusicSkillRequest['requestedExecutionMode']
  routeIdentities: string[]
  operationHandlerIdentities: string[]
  invokedUnitIds: string[]
  inputBindingHashes: string[]
  outputArtifactIds: string[]
  outputBindingHashes: string[]
  assertionKeys: string[]
  evidenceRefs: string[]
  resultEvidenceHash: string
  status: 'planned' | 'completed' | 'partial' | 'blocked' | 'no_music' | 'ambience_only'
  receiptHash: string
}

export type MusicNeedDecisionKind =
  | 'no_music' | 'intentional_silence' | 'ambience_only' | 'preserve_source_music'
  | 'user_provided_music' | 'project_music' | 'workspace_music' | 'internal_music'
  | 'generate_original_music' | 'hybrid_soundtrack'

export interface MusicArtifactEnvelope<TPayload = unknown> {
  artifactId: string
  artifactVersion: number
  schemaVersion: string
  artifactType: string
  artifactHash: string
  requestId: string
  sourceArtifactHashes: string[]
  timelineHash: string
  timelineRate: TimelineRate
  cueId?: string
  qualificationEvidence: string[]
  createdAt: string
  invalidationKeys: string[]
  revisionLineage: string[]
  payload: TPayload
}

export interface MusicRouteBinding {
  cueId: string
  acquisitionDecision: MusicNeedDecisionKind
  routeKey: string
  routeVersion: string
  routeHash: string
  qualificationStatus: SkillQualificationStatus
  selectionReason: string
  sourceBindings: string[]
  rightsBindings: string[]
  fallbackRoutes: string[]
  lowerCostRoutes: string[]
  estimatedCredits: number
  attemptPolicyKey: string
}

export interface MusicCandidateAnalysis {
  candidateArtifact: MusicArtifactRef
  decodeSucceeded: boolean
  durationSeconds: number
  sampleRate: number
  channels: number
  integratedLoudnessLufs: number | null
  truePeakDbtp: number | null
  clippedSampleCount: number
  silenceRatio: number
  measuredTempoBpm: number | null
  beatFrames: number[]
  phraseBoundaryFrames: number[]
  sectionBoundaryFrames: number[]
  chromaKeyEvidence: { label: string; confidence: number } | null
  energyContour: number[]
  measuredVocalEvidence: { present: boolean | null; confidence: number; reviewRequired: boolean }
  loopQuality: { score: number; reviewRequired: boolean }
  endingQuality: { score: number; reviewRequired: boolean }
  generationArtifactFindings: string[]
  qualificationEvidence: string[]
}

export interface MusicSoundSupportReceipt {
  cueId: string
  delegatedRange: MusicFrameRange
  musicSoundSupportRequestHash: string
  soundPublicRequestHash: string
  exactOperationParametersHash: string
  requiredMusicOperations: string[]
  mappedSoundOperations: string[]
  technicalMixDirectiveHash: string
  receivedTechnicalAutomationHash: string
  appliedTechnicalAutomationHash: string
  appliedOperationReceipts: Array<{
    operation: string
    operationVersion: string
    requestedParameters: Record<string, unknown>
    receivedParametersHash: string
    compiledParameters: Record<string, unknown>
    compiledParametersHash: string
    appliedParameters: Record<string, unknown>
    appliedParametersHash: string
    sourceArtifactIds: string[]
    sourceArtifactHashes: string[]
    outputArtifactIds: string[]
    outputArtifactHashes: string[]
    exactMutationRange: MusicFrameRange
    handlerIdentity: string
    routeKey: string
    routeVersion: string
    routeHash: string
    measuredQaRefs: string[]
    measuredQaResult: 'passed' | 'warning' | 'needs_review' | 'failed'
    status: 'completed'
    receiptHash: string
  }>
  soundSkillVersion: string
  soundManifestHash: string
  soundCapabilityKey: string
  soundRouteBindings: string[]
  soundResultHash: string
  processedMusicAssets: MusicArtifactRef[]
  musicStemAssets: MusicArtifactRef[]
  mutationRanges: MusicFrameRange[]
  technicalQaRefs: string[]
  synchronizationQaRefs: string[]
  mixQaRefs: string[]
  nestedActualCredits: number
  callerReceiptHash: string
}

export interface MusicQaFinding {
  qaClass: 'planning' | 'technical' | 'structural_sync' | 'speech_safety' |
    'narrative_fit' | 'vocal_lyric' | 'reference_copy_risk' | 'culture_stereotype' |
    'continuity' | 'provenance' | 'integration'
  status: 'pass' | 'warning' | 'needs_review' | 'blocking'
  code: string
  summary: string
  evidenceRefs: string[]
  confidence?: number
}

export interface MusicContinuityReport {
  sceneIds: string[]
  cueIds: string[]
  cueFamilyContinuity: string[]
  musicEnvironment: string[]
  speechPriorityFindings: string[]
  ambiencePriorityFindings: string[]
  energyCurve: number[]
  tempoCompatibility: string[]
  harmonicCompatibility: { findings: string[]; qualification: 'measured_limited' | 'needs_review' }
  cueRepetitionFindings: string[]
  cueToTrackMappings: Array<{ cueId: string; sourceArtifactId: string; placementHash: string }>
  trackReuseFindings: string[]
  silenceFindings: string[]
  boundaryFindings: string[]
  loudnessFindings: string[]
  segmentationCoverageFindings: string[]
  constraintFindings: string[]
  soundOutputQaFindings: string[]
  musicSfxCollisions: string[]
  reviewRequiredItems: string[]
  recommendedLocalizedRevisions: MusicFrameRange[]
  status: 'pass' | 'needs_review' | 'blocking'
}

export interface MusicFinalCompositionHandoff {
  handoffId: string
  requestId: string
  approvedSnapshotRef: CanonicalMusicSkillRequest['approvedSnapshotRef']
  timelineBinding: CanonicalMusicSkillRequest['timelineBinding']
  selectedMusicAssets: MusicArtifactRef[]
  processedMusicAssets: MusicArtifactRef[]
  musicStemAssets: MusicArtifactRef[]
  musicNarrativeArcRef?: string
  cueSheetRef?: string
  placementManifestRefs: string[]
  beatAndPhraseMapRefs: string[]
  mixIntentManifestRef?: string
  soundSupportReceiptRefs: string[]
  cueQaRefs: string[]
  continuityQaRef?: string
  provenanceRefs: string[]
  usagePolicyRefs: string[]
  actualMusicMutationRanges: MusicFrameRange[]
  intentionalNoMusicRanges: MusicFrameRange[]
  unresolvedReviewItems: string[]
  intentionalNoMusic: boolean
  ambienceOnly: boolean
  handoffHash: string
  createdAt: string
}

export interface MusicExecutionUnitReceipt {
  unitId: string
  cueId?: string
  status: 'completed' | 'skipped' | 'blocked' | 'failed'
  routeKey: string
  routeVersion: string
  routeHash: string
  startedAt: string
  completedAt: string
  elapsedMilliseconds: number
  inputArtifactIds: string[]
  inputArtifactHashes: string[]
  outputArtifactIds: string[]
  outputArtifactHashes: string[]
  outputBindings: MusicRuntimeStepOutputBinding[]
  runtimeEvidence: string[]
  costEvidence: { actualCredits: number; internalToolCostUsd: number; providerCostUsd: number }
  qaEvidence: string[]
  stepReceipts: MusicRouteStepReceipt[]
  providerAttemptId?: string
  reason?: string
}

export interface MusicRouteStepReceipt {
  stepKey: string
  handlerIdentity: string
  toolKey: string
  toolVersion: string
  operationKey: string
  operationVersion: string
  operationProfileKey: string
  operationProfileVersion: string
  status: 'completed' | 'skipped' | 'blocked' | 'failed'
  startedAt: string
  completedAt: string
  elapsedMilliseconds: number
  inputArtifactIds: string[]
  inputArtifactHashes: string[]
  outputArtifactIds: string[]
  outputArtifactHashes: string[]
  outputBindings: MusicRuntimeStepOutputBinding[]
  runtimeEvidence: string[]
  costEvidence: { actualCredits: number; internalToolCostUsd: number; providerCostUsd: number }
  qaEvidence: string[]
  providerAttemptId?: string
  reason?: string
  receiptHash: string
}

export interface MusicRuntimeStepOutputBinding {
  bindingKey: string
  artifactType: string
  artifactId: string
  artifactVersion: number
  artifactHash: string
  producerStepKey: string
  schemaVersion: string
  lineageRefs: string[]
}

export interface CanonicalMusicSkillResult {
  schemaVersion: typeof CANONICAL_MUSIC_RESULT_SCHEMA_VERSION
  requestId: string
  musicSkillKey: 'music'
  musicSkillVersion: string
  musicManifestHash: string
  capabilityKey: string
  capabilityVersion: string
  qualificationStatusUsed: SkillQualificationStatus
  status: 'planned' | 'completed' | 'partial' | 'blocked' | 'no_music' | 'ambience_only' | 'needs_review' | 'stale'
  contextStudyRef?: string
  musicNeedDecisionRef?: string
  musicNarrativeArcRef?: string
  cueSheetRef?: string
  acquisitionPlanRef?: string
  providerAttemptRefs: string[]
  candidateArtifactRefs: MusicArtifactRef[]
  candidateAnalysisRefs: string[]
  selectionDecisionRefs: string[]
  beatAndPhraseMapRefs: string[]
  placementManifestRefs: string[]
  musicMixIntentManifestRef?: string
  soundSupportReceipts: MusicSoundSupportReceipt[]
  selectedMusicAssetRefs: MusicArtifactRef[]
  processedMusicAssetRefs: MusicArtifactRef[]
  musicStemAssetRefs: MusicArtifactRef[]
  cueQaRefs: string[]
  continuityQaRef?: string
  provenanceRefs: string[]
  actualMusicMutationRanges: MusicFrameRange[]
  intentionalNoMusicRanges: MusicFrameRange[]
  revisionEvidenceRef?: string
  finalCompositionHandoff?: MusicFinalCompositionHandoff
  artifacts: MusicArtifactEnvelope[]
  segmentationPlan?: MusicSoundtrackSegmentationPlan
  cueGroupingPlan?: MusicCueGroupingPlan
  cuePolicyConflict?: MusicCuePolicyConflict
  cueConstraintResolutions: MusicCueConstraintResolution[]
  acceptanceReceipts: MusicAcceptanceReceipt[]
  unitReceipts: MusicExecutionUnitReceipt[]
  routeReceipts: string[]
  executionFingerprint: string
  costEvidence: {
    estimatedCredits: number
    actualMusicCredits: number
    nestedSoundCredits: number
    totalActualCredits: number
    providerCostUsd: number
    rateCardVersion: string
    rateCardHash: string
    serviceFeeIncluded: false
    walletMutationExecuted: false
    evidenceHash: string
  }
  elapsedTimeEvidence: { startedAt?: string; completedAt?: string; actualMilliseconds: number }
  unresolvedDependencies: string[]
  reviewRequiredItems: string[]
  callerReceipt: {
    callerSkillKey: string
    parentWorkItemId: string
    exactAuthorityRef: string
    resultHash: string
    finalRenderOutsideMusic: true
    musicDidNotOwnSoundTools: true
  }
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, stableValue(item)]))
  }
  return value
}

export function hashMusicValue(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(stableValue(value))).digest('hex')
}

export function createMusicArtifact<TPayload>(input: Omit<MusicArtifactEnvelope<TPayload>, 'artifactHash'>): MusicArtifactEnvelope<TPayload> {
  const artifactHash = hashMusicValue(input)
  return Object.freeze({ ...structuredClone(input), artifactHash })
}

export function createMusicFinalHandoff(input: Omit<MusicFinalCompositionHandoff, 'handoffHash'>): MusicFinalCompositionHandoff {
  return Object.freeze({ ...structuredClone(input), handoffHash: hashMusicValue(input) })
}

export function musicRoundingPolicy(cue: CanonicalMusicCueIntent): TimelineRoundingMode {
  return cue.roundingPolicy
}

export function parseCanonicalMusicRequest(input: unknown): CanonicalMusicSkillRequest {
  return canonicalMusicRequestSchema.parse(input)
}

export function parseCanonicalMusicResult(input: CanonicalMusicSkillResult): CanonicalMusicSkillResult {
  if (input.schemaVersion !== CANONICAL_MUSIC_RESULT_SCHEMA_VERSION) throw new Error('Unsupported canonical Music result version.')
  const calculated = hashMusicValue({ ...input, callerReceipt: { ...input.callerReceipt, resultHash: '' } })
  if (input.callerReceipt.resultHash && input.callerReceipt.resultHash !== calculated) {
    throw new Error('Canonical Music caller receipt hash is stale.')
  }
  if (input.status === 'completed' && !input.finalCompositionHandoff) {
    throw new Error('Completed Music execution requires a final composition handoff.')
  }
  if (input.status === 'completed' && input.selectedMusicAssetRefs.length === 0) {
    throw new Error('Completed non-no-Music execution requires an approved Music artifact.')
  }
  if (input.status === 'no_music' && input.selectedMusicAssetRefs.length > 0) {
    throw new Error('No-Music result cannot select a Music artifact.')
  }
  return Object.freeze(structuredClone(input))
}
