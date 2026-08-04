import type { EditCueStatus } from './production-workflow'
import type {
  AssetUsageRole,
  ID,
  OptionalTimeRange,
  PriorityLevel,
  ProjectScopedRecord,
  TimeRange,
  TimingFlexibility,
  TranscriptWordRef,
} from './workflow-common'

export type EditCueAnchorType =
  | 'time_range'
  | 'transcript_range'
  | 'scene'
  | 'asset'
  | 'global'

export type EditCueRole =
  | 'b_roll'
  | 'overlay'
  | 'picture_in_picture'
  | 'split_screen'
  | 'insert_clip'
  | 'text_overlay'
  | 'caption_instruction'
  | 'graphic'
  | 'sound_effect'
  | 'music'
  | 'reference_only'
  | 'avoid'

export type EditCueAudioBehavior =
  | 'keep_main_audio'
  | 'use_asset_audio'
  | 'mute_asset_audio'
  | 'mix_both'
  | 'ai_decides'

export type EditCueVisualPlacement =
  | 'full_screen'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'center'
  | 'lower_third'
  | 'upper_third'
  | 'background'
  | 'ai_decides'

export type EditCueCropMode =
  | 'fill'
  | 'fit'
  | 'original'
  | 'safe_crop'
  | 'ai_decides'

export type EditCueMotionStyle =
  | 'none'
  | 'subtle'
  | 'smooth'
  | 'dynamic'
  | 'energetic'
  | 'ai_decides'

export type EditCueConflictType =
  | 'overlapping_must_follow'
  | 'asset_marked_do_not_use'
  | 'cue_points_to_removed_footage'
  | 'timing_outside_clean_assembly'
  | 'duration_too_short'
  | 'duration_too_long'
  | 'caption_collision_risk'
  | 'face_collision_risk'
  | 'audio_conflict'
  | 'missing_asset'
  | 'ambiguous_role'
  | 'other'

export interface EditCueTimeRangeAnchor {
  type: 'time_range'
  range: OptionalTimeRange
  timebase: 'raw_source' | 'clean_assembly' | 'final_edit'
  sourceTimeMappingId?: ID
}

export interface EditCueTranscriptAnchor {
  type: 'transcript_range'
  transcriptSegmentIds: ID[]
  wordRefs?: TranscriptWordRef[]
  quotedText?: string
  cleanAssemblyRange?: TimeRange
}

export interface EditCueSceneAnchor {
  type: 'scene'
  sceneSegmentId: ID
  cleanAssemblyRange?: TimeRange
}

export interface EditCueAssetAnchor {
  type: 'asset'
  mediaAssetId: ID
}

export interface EditCueGlobalAnchor {
  type: 'global'
}

export type EditCueAnchor =
  | EditCueTimeRangeAnchor
  | EditCueTranscriptAnchor
  | EditCueSceneAnchor
  | EditCueAssetAnchor
  | EditCueGlobalAnchor

export interface EditCueVisualBehavior {
  placement?: EditCueVisualPlacement
  crop?: EditCueCropMode
  motion?: EditCueMotionStyle
  safeZoneAware?: boolean
  avoidFaces?: boolean
  avoidCaptions?: boolean
  allowAiToImproveComposition?: boolean
}

export interface EditCueAsset {
  id: ID
  mediaAssetId: ID
  role: AssetUsageRole
  label?: string
  required?: boolean
}

export interface EditCue extends ProjectScopedRecord {
  editBriefId?: ID
  cleanAssemblyId?: ID
  sourceChatMessageId?: ID
  title: string
  status: EditCueStatus
  anchor: EditCueAnchor
  role: EditCueRole
  priority: PriorityLevel
  timingFlexibility: TimingFlexibility
  assetRefs: EditCueAsset[]
  audioBehavior?: EditCueAudioBehavior
  visualBehavior?: EditCueVisualBehavior
  instructions: string
  tags: string[]
  aiTreatmentSummary?: string
  conflictIds?: ID[]
  version: number
}

export interface EditCueConflict extends ProjectScopedRecord {
  editCueIds: ID[]
  type: EditCueConflictType
  severity: 'info' | 'warning' | 'blocking'
  message: string
  suggestedResolution?: string
  resolved: boolean
  resolvedBy?: 'user' | 'ai' | 'system'
  resolvedAt?: string
}

export interface EditCuePlanMapping extends ProjectScopedRecord {
  editCueId: ID
  editPlanId: ID
  editPlanSegmentId?: ID
  professionalIntegrationPlanId?: ID
  status: 'included' | 'adjusted' | 'ignored' | 'superseded'
  mappedTimeRange?: TimeRange
  explanation?: string
}
