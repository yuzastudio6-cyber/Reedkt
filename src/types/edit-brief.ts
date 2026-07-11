import type { ID, ProjectScopedRecord } from './workflow-common'

export type EditBriefStatus =
  | 'draft'
  | 'ready'
  | 'used_in_plan'
  | 'superseded'

export type TargetPlatform =
  | 'tiktok'
  | 'instagram_reels'
  | 'youtube_shorts'
  | 'youtube'
  | 'linkedin'
  | 'facebook'
  | 'x'
  | 'website'
  | 'custom'

export type CaptionPreference =
  | 'none'
  | 'minimal'
  | 'standard'
  | 'dynamic'
  | 'bold_creator'
  | 'premium_subtle'
  | 'ai_decides'

export type MusicPreference =
  | 'none'
  | 'subtle'
  | 'energetic'
  | 'cinematic'
  | 'corporate'
  | 'trend_based'
  | 'ai_decides'

export type PacingPreference =
  | 'slow'
  | 'natural'
  | 'tight'
  | 'fast'
  | 'very_fast'
  | 'ai_decides'

export interface EditBrief extends ProjectScopedRecord {
  status: EditBriefStatus
  cleanAssemblyId?: ID
  chatSessionId?: ID
  sourceChatMessageId?: ID
  goal?: string
  audience?: string
  targetPlatforms: TargetPlatform[]
  targetDurationMs?: number
  styleKeywords: string[]
  pacingPreference?: PacingPreference
  captionPreference?: CaptionPreference
  musicPreference?: MusicPreference
  bRollPreference?: string
  mustUseAssetIds: ID[]
  avoidAssetIds: ID[]
  mustIncludeNotes: string[]
  avoidNotes: string[]
  brandNotes?: string
  specialInstructions?: string
  userProvidedReferenceUrls?: string[]
  version: number
}

export interface EditBriefSummary {
  title: string
  goal?: string
  targetPlatforms: TargetPlatform[]
  targetDurationMs?: number
  styleKeywords: string[]
  hasEditCues: boolean
  cueCount: number
}
