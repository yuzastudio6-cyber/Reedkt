import type {
  CreditApprovalRecord,
  CreditEstimateRecord,
  CreditReservationRecord,
  EditPlanRecord,
  GeneratedAssetRecord,
  GenerationRequestRecord,
  JobRecord,
  SFXGeneratedAssetRecord,
  SFXLibraryCandidateRecord,
  SFXLibrarySearchRecord,
  SFXMixPlanRecord,
  SFXMockWaveformAnalysisRecord,
  SFXPromptPlanRecord,
  SFXProvenanceReviewRecord,
  SFXProvider,
  SFXProviderRouteRecord,
  SFXQAReportRecord,
  SFXTimingAlignmentRecord,
  SFXTransientDetectionResult,
  SFXTrimPlanRecord,
  SFXUsageLearningRecord,
  SFXUsageRecord,
  SFXEventPlanRecord,
} from '../../types'
import type { ProcessGeneratedSFXForLibraryGrowthResponse } from '../contracts/sfx-director-contracts'

export type SFXWorkerRuntime =
  | 'mock'
  | 'cloud_run_job'
  | 'cloud_run_service'
  | 'gpu_worker'
  | 'manual'

export type SFXWorkerStatus =
  | 'mock_generated'
  | 'library_match_used'
  | 'blocked'
  | 'failed'
  | 'completed'

export interface SFXWorkerInput {
  jobId: string
  jobBatchId?: string
  workerId?: string
  leaseId?: string
  leaseToken?: string
  idempotencyKey?: string
  workspaceId: string
  projectId: string
  editPlanId: string
  sfxEventPlanId: string
  sfxProviderRouteId: string
  sfxPromptPlanId: string
  generationRequestId: string
  creditReservationId: string
  requestedByUserId?: string
  userConfirmationApproved?: boolean
  sourceFootageApproved?: boolean
  providerUnavailable?: boolean
  mockOnly: true
}

export interface SFXWorkerContext {
  runtime: SFXWorkerRuntime
  provider: 'Mirelo SFX V1.5' | 'MMAudio V2' | 'ReeditPro Internal Library' | 'No SFX'
  providerKey: 'mirelo_sfx_v1_5' | 'mmaudio_v2' | 'mmaudio_v' | 'reeditpro_internal_library' | 'no_sfx'
  workerId?: string
  leaseId?: string
  leaseToken?: string
  idempotencyKey?: string
  modelName?: string
  region?: string
  secretReferenceName?: string
  outputBucket?: string
  outputPathPrefix?: string
}

export interface SFXWorkerOutput {
  jobId: string
  generationRequestId: string
  sfxEventPlanId: string
  sfxGeneratedAssetId?: string
  generatedAssetId?: string
  sfxTrimPlanId?: string
  sfxTimingAlignmentId?: string
  sfxMixPlanId?: string
  sfxQAReportId?: string
  sfxUsageRecordId?: string
  sfxLibraryCandidateId?: string
  status: SFXWorkerStatus
  message: string
  warnings: string[]
  mockOnly: true
}

export interface SFXWorkerFailure {
  code:
    | 'MISSING_JOB'
    | 'MISSING_EVENT_PLAN'
    | 'MISSING_PROVIDER_ROUTE'
    | 'MISSING_PROMPT_PLAN'
    | 'MISSING_GENERATION_REQUEST'
    | 'MISSING_CREDIT_RESERVATION'
    | 'CREDITS_NOT_RESERVED'
    | 'PLAN_NOT_APPROVED'
    | 'PROMPT_VALIDATION_FAILED'
    | 'SFX_DECISION_AVOID'
    | 'SFX_DECISION_NOT_NEEDED'
    | 'PROVIDER_UNAVAILABLE'
    | 'MOCK_ONLY'
    | 'UNKNOWN_ERROR'
  message: string
  details?: unknown
}

export type SFXWorkerValidationResult =
  | {
      ok: true
      warnings: string[]
    }
  | {
      ok: false
      failure: SFXWorkerFailure
      warnings: string[]
    }

export interface SFXWorkerMockRecordBundle {
  job?: JobRecord
  editPlan?: EditPlanRecord
  creditEstimate?: CreditEstimateRecord
  creditApproval?: CreditApprovalRecord
  creditReservation?: CreditReservationRecord
  generationRequest?: GenerationRequestRecord
  sfxEventPlan?: SFXEventPlanRecord
  sfxProviderRoute?: SFXProviderRouteRecord
  sfxPromptPlan?: SFXPromptPlanRecord
  approvedLibraryAssetId?: string
  speechPresent?: boolean
  musicPresent?: boolean
  ambienceImportant?: boolean
  videoTone?: string
  userSFXInstructions?: string[]
  avoidSFXInstructions?: string[]
  mockOutputSummary?: string
  providerTermsKnown?: boolean
  commercialAllowed?: boolean
  adsAllowed?: boolean
  clientWorkAllowed?: boolean
  reuseAcrossUsersAllowed?: boolean
  simulateMockApproval?: boolean
  simulateApprovedLibraryMatch?: boolean
}

export interface SFXWorkerLoadedRecords {
  job: JobRecord
  editPlan: EditPlanRecord
  creditEstimate: CreditEstimateRecord
  creditApproval: CreditApprovalRecord
  creditReservation: CreditReservationRecord
  generationRequest: GenerationRequestRecord
  sfxEventPlan: SFXEventPlanRecord
  sfxProviderRoute: SFXProviderRouteRecord
  sfxPromptPlan: SFXPromptPlanRecord
}

export interface MockSFXProviderResponse {
  provider: 'Mirelo SFX V1.5' | 'MMAudio V2' | 'ReeditPro Internal Library'
  providerKey: Exclude<SFXProvider, 'no_sfx' | 'manual_upload' | 'unknown'>
  modelName: string
  mockAudioBytes: null
  mockStoragePath: string
  matchedLibraryAssetId?: string
  durationSeconds: number
  format: 'wav' | 'mp3'
  generatedAt: string
  mockOnly: true
  waveformHint: string[]
}

export type SFXWorkerEventType = 'started' | 'progress' | 'completed' | 'failed' | 'blocked' | 'library_match'

export interface SFXWorkerEventRecord {
  id: string
  jobId: string
  jobBatchId?: string
  generationRequestId: string
  sfxEventPlanId: string
  eventType: SFXWorkerEventType
  message: string
  progressPercent: number
  createdAt: string
  payload?: Record<string, string | number | boolean | null>
}

export interface SFXWorkerRunResult {
  output: SFXWorkerOutput
  events: SFXWorkerEventRecord[]
  providerResponse?: MockSFXProviderResponse
  generatedSFXAsset?: SFXGeneratedAssetRecord
  generatedAsset?: GeneratedAssetRecord
  waveformAnalysis?: SFXMockWaveformAnalysisRecord
  transientDetection?: SFXTransientDetectionResult
  trimPlan?: SFXTrimPlanRecord
  timingAlignment?: SFXTimingAlignmentRecord
  mixPlan?: SFXMixPlanRecord
  qaReport?: SFXQAReportRecord
  usageRecord?: SFXUsageRecord
  libraryCandidate?: SFXLibraryCandidateRecord
  librarySearchRecord?: SFXLibrarySearchRecord
  provenanceReview?: SFXProvenanceReviewRecord
  usageLearning?: SFXUsageLearningRecord
  libraryGrowth?: ProcessGeneratedSFXForLibraryGrowthResponse
  failure?: SFXWorkerFailure
}
