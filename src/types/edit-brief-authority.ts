import type {
  CaptionPreference,
  MusicPreference,
  PacingPreference,
  TargetPlatform as EditBriefTargetPlatform,
} from './edit-brief'

export type CanonicalEditBriefMarkerType =
  | 'note'
  | 'keep'
  | 'cut'
  | 'broll'
  | 'caption'
  | 'music'
  | 'sfx'
  | 'graphic'
  | 'transition'
  | 'color'
  | 'story'
  | 'clarification'
  | 'approval'

export type CanonicalEditBriefMarkerPriority =
  | 'low'
  | 'normal'
  | 'high'
  | 'must_follow'

export interface CanonicalEditBriefFields {
  goal: string
  audience?: string
  deliverable?: string
  mustIncludeNotes: string[]
  avoidNotes: string[]
  additionalNotes?: string
  targetPlatforms?: EditBriefTargetPlatform[]
  targetDurationMs?: number
  styleKeywords?: string[]
  pacingPreference?: PacingPreference
  captionPreference?: CaptionPreference
  musicPreference?: MusicPreference
  bRollPreference?: string
  mustUseAssetIds?: string[]
  avoidAssetIds?: string[]
  brandNotes?: string
  specialInstructions?: string
  userProvidedReferenceUrls?: string[]
  status: 'draft' | 'ready'
}

export interface CanonicalEditBriefRecord {
  id: string
  revision: number
  fields: CanonicalEditBriefFields
  createdAt: string
  updatedAt: string
}

export interface CanonicalEditBriefExportSettings {
  revision: number
  platformTarget: string
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5' | '4:3' | 'custom'
  customWidth?: number
  customHeight?: number
  resolution: string
  resolutionProfileId?: string
  frameRate: 24 | 25 | 30 | 50 | 60
  confirmationStatus: 'recommended' | 'confirmed'
  confirmationId?: string
  updatedAt: string
}

export interface CanonicalEditBriefMarker {
  id: string
  editSessionId: string
  briefId?: string
  revision: number
  markerType: CanonicalEditBriefMarkerType
  timeKind: 'point' | 'range'
  startSeconds: number
  endSeconds?: number
  priority: CanonicalEditBriefMarkerPriority
  title: string
  note: string
  status: 'draft' | 'confirmed' | 'archived'
  timingStatus: 'display_seconds_only' | 'frame_authoritative'
  startFrame?: number
  endFrame?: number
  frameRate?: number
  confirmedAt?: string
  archivedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CanonicalEditBriefMarkerMessage {
  id: string
  markerId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  clientMessageId?: string
  runtimeState:
    | 'mock_local'
    | 'metadata_only'
    | 'future_gated'
    | 'blocked_by_worker'
    | 'blocked_by_persistence'
  createdAt: string
}

export interface CanonicalEditBriefQaReport {
  id: string
  status: 'passed' | 'warning' | 'needs_user_review' | 'blocked'
  findings: Array<{
    code: string
    severity: 'warning' | 'needs_user_review' | 'blocking'
    message: string
    markerIds: string[]
  }>
  createdAt: string
}

export interface CanonicalEditBriefPlanHints {
  id: string
  readiness: 'ready_for_planning' | 'needs_user_review' | 'blocked'
  confirmedMarkerHints: Array<{
    markerId: string
    markerType: CanonicalEditBriefMarkerType
    startSeconds: number
    endSeconds?: number
    startFrame?: number
    endFrame?: number
    instruction: string
  }>
  createdAt: string
}

export interface CanonicalEditBriefAuthority {
  schemaVersion: 'private-edit-brief-authority-v1'
  privateInternalOnly: true
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  revision: number
  brief?: CanonicalEditBriefRecord
  exportSettings?: CanonicalEditBriefExportSettings
  markers: CanonicalEditBriefMarker[]
  markerMessages: CanonicalEditBriefMarkerMessage[]
  qaReports: CanonicalEditBriefQaReport[]
  planHintPackages: CanonicalEditBriefPlanHints[]
  lifecycle: {
    phase: 'planning' | 'approved_snapshot'
    mutable: boolean
    approvedSnapshotId?: string
    lockedAt?: string
  }
  createdAt: string
  updatedAt: string
}

export interface CanonicalEditBriefAuthorityReadResponse {
  authority?: CanonicalEditBriefAuthority
  aggregateRevision: number
  optionalBriefPresent: boolean
}

export interface CanonicalEditBriefMarkerDraft {
  markerType: CanonicalEditBriefMarkerType
  timeKind: 'point' | 'range'
  startSeconds: number
  endSeconds?: number
  priority: CanonicalEditBriefMarkerPriority
  title: string
  note: string
}
