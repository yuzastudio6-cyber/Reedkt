import type {
  AssetUsageRole,
  ID,
  MediaKind,
  PriorityLevel,
} from './workflow-common'

export type SourceLibraryStatus =
  | 'draft'
  | 'ai_suggested'
  | 'user_reviewing'
  | 'confirmed'
  | 'superseded'

export type SourceAssetReviewStatus =
  | 'ai_suggested'
  | 'user_confirmed'
  | 'user_modified'
  | 'do_not_use'
  | 'needs_review'

export type SourceAssetOperationType =
  | 'accept_ai_suggestion'
  | 'update_role'
  | 'update_priority'
  | 'update_notes'
  | 'add_tag'
  | 'remove_tag'
  | 'mark_do_not_use'
  | 'reset_asset'
  | 'reset_all'
  | 'confirm_library'

export type SourceAssetAudioPolicy =
  | 'keep_main_audio'
  | 'mute_asset_audio'
  | 'use_asset_audio'
  | 'mix_with_main_audio'
  | 'duck_under_speech'
  | 'reference_only'
  | 'ai_decides'

export interface SourceLibrary {
  id: ID
  projectId: ID
  workspaceId?: ID
  userId?: ID
  footagePrepSessionId?: ID
  cleanAssemblyId?: ID
  status: SourceLibraryStatus
  assetIds: ID[]
  operationIds: ID[]
  confirmedAt?: string
  createdAt: string
  updatedAt: string
}

export interface SourceLibraryAsset {
  id: ID
  projectId: ID
  workspaceId?: ID
  userId?: ID
  sourceLibraryId: ID
  mediaAssetId: ID
  sourceClipSequenceItemId?: ID
  label: string
  mediaKind: MediaKind
  aiSuggestedRole: AssetUsageRole
  userRole: AssetUsageRole
  priority: PriorityLevel
  reviewStatus: SourceAssetReviewStatus
  audioPolicy: SourceAssetAudioPolicy
  tags: string[]
  userNotes?: string
  aiSummary?: string
  qualityFlagIds: ID[]
  assetAnalysisReportId?: ID
  operationIds: ID[]
  createdAt: string
  updatedAt: string
}

export interface SourceAssetOperation {
  id: ID
  projectId: ID
  workspaceId?: ID
  userId?: ID
  sourceLibraryId: ID
  sourceLibraryAssetId?: ID
  type: SourceAssetOperationType
  createdBy: 'user' | 'ai' | 'system'
  createdAt: string
  patch?: Record<string, unknown>
  explanation?: string
}

export interface SourceLibraryState {
  sourceLibrary: SourceLibrary
  assets: SourceLibraryAsset[]
  operations: SourceAssetOperation[]
  updatedAt: string
}

export interface SourceLibrarySummary {
  totalAssets: number
  confirmedAssets: number
  modifiedAssets: number
  doNotUseAssets: number
  mainFootageAssets: number
  bRollAssets: number
  overlayAssets: number
  logoAssets: number
  audioAssets: number
  referenceOnlyAssets: number
  needsReviewAssets: number
}
