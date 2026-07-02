import type {
  ProjectEditBriefMarkerAIMode,
  ProjectEditBriefMarkerTimeMode,
  ProjectEditBriefMarkerType,
} from './project-edit-brief'

export type ProjectEditBriefVisualContextRuntimeSource =
  | 'qwen25vl_live'
  | 'qwen25vl_fake'
  | 'deterministic_visual_fallback'
  | 'blocked_missing_beta_config'
  | 'blocked_provider_error'
  | 'blocked_validation_error'

export type ProjectEditBriefVisualContextConfidence = 'low' | 'medium' | 'high'

export type ProjectEditBriefSampledFrameRole =
  | 'point_before'
  | 'point_marker'
  | 'point_after'
  | 'range_start'
  | 'range_midpoint'
  | 'range_end'
  | 'context_extra'

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

export interface ProjectEditBriefSampledFrameReference extends ProjectEditBriefVisualContextSafetyFlags {
  id: string
  markerId?: string
  sampledAtSeconds: number
  role: ProjectEditBriefSampledFrameRole
  dataUrl: string
  mimeType: 'image/jpeg' | 'image/png'
  width: number
  height: number
  approximateByteSize: number
  noRawFramePersistence: true
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
  summaryForQwen3: string
  visualSummaryFromQwen25VL?: string
  boundarySummary: string
  createdAt: string
  mockOnly: boolean
}

export interface ProjectEditBriefVisualContextMarkerInput {
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  markerType: ProjectEditBriefMarkerType
  title: string
  userNote: string
  aiMode: ProjectEditBriefMarkerAIMode
  timeMode: ProjectEditBriefMarkerTimeMode
  startTimeSeconds: number
  endTimeSeconds?: number
  attachmentLabels: string[]
}

export interface ProjectEditBriefVisualContextRequest {
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  marker: ProjectEditBriefVisualContextMarkerInput
  sourceVideoLabel?: string
  sampledFrames: ProjectEditBriefSampledFrameReference[]
  requestedAt: string
  requestId?: string
}

export interface ProjectEditBriefVisualContextAnalysisResult extends ProjectEditBriefVisualContextSafetyFlags {
  ok: boolean
  visualContext: ProjectEditBriefVisualContext
  runtimeSource: ProjectEditBriefVisualContextRuntimeSource
  fallbackUsed: boolean
  fallbackReason?: string
  providerCallMade: boolean
  modelCallMade: boolean
  qwen25vlCallMade: boolean
  secretValuePrinted: false
  secretSentToFrontend: false
  authorizationHeaderLogged: false
  warnings: string[]
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
  'Marker Visual Context is structured marker-scoped visual metadata from sampled browser frames only; it is not durable source video upload, render, worker execution, or credit activity.'

export const REEDITPRO_PROJECT_EDIT_BRIEF_VISUAL_CONTEXT_NO_RAW_MEDIA_RULE =
  'Qwen2.5-VL visual context beta may receive sampled resized frames after explicit user action, but never full raw video/audio bytes, backend file reads, storage objects, fetched URLs, secrets, credentials, or provider headers.'
