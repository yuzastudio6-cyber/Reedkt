export type ID = string

export interface TimestampedRecord {
  id: ID
  createdAt: string
  updatedAt: string
}

export interface ProjectScopedRecord extends TimestampedRecord {
  projectId: ID
  workspaceId?: ID
  userId?: ID
}

export interface TimeRange {
  startMs: number
  endMs: number
}

export interface OptionalTimeRange {
  startMs: number
  endMs?: number
}

export interface SourceMediaRef {
  mediaAssetId: ID
  sourceClipSequenceItemId?: ID
  label?: string
}

export interface TranscriptWordRef {
  transcriptSegmentId: ID
  wordId?: ID
  startMs?: number
  endMs?: number
  text?: string
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface SafeZone {
  top: number
  right: number
  bottom: number
  left: number
}

export interface ConfidenceScored {
  confidence: number
}

export type PlatformAspectRatio =
  | '9:16'
  | '16:9'
  | '1:1'
  | '4:5'
  | 'original'
  | 'custom'

export type MediaKind =
  | 'video'
  | 'audio'
  | 'image'
  | 'screenshot'
  | 'screen_recording'
  | 'logo'
  | 'music'
  | 'sfx'
  | 'document'
  | 'unknown'

export type AssetUsageRole =
  | 'main_footage'
  | 'b_roll'
  | 'overlay'
  | 'picture_in_picture'
  | 'split_screen'
  | 'insert_clip'
  | 'screenshot'
  | 'logo'
  | 'music'
  | 'sfx'
  | 'reference_only'
  | 'do_not_use'
  | 'unknown'

export type PriorityLevel =
  | 'must_follow'
  | 'prefer'
  | 'optional'
  | 'avoid'
  | 'do_not_use'

export type TimingFlexibility =
  | 'exact'
  | 'ai_can_adjust'
  | 'ai_decides'

/**
 * Preserves the non-destructive timing relationship between original source,
 * Clean Assembly, and final edit placement.
 */
export interface SourceTimeMapping {
  id: ID
  mediaAssetId: ID
  rawSourceRange: TimeRange
  cleanAssemblyRange?: TimeRange
  finalEditRange?: TimeRange
  mappingReason:
    | 'kept'
    | 'trimmed'
    | 'removed'
    | 'moved'
    | 'compressed'
    | 'expanded'
    | 'unknown'
  confidence?: number
}

export interface UserEditableNote {
  note: string
  createdBy?: 'user' | 'ai' | 'system'
  createdAt?: string
}
