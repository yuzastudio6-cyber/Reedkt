import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Request } from 'express'
import type { RuntimeEnv } from './config/env'
import type { StorageAdapter } from './storage/storage-types'
import type { EditReferenceStudyChatRuntimePort } from './services/edit-reference-study-chat-runtime-port'
import type { EditReferenceExactEditApplyRuntimePort } from './services/edit-reference-exact-edit-apply-runtime-port'
import type { EditReferenceApplicationPreparationRuntimePort } from './services/edit-reference-application-preparation-runtime-port'
import type {
  EditReferenceLongFormStudyRuntimePort,
  EditReferenceLongFormStudyRuntimePortFactory,
} from './services/edit-reference-production-long-form-runtime-port'
import type { EditReferenceDomainRepositoryRuntimePort } from './services/edit-reference-domain-repository-runtime-port'
import type { EditReferenceSignedInPrivateMediaRuntimePort } from './services/edit-reference-signed-in-private-media-runtime-port'
import type { EditReferenceExactEditBriefRuntimePortFactory } from './services/edit-reference-exact-edit-brief-runtime-port'
import type {
  EditReferenceTargetUnderstandingPackageRuntimePortFactory,
} from './services/edit-reference-target-understanding-package-runtime-port'
import type { PlanningPreferenceApplicationAuthorityPort } from './services/planning-preference-application-authority-port'
import type { CanonicalMotionStudioAudioCandidateReviewReaderPort } from './motion-studio/audio-production/canonical-audio-candidate-review-reader-port'
import type { CanonicalMotionStudioAudioSelectionTransitionPort } from './motion-studio/audio-acceptance/canonical-audio-selection-transition-port'
import type { CanonicalMotionStudioStorytellingProductionAuthorityReaderPort } from './services/canonical-motion-studio-storytelling-production-authority-service'
import type { CanonicalVisualCalibrationReferenceFrameReaderPort } from './services/canonical-visual-calibration-reference-frame-reader-port'
import type { CanonicalProviderAttemptRuntimeRecordSourcePort } from './services/canonical-provider-attempt-runtime-record-port'
import type {
  VisualIntelligenceReportRepository,
} from './visual-intelligence/visual-intelligence-lifecycle-service'
import type {
  VisualIntelligenceOrchestraJobRuntime,
} from './visual-intelligence/visual-intelligence-orchestra-job-runtime'
import type {
  EditReferenceVisualIntelligenceBindingStore,
  EditReferenceVisualIntelligenceOrchestraReadPort,
} from './edit-references/edit-reference-visual-intelligence-result-bridge'
import type { PlanningExactEditPreferenceAuthorityPort } from './services/planning-exact-edit-preference-authority-port'
import type {
  CanonicalDurableUploadTargetTransactionAdapter,
  CanonicalUploadTargetCredentialEscrow,
} from './upload-target-authority/canonical-durable-upload-target-authority'
import type {
  CanonicalDurableUploadTargetRequestAuthorityFactory,
} from './upload-target-authority/canonical-durable-upload-target-request-factory'
import type {
  CanonicalPrivateProjectRequestAuthorityFactory,
} from './project-authority/canonical-private-project-request-authority'
import type {
  MotionStudioCommandRepositoryRuntimePort,
} from './motion-studio/commands/runtime-port'
import type {
  EditBriefPrivateWorkspaceRuntimePort,
} from './services/edit-brief-private-workspace-runtime-port'
import type {
  SourceLedChatAssistantPort,
} from './services/source-led-chat-assistant'
import type {
  CanonicalSourceCleanupAuthorityReadPort,
} from './services/canonical-source-cleanup-authority-repository'
import type {
  CanonicalSourceVisualIntelligenceOrchestraReadPort,
} from './services/canonical-source-visual-intelligence-orchestra-result-bridge'
import type {
  CanonicalSourceLedOrchestraPlanningReconciliationPort,
} from './services/canonical-source-led-orchestra-planning-reconciliation'
import type {
  CanonicalTrackAllSam31AuthenticatedGpuStartRuntimePort,
} from './services/canonical-track-all-sam3_1-authenticated-gpu-start-service'
import type {
  CanonicalTrackAllSam31CaptionEvidenceFinalizationRuntimePort,
} from './services/canonical-track-all-sam3_1-caption-evidence-finalization-service'
import type {
  CanonicalCaptionPostrenderVisualQaEvidenceRepository,
} from './services/canonical-caption-postrender-visual-qa-evidence-service'
import type {
  CanonicalCaptionPostrenderVisualQaOwnerResultReadPort,
} from './services/canonical-caption-postrender-visual-qa-owner-result-port'
import type {
  CanonicalTrackAllSam31TaskQaEvidenceFinalizationRuntimePort,
} from './services/canonical-track-all-sam3_1-task-qa-evidence-finalization-service'
import type {
  CanonicalTrackAllSam31L4TaskQaAuthenticatedStartRuntimePort,
} from './services/canonical-track-all-sam3_1-l4-task-qa-authenticated-start-service'

export interface AuthContext {
  userId: string
  email?: string
  accessToken?: string
  isMockUser: boolean
  user?: User
}

export interface IdempotencyContext {
  key: string
  requestHash: string
  workspaceId: string
  replayed: boolean
}

export type ProjectAccessRole = 'viewer' | 'editor' | 'admin' | 'owner'

export interface ProjectAccessContext {
  workspaceId: string
  projectId: string
  editSessionId?: string
  briefId?: string
  markerId?: string
  role: ProjectAccessRole
  canRead: boolean
  canWrite: boolean
  canAdmin: boolean
  isMockAccess: boolean
}

export interface RequestContext {
  requestId: string
  auth?: AuthContext
  idempotency?: IdempotencyContext
  projectAccess?: ProjectAccessContext
}

export interface RuntimeClients {
  admin: SupabaseClient | null
  public: SupabaseClient | null
}

export interface RuntimeState {
  env: RuntimeEnv
  clients: RuntimeClients
  storageAdapter?: StorageAdapter
  planningPreferenceApplicationAuthorityPort?: PlanningPreferenceApplicationAuthorityPort
  planningExactEditPreferenceAuthorityPort?: PlanningExactEditPreferenceAuthorityPort
  canonicalDurableUploadTargetStatePort?: CanonicalDurableUploadTargetTransactionAdapter
  canonicalUploadTargetCredentialEscrow?: CanonicalUploadTargetCredentialEscrow
  canonicalDurableUploadTargetRequestAuthorityFactory?:
    CanonicalDurableUploadTargetRequestAuthorityFactory
  canonicalPrivateProjectRequestAuthorityFactory?:
    CanonicalPrivateProjectRequestAuthorityFactory
  editReferenceStudyChatRuntimePort?: EditReferenceStudyChatRuntimePort
  canonicalMotionStudioStorytellingProductionAuthorityReaderPort?:
    CanonicalMotionStudioStorytellingProductionAuthorityReaderPort
  canonicalMotionStudioAudioCandidateReviewReaderPort?:
    CanonicalMotionStudioAudioCandidateReviewReaderPort
  canonicalMotionStudioAudioSelectionTransitionPort?:
    CanonicalMotionStudioAudioSelectionTransitionPort
  canonicalVisualCalibrationReferenceFrameReaderPort?:
    CanonicalVisualCalibrationReferenceFrameReaderPort
  canonicalProviderAttemptRuntimeRecordSourcePort?:
    CanonicalProviderAttemptRuntimeRecordSourcePort
  visualIntelligenceReportRepository?: VisualIntelligenceReportRepository
  visualIntelligenceOrchestraJobRuntimePort?:
    VisualIntelligenceOrchestraJobRuntime
  editReferenceVisualIntelligenceBindingStore?:
    EditReferenceVisualIntelligenceBindingStore
  editReferenceVisualIntelligenceReadPort?:
    EditReferenceVisualIntelligenceOrchestraReadPort
  motionStudioCommandRepositoryRuntimePort?:
    MotionStudioCommandRepositoryRuntimePort
  editReferenceExactEditApplyRuntimePort?: EditReferenceExactEditApplyRuntimePort
  editReferenceApplicationPreparationRuntimePort?: EditReferenceApplicationPreparationRuntimePort
  editReferenceLongFormStudyRuntimePort?: EditReferenceLongFormStudyRuntimePort
  editReferenceLongFormStudyRuntimePortFactory?: EditReferenceLongFormStudyRuntimePortFactory
  editReferenceDomainRepositoryRuntimePort?: EditReferenceDomainRepositoryRuntimePort
  editReferenceSignedInPrivateMediaRuntimePort?: EditReferenceSignedInPrivateMediaRuntimePort
  editReferenceExactEditBriefRuntimePortFactory?: EditReferenceExactEditBriefRuntimePortFactory
  editReferenceTargetUnderstandingPackageRuntimePortFactory?:
    EditReferenceTargetUnderstandingPackageRuntimePortFactory
  editBriefPrivateWorkspaceRuntimePort?: EditBriefPrivateWorkspaceRuntimePort
  kimiK3SourceLedChatAssistantPort?: SourceLedChatAssistantPort
  canonicalSourceCleanupAuthorityReadPort?:
    CanonicalSourceCleanupAuthorityReadPort
  canonicalSourceVisualIntelligenceOrchestraReadPort?:
    CanonicalSourceVisualIntelligenceOrchestraReadPort
  canonicalSourceLedOrchestraPlanningReconciliationPort?:
    CanonicalSourceLedOrchestraPlanningReconciliationPort
  trackAllSam31AuthenticatedGpuStartRuntimePort?:
    CanonicalTrackAllSam31AuthenticatedGpuStartRuntimePort
  trackAllSam31L4TaskQaAuthenticatedStartRuntimePort?:
    CanonicalTrackAllSam31L4TaskQaAuthenticatedStartRuntimePort
  trackAllSam31CaptionEvidenceFinalizationRuntimePort?:
    CanonicalTrackAllSam31CaptionEvidenceFinalizationRuntimePort
  trackAllSam31TaskQaEvidenceFinalizationRuntimePort?:
    CanonicalTrackAllSam31TaskQaEvidenceFinalizationRuntimePort
  canonicalCaptionPostrenderVisualQaEvidenceRepository?:
    CanonicalCaptionPostrenderVisualQaEvidenceRepository
  canonicalCaptionPostrenderVisualQaOwnerResultReadPort?:
    CanonicalCaptionPostrenderVisualQaOwnerResultReadPort
}

export type RuntimeRequest = Request & {
  context?: RequestContext
  runtime?: RuntimeState
}

export interface RouteHandlerResult<T = unknown> {
  ok: true
  data: T
  warnings?: string[]
  mockOnly?: boolean
}

export interface ServiceContext {
  env: RuntimeEnv
  clients: RuntimeClients
  requestId: string
  auth?: AuthContext
  idempotency?: IdempotencyContext
  storageAdapter?: StorageAdapter
  planningPreferenceApplicationAuthorityPort?: PlanningPreferenceApplicationAuthorityPort
  planningExactEditPreferenceAuthorityPort?: PlanningExactEditPreferenceAuthorityPort
  canonicalDurableUploadTargetStatePort?: CanonicalDurableUploadTargetTransactionAdapter
  canonicalUploadTargetCredentialEscrow?: CanonicalUploadTargetCredentialEscrow
  canonicalDurableUploadTargetRequestAuthorityFactory?:
    CanonicalDurableUploadTargetRequestAuthorityFactory
  canonicalPrivateProjectRequestAuthorityFactory?:
    CanonicalPrivateProjectRequestAuthorityFactory
  editReferenceStudyChatRuntimePort?: EditReferenceStudyChatRuntimePort
  canonicalMotionStudioStorytellingProductionAuthorityReaderPort?:
    CanonicalMotionStudioStorytellingProductionAuthorityReaderPort
  canonicalMotionStudioAudioCandidateReviewReaderPort?:
    CanonicalMotionStudioAudioCandidateReviewReaderPort
  canonicalMotionStudioAudioSelectionTransitionPort?:
    CanonicalMotionStudioAudioSelectionTransitionPort
  canonicalVisualCalibrationReferenceFrameReaderPort?:
    CanonicalVisualCalibrationReferenceFrameReaderPort
  canonicalProviderAttemptRuntimeRecordSourcePort?:
    CanonicalProviderAttemptRuntimeRecordSourcePort
  visualIntelligenceReportRepository?: VisualIntelligenceReportRepository
  visualIntelligenceOrchestraJobRuntimePort?:
    VisualIntelligenceOrchestraJobRuntime
  editReferenceVisualIntelligenceBindingStore?:
    EditReferenceVisualIntelligenceBindingStore
  editReferenceVisualIntelligenceReadPort?:
    EditReferenceVisualIntelligenceOrchestraReadPort
  motionStudioCommandRepositoryRuntimePort?:
    MotionStudioCommandRepositoryRuntimePort
  editReferenceExactEditApplyRuntimePort?: EditReferenceExactEditApplyRuntimePort
  editReferenceApplicationPreparationRuntimePort?: EditReferenceApplicationPreparationRuntimePort
  editReferenceLongFormStudyRuntimePort?: EditReferenceLongFormStudyRuntimePort
  editReferenceLongFormStudyRuntimePortFactory?: EditReferenceLongFormStudyRuntimePortFactory
  editReferenceDomainRepositoryRuntimePort?: EditReferenceDomainRepositoryRuntimePort
  editReferenceSignedInPrivateMediaRuntimePort?: EditReferenceSignedInPrivateMediaRuntimePort
  editReferenceExactEditBriefRuntimePortFactory?: EditReferenceExactEditBriefRuntimePortFactory
  editReferenceTargetUnderstandingPackageRuntimePortFactory?:
    EditReferenceTargetUnderstandingPackageRuntimePortFactory
  editBriefPrivateWorkspaceRuntimePort?: EditBriefPrivateWorkspaceRuntimePort
  kimiK3SourceLedChatAssistantPort?: SourceLedChatAssistantPort
  canonicalSourceCleanupAuthorityReadPort?:
    CanonicalSourceCleanupAuthorityReadPort
  canonicalSourceVisualIntelligenceOrchestraReadPort?:
    CanonicalSourceVisualIntelligenceOrchestraReadPort
  canonicalSourceLedOrchestraPlanningReconciliationPort?:
    CanonicalSourceLedOrchestraPlanningReconciliationPort
  trackAllSam31AuthenticatedGpuStartRuntimePort?:
    CanonicalTrackAllSam31AuthenticatedGpuStartRuntimePort
  trackAllSam31L4TaskQaAuthenticatedStartRuntimePort?:
    CanonicalTrackAllSam31L4TaskQaAuthenticatedStartRuntimePort
  trackAllSam31CaptionEvidenceFinalizationRuntimePort?:
    CanonicalTrackAllSam31CaptionEvidenceFinalizationRuntimePort
  trackAllSam31TaskQaEvidenceFinalizationRuntimePort?:
    CanonicalTrackAllSam31TaskQaEvidenceFinalizationRuntimePort
  canonicalCaptionPostrenderVisualQaEvidenceRepository?:
    CanonicalCaptionPostrenderVisualQaEvidenceRepository
  canonicalCaptionPostrenderVisualQaOwnerResultReadPort?:
    CanonicalCaptionPostrenderVisualQaOwnerResultReadPort
}
