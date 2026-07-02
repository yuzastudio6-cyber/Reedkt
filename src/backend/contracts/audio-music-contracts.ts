import type {
  ID,
  LyriaPromptPlanRecord,
  LyriaPromptSegment,
  LyriaPromptValidationWarning,
  MusicContextAnalysisRecord,
  MusicCueRecord,
  MusicCueSheetRecord,
  MusicGenerationPurpose,
  MusicLanguageContextRecord,
  MusicLibraryCandidateRecord,
  MusicMixPlanRecord,
  MusicNeedDecision,
  MusicQAReportRecord,
  MusicCueCountDecision,
  MusicStyleTaxonomyRecord,
  ReferenceMusicDNARecord,
  Seconds,
  SfxLibraryAssetRecord,
  TargetPlatform,
} from '../../types'

export interface AnalyzeMusicContextRequest {
  projectId: ID
  editPlanId: ID
  chatSessionId?: ID
  referenceAssetId?: ID
  sourceAssetIds?: ID[]
  transcriptAssetId?: ID
  platform?: TargetPlatform
  userRequest?: string
  userMusicInstructions?: string[]
  avoidMusicInstructions?: string[]
}

export interface AnalyzeMusicContextResponse {
  musicContextAnalysis: MusicContextAnalysisRecord
  languageContext?: MusicLanguageContextRecord
  referenceMusicDNA?: ReferenceMusicDNARecord
  musicNeedDecision: MusicNeedDecision
}

export interface CreateMusicCueSheetRequest {
  projectId: ID
  editPlanId: ID
  musicContextAnalysisId: ID
  referenceMusicDNAId?: ID
  cueCountDecision?: MusicCueCountDecision
  approvalRequired?: boolean
  creditEstimateId?: ID
  notes?: string[]
}

export interface CreateMusicCueSheetResponse {
  cueSheet: MusicCueSheetRecord
  cues: MusicCueRecord[]
}

export interface CreateMusicCueRequest {
  projectId: ID
  editPlanId: ID
  musicCueSheetId: ID
  cue: Omit<MusicCueRecord, 'id' | 'createdAt' | 'updatedAt' | 'projectId' | 'editPlanId' | 'musicCueSheetId'>
}

export interface CreateMusicCueResponse {
  cue: MusicCueRecord
}

export interface CreateLyriaPromptPlanRequest {
  projectId: ID
  editPlanId: ID
  musicCueSheetId: ID
  musicCueId?: ID
  musicContextAnalysisId?: ID
  musicLanguageContextIds?: ID[]
  referenceMusicDNAId?: ID
  generationPurpose: MusicGenerationPurpose
  modelName?: string
  providerName?: 'Lyria Pro'
  durationSeconds: Seconds
  creditEstimateId?: ID
  userInstruction?: string
  avoidInstruction?: string
}

export interface CreateLyriaPromptPlanResponse {
  promptPlan: LyriaPromptPlanRecord
  promptSegments: LyriaPromptSegment[]
  validationWarnings: LyriaPromptValidationWarning[]
}

export interface ValidateLyriaPromptPlanRequest {
  promptPlan: LyriaPromptPlanRecord
  musicCue: MusicCueRecord
  musicCueSheet?: MusicCueSheetRecord
  musicContextAnalysis?: MusicContextAnalysisRecord
  languageContexts?: MusicLanguageContextRecord[]
  referenceMusicDNA?: ReferenceMusicDNARecord
  userInstruction?: string
  avoidInstruction?: string
}

export interface ValidateLyriaPromptPlanResponse {
  validationWarnings: LyriaPromptValidationWarning[]
}

export interface CreateMusicQARequest {
  projectId: ID
  editPlanId: ID
  musicCueSheetId: ID
  musicCueId?: ID
  generatedMusicTrackId?: ID
  referenceMusicDNAId?: ID
}

export interface CreateMusicQAResponse {
  qaReport: MusicQAReportRecord
}

export interface CreateMusicMixPlanRequest {
  projectId: ID
  editPlanId: ID
  musicCueSheetId: ID
  musicCueId?: ID
  generatedMusicTrackId?: ID
}

export interface CreateMusicMixPlanResponse {
  mixPlan: MusicMixPlanRecord
}

export interface PromoteMusicLibraryCandidateRequest {
  projectId: ID
  generatedMusicTrackId: ID
  workspaceId?: ID
  requestedByUserId?: ID
  reason: string
}

export interface PromoteMusicLibraryCandidateResponse {
  candidate: MusicLibraryCandidateRecord
}

export interface ListMusicStyleTaxonomyResponse {
  styles: MusicStyleTaxonomyRecord[]
}

export interface ListSfxLibraryAssetsResponse {
  assets: SfxLibraryAssetRecord[]
}
