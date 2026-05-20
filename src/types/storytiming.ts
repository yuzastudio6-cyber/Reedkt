import type {
  BaseRecord,
  ID,
  ISODateString,
  JSONObject,
  Percentage,
  Seconds,
  TimeRange,
} from './shared'
import type { EditComplexity } from './planning'
import type { SignatureSystem } from './signature-systems'

export type StoryTimingSourceSystem =
  | 'edit_plan'
  | 'story_beat'
  | 'pacing_analysis'
  | 'cut_decision'
  | 'transition_plan'
  | 'caption_plan'
  | 'signature_route'
  | 'stroke_motion'
  | 'graphic_design'
  | 'real_motion'
  | 'music_cue'
  | 'music_mix'
  | 'sfx_event'
  | 'sfx_trim'
  | 'sfx_alignment'
  | 'sfx_mix'
  | 'render_job'
  | 'qa_report'
  | 'review_comment'
  | 'manual'
  | 'unknown'

export type StoryTimingMapStatus =
  | 'draft'
  | 'planning'
  | 'awaiting_approval'
  | 'approved'
  | 'locked_for_generation'
  | 'render_ready'
  | 'revision_requested'
  | 'superseded'
  | 'cancelled'
  | 'failed'

export type StoryTimingTrackType =
  | 'source_video'
  | 'output_video'
  | 'transcript'
  | 'story_beats'
  | 'cuts'
  | 'transitions'
  | 'captions'
  | 'music'
  | 'sfx'
  | 'stroke_motion'
  | 'graphic_design'
  | 'real_motion'
  | 'cta'
  | 'render_markers'
  | 'qa_markers'
  | 'manual'

export type StoryTimingAnchorType =
  | 'word'
  | 'phrase'
  | 'sentence'
  | 'pause'
  | 'breath'
  | 'emotional_shift'
  | 'scene_change'
  | 'cut'
  | 'transition_start'
  | 'transition_end'
  | 'music_beat'
  | 'music_downbeat'
  | 'music_drop'
  | 'music_resolve'
  | 'sfx_hit'
  | 'sfx_tail'
  | 'caption_reveal'
  | 'caption_emphasis'
  | 'stroke_motion_start'
  | 'stroke_motion_completion'
  | 'graphic_reveal'
  | 'graphic_hide'
  | 'real_motion_object_enter'
  | 'real_motion_object_settle'
  | 'real_motion_object_exit'
  | 'cta_reveal'
  | 'chapter_title'
  | 'manual'

export type StoryTimingEventType =
  | 'cut'
  | 'caption_on'
  | 'caption_off'
  | 'caption_emphasis'
  | 'music_cue_start'
  | 'music_cue_end'
  | 'music_duck_start'
  | 'music_duck_end'
  | 'sfx_start'
  | 'sfx_hit'
  | 'sfx_end'
  | 'stroke_motion_start'
  | 'stroke_motion_beat'
  | 'stroke_motion_complete'
  | 'graphic_reveal'
  | 'graphic_hide'
  | 'real_motion_enter'
  | 'real_motion_move'
  | 'real_motion_settle'
  | 'real_motion_exit'
  | 'transition_start'
  | 'transition_end'
  | 'cta_reveal'
  | 'render_marker'
  | 'qa_marker'
  | 'manual_marker'

export type StoryTimingAuthority =
  | 'user_instruction'
  | 'speech_meaning'
  | 'story_beat'
  | 'emotional_timing'
  | 'caption_readability'
  | 'visual_comprehension'
  | 'music_rhythm'
  | 'sfx_hit'
  | 'signature_animation'
  | 'platform_pacing'
  | 'manual_override'

export type StoryTimingPriority =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'decorative'

export type StoryTimingSyncMode =
  | 'speech_locked'
  | 'word_locked'
  | 'phrase_locked'
  | 'beat_locked'
  | 'frame_locked'
  | 'emotion_locked'
  | 'visual_motion_locked'
  | 'loose'
  | 'manual'

export type StoryTimingConflictType =
  | 'caption_overlay_collision'
  | 'caption_too_fast'
  | 'caption_too_late'
  | 'cut_before_meaning_complete'
  | 'emotional_pause_removed'
  | 'music_ducking_misses_speech'
  | 'sfx_hit_late'
  | 'sfx_hit_early'
  | 'sfx_tail_over_speech'
  | 'stroke_motion_late'
  | 'stroke_motion_too_fast'
  | 'stroke_motion_caption_overlap'
  | 'graphic_reveal_too_early'
  | 'graphic_reveal_too_late'
  | 'graphic_not_readable_long_enough'
  | 'graphic_stays_after_topic'
  | 'real_motion_blocks_face'
  | 'real_motion_blocks_object'
  | 'real_motion_enters_too_early'
  | 'real_motion_settles_late'
  | 'real_motion_distracts_during_speech'
  | 'signature_overlay_during_emotional_pause'
  | 'transition_cuts_story_beat'
  | 'too_many_events_same_moment'
  | 'overall_pacing_too_rushed'
  | 'overall_pacing_too_slow'
  | 'manual_review_needed'

export type StoryTimingConflictSeverity =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'

export type StoryTimingDependencyType =
  | 'starts_after'
  | 'starts_before'
  | 'ends_before'
  | 'ends_after'
  | 'must_overlap'
  | 'must_not_overlap'
  | 'hit_on_same_frame'
  | 'sync_to_anchor'
  | 'duck_during'
  | 'hide_during'
  | 'manual'

export type StoryTimingAdjustmentType =
  | 'shift_earlier'
  | 'shift_later'
  | 'extend_duration'
  | 'shorten_duration'
  | 'move_to_different_anchor'
  | 'reduce_overlap'
  | 'add_ducking'
  | 'remove_event'
  | 'preserve_pause'
  | 'manual_review'

export type StoryTimingQACheckType =
  | 'caption_sync'
  | 'caption_readability_duration'
  | 'caption_overlay_collision'
  | 'speech_cut_integrity'
  | 'emotional_pause_preservation'
  | 'music_beat_alignment'
  | 'music_ducking_timing'
  | 'sfx_hit_alignment'
  | 'sfx_tail_safety'
  | 'transition_timing'
  | 'stroke_motion_word_sync'
  | 'stroke_motion_completion_timing'
  | 'graphic_readability_time'
  | 'graphic_reveal_timing'
  | 'real_motion_entry_exit_timing'
  | 'real_motion_face_safety'
  | 'signature_overlay_collisions'
  | 'signature_sfx_sync'
  | 'signature_timing_story_meaning'
  | 'overall_rhythm'
  | 'platform_pacing'
  | 'render_manifest_integrity'

export type StoryTimingQACheckStatus =
  | 'pending'
  | 'passed'
  | 'warning'
  | 'failed'
  | 'requires_adjustment'
  | 'requires_manual_review'
  | 'waived'

export type StoryTimingReadinessDecision =
  | 'ready_for_preview'
  | 'ready_with_warnings'
  | 'requires_timing_adjustment'
  | 'requires_user_review'
  | 'blocked_for_render'

export type StoryTimingQACategory =
  | 'caption_cut'
  | 'music_sfx'
  | 'signature_animation'
  | 'overlay_safety'
  | 'emotional_timing'
  | 'overall_rhythm'
  | 'render_manifest'

export type StoryTimingQARecommendedAction =
  | 'approve_timing'
  | 'adjust_timing'
  | 'shift_event'
  | 'extend_duration'
  | 'shorten_duration'
  | 'move_caption'
  | 'move_overlay'
  | 'adjust_music_ducking'
  | 'adjust_sfx_hit'
  | 'preserve_pause'
  | 'remove_event'
  | 'ask_user'
  | 'manual_review'

export type StoryTimingOverallRhythm =
  | 'too_rushed'
  | 'slightly_rushed'
  | 'balanced'
  | 'slightly_slow'
  | 'too_slow'
  | 'inconsistent'
  | 'needs_review'

export type RenderTimingManifestStatus =
  | 'draft'
  | 'ready_for_worker'
  | 'rendering'
  | 'rendered'
  | 'failed'
  | 'superseded'

export type RenderTimingWorkerReadiness =
  | 'not_ready'
  | 'ready_for_mock_worker'
  | 'ready_for_future_render_worker'
  | 'blocked_by_timing_conflicts'
  | 'blocked_by_missing_assets'
  | 'blocked_by_missing_tracks'
  | 'requires_user_review'

export type RenderTimingLayerKind =
  | 'video'
  | 'audio'
  | 'overlay'
  | 'caption'
  | 'transition'
  | 'effect'
  | 'marker'
  | 'qa'

export type RenderTimingAssetRequirement =
  | 'source_media_required'
  | 'generated_asset_required'
  | 'music_asset_required'
  | 'sfx_asset_required'
  | 'caption_asset_generated'
  | 'overlay_asset_required'
  | 'no_asset_required'
  | 'mock_asset_placeholder'

export type RenderTimingValidationIssue =
  | 'missing_master_timing_map'
  | 'missing_render_manifest'
  | 'missing_required_track'
  | 'missing_required_event'
  | 'invalid_event_time_range'
  | 'unresolved_blocking_conflict'
  | 'timing_qa_failed'
  | 'missing_source_asset'
  | 'missing_generated_asset'
  | 'missing_worker_notes'
  | 'layer_order_conflict'
  | 'manual_review_needed'

export type StoryTimingFrameRoundingMode = 'floor' | 'ceil' | 'round'

export type StoryTimingConflictStatus =
  | 'open'
  | 'resolved'
  | 'waived'
  | 'needs_user_review'

export type CaptionTimingMode =
  | 'sentence_based'
  | 'phrase_based'
  | 'word_emphasis'
  | 'karaoke_word_by_word'
  | 'minimal'
  | 'none'

export type CaptionReadabilityRisk =
  | 'none'
  | 'too_fast'
  | 'too_long'
  | 'too_many_words'
  | 'overlaps_face'
  | 'overlaps_overlay'
  | 'reveals_too_early'
  | 'lags_speech'
  | 'manual_review'

export type CutTimingIntent =
  | 'remove_dead_space'
  | 'remove_mistake'
  | 'tighten_pause'
  | 'preserve_emotional_pause'
  | 'preserve_breath'
  | 'j_cut'
  | 'l_cut'
  | 'match_cut'
  | 'story_transition'
  | 'manual'

export type PausePreservationDecision =
  | 'remove'
  | 'tighten'
  | 'preserve'
  | 'extend_slightly'
  | 'needs_review'

export type TranscriptAnchorGranularity =
  | 'word'
  | 'phrase'
  | 'sentence'
  | 'pause'
  | 'breath'
  | 'manual'

export type MusicBeatGridConfidence =
  | 'low'
  | 'medium'
  | 'high'
  | 'mock_estimate'

export type MusicBeatRole =
  | 'beat'
  | 'downbeat'
  | 'bar_start'
  | 'drop'
  | 'build'
  | 'resolve'
  | 'cue_start'
  | 'cue_end'

export type SoundSyncTimingRisk =
  | 'none'
  | 'music_duck_late'
  | 'music_duck_too_early'
  | 'sfx_hit_late'
  | 'sfx_hit_early'
  | 'sfx_tail_over_speech'
  | 'sfx_fights_music'
  | 'too_many_hits'
  | 'ambience_masked'
  | 'manual_review'

export type SoundSyncTimingMode =
  | 'voice_first'
  | 'beat_driven'
  | 'ambience_preserving'
  | 'montage_driven'
  | 'subtle_support'
  | 'manual'

export type SignatureTimingMode =
  | 'speech_locked'
  | 'phrase_locked'
  | 'story_beat_locked'
  | 'emotion_locked'
  | 'sfx_synced'
  | 'music_synced'
  | 'visual_motion_locked'
  | 'loose_support'

export type SignatureOverlaySafetyRisk =
  | 'none'
  | 'caption_overlap'
  | 'face_blocking'
  | 'object_blocking'
  | 'too_many_overlays'
  | 'not_readable_long_enough'
  | 'animation_too_late'
  | 'animation_too_fast'
  | 'manual_review'

export type StrokeMotionTimingRole =
  | 'story_start'
  | 'draw'
  | 'morph'
  | 'emphasis'
  | 'completion'
  | 'transition_out'

export type GraphicDesignTimingRole =
  | 'card_reveal'
  | 'label_reveal'
  | 'list_item_reveal'
  | 'diagram_trace'
  | 'callout'
  | 'hide'
  | 'transition_out'

export type RealMotionTimingRole =
  | 'object_enter'
  | 'object_move'
  | 'object_scale'
  | 'object_settle'
  | 'object_exit'
  | 'demonstration_moment'

export interface StoryTimingTimebase {
  frameRate: number
  durationSeconds: Seconds
  totalFrames: number
  frameRoundingMode: StoryTimingFrameRoundingMode
  startTimecode?: string
  dropFrame?: boolean
}

export interface StoryTimingSourceRef {
  sourceSystem: StoryTimingSourceSystem
  sourceRecordId?: ID
  sourceTableName?: string
  label?: string
}

export interface StoryTimingTimePoint {
  seconds: Seconds
  frameNumber?: number
  label?: string
}

export interface StoryTimingTimeWindow {
  startSeconds: Seconds
  hitSeconds?: Seconds
  endSeconds: Seconds
  frameStart?: number
  frameHit?: number
  frameEnd?: number
}

export interface MasterTimingMapRecord extends BaseRecord {
  workspaceId?: ID
  projectId: ID
  editPlanId: ID
  chatSessionId?: ID
  version: number
  status: StoryTimingMapStatus
  durationSeconds: Seconds
  frameRate: number
  timebase: StoryTimingTimebase
  editComplexity?: EditComplexity
  primaryTimingAuthority: StoryTimingAuthority
  timingHierarchy: StoryTimingAuthority[]
  sourceSystemsIncluded: StoryTimingSourceSystem[]
  lockedForGeneration: boolean
  approvedByUserId?: ID
  approvedAt?: ISODateString
  summary: string
  notes: string[]
}

export interface StoryTimingSegmentRecord extends BaseRecord {
  masterTimingMapId: ID
  projectId: ID
  editPlanId: ID
  editPlanSegmentId?: ID
  storyBeatId?: ID
  segmentOrder: number
  sourceTimeRange?: TimeRange
  outputTimeRange: TimeRange
  purpose: string
  primaryAuthority: StoryTimingAuthority
  pacingStyle?: string
  hasSpeech: boolean
  hasMusic: boolean
  hasSFX: boolean
  hasCaptions: boolean
  hasSignatureOverlay: boolean
  preserveEmotionalPause: boolean
  notes: string[]
}

export interface TimingAnchorRecord extends BaseRecord {
  masterTimingMapId: ID
  projectId: ID
  editPlanId: ID
  segmentId?: ID
  sourceSystem: StoryTimingSourceSystem
  sourceRecordId?: ID
  sourceRef?: StoryTimingSourceRef
  anchorType: StoryTimingAnchorType
  anchorLabel: string
  anchorText?: string
  timeSeconds: Seconds
  endTimeSeconds?: Seconds
  frameNumber?: number
  importance: StoryTimingPriority
  primaryAuthority: StoryTimingAuthority
  syncMode: StoryTimingSyncMode
  locked: boolean
  notes: string[]
}

export interface TimingEventRecord extends BaseRecord {
  masterTimingMapId: ID
  projectId: ID
  editPlanId: ID
  segmentId?: ID
  anchorId?: ID
  sourceSystem: StoryTimingSourceSystem
  sourceRecordId?: ID
  sourceRef?: StoryTimingSourceRef
  eventType: StoryTimingEventType
  trackType: StoryTimingTrackType
  label: string
  startTimeSeconds: Seconds
  hitTimeSeconds?: Seconds
  endTimeSeconds: Seconds
  durationSeconds: Seconds
  frameStart?: number
  frameHit?: number
  frameEnd?: number
  priority: StoryTimingPriority
  syncMode: StoryTimingSyncMode
  canShift: boolean
  locked: boolean
  visibilityLayer?: string
  audioLayer?: string
  signatureSystem?: SignatureSystem
  notes: string[]
}

export interface TimingDependencyRecord extends BaseRecord {
  masterTimingMapId: ID
  projectId: ID
  editPlanId: ID
  fromEventId?: ID
  toEventId?: ID
  fromAnchorId?: ID
  toAnchorId?: ID
  dependencyType: StoryTimingDependencyType
  minOffsetSeconds?: Seconds
  maxOffsetSeconds?: Seconds
  required: boolean
  reason: string
  notes: string[]
}

export interface TimingConflictRecord extends BaseRecord {
  masterTimingMapId: ID
  projectId: ID
  editPlanId: ID
  conflictType: StoryTimingConflictType
  severity: StoryTimingConflictSeverity
  relatedEventIds: ID[]
  relatedAnchorIds: ID[]
  sourceSystems: StoryTimingSourceSystem[]
  timeRange: TimeRange
  description: string
  whyItMatters: string
  recommendedAdjustment: StoryTimingAdjustmentType
  blocksRender: boolean
  requiresUserReview: boolean
  status: StoryTimingConflictStatus
}

export interface TimingConflictResolutionRecord extends BaseRecord {
  masterTimingMapId: ID
  projectId: ID
  editPlanId: ID
  timingConflictId: ID
  adjustmentType: StoryTimingAdjustmentType
  affectedEventIds: ID[]
  affectedAnchorIds: ID[]
  timeShiftSeconds?: Seconds
  newTimeRange?: TimeRange
  reason: string
  approved: boolean
  approvedByUserId?: ID
}

export interface StoryTimingQACheckRecord extends BaseRecord {
  masterTimingMapId: ID
  projectId: ID
  editPlanId: ID
  segmentId?: ID
  checkType: StoryTimingQACheckType
  status: StoryTimingQACheckStatus
  score?: Percentage
  timeRange?: TimeRange
  relatedEventIds: ID[]
  relatedAnchorIds: ID[]
  summary: string
  recommendedFix?: string
  blocksRender: boolean
  requiresManualReview: boolean
}

export interface CaptionTimingPlanRecord {
  id: ID
  masterTimingMapId: ID
  projectId: ID
  editPlanId: ID
  segmentId?: ID
  captionPlanId?: ID
  timingMode: CaptionTimingMode
  captionText: string
  transcriptText?: string
  startTimeSeconds: Seconds
  endTimeSeconds: Seconds
  emphasisWordAnchors: ID[]
  readabilityRisk: CaptionReadabilityRisk
  safeZoneRequired: boolean
  avoidOverlayIds: ID[]
  notes: string[]
  createdAt: ISODateString
}

export interface CutTimingPlanRecord {
  id: ID
  masterTimingMapId: ID
  projectId: ID
  editPlanId: ID
  segmentId?: ID
  cutDecisionId?: ID
  intent: CutTimingIntent
  sourceTimeRange?: TimeRange
  outputTimeRange: TimeRange
  preserveAudioContinuity: boolean
  preserveSentenceMeaning: boolean
  preserveEmotionalPause: boolean
  pauseDecision?: PausePreservationDecision
  jCutLcutOffsetSeconds?: Seconds
  notes: string[]
  createdAt: ISODateString
}

export interface MusicBeatGridRecord {
  id: ID
  masterTimingMapId: ID
  projectId: ID
  editPlanId: ID
  musicCueId?: ID
  bpm?: number
  startTimeSeconds: Seconds
  endTimeSeconds: Seconds
  beatTimesSeconds: Seconds[]
  downbeatTimesSeconds: Seconds[]
  dropTimesSeconds: Seconds[]
  resolveTimesSeconds: Seconds[]
  confidence: MusicBeatGridConfidence
  mockOnly: boolean
  notes: string[]
  createdAt: ISODateString
}

export interface MusicDuckingTimingPlanRecord {
  id: ID
  masterTimingMapId: ID
  projectId: ID
  editPlanId: ID
  musicCueId?: ID
  speechSegmentId?: ID
  duckStartSeconds: Seconds
  speechStartSeconds: Seconds
  speechEndSeconds: Seconds
  duckEndSeconds: Seconds
  preRollMs: number
  releaseMs: number
  reason: string
  notes: string[]
  createdAt: ISODateString
}

export interface SoundSyncTimingIntegrationRecord {
  id: ID
  masterTimingMapId: ID
  projectId: ID
  editPlanId: ID
  musicCueIds: ID[]
  sfxEventPlanIds: ID[]
  timingMode: SoundSyncTimingMode
  risks: SoundSyncTimingRisk[]
  summary: string
  createdAt: ISODateString
}

export interface SignatureTimingPlanRecord {
  id: ID
  masterTimingMapId: ID
  projectId: ID
  editPlanId: ID
  signatureRouteId?: ID
  editPlanSegmentId?: ID
  signatureSystem: SignatureSystem
  timingMode: SignatureTimingMode
  sourceAnchorIds: ID[]
  outputEventIds: ID[]
  sfxEventIds: ID[]
  captionConflictRisk: SignatureOverlaySafetyRisk
  faceSafetyRisk?: SignatureOverlaySafetyRisk
  summary: string
  notes: string[]
  createdAt: ISODateString
}

export interface SignatureOverlayTimingWindow {
  startSeconds: Seconds
  emphasisSeconds?: Seconds
  completeSeconds?: Seconds
  endSeconds: Seconds
  minReadableDurationSeconds?: Seconds
  maxRecommendedDurationSeconds?: Seconds
}

export interface StoryTimingQAReportRecord {
  id: ID
  masterTimingMapId: ID
  projectId: ID
  editPlanId: ID
  readinessDecision: StoryTimingReadinessDecision
  overallScore: Percentage
  captionCutScore: Percentage
  musicSfxScore: Percentage
  signatureTimingScore: Percentage
  overlaySafetyScore: Percentage
  emotionalTimingScore: Percentage
  overallRhythmScore: Percentage
  renderManifestScore: Percentage
  conflictIds: ID[]
  qaCheckIds: ID[]
  recommendedActions: StoryTimingQARecommendedAction[]
  blocksPreview: boolean
  blocksRender: boolean
  requiresUserReview: boolean
  summary: string
  createdAt: ISODateString
  metadata?: JSONObject
}

export interface StoryTimingAdjustmentRecommendationRecord {
  id: ID
  masterTimingMapId: ID
  projectId: ID
  editPlanId: ID
  relatedConflictId?: ID
  relatedEventIds: ID[]
  relatedAnchorIds: ID[]
  recommendedAction: StoryTimingQARecommendedAction
  adjustmentType?: StoryTimingAdjustmentType
  timeShiftSeconds?: Seconds
  reason: string
  userFacingSummary: string
  requiresUserApproval: boolean
  createdAt: ISODateString
  metadata?: JSONObject
}

export interface RenderTimingTrack {
  id: ID
  trackType: StoryTimingTrackType
  label: string
  layerOrder: number
  sourceSystem: StoryTimingSourceSystem
  eventIds: ID[]
  notes: string[]
}

export interface RenderTimingManifestEvent {
  eventId: ID
  eventType: StoryTimingEventType
  trackType: StoryTimingTrackType
  startTimeSeconds: Seconds
  hitTimeSeconds?: Seconds
  endTimeSeconds: Seconds
  sourceSystem: StoryTimingSourceSystem
  sourceRecordId?: ID
  payload: JSONObject
}

export interface RenderTimingManifestRecord extends BaseRecord {
  masterTimingMapId: ID
  projectId: ID
  editPlanId: ID
  renderJobId?: ID
  status: RenderTimingManifestStatus
  durationSeconds: Seconds
  frameRate: number
  tracks: RenderTimingTrack[]
  events: RenderTimingManifestEvent[]
  dependencies: ID[]
  conflictsResolved: ID[]
  readyForRender: boolean
  workerNotes: string[]
}

export interface RenderTimingWorkerInputRecord extends BaseRecord {
  renderTimingManifestId: ID
  masterTimingMapId: ID
  projectId: ID
  editPlanId: ID
  renderJobId?: ID
  readiness: RenderTimingWorkerReadiness
  requiredAssets: RenderTimingAssetRequirement[]
  trackCount: number
  eventCount: number
  blockingConflictIds: ID[]
  workerPayload: JSONObject
  workerNotes: string[]
  mockOnly: boolean
}

export interface RenderTimingValidationResult {
  ok: boolean
  readiness: RenderTimingWorkerReadiness
  issues: RenderTimingValidationIssue[]
  warnings: string[]
  recommendedFixes: string[]
}

export const STORYTIMING_CORE_RULE =
  'Timing is the core coordination layer of ReeditPro: captions, cuts, transitions, music, SFX, signatures, overlays, and renders should be timed to meaning, emotion, rhythm, movement, platform pacing, and user instruction.'

export const STORYTIMING_CONSOLIDATION_RULE =
  'StoryTiming does not replace existing timing records; it consolidates edit plan, quality, music, SFX, signature, and render timing into a master timing map.'

export const STORYTIMING_SPEECH_FIRST_RULE =
  'Speech meaning and viewer comprehension usually outrank beat alignment, decorative motion, and SFX timing.'

export const STORYTIMING_MUSIC_DRIVEN_EXCEPTION_RULE =
  'Music beat timing can become the primary authority for montage, fitness, and high-energy sections when it does not harm speech meaning or required context.'

export const STORYTIMING_RENDER_MANIFEST_RULE =
  'Render workers should receive a timing-safe manifest derived from the approved master timing map, not reinterpret raw chat or distributed timing records.'

export const STORYTIMING_DEFAULT_AUTHORITY_HIERARCHY: StoryTimingAuthority[] = [
  'user_instruction',
  'speech_meaning',
  'story_beat',
  'emotional_timing',
  'caption_readability',
  'visual_comprehension',
  'music_rhythm',
  'sfx_hit',
  'signature_animation',
  'platform_pacing',
]
