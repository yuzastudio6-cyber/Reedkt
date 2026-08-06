import type {
  PreferenceApplicationTargetBudgetPreference,
  PreferenceApplicationTargetContentType,
  PreferenceApplicationTargetDirectives,
  PreferenceApplicationTargetSourceMode,
} from './edit-reference'
import type {
  ProjectEditSessionAspectRatio,
  ProjectEditSessionPlatformTarget,
} from './project-edit-session'
import type { UserFacingEditLevel } from './reeditpro'

export const TARGET_VIDEO_UNDERSTANDING_PACKAGE_VERSION =
  'edit-reference-target-video-understanding-package-v1' as const

export const TARGET_VIDEO_UNDERSTANDING_STUDY_TIME_STANDARD_VERSION =
  'edit-reference-target-video-study-time-standard-v1' as const

export type TargetVideoUnderstandingStatus =
  | 'collecting'
  | 'needs_operator_review'
  | 'review_required'
  | 'ready'
  | 'cancelled'

export type TargetVideoUnderstandingEvidenceStatus =
  | 'pending'
  | 'analyzed'
  | 'not_applicable'
  | 'blocked'

export type TargetVideoUnderstandingSkillRuntimeSource =
  | 'verified_local'
  | 'verified_live'
  | 'verified_mock'
  | 'not_run'

export interface TargetVideoUnderstandingSourceIdentity {
  storageObjectRecordId: string
  mediaAssetId: string
  checksumSha256: string
  sizeBytes: number
  durationSeconds: number
  mimeType: string
  hasAudio: boolean
  originalRemainsImmutable: true
  uploadTransport: 'resumable_required' | 'resumable_recommended'
  analysisProxyProfile: 'reeditpro-analysis-proxy-v1'
  analysisProxyMaxWidth: 1280
  analysisProxyMaxHeight: 1280
  analysisProxyMaxFrameRate: 30
  studyAudioSampleRate: 16000
  studyAudioChannels: 1
}

export interface TargetVideoUnderstandingDeclaredContext {
  projectName: string
  editName: string
  contentType: PreferenceApplicationTargetContentType
  currentUserInstruction: string
  selectedEditLevel: UserFacingEditLevel
  aspectRatio: Exclude<ProjectEditSessionAspectRatio, 'custom'>
  outputFrameConfirmed: true
  platformTarget: ProjectEditSessionPlatformTarget
  storyRole: string
  budgetPreference: PreferenceApplicationTargetBudgetPreference
  directives: PreferenceApplicationTargetDirectives
  approvedConstraints: string[]
  editBriefId: string
  editBriefRevision: number
  editBriefDigestSha256: string
  contextDigestSha256: string
}

export interface TargetVideoUnderstandingStudyProgress {
  runId: string
  runRevision: number
  planId: string
  planDigestSha256: string
  state: 'queued' | 'running' | 'paused' | 'needs_operator_review' | 'completed' | 'cancelled'
  durationClass: 'short' | 'standard' | 'long' | 'extended'
  chunkCount: number
  coreChunkDurationSeconds: number
  maximumSemanticWindowSeconds: 120
  completedWorkItemCount: number
  totalWorkItemCount: number
  progressPercent: number
  temporalCoverageRatio: number
  continuousAudioCoverageRatio: 0 | 1
  etaLowerRemainingSeconds: number
  etaUpperRemainingSeconds: number
  etaConfidence: 'planning' | 'observed_low' | 'observed_medium'
  wholeStudyMayRunForMinutesOrHours: true
  browserSessionRequiredForCompletion: false
  fixedWholeStudyWallClockTimeoutApplied: false
  checkpointAfterEveryWorkItem: true
  restartResumeRequired: true
  partialSamplingCannotClaimFullyStudied: true
}

export interface TargetVideoUnderstandingEvidenceRecord {
  evidenceId: string
  workItemId: string
  stageId: string
  chunkId: string | null
  sourceCoverageStartSeconds: number
  sourceCoverageEndSeconds: number
  outputDigestSha256: string
  runtimeSource: TargetVideoUnderstandingSkillRuntimeSource
  completionAuthority: 'authoritative' | 'controlled_mock' | 'incomplete'
  toolIds: string[]
}

export interface TargetVideoUnderstandingSkillRun {
  skillRunId: string
  skillId: string
  stageId: string
  status: TargetVideoUnderstandingEvidenceStatus
  runtimeSources: TargetVideoUnderstandingSkillRuntimeSource[]
  evidenceIds: string[]
  confidence: number
  fullTemporalCoverage: boolean
  limitationIds: string[]
}

export interface TargetVideoUnderstandingConfidence {
  overall: number
  story: number
  visual: number
  audio: number
  captions: number
  color: number
  graphics: number
  basis: 'completed_authoritative_study' | 'partial_or_controlled_study'
}

export interface TargetVideoUnderstandingStoryStructure {
  status: TargetVideoUnderstandingEvidenceStatus
  summary: string
  observedPatterns: string[]
  technicalSceneBoundaryCandidateCount: number
  evidenceIds: string[]
}

export interface TargetVideoUnderstandingVisualOpportunity {
  opportunityId: string
  category: 'visual_language' | 'broll_pattern' | 'color_treatment' | 'graphics_motion'
  summary: string
  confidence: number
  evidenceIds: string[]
}

export interface TargetVideoUnderstandingAudioState {
  status: TargetVideoUnderstandingEvidenceStatus
  hasAudio: boolean
  speechPresent: boolean | null
  sourceMode: PreferenceApplicationTargetSourceMode
  transcriptSegmentCount: number
  transcriptWordCount: number
  languageCodes: string[]
  wordTimingMode: 'exact' | 'not_available' | 'pending'
  continuousCoverage: boolean
  qualitySummary: string
  evidenceIds: string[]
}

export interface TargetVideoUnderstandingCaptionRequirements {
  status: TargetVideoUnderstandingEvidenceStatus
  recommendation: 'required' | 'recommended' | 'not_required' | 'avoid' | 'needs_clarification'
  visibleTextObserved: boolean | null
  analyzedFrameCount: number
  failedFrameCount: number
  reason: string
  evidenceIds: string[]
}

export interface TargetVideoUnderstandingColorState {
  status: TargetVideoUnderstandingEvidenceStatus
  summary: string
  technicalSectionCount: number
  evidenceIds: string[]
}

export interface TargetVideoUnderstandingGraphicsNeed {
  needId: string
  summary: string
  confidence: number
  evidenceIds: string[]
}

export interface TargetVideoUnderstandingRuntimeProvenance {
  runtimeSources: TargetVideoUnderstandingSkillRuntimeSource[]
  toolIds: string[]
  providerIds: string[]
  modelIds: string[]
  outputDigestsSha256: string[]
  completionAttestationDigestSha256: string | null
  everyRequiredOutputVerified: boolean
  everySemanticRuntimeAuthoritative: boolean
  everyRequiredOutputCostAuthoritySatisfied: boolean
  coverageQaPassed: boolean
}

export interface TargetVideoUnderstandingPackage {
  schemaVersion: typeof TARGET_VIDEO_UNDERSTANDING_PACKAGE_VERSION
  packageId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  editReferenceId: string
  studySessionId: string
  status: TargetVideoUnderstandingStatus
  source: TargetVideoUnderstandingSourceIdentity
  declaredContext: TargetVideoUnderstandingDeclaredContext
  study: TargetVideoUnderstandingStudyProgress
  evidenceIds: string[]
  evidence: TargetVideoUnderstandingEvidenceRecord[]
  skillRuns: TargetVideoUnderstandingSkillRun[]
  confidence: TargetVideoUnderstandingConfidence
  sourceSummary: string
  storyStructure: TargetVideoUnderstandingStoryStructure
  visualOpportunities: TargetVideoUnderstandingVisualOpportunity[]
  audioState: TargetVideoUnderstandingAudioState
  captionRequirements: TargetVideoUnderstandingCaptionRequirements
  colorState: TargetVideoUnderstandingColorState
  graphicsNeeds: TargetVideoUnderstandingGraphicsNeed[]
  limitations: Array<{ id: string; summary: string; blocking: boolean }>
  missingEvidence: Array<{ id: string; domain: string; summary: string; blocking: boolean }>
  runtimeProvenance: TargetVideoUnderstandingRuntimeProvenance
  readyForPreferenceApplication: boolean
  callerSourceSummaryUsedAsStudyEvidence: false
  rawTranscriptPersisted: false
  rawFrameBytesPersisted: false
  rawProviderPayloadPersisted: false
  signedUrlPersisted: false
  localFilePathPersisted: false
  providerCallMade: boolean
  modelCallMade: boolean
  customerPriceCalculated: false
  customerCreditsMutated: false
  serviceFeeIncluded: false
  remoteMutationMade: false
  createdAt: string
  updatedAt: string
  packageDigestSha256: string
}

export interface StartTargetVideoUnderstandingRequest {
  workspaceId: string
  editReferenceId: string
  studySessionId: string
  sourceStorageObjectRecordId: string
  sourceMediaAssetId: string
  expectedEditBriefRevision: number
  expectedEditBriefDigestSha256: string
  contentType: PreferenceApplicationTargetContentType
  currentUserInstruction: string
  selectedEditLevel: UserFacingEditLevel
  aspectRatio: Exclude<ProjectEditSessionAspectRatio, 'custom'>
  outputFrameConfirmed: true
  platformTarget: ProjectEditSessionPlatformTarget
  storyRole: string
  budgetPreference: PreferenceApplicationTargetBudgetPreference
  directives: PreferenceApplicationTargetDirectives
  approvedConstraints: string[]
}

export interface ReadTargetVideoUnderstandingRequest {
  workspaceId: string
  editReferenceId: string
  studySessionId: string
  sourceStorageObjectRecordId: string
  sourceMediaAssetId: string
  expectedEditBriefRevision: number
  expectedEditBriefDigestSha256: string
}

export interface TargetVideoUnderstandingSchedule {
  scheduled: boolean
  alreadyActive: boolean
  runtime: 'backend_local_private' | 'blocked'
  stageCapability:
    | 'technical_only'
    | 'partial_specialist_pipeline'
    | 'full_specialist_pipeline'
    | 'blocked'
  technicalStagesComplete: boolean
  specialistPipelineAvailable: boolean
  waitingForSpecialistRuntime: boolean
  reason?:
    | 'worker_runtime_not_local'
    | 'storage_runtime_not_local'
    | 'canonical_worker_dispatch_not_verified'
    | 'specialist_runtime_not_connected'
}

export interface TargetVideoUnderstandingApiData {
  targetVideoUnderstandingPackage: TargetVideoUnderstandingPackage
  schedule: TargetVideoUnderstandingSchedule
  persistence:
    | 'backend_local_private_versioned'
    | 'canonical_v3_local_supabase_rls'
  replayed: boolean
  productReady: false
}
