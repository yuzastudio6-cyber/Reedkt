import type {
  CreditReservationRecord,
  GeneratedAssetRecord,
  GeneratedMusicTrackRecord,
  GenerationRequestRecord,
  JobRecord,
  LyriaPromptPlanRecord,
  MusicCueSheetItemRecord,
  MusicLibraryCandidateRecord,
  MusicMixPlanRecord,
  MusicQAReportRecord,
  MusicTrackAnalysisRecord,
  ReferenceMusicDNARecord,
} from '../../types'

export interface LyriaWorkerInput {
  jobId: string
  jobBatchId?: string
  workspaceId: string
  projectId: string
  editPlanId: string
  musicCueId: string
  musicCueSheetId?: string
  lyriaPromptPlanId: string
  generationRequestId: string
  creditReservationId: string
  requestedByUserId?: string
  mockOnly: true
}

export interface LyriaWorkerContext {
  provider: 'Lyria Pro'
  modelName: 'lyria-3-pro-preview'
  runtime: 'mock' | 'cloud_run_job' | 'cloud_run_service'
  region?: string
  secretReferenceName?: string
  outputBucket?: string
  outputPathPrefix?: string
}

export interface LyriaWorkerOutput {
  generationRequestId: string
  generatedMusicTrackId: string
  generatedAssetId: string
  musicTrackAnalysisId?: string
  musicQAReportId?: string
  musicMixPlanId?: string
  status: 'mock_generated' | 'blocked' | 'failed'
  message: string
  warnings: string[]
}

export interface LyriaWorkerFailure {
  code:
    | 'MISSING_JOB'
    | 'MISSING_PROMPT_PLAN'
    | 'MISSING_MUSIC_CUE'
    | 'MISSING_GENERATION_REQUEST'
    | 'MISSING_CREDIT_RESERVATION'
    | 'CREDITS_NOT_RESERVED'
    | 'PLAN_NOT_APPROVED'
    | 'PROMPT_VALIDATION_FAILED'
    | 'MOCK_ONLY'
    | 'UNKNOWN_ERROR'
  message: string
  details?: unknown
}

export type LyriaWorkerValidationResult =
  | {
      ok: true
      warnings: string[]
    }
  | {
      ok: false
      failure: LyriaWorkerFailure
      warnings: string[]
    }

export interface LyriaWorkerMockRecordBundle {
  job?: JobRecord
  promptPlan?: LyriaPromptPlanRecord
  musicCue?: MusicCueSheetItemRecord
  generationRequest?: GenerationRequestRecord
  creditReservation?: CreditReservationRecord
  referenceMusicDNA?: ReferenceMusicDNARecord
  generatedTrackOverride?: Partial<GeneratedMusicTrackRecord>
}

export interface LyriaWorkerLoadedRecords {
  job?: JobRecord
  promptPlan: LyriaPromptPlanRecord
  musicCue: MusicCueSheetItemRecord
  generationRequest: GenerationRequestRecord
  creditReservation: CreditReservationRecord
  referenceMusicDNA?: ReferenceMusicDNARecord
  generatedTrackOverride?: Partial<GeneratedMusicTrackRecord>
}

export interface MockLyriaProviderResponse {
  provider: 'Lyria Pro'
  model: 'lyria-3-pro-preview'
  mockAudioBytes: null
  mockStoragePath: string
  durationSeconds: number
  format: 'wav'
  generatedAt: string
  mockOnly: true
  waveformSummary: string[]
}

export type LyriaWorkerEventType = 'started' | 'progress' | 'completed' | 'failed' | 'blocked'

export interface LyriaWorkerEventRecord {
  id: string
  jobId: string
  jobBatchId?: string
  generationRequestId: string
  eventType: LyriaWorkerEventType
  message: string
  progressPercent: number
  createdAt: string
  payload?: Record<string, string | number | boolean | null>
}

export interface LyriaWorkerRunResult {
  output: LyriaWorkerOutput
  events: LyriaWorkerEventRecord[]
  generatedMusicTrack?: GeneratedMusicTrackRecord
  generatedAsset?: GeneratedAssetRecord
  trackAnalysis?: MusicTrackAnalysisRecord
  qaReport?: MusicQAReportRecord
  mixPlan?: MusicMixPlanRecord
  libraryCandidate?: MusicLibraryCandidateRecord
  providerResponse?: MockLyriaProviderResponse
  failure?: LyriaWorkerFailure
}
