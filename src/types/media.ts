import type { BaseRecord, ID, ISODateString, JSONObject, ProcessingStatus, Seconds, TimeRange } from './shared'

export type MediaAssetType =
  | 'source_video'
  | 'source_audio'
  | 'source_image'
  | 'reference_video'
  | 'reference_image'
  | 'transcript'
  | 'generated_overlay'
  | 'generated_audio'
  | 'preview_render'
  | 'final_export'

export type MediaStorageProvider = 'supabase_storage' | 'google_cloud_storage' | 'external_url' | 'local_mock'

export type TranscriptStatus = 'not_started' | 'queued' | 'running' | 'completed' | 'failed'

export type ObservationConfidence = 'low' | 'medium' | 'high'

export interface MediaAssetRecord extends BaseRecord {
  workspaceId: ID
  projectId?: ID
  uploadedByUserId?: ID
  assetType: MediaAssetType
  storageProvider: MediaStorageProvider
  storagePath?: string
  externalUrl?: string
  safePreviewUrl?: string
  fileName: string
  mimeType: string
  byteSize?: number
  width?: number
  height?: number
  durationSeconds?: Seconds
  checksum?: string
  status: ProcessingStatus
}

export interface SourceClipSequenceRecord extends BaseRecord {
  projectId: ID
  chatSessionId: ID
  createdFromChatMessageId?: ID
  sequenceName: string
  explanation: string
  lockedByUser: boolean
  status: ProcessingStatus
}

export interface SourceClipSequenceItem {
  id: ID
  sourceClipSequenceId: ID
  mediaAssetId: ID
  uploadedOrder: number
  userNotes?: string
  isImportant: boolean
  isOptional: boolean
  detectedRole?: string
  possibleUses: string[]
  transcriptStatus: TranscriptStatus
  analysisStatus: ProcessingStatus
  metadata?: JSONObject
}

export interface TranscriptRecord extends BaseRecord {
  projectId: ID
  mediaAssetId: ID
  languageCode?: string
  status: TranscriptStatus
  fullText: string
  speakerLabels: string[]
  wordLevelTimingAvailable: boolean
}

export interface TranscriptSegmentRecord extends BaseRecord {
  transcriptId: ID
  mediaAssetId: ID
  speakerLabel?: string
  startSeconds: Seconds
  endSeconds: Seconds
  text: string
  confidence?: number
  matchedStoryBeatId?: ID
}

export interface SceneBoundaryRecord extends BaseRecord {
  projectId: ID
  mediaAssetId: ID
  startSeconds: Seconds
  endSeconds: Seconds
  sceneLabel: string
  visualSummary: string
  detectionConfidence: ObservationConfidence
}

export interface VisualObservationRecord extends BaseRecord {
  projectId: ID
  mediaAssetId: ID
  timeRange: TimeRange
  observationType: 'person' | 'object' | 'place' | 'screen' | 'gesture' | 'product' | 'text' | 'other'
  summary: string
  detectedObjects: string[]
  faceSafeRegions?: JSONObject
  confidence: ObservationConfidence
}

export interface AudioObservationRecord extends BaseRecord {
  projectId: ID
  mediaAssetId: ID
  timeRange: TimeRange
  roomTone: string
  noiseProfile: string[]
  voiceClarity: ObservationConfidence
  musicDetected: boolean
  sfxDetected: boolean
  cleanupNeeded: boolean
  preserveAmbience: boolean
}

export interface ReferenceAssetRecord extends BaseRecord {
  projectId: ID
  chatAttachmentId?: ID
  mediaAssetId?: ID
  referenceUrl?: string
  status: ProcessingStatus
  userInstructions?: string
  analyzedAt?: ISODateString
}

export interface ReferenceDNARecord extends BaseRecord {
  projectId: ID
  referenceAssetId: ID
  topic: string
  openingStyle: string
  pacing: string
  musicIntro: string
  beatChanges: string
  transitionStyle: string
  captionStyle: string
  visualEffectStyle: string
  strokeMotionUsage: string
  graphicDesignUsage: string
  realMotionStyleOverlayUsage: string
  moodAndTone: string
  whyReferenceWorks: string
  adaptationRule: string
  doNotCopyRule: string
}

export const MEDIA_ASSET_TYPES: MediaAssetType[] = [
  'source_video',
  'source_audio',
  'source_image',
  'reference_video',
  'reference_image',
  'transcript',
  'generated_overlay',
  'generated_audio',
  'preview_render',
  'final_export',
]
