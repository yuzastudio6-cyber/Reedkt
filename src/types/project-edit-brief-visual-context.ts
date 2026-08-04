export type ProjectEditBriefVisualContextRuntimeSource =
  | 'visual_intelligence_authenticated_read'
  /** @deprecated Immutable compatibility only; never current authority. */
  | 'qwen25vl_live'
  /** @deprecated Immutable compatibility only; never current authority. */
  | 'qwen25vl_fake'
  | 'deterministic_visual_fallback'
  | 'blocked_missing_orchestra_report'
  | 'blocked_provider_error'
  | 'blocked_validation_error'

export type ProjectEditBriefVisualContextConfidence = 'low' | 'medium' | 'high'

export interface ProjectEditBriefVisualContextTimeRange {
  startTimeSeconds: number
  endTimeSeconds: number
  label: string
}

export interface ProjectEditBriefVisualContextSafetyFlags {
  fullVideoUploaded: false
  sampledFramesPersisted: false
  rawProviderPayloadStored: false
  rawProviderPayloadExposed: false
  providerHeadersExposed: false
  providerCredentialsExposed: false
  chainOfThoughtExposed: false
  browserFileBytesReadManually: false
  backendFileBytesRead: false
  storageReadMade: false
  storageWriteMade: false
  signedUrlCreated: false
  externalUrlFetched: false
  ffmpegRun: false
  ffprobeRun: false
  whisperRun: false
  soundRuntimeInvoked: false
  deepSeekCallMade: false
  qwen37VisualCallMade: false
  workerJobCreated: false
  generationRequestCreated: false
  renderJobCreated: false
  editPlanCreated: false
  plannerExecuted: false
  creditReservedOrSpent: false
  supabaseCommandRun: false
  migrationCreatedOrModified: false
}

export interface ProjectEditBriefVisualContext extends ProjectEditBriefVisualContextSafetyFlags {
  id: string
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  sourceVideoLabel?: string
  visualSummary: string
  setting: string
  visibleObjects: string[]
  visiblePeople: string[]
  actions: string[]
  cameraMotion: string
  visibleText: string[]
  layoutNotes: string[]
  brollOpportunities: string[]
  visualRisks: string[]
  doNotCopyNotes: string[]
  confidence: ProjectEditBriefVisualContextConfidence
  timeRange: ProjectEditBriefVisualContextTimeRange
  sampledFrameCount: number
  runtimeSource: ProjectEditBriefVisualContextRuntimeSource
  fallbackReason?: string
  summaryForOrchestra: string
  /** @deprecated Immutable compatibility only; never fresh planning authority. */
  summaryForQwen3?: string
  /** @deprecated Immutable compatibility only; never current visual evidence. */
  visualSummaryFromQwen25VL?: string
  boundarySummary: string
  createdAt: string
  mockOnly: boolean
}

export const PROJECT_EDIT_BRIEF_VISUAL_CONTEXT_SAFETY_FLAGS: ProjectEditBriefVisualContextSafetyFlags = {
  fullVideoUploaded: false,
  sampledFramesPersisted: false,
  rawProviderPayloadStored: false,
  rawProviderPayloadExposed: false,
  providerHeadersExposed: false,
  providerCredentialsExposed: false,
  chainOfThoughtExposed: false,
  browserFileBytesReadManually: false,
  backendFileBytesRead: false,
  storageReadMade: false,
  storageWriteMade: false,
  signedUrlCreated: false,
  externalUrlFetched: false,
  ffmpegRun: false,
  ffprobeRun: false,
  whisperRun: false,
  soundRuntimeInvoked: false,
  deepSeekCallMade: false,
  qwen37VisualCallMade: false,
  workerJobCreated: false,
  generationRequestCreated: false,
  renderJobCreated: false,
  editPlanCreated: false,
  plannerExecuted: false,
  creditReservedOrSpent: false,
  supabaseCommandRun: false,
  migrationCreatedOrModified: false,
}

export const REEDITPRO_PROJECT_EDIT_BRIEF_VISUAL_CONTEXT_RULE =
  'Marker Visual Context is a read-only projection of an authenticated immutable Visual Intelligence report produced through Orchestra; browser sampling and direct model execution are retired.'

export const REEDITPRO_PROJECT_EDIT_BRIEF_VISUAL_CONTEXT_NO_RAW_MEDIA_RULE =
  'The browser never samples, uploads, or sends visual media to a model. Canonical media analysis runs only through the authenticated Orchestra-owned Visual Intelligence workflow.'
