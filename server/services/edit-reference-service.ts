import { createHash, randomUUID } from 'node:crypto'
import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import type {
  ApproveEditReferenceDNAVersionRequest,
  AppendPreferenceStudyMessageRequest,
  ClearPreferenceApplicationRequest,
  ConnectPreferenceApplicationRequest,
  CreatePreferenceApplicationRequest,
  CreatePreferenceEvidenceRequest,
  CreateEditReferenceRequest,
  CreatePreferenceStudyRequest,
  EditReferenceDetail,
  EditReferenceDetailData,
  EditReferenceListData,
  EditReferenceListItem,
  EditReferenceRecord,
  EditReferenceStudyChatReasoningStatus,
  PreferenceApplicationListData,
  PreferenceApplicationTargetContextSnapshot,
  PreferenceAssetRecord,
  PreferenceEvidenceCategory,
  PreferenceEvidenceMediaMetadata,
  PreferenceEvidenceRecord,
  PreferenceEvidenceTransferability,
  PreferenceLongFormStudySummary,
  PreferenceStudyMessageRecord,
  PreferenceStudyData,
  PreferenceStudyMessageListData,
  PreferenceStudySessionRecord,
  PreferenceDNAVersionRecord,
  RunEditReferenceDNAQARequest,
  RunPreferenceEvidenceStudyRequest,
  ControlEditReferenceLongFormStudyRequest,
  StartEditReferenceLongFormStudyRequest,
  EditReferenceLongFormStudyControlData,
  EditReferenceLongFormStudyStatusData,
  SynthesizePreferenceDNARequest,
  UpdateEditReferenceRequest,
  UpdatePreferenceStudyRequest,
} from '../../src/types/edit-reference'
import type { TargetVideoUnderstandingPackage } from '../../src/types/edit-reference-target-video-understanding'
import type {
  ApplyEditReferenceLongFormStudyReviewRequest,
  EditReferenceLongFormStudyReviewData,
  EditReferenceLongFormStudyReviewDecision,
  EditReferenceLongFormStudyReviewPackage,
  EditReferenceLongFormStudyReviewSelectionSummary,
  EditReferenceLongFormStudyReviewSelectionData,
} from '../../src/types/edit-reference-long-form-review'
import {
  EDIT_REFERENCE_LONG_FORM_STUDY_REVIEW_DECISION_VERSION,
} from '../../src/types/edit-reference-long-form-review'
import { EDIT_REFERENCE_SAFETY_FLAGS } from '../../src/types/edit-reference'
import type {
  EditReferenceAggregate,
  EditReferenceMutationResult,
  EditReferenceMutationReplayContext,
  EditReferenceRepository,
  EditReferenceRepositoryScope,
} from '../edit-references/edit-reference-repository'
import {
  EDIT_REFERENCE_STUDY_CHAT_REASONING_ATTEMPT_VERSION,
  type CancelEditReferenceStudyChatReasoningAttemptInput,
  type EditReferenceStudyChatReasoningAttemptRecord,
  type EditReferenceStudyChatReasoningExecutionData,
  type EditReferenceStudyChatReasoningReservationData,
  type ReserveEditReferenceStudyChatReasoningAttemptInput,
  type SettleEditReferenceStudyChatReasoningAttemptInput,
  type StartEditReferenceStudyChatReasoningAttemptInput,
} from '../edit-references/edit-reference-study-chat-reasoning-attempt-contract'
import {
  hashEditReferenceStudyChatReasoningRequest,
  validateEditReferenceStudyChatReasoningRequest,
  validateEditReferenceStudyChatReasoningResult,
  type EditReferenceStudyChatReasoningResult,
} from '../edit-references/edit-reference-study-chat-reasoning-contract'
import {
  EDIT_REFERENCE_STUDY_CHAT_PROVIDER_REQUEST_VERSION,
  hashEditReferenceStudyChatProviderObservation,
  hashEditReferenceStudyChatProviderSubmissionKey,
  validateAuthorizeEditReferenceStudyChatProviderSubmissionInput,
  validateReconcileEditReferenceStudyChatProviderRequestInput,
  validateReserveEditReferenceStudyChatProviderRequestInput,
  type AuthorizeEditReferenceStudyChatProviderSubmissionInput,
  type EditReferenceStudyChatProviderReconciliationData,
  type EditReferenceStudyChatProviderRequestRecord,
  type EditReferenceStudyChatProviderRequestReservationData,
  type EditReferenceStudyChatProviderSubmissionAuthorizationData,
  type ReconcileEditReferenceStudyChatProviderRequestInput,
  type ReserveEditReferenceStudyChatProviderRequestInput,
} from '../edit-references/edit-reference-study-chat-provider-request-contract'
import {
  EDIT_REFERENCE_STUDY_CHAT_PROVIDER_CHECKBACK_VERSION,
  deriveEditReferenceStudyChatProviderCheckbackLeaseToken,
  hashEditReferenceStudyChatProviderCheckbackLeaseToken,
  validateClaimEditReferenceStudyChatProviderCheckbackInput,
  validateResumeEditReferenceStudyChatProviderCheckbackInput,
  validateScheduleEditReferenceStudyChatProviderCheckbackInput,
  validateSettleEditReferenceStudyChatProviderCheckbackInput,
  validateStopEditReferenceStudyChatProviderCheckbackInput,
  type ClaimEditReferenceStudyChatProviderCheckbackInput,
  type EditReferenceStudyChatProviderCheckbackClaimData,
  type EditReferenceStudyChatProviderCheckbackControlData,
  type EditReferenceStudyChatProviderCheckbackRecord,
  type EditReferenceStudyChatProviderCheckbackScheduleData,
  type EditReferenceStudyChatProviderCheckbackSettlementData,
  type ResumeEditReferenceStudyChatProviderCheckbackInput,
  type ScheduleEditReferenceStudyChatProviderCheckbackInput,
  type SettleEditReferenceStudyChatProviderCheckbackInput,
  type StopEditReferenceStudyChatProviderCheckbackInput,
} from '../edit-references/edit-reference-study-chat-provider-checkback-contract'
import {
  EDIT_REFERENCE_STUDY_CHAT_INTERNAL_COST_AUTHORITY_VERSION,
  calculateEditReferenceStudyChatInternalCostMicros,
  hashEditReferenceStudyChatInternalCostAuthorization,
  hashEditReferenceStudyChatRateCardSnapshot,
  validateBindEditReferenceStudyChatInternalCostProviderRequestInput,
  validateEditReferenceStudyChatInternalCostAuthorityRecord,
  validateEditReferenceStudyChatProviderUsageMeasurement,
  validateRegisterEditReferenceStudyChatInternalCostAuthorityInput,
  type AuthorizeEditReferenceStudyChatInternalCostInput,
  type BindEditReferenceStudyChatInternalCostProviderRequestInput,
  type EditReferenceStudyChatImmutableRateCardSnapshot,
  type EditReferenceStudyChatInternalCostAuthorizationData,
  type EditReferenceStudyChatInternalCostAuthorityRecord,
  type EditReferenceStudyChatInternalCostProviderBindingData,
  type EditReferenceStudyChatInternalCostSettlementData,
  type RegisterEditReferenceStudyChatInternalCostAuthorityInput,
  type SettleEditReferenceStudyChatInternalCostInput,
} from '../edit-references/edit-reference-study-chat-internal-cost-authority-contract'
import {
  validateEditReferenceStudyChatProviderIdentity,
  validateEditReferenceStudyChatProviderTransportObservation,
} from '../edit-references/edit-reference-study-chat-provider-transport-contract'
import {
  EDIT_REFERENCE_STUDY_CHAT_PROVIDER_WORKFLOW_VERSION,
  deriveEditReferenceStudyChatProviderWorkflowLeaseToken,
  hashEditReferenceStudyChatProviderWorkflowLeaseToken,
  validateClaimEditReferenceStudyChatProviderWorkflowInput,
  validateHeartbeatEditReferenceStudyChatProviderWorkflowInput,
  validateRecordEditReferenceStudyChatProviderCallbackWakeInput,
  validateRegisterEditReferenceStudyChatProviderWorkflowInput,
  validateResumeEditReferenceStudyChatProviderWorkflowInput,
  validateSettleEditReferenceStudyChatProviderWorkflowInput,
  validateStopEditReferenceStudyChatProviderWorkflowInput,
  type ClaimEditReferenceStudyChatProviderWorkflowInput,
  type EditReferenceStudyChatProviderCallbackWakeData,
  type EditReferenceStudyChatProviderWorkflowClaimData,
  type EditReferenceStudyChatProviderWorkflowControlData,
  type EditReferenceStudyChatProviderWorkflowHeartbeatData,
  type EditReferenceStudyChatProviderWorkflowRecord,
  type EditReferenceStudyChatProviderWorkflowRegistrationData,
  type EditReferenceStudyChatProviderWorkflowSettlementData,
  type HeartbeatEditReferenceStudyChatProviderWorkflowInput,
  type RecordEditReferenceStudyChatProviderCallbackWakeInput,
  type RegisterEditReferenceStudyChatProviderWorkflowInput,
  type ResumeEditReferenceStudyChatProviderWorkflowInput,
  type SettleEditReferenceStudyChatProviderWorkflowInput,
  type StopEditReferenceStudyChatProviderWorkflowInput,
} from '../edit-references/edit-reference-study-chat-provider-workflow-contract'
import { hashEditReferenceStudyChatStructuredContext } from '../edit-references/edit-reference-qwen-study-chat-adapter'
import {
  EDIT_REFERENCE_PREFERENCE_DNA_REASONING_ATTEMPT_VERSION,
  hashEditReferencePreferenceDnaReasoningResult,
  type CancelEditReferencePreferenceDnaReasoningAttemptInput,
  type EditReferencePreferenceDnaReasoningAttemptExecutionData,
  type EditReferencePreferenceDnaReasoningAttemptRecord,
  type EditReferencePreferenceDnaReasoningAttemptReservationData,
  type ReserveEditReferencePreferenceDnaReasoningAttemptInput,
  type SettleEditReferencePreferenceDnaReasoningAttemptInput,
  type StartEditReferencePreferenceDnaReasoningAttemptInput,
} from '../edit-references/edit-reference-preference-dna-reasoning-attempt-contract'
import {
  hashEditReferencePreferenceDnaReasoningRequest,
  validateEditReferencePreferenceDnaReasoningRequest,
  validateEditReferencePreferenceDnaReasoningResult,
} from '../edit-references/edit-reference-preference-dna-reasoning-contract'
import { hashEditReferencePreferenceDnaStructuredContext } from '../edit-references/edit-reference-qwen-preference-dna-adapter'
import { hashEditReferenceRequest } from '../edit-references/private-edit-reference-repository'
import { orchestratePreferenceEvidenceStudy } from '../edit-references/edit-reference-evidence-orchestrator'
import {
  createBlockedEditReferenceMediaStudy,
  runEditReferenceLocalMediaStudy,
  type EditReferenceCaptionDesignOcrAuthorityResolver,
  type EditReferenceCaptionDesignProductionAuthority,
  type EditReferenceAudioSoundDesignRuntimeInput,
  type EditReferenceAudioSoundDesignProductionAuthority,
  type EditReferenceColorTreatmentProductionAuthority,
  type EditReferenceColorTreatmentRuntimeInput,
  type EditReferenceGraphicsMotionProductionAuthority,
  type EditReferenceGraphicsMotionRuntimeInput,
  type EditReferenceLocalMediaStudyResult,
  type EditReferenceSpeechPacingProductionAuthority,
  type EditReferenceSpeechPacingTranscriptAuthorityResolver,
  type EditReferenceStoryEditorialEvidenceAuthorityResolver,
  type EditReferenceStoryEditorialProductionAuthority,
  type EditReferenceVisualLanguageRuntimeInput,
  type EditReferenceVisualLanguageProductionAuthority,
} from '../edit-references/edit-reference-media-study'
import {
  EDIT_REFERENCE_LONG_FORM_STUDY_POLICY_VERSION,
  createEditReferenceLongFormStudyPlan,
  createEditReferenceLongFormStudyRun,
  validateRunAgainstPlan,
  type EditReferenceLongFormStudyPlan,
  type EditReferenceLongFormStudyRunRecord,
} from '../edit-references/edit-reference-long-form-study-contract'
import {
  assertPreferenceLongFormStudySummaryMatches,
  createPreferenceLongFormStudySummary,
  prepareEditReferenceLongFormStudyRun,
} from '../edit-references/edit-reference-long-form-study-binding'
import { PrivateEditReferenceLongFormStudyRepository } from '../edit-references/private-edit-reference-long-form-study-repository'
import {
  createEditReferenceLongFormSemanticWindowPlan,
} from '../edit-references/edit-reference-long-form-semantic-window-contract'
import {
  EDIT_REFERENCE_SEMANTIC_SPECIALISTS,
} from '../edit-references/edit-reference-semantic-study-contract'
import {
  createEditReferenceLongFormStudyReviewPackage,
  type EditReferenceLongFormStudyReviewChunkInput,
} from '../edit-references/edit-reference-long-form-review-package'
import { PrivateTargetVideoUnderstandingRepository } from '../edit-references/private-target-video-understanding-repository'
import {
  type EditReferenceLongFormStudyScheduler,
} from '../edit-references/edit-reference-long-form-study-scheduler'
import {
  inspectEditReferenceLongFormSource,
  type EditReferenceLongFormSourceInspector,
} from '../edit-references/edit-reference-long-form-source-inspector'
import { synthesizeEditReferencePreferenceDNA } from '../edit-references/edit-reference-dna-synthesis'
import { runEditReferenceDNAQA } from '../edit-references/edit-reference-dna-qa'
import {
  materializeEditReferencePreferenceDnaReasoningCandidate,
  type MaterializeEditReferencePreferenceDnaReasoningCandidateInput,
} from '../edit-references/edit-reference-preference-dna-candidate-materialization'
import {
  createEditReferencePreferenceDnaReasoningApprovalSnapshot,
  createEditReferencePreferenceDnaReasoningReviewSummary,
} from '../edit-references/edit-reference-preference-dna-approval'
import { createEditReferenceTargetApplication } from '../edit-references/edit-reference-target-adaptation'
import { recordPreferenceApplicationPlanInvalidation } from '../edit-references/edit-reference-plan-invalidation-registry'
import { createPreferenceApplicationDownstreamContext } from '../../src/lib/edit-reference-downstream-context'
import { createUploadService } from './upload-service'
import {
  buildEditReferenceStudyChatStructuredContext,
  prepareEditReferenceStudyChatReasoning,
  type EditReferenceStudyChatReasoningServiceInput,
  type PreparedEditReferenceStudyChatReasoning,
} from './edit-reference-study-chat-reasoning-service'
import { buildEditReferencePreferenceDnaStructuredContext } from './edit-reference-preference-dna-reasoning-service'
import {
  resolveEditReferenceLongFormStudyRuntimePort,
  type EditReferenceLongFormStudyRuntimePort,
} from './edit-reference-production-long-form-runtime-port'
import { instrumentEditReferenceService } from './edit-reference-observability-service'
import type { EditReferenceObservabilitySink } from '../edit-references/edit-reference-observability-contract'
import {
  createQwenVisualUnderstandingProvider,
  type QwenVisualUnderstandingProvider,
} from './qwen-visual-understanding-provider'
import {
  createQwenStoryEditorialReasoningProvider,
  type QwenStoryEditorialReasoningProvider,
} from './qwen-story-editorial-provider'
import {
  createQwenSpeechPacingReasoningProvider,
  type QwenSpeechPacingReasoningProvider,
} from './qwen-speech-pacing-provider'
import {
  createUnavailableEditReferenceAudioSoundDesignProvider,
  type EditReferenceAudioSoundDesignProvider,
} from './edit-reference-audio-sound-design-provider'
import {
  type EditReferenceApprovedHistoryReader,
} from './edit-reference-approved-history-reader'
import { createUnavailableEditReferenceApprovedHistoryReader } from './edit-reference-approved-history-reader'
import {
  createEditReferencePreviousApprovedEditAdapter,
  type EditReferencePreviousApprovedEditStudyAdapter,
} from '../edit-references/edit-reference-previous-approved-edit-adapter'
import {
  EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_STUDY_REQUEST_VERSION,
  createBlockedEditReferencePreviousApprovedEditStudyResult,
  type EditReferencePreviousApprovedEditStudyLayer,
  type EditReferencePreviousApprovedEditStudyResult,
} from '../edit-references/edit-reference-previous-approved-edit-study-contract'
import {
  PREFERENCE_APPLICATION_INTEGRATION_SAFETY_FLAGS,
  type PreferenceApplicationDownstreamInvalidationReceipt,
  type PreferenceApplicationInvalidationReason,
} from '../../src/types/edit-reference-integration'
import {
  editReferenceDomainRepositoryRuntimeWarnings,
  resolveEditReferenceDomainRepositoryRuntimePort,
  type EditReferenceDomainRepositoryRuntimePort,
} from './edit-reference-domain-repository-runtime-port'
import {
  EDIT_REFERENCE_DOMAIN_COMMAND_CONTRACT_VERSION,
  type EditReferencePreparedDnaApprovalCommandResult,
  type EditReferencePreparedDnaQaCommandResult,
  type EditReferencePreparedDnaSynthesisCommandResult,
  type EditReferencePreparedEvidenceStudyCommandResult,
} from '../edit-references/edit-reference-domain-command-contract'

export interface EditReferenceServiceResult<T> {
  data: T
  warnings: string[]
  replayed?: boolean
}

export interface EditReferenceServiceRuntimeOptions {
  readonly observabilitySink?: EditReferenceObservabilitySink
  readonly visualLanguageProvider?: QwenVisualUnderstandingProvider
  readonly visualLanguageProductionAuthority?: EditReferenceVisualLanguageProductionAuthority
  readonly reviewedLocalVisualLanguageRuntime?: EditReferenceReviewedLocalVisualLanguageRuntimeOptions
  readonly colorTreatmentProductionAuthority?: EditReferenceColorTreatmentProductionAuthority
  readonly reviewedLocalColorTreatmentRuntime?: EditReferenceReviewedLocalColorTreatmentRuntimeOptions
  readonly graphicsMotionProductionAuthority?: EditReferenceGraphicsMotionProductionAuthority
  readonly reviewedLocalGraphicsMotionRuntime?: EditReferenceReviewedLocalGraphicsMotionRuntimeOptions
  readonly captionDesignOcrAuthorityResolver?: EditReferenceCaptionDesignOcrAuthorityResolver
  readonly captionDesignProductionAuthority?: EditReferenceCaptionDesignProductionAuthority
  readonly storyEditorialProvider?: QwenStoryEditorialReasoningProvider
  readonly storyEditorialEvidenceAuthorityResolver?: EditReferenceStoryEditorialEvidenceAuthorityResolver
  readonly storyEditorialProductionAuthority?: EditReferenceStoryEditorialProductionAuthority
  readonly speechPacingProvider?: QwenSpeechPacingReasoningProvider
  readonly speechPacingTranscriptAuthorityResolver?: EditReferenceSpeechPacingTranscriptAuthorityResolver
  readonly speechPacingProductionAuthority?: EditReferenceSpeechPacingProductionAuthority
  readonly audioSoundDesignProvider?: EditReferenceAudioSoundDesignProvider
  readonly audioSoundDesignProductionAuthority?: EditReferenceAudioSoundDesignProductionAuthority
  readonly reviewedLocalAudioSoundDesignRuntime?: EditReferenceReviewedLocalAudioSoundDesignRuntimeOptions
  readonly previousApprovedEditHistoryReader?: EditReferenceApprovedHistoryReader
  readonly domainRepositoryRuntimePort?: EditReferenceDomainRepositoryRuntimePort
  readonly longFormStudyRuntimePort?: EditReferenceLongFormStudyRuntimePort
  readonly longFormStudyRepository?: PrivateEditReferenceLongFormStudyRepository
  readonly longFormSourceInspector?: EditReferenceLongFormSourceInspector
  readonly longFormStudyScheduler?: EditReferenceLongFormStudyScheduler
  readonly targetVideoUnderstandingRepository?: PrivateTargetVideoUnderstandingRepository
}

export interface EditReferenceReviewedLocalVisualLanguageRuntimeOptions {
  readonly manifestPath: string
  readonly modelPath: string
  readonly pythonCommand: string
  readonly runnerScriptPath?: string
  readonly timeoutMs?: number
}

export type EditReferenceReviewedLocalColorTreatmentRuntimeOptions =
  EditReferenceReviewedLocalVisualLanguageRuntimeOptions

export type EditReferenceReviewedLocalGraphicsMotionRuntimeOptions =
  EditReferenceReviewedLocalVisualLanguageRuntimeOptions

export interface EditReferenceReviewedLocalAudioSoundDesignRuntimeOptions {
  readonly manifestPath: string
  readonly modelPath: string
  readonly pythonCommand: string
  readonly runnerScriptPath?: string
  readonly timeoutMs?: number
}

export interface EditReferenceService {
  listReferences(workspaceId: string): Promise<EditReferenceServiceResult<EditReferenceListData>>
  listApplications(workspaceId: string): Promise<EditReferenceServiceResult<PreferenceApplicationListData>>
  getReference(workspaceId: string, referenceId: string): Promise<EditReferenceServiceResult<EditReferenceDetailData>>
  getStudy(workspaceId: string, studyId: string): Promise<EditReferenceServiceResult<PreferenceStudyData>>
  listStudyMessages(workspaceId: string, studyId: string): Promise<EditReferenceServiceResult<PreferenceStudyMessageListData>>
  prepareStudyChatReasoning(workspaceId: string, input: EditReferenceStudyChatReasoningServiceInput): Promise<PreparedEditReferenceStudyChatReasoning>
  getStudyChatReasoningAttempt(workspaceId: string, attemptId: string): Promise<EditReferenceServiceResult<EditReferenceStudyChatReasoningAttemptRecord>>
  listStudyChatReasoningAttempts(workspaceId: string, studyId: string): Promise<EditReferenceServiceResult<EditReferenceStudyChatReasoningAttemptRecord[]>>
  getPreferenceDnaReasoningAttempt(workspaceId: string, attemptId: string): Promise<EditReferenceServiceResult<EditReferencePreferenceDnaReasoningAttemptRecord>>
  listPreferenceDnaReasoningAttempts(workspaceId: string, studyId: string): Promise<EditReferenceServiceResult<EditReferencePreferenceDnaReasoningAttemptRecord[]>>
  getStudyChatProviderRequest(workspaceId: string, providerRequestRecordId: string): Promise<EditReferenceServiceResult<EditReferenceStudyChatProviderRequestRecord>>
  getStudyChatProviderCheckback(workspaceId: string, checkbackId: string): Promise<EditReferenceServiceResult<EditReferenceStudyChatProviderCheckbackRecord>>
  getStudyChatProviderWorkflow(workspaceId: string, workflowId: string): Promise<EditReferenceServiceResult<EditReferenceStudyChatProviderWorkflowRecord>>
  getStudyChatInternalCostAuthority(workspaceId: string, authorityRecordId: string): Promise<EditReferenceServiceResult<EditReferenceStudyChatInternalCostAuthorityRecord>>
  registerStudyChatInternalCostAuthority(input: RegisterEditReferenceStudyChatInternalCostAuthorityInput, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceStudyChatInternalCostAuthorityRecord>>
  authorizeStudyChatInternalCost(input: AuthorizeEditReferenceStudyChatInternalCostInput, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceStudyChatInternalCostAuthorizationData>>
  bindStudyChatInternalCostProviderRequest(input: BindEditReferenceStudyChatInternalCostProviderRequestInput, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceStudyChatInternalCostProviderBindingData>>
  settleStudyChatInternalCost(input: SettleEditReferenceStudyChatInternalCostInput, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceStudyChatInternalCostSettlementData>>
  reserveStudyChatReasoningAttempt(input: ReserveEditReferenceStudyChatReasoningAttemptInput, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceStudyChatReasoningReservationData>>
  startStudyChatReasoningAttempt(attemptId: string, input: StartEditReferenceStudyChatReasoningAttemptInput, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceStudyChatReasoningExecutionData>>
  reserveStudyChatProviderRequest(attemptId: string, input: ReserveEditReferenceStudyChatProviderRequestInput, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceStudyChatProviderRequestReservationData>>
  authorizeStudyChatProviderSubmission(providerRequestRecordId: string, input: AuthorizeEditReferenceStudyChatProviderSubmissionInput, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceStudyChatProviderSubmissionAuthorizationData>>
  reconcileStudyChatProviderRequest(providerRequestRecordId: string, input: ReconcileEditReferenceStudyChatProviderRequestInput, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceStudyChatProviderReconciliationData>>
  scheduleStudyChatProviderCheckback(providerRequestRecordId: string, input: ScheduleEditReferenceStudyChatProviderCheckbackInput, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceStudyChatProviderCheckbackScheduleData>>
  claimStudyChatProviderCheckback(checkbackId: string, input: ClaimEditReferenceStudyChatProviderCheckbackInput, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceStudyChatProviderCheckbackClaimData>>
  settleStudyChatProviderCheckback(checkbackId: string, input: SettleEditReferenceStudyChatProviderCheckbackInput, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceStudyChatProviderCheckbackSettlementData>>
  stopStudyChatProviderCheckback(checkbackId: string, input: StopEditReferenceStudyChatProviderCheckbackInput, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceStudyChatProviderCheckbackControlData>>
  resumeStudyChatProviderCheckback(checkbackId: string, input: ResumeEditReferenceStudyChatProviderCheckbackInput, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceStudyChatProviderCheckbackControlData>>
  registerStudyChatProviderWorkflow(checkbackId: string, input: RegisterEditReferenceStudyChatProviderWorkflowInput, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceStudyChatProviderWorkflowRegistrationData>>
  claimStudyChatProviderWorkflow(workflowId: string, input: ClaimEditReferenceStudyChatProviderWorkflowInput, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceStudyChatProviderWorkflowClaimData>>
  heartbeatStudyChatProviderWorkflow(workflowId: string, input: HeartbeatEditReferenceStudyChatProviderWorkflowInput, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceStudyChatProviderWorkflowHeartbeatData>>
  recordStudyChatProviderCallbackWake(workflowId: string, input: RecordEditReferenceStudyChatProviderCallbackWakeInput, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceStudyChatProviderCallbackWakeData>>
  settleStudyChatProviderWorkflow(workflowId: string, input: SettleEditReferenceStudyChatProviderWorkflowInput, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceStudyChatProviderWorkflowSettlementData>>
  stopStudyChatProviderWorkflow(workflowId: string, input: StopEditReferenceStudyChatProviderWorkflowInput, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceStudyChatProviderWorkflowControlData>>
  resumeStudyChatProviderWorkflow(workflowId: string, input: ResumeEditReferenceStudyChatProviderWorkflowInput, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceStudyChatProviderWorkflowControlData>>
  settleStudyChatReasoningAttempt(attemptId: string, input: SettleEditReferenceStudyChatReasoningAttemptInput, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceStudyChatReasoningAttemptRecord>>
  cancelStudyChatReasoningAttempt(attemptId: string, input: CancelEditReferenceStudyChatReasoningAttemptInput, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceStudyChatReasoningAttemptRecord>>
  reservePreferenceDnaReasoningAttempt(input: ReserveEditReferencePreferenceDnaReasoningAttemptInput, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferencePreferenceDnaReasoningAttemptReservationData>>
  startPreferenceDnaReasoningAttempt(attemptId: string, input: StartEditReferencePreferenceDnaReasoningAttemptInput, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferencePreferenceDnaReasoningAttemptExecutionData>>
  settlePreferenceDnaReasoningAttempt(attemptId: string, input: SettleEditReferencePreferenceDnaReasoningAttemptInput, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferencePreferenceDnaReasoningAttemptRecord>>
  cancelPreferenceDnaReasoningAttempt(attemptId: string, input: CancelEditReferencePreferenceDnaReasoningAttemptInput, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferencePreferenceDnaReasoningAttemptRecord>>
  materializePreferenceDnaReasoningCandidate(attemptId: string, input: MaterializeEditReferencePreferenceDnaReasoningCandidateInput, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceDetailData>>
  createReference(input: CreateEditReferenceRequest, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceDetailData>>
  updateReference(referenceId: string, input: UpdateEditReferenceRequest, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceDetailData>>
  createStudy(referenceId: string, input: CreatePreferenceStudyRequest, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceDetailData>>
  updateStudy(studyId: string, input: UpdatePreferenceStudyRequest, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceDetailData>>
  appendMessage(studyId: string, input: AppendPreferenceStudyMessageRequest, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceDetailData & { appendedMessageIds: string[] }>>
  addEvidence(studyId: string, input: CreatePreferenceEvidenceRequest, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceDetailData>>
  startLongFormStudy(studyId: string, referenceAssetId: string, input: StartEditReferenceLongFormStudyRequest, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceLongFormStudyStatusData>>
  getLongFormStudy(workspaceId: string, studyId: string, referenceAssetId: string): Promise<EditReferenceServiceResult<EditReferenceLongFormStudyStatusData>>
  controlLongFormStudy(studyId: string, referenceAssetId: string, input: ControlEditReferenceLongFormStudyRequest, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceLongFormStudyControlData>>
  getLongFormStudyReview(workspaceId: string, studyId: string, referenceAssetId: string): Promise<EditReferenceServiceResult<EditReferenceLongFormStudyReviewData>>
  applyLongFormStudyReview(studyId: string, referenceAssetId: string, input: ApplyEditReferenceLongFormStudyReviewRequest, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceLongFormStudyReviewSelectionData>>
  runEvidenceStudy(studyId: string, input: RunPreferenceEvidenceStudyRequest, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceDetailData>>
  synthesizePreferenceDNA(studyId: string, input: SynthesizePreferenceDNARequest, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceDetailData>>
  runPreferenceDNAQA(studyId: string, dnaVersionId: string, input: RunEditReferenceDNAQARequest, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceDetailData>>
  approvePreferenceDNA(studyId: string, dnaVersionId: string, input: ApproveEditReferenceDNAVersionRequest, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceDetailData>>
  createPreferenceApplication(studyId: string, dnaVersionId: string, input: CreatePreferenceApplicationRequest, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceDetailData>>
  connectPreferenceApplication(applicationId: string, input: ConnectPreferenceApplicationRequest, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceDetailData>>
  clearPreferenceApplication(applicationId: string, input: ClearPreferenceApplicationRequest, idempotencyKey: string): Promise<EditReferenceServiceResult<EditReferenceDetailData>>
}

export function createEditReferenceService(
  context: ServiceContext,
  repositoryOverride?: EditReferenceRepository,
  runtimeOptions: EditReferenceServiceRuntimeOptions = {},
): EditReferenceService {
  const ownerUserId = context.auth?.userId
  if (!ownerUserId) throw new ApiError('AUTH_REQUIRED', 'Edit Reference requires an authenticated user.', 401)
  if (
    runtimeOptions.reviewedLocalVisualLanguageRuntime
    && runtimeOptions.visualLanguageProductionAuthority
  ) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Reviewed-local Visual Language study cannot be combined with paid-provider production authority.',
      500,
    )
  }
  if (
    runtimeOptions.reviewedLocalColorTreatmentRuntime
    && runtimeOptions.colorTreatmentProductionAuthority
  ) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Reviewed-local Color Treatment study cannot be combined with paid-provider production authority.',
      500,
    )
  }
  if (
    runtimeOptions.reviewedLocalGraphicsMotionRuntime
    && runtimeOptions.graphicsMotionProductionAuthority
  ) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Reviewed-local Graphics/Motion study cannot be combined with paid-provider production authority.',
      500,
    )
  }
  if (
    runtimeOptions.reviewedLocalAudioSoundDesignRuntime
    && (runtimeOptions.audioSoundDesignProvider || runtimeOptions.audioSoundDesignProductionAuthority)
  ) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Reviewed-local Audio/Sound Design study cannot be combined with another semantic-audio provider or paid-provider production authority.',
      500,
    )
  }

  if (
    runtimeOptions.domainRepositoryRuntimePort
    && context.editReferenceDomainRepositoryRuntimePort
    && runtimeOptions.domainRepositoryRuntimePort !== context.editReferenceDomainRepositoryRuntimePort
  ) {
    throw new ApiError(
      'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
      'Edit Reference received conflicting domain repository authorities.',
      503,
      {
        reason: 'multiple_domain_repository_authorities_configured',
        requiredGate: 'canonical_persistence',
        productionReady: false,
      },
    )
  }
  const domainRepositoryRuntime = resolveEditReferenceDomainRepositoryRuntimePort({
    context,
    runtimePort: runtimeOptions.domainRepositoryRuntimePort
      ?? context.editReferenceDomainRepositoryRuntimePort,
    localRepository: repositoryOverride,
  })
  const repository = domainRepositoryRuntime.repository
  const result = <T>(data: T, replayed?: boolean): EditReferenceServiceResult<T> => ({
    data,
    warnings: editReferenceDomainRepositoryRuntimeWarnings(domainRepositoryRuntime),
    ...(replayed === undefined ? {} : { replayed }),
  })
  const visualLanguageProvider = runtimeOptions.visualLanguageProvider
    ?? createQwenVisualUnderstandingProvider()
  const storyEditorialProvider = runtimeOptions.storyEditorialProvider
    ?? createQwenStoryEditorialReasoningProvider()
  const speechPacingProvider = runtimeOptions.speechPacingProvider
    ?? createQwenSpeechPacingReasoningProvider()
  const audioSoundDesignProvider = runtimeOptions.audioSoundDesignProvider
    ?? createUnavailableEditReferenceAudioSoundDesignProvider()
  const previousApprovedEditAdapter = createEditReferencePreviousApprovedEditAdapter({
    reader: runtimeOptions.previousApprovedEditHistoryReader
      ?? createUnavailableEditReferenceApprovedHistoryReader(),
  })
  if (
    runtimeOptions.longFormStudyRuntimePort
    && context.editReferenceLongFormStudyRuntimePort
    && runtimeOptions.longFormStudyRuntimePort !== context.editReferenceLongFormStudyRuntimePort
  ) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'The Edit Reference long-form runtime has conflicting server authorities.',
      503,
      {
        reason: 'multiple_long_form_runtime_authorities_configured',
        requiredGate: 'durable_long_form_study',
        productionReady: false,
      },
    )
  }
  const longFormStudyRuntime = resolveEditReferenceLongFormStudyRuntimePort({
    env: context.env,
    runtimePort: runtimeOptions.longFormStudyRuntimePort
      ?? context.editReferenceLongFormStudyRuntimePort,
    localRepository: runtimeOptions.longFormStudyRepository,
    localScheduler: runtimeOptions.longFormStudyScheduler,
  })
  const longFormSourceInspector = runtimeOptions.longFormSourceInspector
    ?? inspectEditReferenceLongFormSource
  const targetVideoUnderstandingRepository = runtimeOptions.targetVideoUnderstandingRepository
    ?? new PrivateTargetVideoUnderstandingRepository()
  const scope = (workspaceId: string): EditReferenceRepositoryScope => ({
    localStorageRoot: context.env.localStorageRoot,
    ownerUserId,
    workspaceId: requireWorkspaceId(workspaceId),
  })

  const service: EditReferenceService = {
    async listReferences(workspaceId) {
      const aggregate = await repository.read(scope(workspaceId))
      const references: EditReferenceListItem[] = aggregate
        ? aggregate.references
          .slice()
          .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
          .map((reference) => {
            const currentStudy = requireStudy(aggregate, reference.currentStudyId)
            return {
              reference,
              currentStudy,
              messageCount: aggregate.messages.filter((message) => message.studySessionId === currentStudy.id).length,
              applicationCount: aggregate.applications.filter((application) => application.editReferenceId === reference.id).length,
            }
          })
        : []
      return result({
        references,
        persistence: repository.persistence === 'canonical_supabase_transactional'
          ? 'canonical_supabase_transactional'
          : 'backend_local_private',
        productionPersistence: repository.persistence === 'canonical_supabase_transactional'
          ? 'canonical_transactional'
          : 'blocked_by_migration_baseline',
        safety: EDIT_REFERENCE_SAFETY_FLAGS,
      })
    },

    async listApplications(workspaceId) {
      const aggregate = await repository.read(scope(workspaceId))
      return result({
        applications: aggregate
          ? aggregate.applications.slice().sort((left, right) => right.createdAt.localeCompare(left.createdAt))
          : [],
        persistence: repository.persistence === 'canonical_supabase_transactional'
          ? 'canonical_supabase_transactional'
          : 'backend_local_private',
        productionPersistence: repository.persistence === 'canonical_supabase_transactional'
          ? 'canonical_transactional'
          : 'blocked_by_migration_baseline',
        safety: EDIT_REFERENCE_SAFETY_FLAGS,
      })
    },

    async getReference(workspaceId, referenceId) {
      const aggregate = await repository.read(scope(workspaceId))
      if (!aggregate) throw referenceNotFound(referenceId)
      return result(detailData(aggregate, requireReference(aggregate, referenceId)))
    },

    async getStudy(workspaceId, studyId) {
      const aggregate = await repository.read(scope(workspaceId))
      if (!aggregate) throw studyNotFound(studyId)
      const study = requireStudy(aggregate, studyId)
      return result({
        reference: requireReference(aggregate, study.editReferenceId),
        study,
        messages: studyMessages(aggregate, study.id),
        safety: EDIT_REFERENCE_SAFETY_FLAGS,
      })
    },

    async getLongFormStudy(workspaceId, studyId, referenceAssetId) {
      const aggregate = await repository.read(scope(workspaceId))
      if (!aggregate) throw studyNotFound(studyId)
      const study = requireStudy(aggregate, studyId)
      const reference = requireReference(aggregate, study.editReferenceId)
      const asset = requireReferenceVideoAsset(aggregate, study, referenceAssetId)
      if (!asset.longFormStudy) {
        throw new ApiError('LONG_FORM_STUDY_NOT_FOUND', 'This reference video does not have a durable study in progress.', 404)
      }
      const persisted = await longFormStudyRuntime.read({
        scope: scope(workspaceId),
        runId: asset.longFormStudy.runId,
      })
      if (!persisted) {
        throw new ApiError('LONG_FORM_STUDY_CHECKPOINT_MISSING', 'The durable study checkpoint is unavailable. ReEditPro kept the reference unchanged and requires recovery before continuing.', 409)
      }
      validateLongFormStudyIdentity({ reference, study, asset, plan: persisted.plan, run: persisted.run })
      const summary = createPreferenceLongFormStudySummary({
        referenceAssetId: asset.id,
        plan: persisted.plan,
        run: persisted.run,
      })
      const storage = (await createUploadService(context).getStorageObjectRecord(
        asset.storageObjectRecordId as string,
        workspaceId,
      )).storageObjectRecord
      longFormStudyRuntime.schedule({
        env: context.env,
        scope: scope(workspaceId),
        runId: summary.runId,
        storageObject: storage,
      })
      return result(longFormStudyStatusData(reference, study, asset, summary))
    },

    async getLongFormStudyReview(workspaceId, studyId, referenceAssetId) {
      const requestedScope = scope(workspaceId)
      const aggregate = await repository.read(requestedScope)
      if (!aggregate) throw studyNotFound(studyId)
      const authority = await loadLongFormStudyReviewAuthority({
        aggregate,
        studyId,
        referenceAssetId,
        scope: requestedScope,
        runtime: longFormStudyRuntime,
      })
      return result(longFormStudyReviewData(authority))
    },

    async applyLongFormStudyReview(studyId, referenceAssetId, input, idempotencyKey) {
      const normalized = normalizeApplyLongFormStudyReview(input)
      const requestedScope = scope(normalized.workspaceId)
      const key = requireIdempotencyKey(idempotencyKey)
      const currentAggregate = await repository.read(requestedScope)
      if (!currentAggregate) throw studyNotFound(studyId)
      const currentAuthority = await loadLongFormStudyReviewAuthority({
        aggregate: currentAggregate,
        studyId,
        referenceAssetId,
        scope: requestedScope,
        runtime: longFormStudyRuntime,
      })
      assertLongFormStudyReviewPackageDigest(
        currentAuthority.reviewPackage.packageDigestSha256,
        normalized.expectedReviewPackageDigestSha256,
      )
      const existingSelection = longFormStudyReviewSelection(
        currentAggregate,
        currentAuthority.reviewPackage,
      )
      if (existingSelection.status === 'selected') {
        if (!sameLongFormReviewDecisions(existingSelection.decisions, normalized.decisions)) {
          throw new ApiError(
            'VERSION_CONFLICT',
            'This study review was already saved. Start a new Preference Study before changing its decisions.',
            409,
          )
        }
        return result({
          review: longFormStudyReviewData({ ...currentAuthority, selection: existingSelection }),
          detail: detailData(currentAggregate, currentAuthority.reference),
        }, true)
      }

      const mutation = await repository.mutate({
        scope: requestedScope,
        operation: 'preference_study.long_form_review.apply',
        idempotencyKey: key,
        requestHash: hashEditReferenceRequest({ studyId, referenceAssetId, ...normalized }),
        replay: replayDetailData,
        mutate: async ({ aggregate, now, addAuditEvent }) => {
          const authority = await loadLongFormStudyReviewAuthority({
            aggregate,
            studyId,
            referenceAssetId,
            scope: requestedScope,
            runtime: longFormStudyRuntime,
          })
          assertActiveStudy(authority.reference, authority.study)
          assertRevision(authority.study.revision, normalized.expectedStudyRevision, 'Preference Study')
          assertLongFormStudyReviewPackageDigest(
            authority.reviewPackage.packageDigestSha256,
            normalized.expectedReviewPackageDigestSha256,
          )
          assertLongFormStudyReviewIsEditable(aggregate, authority.study)
          const selection = longFormStudyReviewSelection(aggregate, authority.reviewPackage)
          if (selection.status === 'selected') {
            throw new ApiError(
              'VERSION_CONFLICT',
              'This study review was saved by another request. Reload before continuing.',
              409,
            )
          }
          const sourceEvidence = requireLongFormStudySourceEvidence(
            aggregate,
            authority.reviewPackage.sourceEvidenceId,
            authority.study,
            authority.asset,
          )
          const orchestrationId = longFormStudyReviewOrchestrationId(
            authority.reviewPackage.packageDigestSha256,
          )
          const orchestration = orchestratePreferenceEvidenceStudy({
            orchestrationId,
            workspaceId: authority.reference.workspaceId,
            editReferenceId: authority.reference.id,
            study: authority.study,
            evidence: [sourceEvidence],
            longFormStudyReviewSelections: [{
              package: authority.reviewPackage,
              sourceEvidenceId: sourceEvidence.id,
              decisions: normalized.decisions,
              acknowledgeAdaptNotCopy: normalized.acknowledgeAdaptNotCopy,
              acknowledgeFactSafetyReview: normalized.acknowledgeFactSafetyReview,
            }],
            now,
          })
          aggregate.evidence.push(...orchestration.derivedEvidence)
          aggregate.skillRuns.push(...orchestration.skillRuns)
          authority.study.status = orchestration.studyStatus
          authority.study.evidenceStatus = orchestration.evidenceStatus
          authority.study.revision += 1
          authority.study.updatedAt = now
          authority.reference.evidenceStatus = orchestration.evidenceStatus
          authority.reference.updatedAt = now
          aggregate.messages.push(studyResultMessage(
            authority.reference,
            authority.study,
            orchestration.assistantMessage,
            now,
            nextSequence(aggregate, authority.study.id),
          ))
          aggregate.usageLogs.push(usageLog(authority.reference, 'evidence_study_completed', now))
          addAuditEvent({
            eventType: 'preference_long_form_review_selection_saved',
            editReferenceId: authority.reference.id,
            studySessionId: authority.study.id,
          })
          return detailData(aggregate, authority.reference)
        },
      })
      const storedAggregate = await repository.read(requestedScope)
      if (!storedAggregate) {
        throw new ApiError('INTERNAL_ERROR', 'The saved study review could not be read back.', 500)
      }
      const storedAuthority = await loadLongFormStudyReviewAuthority({
        aggregate: storedAggregate,
        studyId,
        referenceAssetId,
        scope: requestedScope,
        runtime: longFormStudyRuntime,
      })
      return result({
        review: longFormStudyReviewData(storedAuthority),
        detail: mutation.data,
      }, mutation.replayed)
    },

    async controlLongFormStudy(studyId, referenceAssetId, input, idempotencyKey) {
      const normalized = normalizeControlLongFormStudy(input)
      const key = requireIdempotencyKey(idempotencyKey)
      const currentAggregate = await repository.read(scope(normalized.workspaceId))
      if (!currentAggregate) throw studyNotFound(studyId)
      const currentStudy = requireStudy(currentAggregate, studyId)
      const currentReference = requireReference(currentAggregate, currentStudy.editReferenceId)
      assertActiveStudy(currentReference, currentStudy)
      const currentAsset = requireReferenceVideoAsset(currentAggregate, currentStudy, referenceAssetId)
      if (!currentAsset.longFormStudy) {
        throw new ApiError('LONG_FORM_STUDY_NOT_FOUND', 'This reference video does not have a durable study to control.', 404)
      }
      const requestedScope = scope(normalized.workspaceId)
      let controlled: Awaited<ReturnType<EditReferenceLongFormStudyRuntimePort['applyControlCommand']>>
      try {
        controlled = await longFormStudyRuntime.applyControlCommand({
          scope: requestedScope,
          runId: currentAsset.longFormStudy.runId,
          expectedRunRevision: normalized.expectedRunRevision,
          action: normalized.action,
          idempotencyKey: key,
          now: new Date().toISOString(),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : ''
        if (message.includes('revision_conflict')) {
          throw new ApiError('VERSION_CONFLICT', 'The study changed before this control was applied. Refresh its progress and try again.', 409)
        }
        if (message.includes('idempotency_conflict')) {
          throw new ApiError('IDEMPOTENCY_CONFLICT', 'This control key was already used for a different study action.', 409)
        }
        if (message.includes('transition_rejected')) {
          throw new ApiError('VALIDATION_FAILED', 'That action is no longer available for the study’s current state. Refresh its progress before continuing.', 409)
        }
        throw new ApiError('LONG_FORM_STUDY_CHECKPOINT_INVALID', 'The durable study control could not be verified. Completed checkpoints remain unchanged.', 409)
      }
      validateLongFormStudyIdentity({
        reference: currentReference,
        study: currentStudy,
        asset: currentAsset,
        plan: controlled.plan,
        run: controlled.run,
      })
      const summary = createPreferenceLongFormStudySummary({
        referenceAssetId: currentAsset.id,
        plan: controlled.plan,
        run: controlled.run,
      })
      const aggregateMutation = await repository.mutate({
        scope: requestedScope,
        operation: `preference_study.long_form_study.control.${normalized.action}`,
        idempotencyKey: key,
        requestHash: hashEditReferenceRequest({ studyId, referenceAssetId, ...normalized }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const study = requireStudy(aggregate, studyId)
          const reference = requireReference(aggregate, study.editReferenceId)
          const asset = requireReferenceVideoAsset(aggregate, study, referenceAssetId)
          if (asset.longFormStudy?.runId !== summary.runId) {
            throw new ApiError('LONG_FORM_STUDY_BINDING_CONFLICT', 'The selected reference changed before the study control was recorded.', 409)
          }
          asset.longFormStudy = structuredClone(summary)
          study.status = normalized.action === 'cancel' ? 'needs_user_review' : 'studying'
          study.revision += 1
          study.updatedAt = now
          reference.updatedAt = now
          aggregate.messages.push(longFormStudyControlMessage(
            reference,
            study,
            normalized.action,
            controlled.receipt.activeWorkFinishesBeforePause,
            controlled.receipt.recoveredWorkItemCount,
            now,
            nextSequence(aggregate, study.id),
          ))
          addAuditEvent({
            eventType: `preference_long_form_study_${normalized.action}`,
            editReferenceId: reference.id,
            studySessionId: study.id,
          })
          return detailData(aggregate, reference)
        },
      })

      if (['resume', 'recover'].includes(normalized.action)) {
        const storage = (await createUploadService(context).getStorageObjectRecord(
          currentAsset.storageObjectRecordId as string,
          normalized.workspaceId,
        )).storageObjectRecord
        longFormStudyRuntime.schedule({
          env: context.env,
          scope: requestedScope,
          runId: summary.runId,
          storageObject: storage,
        })
      }
      const latestAsset = aggregateMutation.data.detail.assets.find((asset) => asset.id === referenceAssetId)
      return {
        ...result({
          ...longFormStudyStatusData(
            aggregateMutation.data.detail.reference,
            aggregateMutation.data.detail.study,
            latestAsset ?? currentAsset,
            summary,
          ),
          control: {
            action: normalized.action,
            disposition: controlled.disposition,
            activeWorkFinishesBeforePause: controlled.receipt.activeWorkFinishesBeforePause,
            recoveredWorkItemCount: controlled.receipt.recoveredWorkItemCount,
            completedCheckpointsPreserved: true,
          },
        }, controlled.disposition === 'idempotent_replay' || aggregateMutation.replayed),
      }
    },

    async listStudyMessages(workspaceId, studyId) {
      const aggregate = await repository.read(scope(workspaceId))
      if (!aggregate) throw studyNotFound(studyId)
      requireStudy(aggregate, studyId)
      return result({ studyId, messages: studyMessages(aggregate, studyId), safety: EDIT_REFERENCE_SAFETY_FLAGS })
    },

    async prepareStudyChatReasoning(workspaceId, input) {
      const requestedScope = scope(workspaceId)
      const aggregate = await repository.read(requestedScope)
      return prepareEditReferenceStudyChatReasoning({
        aggregate,
        scope: requestedScope,
        input,
      })
    },

    async getStudyChatReasoningAttempt(workspaceId, attemptId) {
      const aggregate = await repository.read(scope(workspaceId))
      if (!aggregate) throw reasoningAttemptNotFound(attemptId)
      return result(structuredClone(requireReasoningAttempt(aggregate, attemptId)))
    },

    async listStudyChatReasoningAttempts(workspaceId, studyId) {
      const aggregate = await repository.read(scope(workspaceId))
      if (!aggregate) throw studyNotFound(studyId)
      requireStudy(aggregate, studyId)
      return result(aggregate.reasoningAttempts
        .filter((attempt) => attempt.studySessionId === studyId)
        .slice()
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id))
        .map((attempt) => structuredClone(attempt)))
    },

    async getPreferenceDnaReasoningAttempt(workspaceId, attemptId) {
      const aggregate = await repository.read(scope(workspaceId))
      if (!aggregate) throw preferenceDnaReasoningAttemptNotFound(attemptId)
      return result(structuredClone(requirePreferenceDnaReasoningAttempt(aggregate, attemptId)))
    },

    async listPreferenceDnaReasoningAttempts(workspaceId, studyId) {
      const aggregate = await repository.read(scope(workspaceId))
      if (!aggregate) throw studyNotFound(studyId)
      requireStudy(aggregate, studyId)
      return result(aggregate.preferenceDnaReasoningAttempts
        .filter((attempt) => attempt.studySessionId === studyId)
        .slice()
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id))
        .map((attempt) => structuredClone(attempt)))
    },

    async getStudyChatProviderRequest(workspaceId, providerRequestRecordId) {
      const aggregate = await repository.read(scope(workspaceId))
      if (!aggregate) throw reasoningProviderRequestNotFound(providerRequestRecordId)
      return result(structuredClone(requireReasoningProviderRequest(aggregate, providerRequestRecordId)))
    },

    async getStudyChatProviderCheckback(workspaceId, checkbackId) {
      const aggregate = await repository.read(scope(workspaceId))
      if (!aggregate) throw reasoningProviderCheckbackNotFound(checkbackId)
      return result(structuredClone(requireReasoningProviderCheckback(aggregate, checkbackId)))
    },

    async getStudyChatProviderWorkflow(workspaceId, workflowId) {
      const aggregate = await repository.read(scope(workspaceId))
      if (!aggregate) throw reasoningProviderWorkflowNotFound(workflowId)
      return result(structuredClone(requireReasoningProviderWorkflow(aggregate, workflowId)))
    },

    async getStudyChatInternalCostAuthority(workspaceId, authorityRecordId) {
      const aggregate = await repository.read(scope(workspaceId))
      if (!aggregate) throw reasoningInternalCostAuthorityNotFound(authorityRecordId)
      return result(structuredClone(requireReasoningInternalCostAuthority(aggregate, authorityRecordId)))
    },

    async registerStudyChatInternalCostAuthority(input, idempotencyKey) {
      const normalized = normalizeReasoningInternalCostRegistration(input)
      const committedIdempotencyKey = requireIdempotencyKey(idempotencyKey)
      const registrationIdempotencyKeyHashSha256 = sha256Text(committedIdempotencyKey)
      const requestedScope = scope(normalized.workspaceId)
      const mutation = await repository.mutate({
        scope: requestedScope,
        operation: 'preference_study.reasoning_internal_cost_authority.register',
        idempotencyKey: committedIdempotencyKey,
        requestHash: hashEditReferenceRequest(normalized),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const reference = requireReference(aggregate, normalized.editReferenceId)
          const study = requireStudy(aggregate, normalized.studySessionId)
          if (study.editReferenceId !== reference.id || reference.currentStudyId !== study.id) {
            throw new ApiError('VALIDATION_FAILED', 'The Study Chat cost authority does not match the active study.', 409)
          }
          if (reference.status === 'archived' || study.status === 'archived') {
            throw new ApiError('VALIDATION_FAILED', 'Archived studies cannot register internal-cost authority.', 409)
          }
          assertRevision(study.revision, normalized.expectedStudyRevision, 'Preference Study')
          if (Date.parse(normalized.validUntil) <= Date.parse(now)) {
            throw new ApiError('VALIDATION_FAILED', 'The Study Chat internal-cost authority already expired.', 409)
          }
          const rateCardPayload: Omit<EditReferenceStudyChatImmutableRateCardSnapshot, 'digestSha256'> = {
            id: `edit-reference-study-chat-rate-card-${randomUUID()}`,
            version: normalized.rateCardVersion,
            currency: 'USD',
            effectiveAt: now,
            fixedRequestMicros: normalized.fixedRequestMicros,
            inputTokenMicrosPerMillion: normalized.inputTokenMicrosPerMillion,
            outputTokenMicrosPerMillion: normalized.outputTokenMicrosPerMillion,
            roundingMode: 'ceil_each_line_item_to_integer_micros',
            source: 'backend_private_controlled_snapshot',
            immutable: true,
          }
          const rateCardSnapshot: EditReferenceStudyChatImmutableRateCardSnapshot = {
            ...rateCardPayload,
            digestSha256: hashEditReferenceStudyChatRateCardSnapshot(rateCardPayload),
          }
          const lowInternalCostMicros = calculateEditReferenceStudyChatInternalCostMicros({
            rateCard: rateCardSnapshot,
            inputTokens: normalized.inputTokenEstimate.low,
            outputTokens: normalized.outputTokenEstimate.low,
          })
          const expectedInternalCostMicros = calculateEditReferenceStudyChatInternalCostMicros({
            rateCard: rateCardSnapshot,
            inputTokens: normalized.inputTokenEstimate.expected,
            outputTokens: normalized.outputTokenEstimate.expected,
          })
          const highInternalCostMicros = calculateEditReferenceStudyChatInternalCostMicros({
            rateCard: rateCardSnapshot,
            inputTokens: normalized.inputTokenEstimate.high,
            outputTokens: normalized.outputTokenEstimate.high,
          })
          if (BigInt(normalized.maximumAuthorizedInternalCostMicros) < BigInt(highInternalCostMicros)) {
            throw new ApiError(
              'VALIDATION_FAILED',
              'The Study Chat internal-cost ceiling does not cover the approved high estimate.',
              409,
            )
          }
          const authorityRecord: EditReferenceStudyChatInternalCostAuthorityRecord = {
            schemaVersion: EDIT_REFERENCE_STUDY_CHAT_INTERNAL_COST_AUTHORITY_VERSION,
            id: `edit-reference-study-chat-cost-authority-${randomUUID()}`,
            workspaceId: normalized.workspaceId,
            actorUserId: ownerUserId,
            editReferenceId: reference.id,
            studySessionId: study.id,
            revision: 1,
            state: 'approved_private',
            studyRevisionAtApproval: study.revision,
            approvedUsageEstimateId: `edit-reference-study-chat-usage-estimate-${randomUUID()}`,
            internalCostBudgetId: `edit-reference-study-chat-cost-budget-${randomUUID()}`,
            immutableRateCardSnapshotId: rateCardSnapshot.id,
            providerRoute: normalized.providerIdentity.providerRoute,
            providerModelId: normalized.providerIdentity.providerModelId,
            providerModelRevision: normalized.providerIdentity.providerModelRevision,
            providerModelAggregateSha256: normalized.providerIdentity.providerModelAggregateSha256,
            tokenEstimate: {
              input: structuredClone(normalized.inputTokenEstimate),
              output: structuredClone(normalized.outputTokenEstimate),
            },
            lowInternalCostMicros,
            expectedInternalCostMicros,
            highInternalCostMicros,
            maximumAuthorizedInternalCostMicros: normalized.maximumAuthorizedInternalCostMicros,
            rateCardSnapshot,
            approvalAuthority: 'backend_private_controlled',
            registrationIdempotencyKeyHashSha256,
            publicUserApprovalVerified: false,
            externalProviderExecutionAllowed: false,
            privateControlledExecutionOnly: true,
            reservedInternalCostMicros: '0',
            meteredInternalCostMicros: null,
            releasedInternalCostMicros: '0',
            usageEventIds: [],
            internalCostRecordIds: [],
            costEvidenceSource: 'not_incurred',
            customerPriceCalculated: false,
            customerCreditsMutated: false,
            serviceFeeIncluded: false,
            invoiceReconciled: false,
            createdAt: now,
            updatedAt: now,
            validUntil: normalized.validUntil,
            privateInternalOnly: true,
          }
          validateEditReferenceStudyChatInternalCostAuthorityRecord(authorityRecord)
          aggregate.reasoningInternalCostAuthorities.push(authorityRecord)
          addAuditEvent({
            eventType: 'preference_study_reasoning_internal_cost_authority_registered_private',
            editReferenceId: reference.id,
            studySessionId: study.id,
            reasoningInternalCostAuthorityId: authorityRecord.id,
          })
          return detailData(aggregate, reference)
        },
      })
      const aggregate = await requireAggregateAfterReasoningMutation(repository, requestedScope)
      const authorityRecord = requireReasoningInternalCostAuthorityByRegistration(
        aggregate,
        registrationIdempotencyKeyHashSha256,
      )
      return result(structuredClone(authorityRecord), mutation.replayed)
    },

    async authorizeStudyChatInternalCost(input, idempotencyKey) {
      const normalized = normalizeReasoningInternalCostAuthorization(input, ownerUserId)
      const committedIdempotencyKey = requireIdempotencyKey(idempotencyKey)
      const reservationIdempotencyKeyHashSha256 = sha256Text(committedIdempotencyKey)
      const requestDigestSha256 = hashEditReferenceStudyChatReasoningRequest(normalized.request)
      const requestedScope = scope(normalized.request.workspaceId)
      const mutation = await repository.mutate({
        scope: requestedScope,
        operation: 'preference_study.reasoning_internal_cost_authority.authorize',
        idempotencyKey: committedIdempotencyKey,
        requestHash: hashEditReferenceRequest({
          requestDigestSha256,
          providerIdentity: normalized.providerIdentity,
        }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const authorityRecord = requireReasoningInternalCostAuthorityByRequest(aggregate, normalized.request)
          const attempt = aggregate.reasoningAttempts.find(
            (candidate) => candidate.requestDigestSha256 === requestDigestSha256,
          )
          if (!attempt) {
            throw new ApiError('VERSION_CONFLICT', 'The exact reasoning attempt was not reserved before cost authority.', 409)
          }
          assertReasoningInternalCostProviderIdentity(authorityRecord, normalized.providerIdentity)
          if (authorityRecord.state !== 'approved_private') {
            if (
              authorityRecord.state === 'reserved'
              && authorityRecord.boundRequestDigestSha256 === requestDigestSha256
              && authorityRecord.reasoningAttemptId === attempt.id
              && authorityRecord.reservationIdempotencyKeyHashSha256 === reservationIdempotencyKeyHashSha256
            ) return detailData(aggregate, requireReference(aggregate, authorityRecord.editReferenceId))
            throw new ApiError('VERSION_CONFLICT', 'The Study Chat internal-cost authority was already consumed.', 409)
          }
          if (
            Date.parse(authorityRecord.validUntil) <= Date.parse(now)
            || authorityRecord.studyRevisionAtApproval !== normalized.request.expectedStudyRevision
            || attempt.studyRevisionAtReservation !== authorityRecord.studyRevisionAtApproval
          ) throw new ApiError('VERSION_CONFLICT', 'The Study Chat internal-cost authority is stale or expired.', 409)
          authorityRecord.state = 'reserved'
          authorityRecord.revision += 1
          authorityRecord.boundRequestDigestSha256 = requestDigestSha256
          authorityRecord.reasoningAttemptId = attempt.id
          authorityRecord.reservationIdempotencyKeyHashSha256 = reservationIdempotencyKeyHashSha256
          authorityRecord.reservedInternalCostMicros = authorityRecord.maximumAuthorizedInternalCostMicros
          authorityRecord.usageEventIds = [`edit-reference-study-chat-usage-event-${randomUUID()}`]
          authorityRecord.internalCostRecordIds = [`edit-reference-study-chat-internal-cost-${randomUUID()}`]
          authorityRecord.reservedAt = now
          authorityRecord.updatedAt = now
          validateEditReferenceStudyChatInternalCostAuthorityRecord(authorityRecord)
          addAuditEvent({
            eventType: 'preference_study_reasoning_internal_cost_reserved_private',
            editReferenceId: authorityRecord.editReferenceId,
            studySessionId: authorityRecord.studySessionId,
            reasoningAttemptId: attempt.id,
            reasoningInternalCostAuthorityId: authorityRecord.id,
          })
          return detailData(aggregate, requireReference(aggregate, authorityRecord.editReferenceId))
        },
      })
      const aggregate = await requireAggregateAfterReasoningMutation(repository, requestedScope)
      const authorityRecord = requireReasoningInternalCostAuthorityByRequest(aggregate, normalized.request)
      return result({
        authorityRecord: structuredClone(authorityRecord),
        usageEventIds: [...authorityRecord.usageEventIds],
        internalCostRecordIds: [...authorityRecord.internalCostRecordIds],
        authorizationDigestSha256: hashEditReferenceStudyChatInternalCostAuthorization(authorityRecord),
        customerPriceCalculated: false,
        customerCreditsMutated: false,
        serviceFeeIncluded: false,
      }, mutation.replayed)
    },

    async bindStudyChatInternalCostProviderRequest(input, idempotencyKey) {
      const normalized = normalizeReasoningInternalCostProviderBinding(input, ownerUserId)
      const committedIdempotencyKey = requireIdempotencyKey(idempotencyKey)
      let bindingAlreadyExists = false
      const requestDigestSha256 = hashEditReferenceStudyChatReasoningRequest(normalized.request)
      const requestedScope = scope(normalized.request.workspaceId)
      const mutation = await repository.mutate({
        scope: requestedScope,
        operation: 'preference_study.reasoning_internal_cost_authority.bind_provider_request',
        idempotencyKey: committedIdempotencyKey,
        requestHash: hashEditReferenceRequest({
          requestDigestSha256,
          providerIdentity: normalized.providerIdentity,
          reasoningProviderRequestId: normalized.reasoningProviderRequestId,
        }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const authorityRecord = requireReasoningInternalCostAuthorityByRequest(aggregate, normalized.request)
          const attempt = requireReasoningAttempt(aggregate, authorityRecord.reasoningAttemptId as string)
          const providerRequest = requireReasoningProviderRequest(
            aggregate,
            normalized.reasoningProviderRequestId,
          )
          assertReasoningInternalCostProviderIdentity(authorityRecord, normalized.providerIdentity)
          if (
            authorityRecord.boundRequestDigestSha256 !== requestDigestSha256
            || providerRequest.reasoningAttemptId !== attempt.id
            || providerRequest.providerRoute !== authorityRecord.providerRoute
            || providerRequest.providerModelId !== authorityRecord.providerModelId
            || providerRequest.providerModelRevision !== authorityRecord.providerModelRevision
            || providerRequest.providerModelAggregateSha256 !== authorityRecord.providerModelAggregateSha256
          ) throw new ApiError(
            'VERSION_CONFLICT',
            'The provider request does not match the exact reserved Study Chat internal-cost authority.',
            409,
          )
          if (authorityRecord.reasoningProviderRequestId) {
            if (authorityRecord.reasoningProviderRequestId !== providerRequest.id) {
              throw new ApiError(
                'IDEMPOTENCY_CONFLICT',
                'The Study Chat internal-cost authority already bound a different provider request.',
                409,
              )
            }
            bindingAlreadyExists = true
            return detailData(aggregate, requireReference(aggregate, authorityRecord.editReferenceId))
          }
          if (authorityRecord.state !== 'reserved') {
            throw new ApiError(
              'VERSION_CONFLICT',
              'Only a reserved Study Chat internal-cost authority can bind its provider request.',
              409,
            )
          }
          authorityRecord.reasoningProviderRequestId = providerRequest.id
          authorityRecord.revision += 1
          authorityRecord.updatedAt = now
          validateEditReferenceStudyChatInternalCostAuthorityRecord(authorityRecord)
          addAuditEvent({
            eventType: 'preference_study_reasoning_internal_cost_provider_request_bound',
            editReferenceId: authorityRecord.editReferenceId,
            studySessionId: authorityRecord.studySessionId,
            reasoningAttemptId: attempt.id,
            reasoningProviderRequestId: providerRequest.id,
            reasoningInternalCostAuthorityId: authorityRecord.id,
          })
          return detailData(aggregate, requireReference(aggregate, authorityRecord.editReferenceId))
        },
      })
      const aggregate = await requireAggregateAfterReasoningMutation(repository, requestedScope)
      const authorityRecord = requireReasoningInternalCostAuthorityByRequest(aggregate, normalized.request)
      return result({
        authorityRecord: structuredClone(authorityRecord),
        disposition: mutation.replayed || bindingAlreadyExists ? 'idempotent_replay' : 'bound',
        providerCallAuthorized: false,
        internalCostSettled: false,
        customerPriceCalculated: false,
        customerCreditsMutated: false,
        serviceFeeIncluded: false,
      }, mutation.replayed)
    },

    async settleStudyChatInternalCost(input, idempotencyKey) {
      const normalized = normalizeReasoningInternalCostSettlement(input, ownerUserId)
      const committedIdempotencyKey = requireIdempotencyKey(idempotencyKey)
      const requestDigestSha256 = hashEditReferenceStudyChatReasoningRequest(normalized.request)
      const providerObservationIdDigestSha256 = sha256Text(normalized.providerObservation.observationId)
      const providerObservationDigestSha256 = hashEditReferenceStudyChatProviderObservation({
        workspaceId: normalized.request.workspaceId,
        expectedProviderRequestRevision: 1,
        ...normalized.providerObservation,
      })
      const requestedScope = scope(normalized.request.workspaceId)
      const mutation = await repository.mutate({
        scope: requestedScope,
        operation: 'preference_study.reasoning_internal_cost_authority.settle',
        idempotencyKey: committedIdempotencyKey,
        requestHash: hashEditReferenceRequest({
          requestDigestSha256,
          providerIdentity: normalized.providerIdentity,
          reasoningProviderRequestId: normalized.reasoningProviderRequestId,
          providerObservationIdDigestSha256,
          providerObservationDigestSha256,
          providerCallMade: normalized.providerCallMade,
          usageMeasurement: normalized.usageMeasurement,
        }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const authorityRecord = requireReasoningInternalCostAuthorityByRequest(aggregate, normalized.request)
          const attempt = requireReasoningAttempt(aggregate, authorityRecord.reasoningAttemptId as string)
          const providerRequest = requireReasoningProviderRequest(aggregate, normalized.reasoningProviderRequestId)
          assertReasoningInternalCostProviderIdentity(authorityRecord, normalized.providerIdentity)
          if (
            authorityRecord.boundRequestDigestSha256 !== requestDigestSha256
            || providerRequest.reasoningAttemptId !== attempt.id
          ) throw new ApiError('VERSION_CONFLICT', 'The provider cost settlement does not match its reserved attempt.', 409)
          if (authorityRecord.state !== 'reserved') {
            if (
              ['metered_provisional', 'released_not_incurred', 'cost_unverified'].includes(authorityRecord.state)
              && authorityRecord.providerObservationIdDigestSha256 === providerObservationIdDigestSha256
              && authorityRecord.providerObservationDigestSha256 === providerObservationDigestSha256
              && reasoningInternalCostSettlementEvidenceMatches(
                authorityRecord,
                normalized.providerCallMade,
                normalized.usageMeasurement,
              )
            ) return detailData(aggregate, requireReference(aggregate, authorityRecord.editReferenceId))
            throw new ApiError('IDEMPOTENCY_CONFLICT', 'The Study Chat internal cost already settled different truth.', 409)
          }

          if (
            authorityRecord.reasoningProviderRequestId
            && authorityRecord.reasoningProviderRequestId !== providerRequest.id
          ) throw new ApiError(
            'IDEMPOTENCY_CONFLICT',
            'The Study Chat internal cost cannot settle a different provider request.',
            409,
          )
          authorityRecord.reasoningProviderRequestId = providerRequest.id
          authorityRecord.providerObservationIdDigestSha256 = providerObservationIdDigestSha256
          authorityRecord.providerObservationDigestSha256 = providerObservationDigestSha256
          authorityRecord.revision += 1
          authorityRecord.settledAt = now
          authorityRecord.updatedAt = now
          if (!normalized.providerCallMade) {
            authorityRecord.state = 'released_not_incurred'
            authorityRecord.meteredInternalCostMicros = '0'
            authorityRecord.releasedInternalCostMicros = authorityRecord.maximumAuthorizedInternalCostMicros
            authorityRecord.costEvidenceSource = 'not_incurred'
          } else if (!normalized.usageMeasurement) {
            authorityRecord.state = 'cost_unverified'
            authorityRecord.meteredInternalCostMicros = null
            authorityRecord.releasedInternalCostMicros = '0'
            authorityRecord.costEvidenceSource = 'unverified'
          } else {
            const measurement = normalized.usageMeasurement
            authorityRecord.usageMeasurement = {
              providerUsageRecordIdDigestSha256: sha256Text(measurement.providerUsageRecordId),
              inputTokens: measurement.inputTokens,
              outputTokens: measurement.outputTokens,
              totalTokens: measurement.totalTokens,
              billableRequestCount: 1,
              evidenceSource: 'provider_reported',
              rawProviderUsagePersisted: false,
            }
            const meteredInternalCostMicros = calculateEditReferenceStudyChatInternalCostMicros({
              rateCard: authorityRecord.rateCardSnapshot,
              inputTokens: measurement.inputTokens,
              outputTokens: measurement.outputTokens,
              billableRequestCount: measurement.billableRequestCount,
            })
            if (
              BigInt(meteredInternalCostMicros) <= 0n
              || BigInt(meteredInternalCostMicros) > BigInt(authorityRecord.maximumAuthorizedInternalCostMicros)
            ) {
              authorityRecord.state = 'cost_unverified'
              authorityRecord.meteredInternalCostMicros = null
              authorityRecord.releasedInternalCostMicros = '0'
              authorityRecord.costEvidenceSource = 'unverified'
            } else {
              authorityRecord.state = 'metered_provisional'
              authorityRecord.meteredInternalCostMicros = meteredInternalCostMicros
              authorityRecord.releasedInternalCostMicros = (
                BigInt(authorityRecord.maximumAuthorizedInternalCostMicros)
                - BigInt(meteredInternalCostMicros)
              ).toString()
              authorityRecord.costEvidenceSource = 'provider_reported'
            }
          }
          validateEditReferenceStudyChatInternalCostAuthorityRecord(authorityRecord)
          addAuditEvent({
            eventType: authorityRecord.state === 'metered_provisional'
              ? 'preference_study_reasoning_internal_cost_metered_provisional'
              : authorityRecord.state === 'released_not_incurred'
                ? 'preference_study_reasoning_internal_cost_released'
                : 'preference_study_reasoning_internal_cost_unverified',
            editReferenceId: authorityRecord.editReferenceId,
            studySessionId: authorityRecord.studySessionId,
            reasoningAttemptId: attempt.id,
            reasoningProviderRequestId: providerRequest.id,
            reasoningInternalCostAuthorityId: authorityRecord.id,
            providerObservationIdDigestSha256,
            providerObservationDigestSha256,
          })
          return detailData(aggregate, requireReference(aggregate, authorityRecord.editReferenceId))
        },
      })
      const aggregate = await requireAggregateAfterReasoningMutation(repository, requestedScope)
      const authorityRecord = requireReasoningInternalCostAuthorityByRequest(aggregate, normalized.request)
      return result({
        authorityRecord: structuredClone(authorityRecord),
        disposition: authorityRecord.state as EditReferenceStudyChatInternalCostSettlementData['disposition'],
        meteredInternalCostMicros: authorityRecord.meteredInternalCostMicros,
        usageEventIds: [...authorityRecord.usageEventIds],
        internalCostRecordIds: [...authorityRecord.internalCostRecordIds],
        invoiceReconciled: false,
        customerPriceCalculated: false,
        customerCreditsMutated: false,
        serviceFeeIncluded: false,
      }, mutation.replayed)
    },

    async reserveStudyChatReasoningAttempt(input, idempotencyKey) {
      const normalized = normalizeReasoningAttemptReservation(input, ownerUserId)
      const committedIdempotencyKey = requireIdempotencyKey(idempotencyKey)
      const reservationIdempotencyKeyHashSha256 = sha256Text(committedIdempotencyKey)
      const requestDigestSha256 = hashEditReferenceStudyChatReasoningRequest(normalized.request)
      const userMessageContentDigestSha256 = sha256Text(normalized.userMessage)
      const mutation = await repository.mutate({
        scope: scope(normalized.request.workspaceId),
        operation: 'preference_study.reasoning_attempt.reserve',
        idempotencyKey: committedIdempotencyKey,
        requestHash: hashEditReferenceRequest({
          requestDigestSha256,
          userMessageContentDigestSha256,
        }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const reference = requireReference(aggregate, normalized.request.editReferenceId)
          const study = requireStudy(aggregate, normalized.request.studySessionId)
          if (study.editReferenceId !== reference.id || reference.currentStudyId !== study.id) {
            throw new ApiError('VERSION_CONFLICT', 'Study Chat reasoning is limited to the current Preference Study.', 409)
          }
          if (reference.status === 'archived' || study.status === 'archived') {
            throw new ApiError('VALIDATION_FAILED', 'Archived studies cannot reserve reasoning attempts.', 409)
          }
          const duplicate = aggregate.reasoningAttempts.find((attempt) => (
            attempt.studySessionId === study.id
            && attempt.clientMessageDigestSha256 === normalized.request.clientMessageDigestSha256
          ))
          if (duplicate) {
            if (
              duplicate.requestDigestSha256 !== requestDigestSha256
              || duplicate.userMessageContentDigestSha256 !== userMessageContentDigestSha256
            ) throw new ApiError('IDEMPOTENCY_CONFLICT', 'The Study Chat client message was already reserved with different content or context.', 409)
            return detailData(aggregate, reference)
          }
          assertRevision(study.revision, normalized.request.expectedStudyRevision, 'Preference Study')
          if (aggregate.messages.some((message) => message.clientMessageId === normalized.clientMessageId)) {
            throw new ApiError('IDEMPOTENCY_CONFLICT', 'The Study Chat client message ID was already used outside a reasoning attempt.', 409)
          }
          let correctionEvidence: PreferenceEvidenceRecord | undefined
          if (normalized.findingCorrectionEvidenceId) {
            assertActiveStudy(reference, study)
            const superseded = aggregate.evidence.find(
              (record) => record.id === normalized.findingCorrectionEvidenceId,
            )
            if (!superseded || superseded.studySessionId !== study.id || superseded.sourceType !== 'manual_user_evidence') {
              throw new ApiError(
                'VALIDATION_FAILED',
                'A Study Chat correction must replace saved creative evidence in this study.',
                409,
              )
            }
            if (aggregate.evidence.some((record) => record.supersedesEvidenceId === superseded.id)) {
              throw new ApiError('VERSION_CONFLICT', 'That evidence already has a newer correction. Reload before saving.', 409)
            }
            correctionEvidence = createEvidenceRecords(reference, study, {
              workspaceId: normalized.request.workspaceId,
              expectedStudyRevision: normalized.request.expectedStudyRevision,
              sourceType: 'manual_user_evidence',
              title: `${superseded.title} — Study Chat correction`.slice(0, 160),
              category: requireManualEvidenceCategory(superseded.category),
              summary: normalized.userMessage,
              intendedUse: requireCorrectionTransferability(superseded.transferability),
              supersedesEvidenceId: superseded.id,
            }, now).evidence
          }
          const savedDirectionEvidence = correctionEvidence ?? createEvidenceRecords(reference, study, {
            workspaceId: normalized.request.workspaceId,
            expectedStudyRevision: normalized.request.expectedStudyRevision,
            sourceType: 'manual_user_evidence',
            title: `Study Chat direction ${aggregate.evidence.filter((record) => (
              record.studySessionId === study.id && record.sourceType === 'manual_user_evidence'
            )).length + 1}`,
            category: 'all_goals',
            summary: normalized.userMessage,
            intendedUse: 'transferable',
          }, now).evidence
          const userMessage: PreferenceStudyMessageRecord = {
            id: `preference-study-message-${randomUUID()}`,
            workspaceId: reference.workspaceId,
            editReferenceId: reference.id,
            studySessionId: study.id,
            role: 'user',
            content: normalized.userMessage,
            sequence: nextSequence(aggregate, study.id),
            clientMessageId: normalized.clientMessageId,
            runtimeSource: 'user_input',
            createdAt: now,
          }
          const attempt: EditReferenceStudyChatReasoningAttemptRecord = {
            schemaVersion: EDIT_REFERENCE_STUDY_CHAT_REASONING_ATTEMPT_VERSION,
            id: `edit-reference-reasoning-attempt-${randomUUID()}`,
            workspaceId: reference.workspaceId,
            actorUserId: ownerUserId,
            editReferenceId: reference.id,
            studySessionId: study.id,
            revision: 1,
            state: 'reserved',
            request: structuredClone(normalized.request),
            requestDigestSha256,
            clientMessageDigestSha256: normalized.request.clientMessageDigestSha256,
            userMessageId: userMessage.id,
            userMessageContentDigestSha256,
            savedDirectionEvidenceId: savedDirectionEvidence.id,
            contextStateAtReservation: {
              referenceStatus: reference.status,
              studyStatus: study.status,
              evidenceStatus: study.evidenceStatus,
              dnaStatus: study.dnaStatus,
              qaStatus: study.qaStatus,
            },
            studyRevisionAtReservation: study.revision,
            studyRevisionAfterReservation: study.revision + 1,
            reservationIdempotencyKeyHashSha256,
            providerExecutionState: 'not_started',
            internalCostStatus: normalized.request.executionScope === 'production'
              ? 'authorized_not_incurred'
              : 'not_incurred',
            meteredInternalCostMicros: null,
            usageEventIds: [],
            internalCostRecordIds: [],
            customerPriceCalculated: false,
            customerCreditsMutated: false,
            serviceFeeIncluded: false,
            createdAt: now,
            reservedAt: now,
            privateInternalOnly: true,
          }
          aggregate.messages.push(userMessage)
          aggregate.evidence.push(savedDirectionEvidence)
          let invalidatedDNACandidate = false
          for (const dnaVersion of aggregate.dnaVersions.filter((record) => (
            record.studySessionId === study.id
            && record.status !== 'approved'
            && record.status !== 'superseded'
          ))) {
            dnaVersion.status = 'superseded'
            dnaVersion.supersededAt = now
            invalidatedDNACandidate = true
          }
          aggregate.reasoningAttempts.push(attempt)
          study.status = 'ready_to_study'
          study.evidenceStatus = 'ready_to_study'
          study.dnaStatus = 'not_generated'
          study.qaStatus = 'not_run'
          study.revision += 1
          study.updatedAt = now
          reference.evidenceStatus = 'ready_to_study'
          reference.dnaStatus = 'not_generated'
          reference.qaStatus = 'not_run'
          reference.updatedAt = now
          aggregate.usageLogs.push(usageLog(reference, 'evidence_added', now))
          aggregate.usageLogs.push(usageLog(reference, 'message_appended', now))
          if (invalidatedDNACandidate) {
            addAuditEvent({
              eventType: 'preference_dna_candidate_invalidated',
              editReferenceId: reference.id,
              studySessionId: study.id,
            })
          }
          addAuditEvent({
            eventType: 'preference_evidence_added',
            editReferenceId: reference.id,
            studySessionId: study.id,
          })
          addAuditEvent({
            eventType: 'preference_study_reasoning_attempt_reserved',
            editReferenceId: reference.id,
            studySessionId: study.id,
            reasoningAttemptId: attempt.id,
          })
          return detailData(aggregate, reference)
        },
      })
      const aggregate = await requireAggregateAfterReasoningMutation(
        repository,
        scope(normalized.request.workspaceId),
      )
      const attempt = requireReasoningAttemptByClientDigest(
        aggregate,
        normalized.request.studySessionId,
        normalized.request.clientMessageDigestSha256,
      )
      const disposition = mutation.replayed
        ? 'idempotent_replay'
        : attempt.reservationIdempotencyKeyHashSha256 === reservationIdempotencyKeyHashSha256
          ? 'created'
          : 'client_message_deduplicated'
      return result({ attempt: structuredClone(attempt), disposition }, mutation.replayed)
    },

    async startStudyChatReasoningAttempt(attemptId, input, idempotencyKey) {
      const normalized = normalizeReasoningAttemptStart(input)
      const committedIdempotencyKey = requireIdempotencyKey(idempotencyKey)
      const executionIdempotencyKeyHashSha256 = sha256Text(committedIdempotencyKey)
      const executionCommandDigestSha256 = sha256Text(normalized.executionCommandId)
      const requestedScope = scope(normalized.workspaceId)
      const mutation = await repository.mutate({
        scope: requestedScope,
        operation: 'preference_study.reasoning_attempt.start',
        idempotencyKey: committedIdempotencyKey,
        requestHash: hashEditReferenceRequest({
          attemptId,
          expectedAttemptRevision: normalized.expectedAttemptRevision,
          executionCommandDigestSha256,
        }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const attempt = requireReasoningAttempt(aggregate, attemptId)
          const reference = requireReference(aggregate, attempt.editReferenceId)
          const study = requireStudy(aggregate, attempt.studySessionId)
          if (attempt.state === 'running') {
            if (attempt.executionCommandDigestSha256 !== executionCommandDigestSha256) {
              throw new ApiError('VERSION_CONFLICT', 'This reasoning attempt already consumed its one execution authority.', 409)
            }
            return detailData(aggregate, reference)
          }
          if (attempt.state !== 'reserved') {
            throw new ApiError('VERSION_CONFLICT', 'Only a reserved reasoning attempt can start.', 409)
          }
          assertRevision(attempt.revision, normalized.expectedAttemptRevision, 'Study Chat reasoning attempt')
          if (
            reference.currentStudyId !== study.id
            || study.revision !== attempt.studyRevisionAfterReservation
          ) throw new ApiError('VERSION_CONFLICT', 'The Preference Study changed before reasoning execution could start.', 409)
          const userMessage = aggregate.messages.find((message) => message.id === attempt.userMessageId)
          if (!userMessage) {
            throw new ApiError('INTERNAL_ERROR', 'The reserved Study Chat message is unavailable.', 500)
          }
          try {
            const reconstructedContext = buildEditReferenceStudyChatStructuredContext({
              aggregate,
              referenceId: reference.id,
              studyId: study.id,
              userMessage: userMessage.content,
              excludedMessageIds: [userMessage.id],
              excludedEvidenceIds: attempt.savedDirectionEvidenceId
                ? [attempt.savedDirectionEvidenceId]
                : [],
              ...(attempt.contextStateAtReservation
                ? { currentStateOverride: attempt.contextStateAtReservation }
                : {}),
            })
            if (
              hashEditReferenceStudyChatStructuredContext(reconstructedContext)
              !== attempt.request.structuredContextDigestSha256
            ) throw new Error('context_digest_mismatch')
          } catch {
            throw new ApiError(
              'VERSION_CONFLICT',
              'The exact bounded Study Chat context cannot be reconstructed after reservation.',
              409,
            )
          }
          attempt.state = 'running'
          attempt.revision = 2
          attempt.executionCommandDigestSha256 = executionCommandDigestSha256
          attempt.executionIdempotencyKeyHashSha256 = executionIdempotencyKeyHashSha256
          attempt.providerExecutionState = 'execution_authorized_once'
          attempt.startedAt = now
          reference.updatedAt = now
          addAuditEvent({
            eventType: 'preference_study_reasoning_attempt_started',
            editReferenceId: reference.id,
            studySessionId: study.id,
            reasoningAttemptId: attempt.id,
          })
          return detailData(aggregate, reference)
        },
      })
      const aggregate = await requireAggregateAfterReasoningMutation(repository, requestedScope)
      const attempt = requireReasoningAttempt(aggregate, attemptId)
      const providerCallAuthorized = !mutation.replayed
        && attempt.state === 'running'
        && attempt.executionCommandDigestSha256 === executionCommandDigestSha256
        && attempt.executionIdempotencyKeyHashSha256 === executionIdempotencyKeyHashSha256
      const disposition = providerCallAuthorized
        ? 'authorized_once'
        : mutation.replayed
          ? 'idempotent_replay_blocked'
          : 'duplicate_command_blocked'
      return result({
        attempt: structuredClone(attempt),
        disposition,
        providerCallAuthorized,
      }, mutation.replayed)
    },

    async reserveStudyChatProviderRequest(attemptId, input, idempotencyKey) {
      const normalized = normalizeReasoningProviderRequestReservation(input)
      const committedIdempotencyKey = requireIdempotencyKey(idempotencyKey)
      const reservationIdempotencyKeyHashSha256 = sha256Text(committedIdempotencyKey)
      const submissionIdempotencyKeyHashSha256 = hashEditReferenceStudyChatProviderSubmissionKey(
        normalized.providerSubmissionIdempotencyKey,
      )
      const requestedScope = scope(normalized.workspaceId)
      const mutation = await repository.mutate({
        scope: requestedScope,
        operation: 'preference_study.reasoning_provider_request.reserve',
        idempotencyKey: committedIdempotencyKey,
        requestHash: hashEditReferenceRequest({
          attemptId,
          expectedAttemptRevision: normalized.expectedAttemptRevision,
          providerRoute: normalized.providerRoute,
          providerModelId: normalized.providerModelId,
          providerModelRevision: normalized.providerModelRevision,
          providerModelAggregateSha256: normalized.providerModelAggregateSha256,
          providerLookupMode: normalized.providerLookupMode,
          submissionIdempotencyKeyHashSha256,
        }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const attempt = requireReasoningAttempt(aggregate, attemptId)
          const reference = requireReference(aggregate, attempt.editReferenceId)
          const duplicate = aggregate.reasoningProviderRequests.find(
            (candidate) => candidate.reasoningAttemptId === attempt.id,
          )
          if (duplicate) {
            if (
              duplicate.reasoningRequestDigestSha256 !== attempt.requestDigestSha256
              || duplicate.executionCommandDigestSha256 !== attempt.executionCommandDigestSha256
              || duplicate.providerRoute !== normalized.providerRoute
              || duplicate.providerModelId !== normalized.providerModelId
              || duplicate.providerModelRevision !== normalized.providerModelRevision
              || duplicate.providerModelAggregateSha256 !== normalized.providerModelAggregateSha256
              || duplicate.providerLookupMode !== normalized.providerLookupMode
              || duplicate.submissionIdempotencyKeyHashSha256 !== submissionIdempotencyKeyHashSha256
            ) throw new ApiError('IDEMPOTENCY_CONFLICT', 'This reasoning attempt already bound a different provider request.', 409)
            return detailData(aggregate, reference)
          }
          if (attempt.state !== 'running' || !attempt.executionCommandDigestSha256) {
            throw new ApiError('VERSION_CONFLICT', 'Only an authorized running reasoning attempt can bind a provider request.', 409)
          }
          assertRevision(attempt.revision, normalized.expectedAttemptRevision, 'Study Chat reasoning attempt')
          const providerRequest: EditReferenceStudyChatProviderRequestRecord = {
            schemaVersion: EDIT_REFERENCE_STUDY_CHAT_PROVIDER_REQUEST_VERSION,
            id: `edit-reference-reasoning-provider-request-${randomUUID()}`,
            workspaceId: attempt.workspaceId,
            actorUserId: attempt.actorUserId,
            editReferenceId: attempt.editReferenceId,
            studySessionId: attempt.studySessionId,
            reasoningAttemptId: attempt.id,
            revision: 1,
            state: 'not_submitted',
            reasoningRequestDigestSha256: attempt.requestDigestSha256,
            executionCommandDigestSha256: attempt.executionCommandDigestSha256,
            providerRoute: normalized.providerRoute,
            providerModelId: normalized.providerModelId,
            providerModelRevision: normalized.providerModelRevision,
            providerModelAggregateSha256: normalized.providerModelAggregateSha256,
            providerLookupMode: normalized.providerLookupMode,
            reservationIdempotencyKeyHashSha256,
            submissionIdempotencyKeyHashSha256,
            providerCallMayHaveOccurred: false,
            resubmissionAllowed: false,
            operatorReviewRequired: false,
            reconciliationCount: 0,
            internalCostStatus: attempt.internalCostStatus,
            meteredInternalCostMicros: null,
            usageEventIds: [],
            internalCostRecordIds: [],
            customerPriceCalculated: false,
            customerCreditsMutated: false,
            serviceFeeIncluded: false,
            createdAt: now,
            updatedAt: now,
            privateInternalOnly: true,
          }
          aggregate.reasoningProviderRequests.push(providerRequest)
          reference.updatedAt = now
          addAuditEvent({
            eventType: 'preference_study_reasoning_provider_request_reserved',
            editReferenceId: reference.id,
            studySessionId: attempt.studySessionId,
            reasoningAttemptId: attempt.id,
            reasoningProviderRequestId: providerRequest.id,
          })
          return detailData(aggregate, reference)
        },
      })
      const aggregate = await requireAggregateAfterReasoningMutation(repository, requestedScope)
      const providerRequest = requireReasoningProviderRequestByAttempt(aggregate, attemptId)
      const disposition = mutation.replayed
        ? 'idempotent_replay'
        : providerRequest.reservationIdempotencyKeyHashSha256 === reservationIdempotencyKeyHashSha256
          ? 'created'
          : 'attempt_deduplicated'
      return result({
        providerRequest: structuredClone(providerRequest),
        disposition,
      }, mutation.replayed)
    },

    async authorizeStudyChatProviderSubmission(providerRequestRecordId, input, idempotencyKey) {
      const normalized = normalizeReasoningProviderSubmissionAuthorization(input)
      const committedIdempotencyKey = requireIdempotencyKey(idempotencyKey)
      const submissionAuthorizationIdempotencyKeyHashSha256 = sha256Text(committedIdempotencyKey)
      const requestedScope = scope(normalized.workspaceId)
      const mutation = await repository.mutate({
        scope: requestedScope,
        operation: 'preference_study.reasoning_provider_request.authorize_submission',
        idempotencyKey: committedIdempotencyKey,
        requestHash: hashEditReferenceRequest({
          providerRequestRecordId,
          expectedProviderRequestRevision: normalized.expectedProviderRequestRevision,
        }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const providerRequest = requireReasoningProviderRequest(aggregate, providerRequestRecordId)
          const attempt = requireReasoningAttempt(aggregate, providerRequest.reasoningAttemptId)
          const reference = requireReference(aggregate, providerRequest.editReferenceId)
          if (providerRequest.state !== 'not_submitted') return detailData(aggregate, reference)
          assertRevision(
            providerRequest.revision,
            normalized.expectedProviderRequestRevision,
            'Study Chat provider request',
          )
          if (attempt.state !== 'running') {
            throw new ApiError('VERSION_CONFLICT', 'The linked reasoning attempt is no longer running.', 409)
          }
          providerRequest.state = 'submission_unknown'
          providerRequest.revision = 2
          providerRequest.providerCallMayHaveOccurred = true
          providerRequest.internalCostStatus = 'unverified'
          providerRequest.submissionAuthorizationIdempotencyKeyHashSha256 = submissionAuthorizationIdempotencyKeyHashSha256
          providerRequest.submissionAuthorizedAt = now
          providerRequest.updatedAt = now
          reference.updatedAt = now
          addAuditEvent({
            eventType: 'preference_study_reasoning_provider_submission_authorized',
            editReferenceId: reference.id,
            studySessionId: attempt.studySessionId,
            reasoningAttemptId: attempt.id,
            reasoningProviderRequestId: providerRequest.id,
          })
          return detailData(aggregate, reference)
        },
      })
      const aggregate = await requireAggregateAfterReasoningMutation(repository, requestedScope)
      const providerRequest = requireReasoningProviderRequest(aggregate, providerRequestRecordId)
      const submissionAuthorized = !mutation.replayed
        && providerRequest.state === 'submission_unknown'
        && providerRequest.revision === 2
        && providerRequest.submissionAuthorizationIdempotencyKeyHashSha256 === submissionAuthorizationIdempotencyKeyHashSha256
      return result({
        providerRequest: structuredClone(providerRequest),
        disposition: submissionAuthorized
          ? 'authorized_once'
          : mutation.replayed
            ? 'idempotent_replay_blocked'
            : 'already_consumed_blocked',
        submissionAuthorized,
      }, mutation.replayed)
    },

    async reconcileStudyChatProviderRequest(providerRequestRecordId, input, idempotencyKey) {
      const normalized = normalizeReasoningProviderRequestReconciliation(input)
      const committedIdempotencyKey = requireIdempotencyKey(idempotencyKey)
      const observationDigestSha256 = hashEditReferenceStudyChatProviderObservation(normalized)
      const observationIdDigestSha256 = sha256Text(normalized.observationId)
      const requestedScope = scope(normalized.workspaceId)
      const mutation = await repository.mutate({
        scope: requestedScope,
        operation: 'preference_study.reasoning_provider_request.reconcile',
        idempotencyKey: committedIdempotencyKey,
        requestHash: hashEditReferenceRequest({
          providerRequestRecordId,
          observationDigestSha256,
        }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const providerRequest = requireReasoningProviderRequest(aggregate, providerRequestRecordId)
          const attempt = requireReasoningAttempt(aggregate, providerRequest.reasoningAttemptId)
          const reference = requireReference(aggregate, providerRequest.editReferenceId)
          if (providerRequest.lastObservationIdDigestSha256 === observationIdDigestSha256) {
            if (providerRequest.lastObservationDigestSha256 !== observationDigestSha256) {
              throw new ApiError(
                'IDEMPOTENCY_CONFLICT',
                'This provider observation identity already recorded different provider truth.',
                409,
              )
            }
            return detailData(aggregate, reference)
          }
          if (['completed', 'failed'].includes(providerRequest.state)) {
            if (!sameTerminalProviderObservation(providerRequest, normalized)) {
              throw new ApiError('IDEMPOTENCY_CONFLICT', 'This provider request already reconciled with different terminal truth.', 409)
            }
            return detailData(aggregate, reference)
          }
          if (providerRequest.state === 'not_submitted') {
            throw new ApiError('VERSION_CONFLICT', 'A provider request cannot reconcile before submission authority is consumed.', 409)
          }
          assertRevision(
            providerRequest.revision,
            normalized.expectedProviderRequestRevision,
            'Study Chat provider request',
          )
          if (attempt.state !== 'running') {
            throw new ApiError('VERSION_CONFLICT', 'The linked reasoning attempt is no longer available for reconciliation.', 409)
          }
          if (
            providerRequest.providerRequestId
            && normalized.providerRequestId
            && providerRequest.providerRequestId !== normalized.providerRequestId
          ) throw new ApiError('IDEMPOTENCY_CONFLICT', 'The provider request identity changed during reconciliation.', 409)

          const resolvedProviderRequestId = providerRequest.providerRequestId ?? normalized.providerRequestId
          if (resolvedProviderRequestId) {
            providerRequest.providerRequestId = resolvedProviderRequestId
            providerRequest.providerRequestIdDigestSha256 = sha256Text(resolvedProviderRequestId)
            providerRequest.submittedAt ??= now
          }
          providerRequest.revision += 1
          providerRequest.reconciliationCount += 1
          providerRequest.lastObservationIdDigestSha256 = observationIdDigestSha256
          providerRequest.lastObservationDigestSha256 = observationDigestSha256
          providerRequest.lastReconciledAt = now
          providerRequest.updatedAt = now

          let eventType: string
          if (normalized.observationStatus === 'pending') {
            providerRequest.state = 'submitted'
            providerRequest.operatorReviewRequired = false
            eventType = 'preference_study_reasoning_provider_request_pending'
          } else if (['not_found', 'unknown'].includes(normalized.observationStatus)) {
            providerRequest.state = 'operator_review_required'
            providerRequest.operatorReviewRequired = true
            eventType = 'preference_study_reasoning_provider_request_review_required'
          } else {
            const reasoningResult = normalized.result
            if (!reasoningResult || !resolvedProviderRequestId) {
              throw new ApiError('VALIDATION_FAILED', 'Terminal provider truth is incomplete.', 409)
            }
            assertProviderResultMatchesReservedIdentity(providerRequest, reasoningResult)
            const attemptEventType = settleStudyChatReasoningAttemptInAggregate({
              aggregate,
              attempt,
              reference,
              now,
              reasoningResult,
            })
            providerRequest.state = normalized.observationStatus === 'answered' ? 'completed' : 'failed'
            providerRequest.operatorReviewRequired = false
            providerRequest.resultDigestSha256 = attempt.resultDigestSha256
            providerRequest.internalCostStatus = attempt.internalCostStatus
            providerRequest.meteredInternalCostMicros = attempt.meteredInternalCostMicros
            providerRequest.usageEventIds = [...attempt.usageEventIds]
            providerRequest.internalCostRecordIds = [...attempt.internalCostRecordIds]
            providerRequest.terminalAt = now
            eventType = providerRequest.state === 'completed'
              ? 'preference_study_reasoning_provider_request_completed'
              : 'preference_study_reasoning_provider_request_failed'
            addAuditEvent({
              eventType: attemptEventType,
              editReferenceId: reference.id,
              studySessionId: attempt.studySessionId,
              reasoningAttemptId: attempt.id,
              reasoningProviderRequestId: providerRequest.id,
              providerObservationIdDigestSha256: observationIdDigestSha256,
              providerObservationDigestSha256: observationDigestSha256,
            })
          }
          reference.updatedAt = now
          addAuditEvent({
            eventType,
            editReferenceId: reference.id,
            studySessionId: attempt.studySessionId,
            reasoningAttemptId: attempt.id,
            reasoningProviderRequestId: providerRequest.id,
            providerObservationIdDigestSha256: observationIdDigestSha256,
            providerObservationDigestSha256: observationDigestSha256,
          })
          return detailData(aggregate, reference)
        },
      })
      const aggregate = await requireAggregateAfterReasoningMutation(repository, requestedScope)
      const providerRequest = requireReasoningProviderRequest(aggregate, providerRequestRecordId)
      const reasoningAttempt = requireReasoningAttempt(aggregate, providerRequest.reasoningAttemptId)
      const terminal = ['completed', 'failed'].includes(providerRequest.state)
      return result({
        providerRequest: structuredClone(providerRequest),
        reconciliationDisposition: mutation.replayed && terminal
          ? 'terminal_replay'
          : terminal
            ? 'terminal_settled'
            : providerRequest.state === 'submitted'
              ? 'pending_recorded'
              : 'operator_review_required',
        reasoningAttemptTerminal: ['completed', 'failed', 'cost_unverified'].includes(reasoningAttempt.state),
        providerResubmissionAllowed: false,
      }, mutation.replayed)
    },

    async scheduleStudyChatProviderCheckback(providerRequestRecordId, input, idempotencyKey) {
      const normalized = normalizeReasoningProviderCheckbackSchedule(input)
      const committedIdempotencyKey = requireIdempotencyKey(idempotencyKey)
      const requestedScope = scope(normalized.workspaceId)
      const mutation = await repository.mutate({
        scope: requestedScope,
        operation: 'preference_study.reasoning_provider_checkback.schedule',
        idempotencyKey: committedIdempotencyKey,
        requestHash: hashEditReferenceRequest({ providerRequestRecordId, ...normalized }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const providerRequest = requireReasoningProviderRequest(aggregate, providerRequestRecordId)
          const attempt = requireReasoningAttempt(aggregate, providerRequest.reasoningAttemptId)
          const reference = requireReference(aggregate, providerRequest.editReferenceId)
          const duplicate = aggregate.reasoningProviderCheckbacks.find(
            (candidate) => candidate.reasoningProviderRequestId === providerRequest.id,
          )
          if (duplicate) {
            if (
              duplicate.scheduleReason !== normalized.scheduleReason
              || duplicate.nextCheckAt !== normalized.nextCheckAt
              || duplicate.deadlineAt !== normalized.deadlineAt
              || duplicate.maxLookupAttempts !== normalized.maxLookupAttempts
            ) throw new ApiError(
              'IDEMPOTENCY_CONFLICT',
              'This provider request already has a different durable checkback policy.',
              409,
            )
            return detailData(aggregate, reference)
          }
          assertRevision(
            providerRequest.revision,
            normalized.expectedProviderRequestRevision,
            'Study Chat provider request',
          )
          if (Date.parse(normalized.deadlineAt) <= Date.parse(now)) {
            throw new ApiError('VALIDATION_FAILED', 'Provider checkback deadline must remain in the future.', 409)
          }
          if (providerRequest.state === 'not_submitted') {
            throw new ApiError(
              'VERSION_CONFLICT',
              'Provider checkback cannot be scheduled before submission authority is consumed.',
              409,
            )
          }
          if (attempt.state !== 'running' && !['completed', 'failed', 'cost_unverified'].includes(attempt.state)) {
            throw new ApiError('VERSION_CONFLICT', 'The linked reasoning attempt cannot own a checkback.', 409)
          }

          const providerTerminal = ['completed', 'failed'].includes(providerRequest.state)
          const providerReview = providerRequest.state === 'operator_review_required'
          const checkback: EditReferenceStudyChatProviderCheckbackRecord = {
            schemaVersion: EDIT_REFERENCE_STUDY_CHAT_PROVIDER_CHECKBACK_VERSION,
            id: `edit-reference-reasoning-provider-checkback-${randomUUID()}`,
            workspaceId: providerRequest.workspaceId,
            actorUserId: providerRequest.actorUserId,
            editReferenceId: providerRequest.editReferenceId,
            studySessionId: providerRequest.studySessionId,
            reasoningAttemptId: providerRequest.reasoningAttemptId,
            reasoningProviderRequestId: providerRequest.id,
            revision: 1,
            state: providerTerminal
              ? 'terminal'
              : providerReview
                ? 'operator_review_required'
                : 'scheduled',
            scheduleReason: normalized.scheduleReason,
            nextCheckAt: normalized.nextCheckAt,
            deadlineAt: normalized.deadlineAt,
            maxLookupAttempts: normalized.maxLookupAttempts,
            lookupAttemptCount: 0,
            leaseGeneration: 0,
            lastOutcome: providerTerminal
              ? 'terminal_settled'
              : providerReview
                ? 'operator_review_required'
                : 'not_checked',
            lastOutcomeProviderRequestRevision: providerTerminal || providerReview
              ? providerRequest.revision
              : null,
            operatorReviewRequired: providerReview,
            automaticLookupStopped: providerTerminal || providerReview,
            ...(providerReview ? { stoppedAt: now } : {}),
            ...(providerTerminal ? { terminalAt: now } : {}),
            operatorRecoveryCount: 0,
            lookupOnly: true,
            providerSubmissionAllowed: false,
            providerResubmissionAllowed: false,
            providerSubmissionIdempotencyKeyPersisted: false,
            providerCancellationAttempted: false,
            providerCancellationConfirmed: false,
            customerPriceCalculated: false,
            customerCreditsMutated: false,
            serviceFeeIncluded: false,
            createdAt: now,
            updatedAt: now,
            privateInternalOnly: true,
          }
          aggregate.reasoningProviderCheckbacks.push(checkback)
          reference.updatedAt = now
          addAuditEvent({
            eventType: providerTerminal
              ? 'preference_study_reasoning_provider_checkback_terminal_recorded'
              : providerReview
                ? 'preference_study_reasoning_provider_checkback_review_recorded'
                : 'preference_study_reasoning_provider_checkback_scheduled',
            editReferenceId: reference.id,
            studySessionId: attempt.studySessionId,
            reasoningAttemptId: attempt.id,
            reasoningProviderRequestId: providerRequest.id,
            reasoningProviderCheckbackId: checkback.id,
          })
          return detailData(aggregate, reference)
        },
      })
      const aggregate = await requireAggregateAfterReasoningMutation(repository, requestedScope)
      const checkback = requireReasoningProviderCheckbackByRequest(aggregate, providerRequestRecordId)
      return result({
        checkback: structuredClone(checkback),
        disposition: mutation.replayed
          ? 'idempotent_replay'
          : checkback.state === 'terminal'
            ? 'already_terminal'
            : checkback.createdAt === aggregate.updatedAt
              ? 'created'
              : 'provider_request_deduplicated',
      }, mutation.replayed)
    },

    async claimStudyChatProviderCheckback(checkbackId, input, idempotencyKey) {
      const normalized = normalizeReasoningProviderCheckbackClaim(input)
      const committedIdempotencyKey = requireIdempotencyKey(idempotencyKey)
      const leaseToken = deriveEditReferenceStudyChatProviderCheckbackLeaseToken(committedIdempotencyKey)
      const leaseTokenHashSha256 = hashEditReferenceStudyChatProviderCheckbackLeaseToken(leaseToken)
      const leaseOwnerIdDigestSha256 = sha256Text(normalized.workerId)
      const leaseClaimIdempotencyKeyHashSha256 = sha256Text(committedIdempotencyKey)
      const requestedScope = scope(normalized.workspaceId)
      const mutation = await repository.mutate({
        scope: requestedScope,
        operation: 'preference_study.reasoning_provider_checkback.claim',
        idempotencyKey: committedIdempotencyKey,
        requestHash: hashEditReferenceRequest({
          checkbackId,
          expectedCheckbackRevision: normalized.expectedCheckbackRevision,
          leaseOwnerIdDigestSha256,
          leaseDurationMs: normalized.leaseDurationMs,
        }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const checkback = requireReasoningProviderCheckback(aggregate, checkbackId)
          const providerRequest = requireReasoningProviderRequest(
            aggregate,
            checkback.reasoningProviderRequestId,
          )
          const reference = requireReference(aggregate, checkback.editReferenceId)
          if (['completed', 'failed'].includes(providerRequest.state)) {
            if (checkback.state !== 'terminal') {
              assertRevision(checkback.revision, normalized.expectedCheckbackRevision, 'Study Chat provider checkback')
              markReasoningProviderCheckbackTerminal(checkback, providerRequest, now)
              addAuditEvent({
                eventType: 'preference_study_reasoning_provider_checkback_terminal_recovered',
                editReferenceId: reference.id,
                studySessionId: checkback.studySessionId,
                reasoningAttemptId: checkback.reasoningAttemptId,
                reasoningProviderRequestId: providerRequest.id,
                reasoningProviderCheckbackId: checkback.id,
              })
            }
            return detailData(aggregate, reference)
          }
          if (['terminal', 'cancelled', 'operator_review_required'].includes(checkback.state)) {
            return detailData(aggregate, reference)
          }
          if (checkback.state === 'leased' && Date.parse(checkback.leaseExpiresAt as string) > Date.parse(now)) {
            return detailData(aggregate, reference)
          }
          assertRevision(checkback.revision, normalized.expectedCheckbackRevision, 'Study Chat provider checkback')
          if (checkback.state !== 'scheduled' && checkback.state !== 'leased') {
            throw new ApiError('VERSION_CONFLICT', 'Provider checkback is not eligible for a lookup lease.', 409)
          }
          if (Date.parse(now) < Date.parse(checkback.nextCheckAt)) {
            return detailData(aggregate, reference)
          }
          if (
            Date.parse(now) >= Date.parse(checkback.deadlineAt)
            || checkback.lookupAttemptCount >= checkback.maxLookupAttempts
          ) {
            markReasoningProviderCheckbackReview(
              checkback,
              'automatic_lookup_exhausted',
              providerRequest.revision,
              now,
            )
            addAuditEvent({
              eventType: 'preference_study_reasoning_provider_checkback_exhausted',
              editReferenceId: reference.id,
              studySessionId: checkback.studySessionId,
              reasoningAttemptId: checkback.reasoningAttemptId,
              reasoningProviderRequestId: providerRequest.id,
              reasoningProviderCheckbackId: checkback.id,
            })
            return detailData(aggregate, reference)
          }
          checkback.state = 'leased'
          checkback.revision += 1
          checkback.lookupAttemptCount += 1
          checkback.leaseGeneration += 1
          checkback.activeLeaseTokenHashSha256 = leaseTokenHashSha256
          checkback.activeLeaseOwnerIdDigestSha256 = leaseOwnerIdDigestSha256
          checkback.activeLeaseClaimIdempotencyKeyHashSha256 = leaseClaimIdempotencyKeyHashSha256
          checkback.leasedAt = now
          checkback.leaseExpiresAt = new Date(Date.parse(now) + normalized.leaseDurationMs).toISOString()
          checkback.lastLookupStartedAt = now
          delete checkback.lastLookupCompletedAt
          checkback.updatedAt = now
          reference.updatedAt = now
          addAuditEvent({
            eventType: 'preference_study_reasoning_provider_checkback_lookup_leased',
            editReferenceId: reference.id,
            studySessionId: checkback.studySessionId,
            reasoningAttemptId: checkback.reasoningAttemptId,
            reasoningProviderRequestId: providerRequest.id,
            reasoningProviderCheckbackId: checkback.id,
          })
          return detailData(aggregate, reference)
        },
      })
      const aggregate = await requireAggregateAfterReasoningMutation(repository, requestedScope)
      const checkback = requireReasoningProviderCheckback(aggregate, checkbackId)
      const ownsActiveLease = checkback.state === 'leased'
        && checkback.activeLeaseTokenHashSha256 === leaseTokenHashSha256
        && checkback.activeLeaseOwnerIdDigestSha256 === leaseOwnerIdDigestSha256
        && checkback.activeLeaseClaimIdempotencyKeyHashSha256 === leaseClaimIdempotencyKeyHashSha256
      const disposition: EditReferenceStudyChatProviderCheckbackClaimData['disposition'] = ownsActiveLease
        ? mutation.replayed ? 'authorized_replay' : 'authorized'
        : checkback.state === 'leased'
          ? 'already_leased'
          : checkback.state === 'scheduled'
            ? 'not_due'
            : checkback.state === 'operator_review_required'
              ? 'operator_review_required'
              : checkback.state === 'terminal'
                ? 'terminal'
                : 'cancelled'
      return result({
        checkback: structuredClone(checkback),
        disposition,
        lookupAuthorized: ownsActiveLease,
        leaseToken: ownsActiveLease ? leaseToken : null,
      }, mutation.replayed)
    },

    async settleStudyChatProviderCheckback(checkbackId, input, idempotencyKey) {
      const normalized = normalizeReasoningProviderCheckbackSettlement(input)
      const committedIdempotencyKey = requireIdempotencyKey(idempotencyKey)
      const leaseTokenHashSha256 = hashEditReferenceStudyChatProviderCheckbackLeaseToken(
        normalized.leaseToken,
      )
      const requestedScope = scope(normalized.workspaceId)
      const mutation = await repository.mutate({
        scope: requestedScope,
        operation: 'preference_study.reasoning_provider_checkback.settle',
        idempotencyKey: committedIdempotencyKey,
        requestHash: hashEditReferenceRequest({
          checkbackId,
          expectedCheckbackRevision: normalized.expectedCheckbackRevision,
          expectedProviderRequestRevision: normalized.expectedProviderRequestRevision,
          leaseTokenHashSha256,
          outcome: normalized.outcome,
          nextCheckAt: normalized.nextCheckAt,
        }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const checkback = requireReasoningProviderCheckback(aggregate, checkbackId)
          const providerRequest = requireReasoningProviderRequest(
            aggregate,
            checkback.reasoningProviderRequestId,
          )
          const reference = requireReference(aggregate, checkback.editReferenceId)
          if (checkback.state === 'terminal') {
            if (normalized.outcome !== 'terminal_settled' || !['completed', 'failed'].includes(providerRequest.state)) {
              throw new ApiError('IDEMPOTENCY_CONFLICT', 'The provider checkback already settled different truth.', 409)
            }
            return detailData(aggregate, reference)
          }
          assertRevision(checkback.revision, normalized.expectedCheckbackRevision, 'Study Chat provider checkback')
          assertRevision(providerRequest.revision, normalized.expectedProviderRequestRevision, 'Study Chat provider request')
          if (
            checkback.state !== 'leased'
            || checkback.activeLeaseTokenHashSha256 !== leaseTokenHashSha256
            || !checkback.leaseExpiresAt
            || Date.parse(checkback.leaseExpiresAt) <= Date.parse(now)
          ) throw new ApiError('VERSION_CONFLICT', 'The provider checkback lease is missing, stale, or belongs to another worker.', 409)

          assertReasoningProviderCheckbackOutcomeMatchesProvider(normalized.outcome, providerRequest)
          clearReasoningProviderCheckbackLease(checkback)
          checkback.lastLookupCompletedAt = now
          checkback.lastOutcome = normalized.outcome
          checkback.lastOutcomeProviderRequestRevision = providerRequest.revision
          checkback.revision += 1
          checkback.updatedAt = now

          // A lookup can finish after its requested retry instant even though the
          // lease is still valid. Preserve the caller's idempotent command while
          // making that retry immediately due instead of rejecting a legitimate
          // settlement because wall-clock time advanced during provider I/O.
          const effectiveNextCheckAt = normalized.nextCheckAt === null
            ? null
            : Date.parse(normalized.nextCheckAt) <= Date.parse(now)
              ? now
              : normalized.nextCheckAt

          let eventType: string
          if (normalized.outcome === 'terminal_settled') {
            markReasoningProviderCheckbackTerminal(checkback, providerRequest, now, false)
            eventType = 'preference_study_reasoning_provider_checkback_terminal'
          } else if (
            normalized.outcome === 'operator_review_required'
            || normalized.outcome === 'invalid_provider_observation'
          ) {
            markReasoningProviderCheckbackReview(
              checkback,
              normalized.outcome,
              providerRequest.revision,
              now,
              false,
            )
            eventType = 'preference_study_reasoning_provider_checkback_review_required'
          } else if (
            checkback.lookupAttemptCount >= checkback.maxLookupAttempts
            || Date.parse(now) >= Date.parse(checkback.deadlineAt)
            || Date.parse(effectiveNextCheckAt as string) > Date.parse(checkback.deadlineAt)
          ) {
            markReasoningProviderCheckbackReview(
              checkback,
              normalized.outcome,
              providerRequest.revision,
              now,
              false,
            )
            eventType = 'preference_study_reasoning_provider_checkback_exhausted'
          } else {
            checkback.state = 'scheduled'
            checkback.scheduleReason = normalized.outcome === 'provider_pending'
              ? 'provider_pending'
              : 'lookup_unavailable'
            checkback.nextCheckAt = effectiveNextCheckAt as string
            checkback.operatorReviewRequired = false
            checkback.automaticLookupStopped = false
            delete checkback.stopReason
            delete checkback.stoppedAt
            delete checkback.terminalAt
            eventType = 'preference_study_reasoning_provider_checkback_rescheduled'
          }
          reference.updatedAt = now
          addAuditEvent({
            eventType,
            editReferenceId: reference.id,
            studySessionId: checkback.studySessionId,
            reasoningAttemptId: checkback.reasoningAttemptId,
            reasoningProviderRequestId: providerRequest.id,
            reasoningProviderCheckbackId: checkback.id,
          })
          return detailData(aggregate, reference)
        },
      })
      const aggregate = await requireAggregateAfterReasoningMutation(repository, requestedScope)
      const checkback = requireReasoningProviderCheckback(aggregate, checkbackId)
      const disposition: EditReferenceStudyChatProviderCheckbackSettlementData['disposition'] = mutation.replayed
        ? 'idempotent_replay'
        : checkback.state === 'terminal'
          ? 'terminal'
          : checkback.state === 'scheduled'
            ? 'rescheduled'
            : normalized.outcome === 'operator_review_required' || normalized.outcome === 'invalid_provider_observation'
              ? 'operator_review_required'
              : 'automatic_lookup_exhausted'
      return result({
        checkback: structuredClone(checkback),
        disposition,
        providerSubmissionAllowed: false,
        providerResubmissionAllowed: false,
      }, mutation.replayed)
    },

    async stopStudyChatProviderCheckback(checkbackId, input, idempotencyKey) {
      const normalized = normalizeReasoningProviderCheckbackStop(input)
      const committedIdempotencyKey = requireIdempotencyKey(idempotencyKey)
      const requestedScope = scope(normalized.workspaceId)
      const mutation = await repository.mutate({
        scope: requestedScope,
        operation: 'preference_study.reasoning_provider_checkback.stop',
        idempotencyKey: committedIdempotencyKey,
        requestHash: hashEditReferenceRequest({ checkbackId, ...normalized }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const checkback = requireReasoningProviderCheckback(aggregate, checkbackId)
          const providerRequest = requireReasoningProviderRequest(aggregate, checkback.reasoningProviderRequestId)
          const reference = requireReference(aggregate, checkback.editReferenceId)
          if (checkback.state === 'terminal' || checkback.state === 'cancelled') return detailData(aggregate, reference)
          assertRevision(checkback.revision, normalized.expectedCheckbackRevision, 'Study Chat provider checkback')
          if (checkback.state === 'leased') {
            throw new ApiError('VERSION_CONFLICT', 'An active lookup lease must settle or expire before automatic checkback can stop.', 409)
          }
          const providerWasTerminal = ['completed', 'failed'].includes(providerRequest.state)
          if (providerWasTerminal) {
            markReasoningProviderCheckbackTerminal(checkback, providerRequest, now)
          } else {
            checkback.state = 'cancelled'
            checkback.revision += 1
            checkback.operatorReviewRequired = true
            checkback.automaticLookupStopped = true
            checkback.stopReason = normalized.stopReason
            checkback.stoppedAt = now
            checkback.updatedAt = now
          }
          reference.updatedAt = now
          addAuditEvent({
            eventType: providerWasTerminal
              ? 'preference_study_reasoning_provider_checkback_terminal_recovered'
              : 'preference_study_reasoning_provider_checkback_stopped',
            editReferenceId: reference.id,
            studySessionId: checkback.studySessionId,
            reasoningAttemptId: checkback.reasoningAttemptId,
            reasoningProviderRequestId: providerRequest.id,
            reasoningProviderCheckbackId: checkback.id,
          })
          return detailData(aggregate, reference)
        },
      })
      const aggregate = await requireAggregateAfterReasoningMutation(repository, requestedScope)
      const checkback = requireReasoningProviderCheckback(aggregate, checkbackId)
      return result({
        checkback: structuredClone(checkback),
        disposition: mutation.replayed
          ? 'idempotent_replay'
          : checkback.state === 'terminal'
            ? 'terminal'
            : 'stopped',
        providerCancellationAttempted: false,
        providerCancellationConfirmed: false,
        providerResubmissionAllowed: false,
      }, mutation.replayed)
    },

    async resumeStudyChatProviderCheckback(checkbackId, input, idempotencyKey) {
      const normalized = normalizeReasoningProviderCheckbackResume(input)
      const committedIdempotencyKey = requireIdempotencyKey(idempotencyKey)
      const operatorRecoveryCommandDigestSha256 = sha256Text(normalized.operatorRecoveryCommandId)
      const requestedScope = scope(normalized.workspaceId)
      const mutation = await repository.mutate({
        scope: requestedScope,
        operation: 'preference_study.reasoning_provider_checkback.resume',
        idempotencyKey: committedIdempotencyKey,
        requestHash: hashEditReferenceRequest({
          checkbackId,
          ...normalized,
          operatorRecoveryCommandId: operatorRecoveryCommandDigestSha256,
        }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const checkback = requireReasoningProviderCheckback(aggregate, checkbackId)
          const providerRequest = requireReasoningProviderRequest(aggregate, checkback.reasoningProviderRequestId)
          const reference = requireReference(aggregate, checkback.editReferenceId)
          if (checkback.state === 'terminal') return detailData(aggregate, reference)
          assertRevision(checkback.revision, normalized.expectedCheckbackRevision, 'Study Chat provider checkback')
          assertRevision(providerRequest.revision, normalized.expectedProviderRequestRevision, 'Study Chat provider request')
          const providerWasTerminal = ['completed', 'failed'].includes(providerRequest.state)
          if (providerWasTerminal) {
            markReasoningProviderCheckbackTerminal(checkback, providerRequest, now)
          } else {
            if (!['operator_review_required', 'cancelled'].includes(checkback.state)) {
              throw new ApiError('VERSION_CONFLICT', 'Only a stopped provider checkback can receive operator recovery.', 409)
            }
            if (Date.parse(normalized.deadlineAt) <= Date.parse(now)) {
              throw new ApiError('VALIDATION_FAILED', 'Recovered provider checkback deadline must remain in the future.', 409)
            }
            if (normalized.maxLookupAttempts <= checkback.lookupAttemptCount) {
              throw new ApiError('VALIDATION_FAILED', 'Operator recovery must authorize at least one additional lookup.', 409)
            }
            checkback.state = 'scheduled'
            checkback.revision += 1
            checkback.scheduleReason = 'operator_recovery'
            checkback.nextCheckAt = normalized.nextCheckAt
            checkback.deadlineAt = normalized.deadlineAt
            checkback.maxLookupAttempts = normalized.maxLookupAttempts
            checkback.operatorReviewRequired = false
            checkback.automaticLookupStopped = false
            delete checkback.stopReason
            delete checkback.stoppedAt
            delete checkback.terminalAt
            checkback.operatorRecoveryCount += 1
            checkback.lastOperatorRecoveryCommandDigestSha256 = operatorRecoveryCommandDigestSha256
            checkback.updatedAt = now
          }
          reference.updatedAt = now
          addAuditEvent({
            eventType: providerWasTerminal
              ? 'preference_study_reasoning_provider_checkback_terminal_recovered'
              : 'preference_study_reasoning_provider_checkback_operator_resumed',
            editReferenceId: reference.id,
            studySessionId: checkback.studySessionId,
            reasoningAttemptId: checkback.reasoningAttemptId,
            reasoningProviderRequestId: providerRequest.id,
            reasoningProviderCheckbackId: checkback.id,
          })
          return detailData(aggregate, reference)
        },
      })
      const aggregate = await requireAggregateAfterReasoningMutation(repository, requestedScope)
      const checkback = requireReasoningProviderCheckback(aggregate, checkbackId)
      return result({
        checkback: structuredClone(checkback),
        disposition: mutation.replayed
          ? 'idempotent_replay'
          : checkback.state === 'terminal'
            ? 'terminal'
            : 'resumed',
        providerCancellationAttempted: false,
        providerCancellationConfirmed: false,
        providerResubmissionAllowed: false,
      }, mutation.replayed)
    },

    async registerStudyChatProviderWorkflow(checkbackId, input, idempotencyKey) {
      const normalized = normalizeReasoningProviderWorkflowRegistration(input)
      const committedIdempotencyKey = requireIdempotencyKey(idempotencyKey)
      const requestedScope = scope(normalized.workspaceId)
      const mutation = await repository.mutate({
        scope: requestedScope,
        operation: 'preference_study.reasoning_provider_workflow.register',
        idempotencyKey: committedIdempotencyKey,
        requestHash: hashEditReferenceRequest({ checkbackId, ...normalized }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const checkback = requireReasoningProviderCheckback(aggregate, checkbackId)
          const providerRequest = requireReasoningProviderRequest(aggregate, checkback.reasoningProviderRequestId)
          const attempt = requireReasoningAttempt(aggregate, checkback.reasoningAttemptId)
          const costAuthority = requireReasoningInternalCostAuthority(
            aggregate,
            normalized.reasoningInternalCostAuthorityId,
          )
          const reference = requireReference(aggregate, checkback.editReferenceId)
          assertRevision(checkback.revision, normalized.expectedCheckbackRevision, 'Study Chat provider checkback')
          assertRevision(providerRequest.revision, normalized.expectedProviderRequestRevision, 'Study Chat provider request')
          if (
            costAuthority.reasoningAttemptId !== attempt.id
            || costAuthority.reasoningProviderRequestId !== providerRequest.id
            || costAuthority.state === 'approved_private'
          ) throw new ApiError(
            'VALIDATION_FAILED',
            'The provider workflow requires the exact reserved Study Chat internal-cost authority.',
            409,
          )
          const existing = aggregate.reasoningProviderWorkflows.find(
            (candidate) => candidate.reasoningProviderCheckbackId === checkback.id,
          )
          if (existing) return detailData(aggregate, reference)
          if (checkback.state === 'leased') {
            throw new ApiError('VERSION_CONFLICT', 'A leased provider checkback cannot register a workflow.', 409)
          }
          if (
            !['terminal', 'operator_review_required', 'cancelled'].includes(checkback.state)
            && Date.parse(normalized.deadlineAt) <= Date.parse(now)
          ) throw new ApiError('VALIDATION_FAILED', 'The provider workflow deadline must remain in the future.', 409)

          const terminal = checkback.state === 'terminal'
          const needsReview = ['operator_review_required', 'cancelled'].includes(checkback.state)
          const workflow: EditReferenceStudyChatProviderWorkflowRecord = {
            schemaVersion: EDIT_REFERENCE_STUDY_CHAT_PROVIDER_WORKFLOW_VERSION,
            id: `edit-reference-study-chat-provider-workflow-${randomUUID()}`,
            workspaceId: normalized.workspaceId,
            actorUserId: ownerUserId,
            editReferenceId: checkback.editReferenceId,
            studySessionId: checkback.studySessionId,
            reasoningAttemptId: checkback.reasoningAttemptId,
            reasoningProviderRequestId: providerRequest.id,
            reasoningProviderCheckbackId: checkback.id,
            reasoningInternalCostAuthorityId: costAuthority.id,
            revision: 1,
            state: terminal ? 'terminal' : needsReview ? 'operator_review_required' : 'scheduled',
            nextRunAt: normalized.nextRunAt,
            deadlineAt: normalized.deadlineAt,
            maxWorkflowRuns: normalized.maxWorkflowRuns,
            workflowRunCount: 0,
            leaseGeneration: 0,
            heartbeatCount: 0,
            callbackWakeCount: 0,
            callbackEvents: [],
            lastOutcome: terminal
              ? 'terminal_settled'
              : needsReview
                ? 'operator_review_required'
                : 'not_run',
            lastOutcomeCheckbackRevision: terminal || needsReview ? checkback.revision : null,
            operatorReviewRequired: needsReview,
            automaticWorkflowStopped: terminal || needsReview,
            ...(needsReview ? { stoppedAt: now } : {}),
            ...(terminal ? { terminalAt: now } : {}),
            operatorRecoveryCount: 0,
            callbackAuthenticationRequired: true,
            callbackWakeOnly: true,
            callbackCanSettleProviderTruth: false,
            providerLookupOnly: true,
            providerSubmissionAllowed: false,
            providerResubmissionAllowed: false,
            providerCancellationAttempted: false,
            publicRouteAvailable: false,
            distributedRuntimeDeployed: false,
            externalProviderExecutionAllowed: false,
            customerPriceCalculated: false,
            customerCreditsMutated: false,
            serviceFeeIncluded: false,
            createdAt: now,
            updatedAt: now,
            privateInternalOnly: true,
          }
          aggregate.reasoningProviderWorkflows.push(workflow)
          reference.updatedAt = now
          addAuditEvent({
            eventType: terminal
              ? 'preference_study_reasoning_provider_workflow_terminal_recorded'
              : needsReview
                ? 'preference_study_reasoning_provider_workflow_review_recorded'
                : 'preference_study_reasoning_provider_workflow_registered',
            editReferenceId: reference.id,
            studySessionId: workflow.studySessionId,
            reasoningAttemptId: workflow.reasoningAttemptId,
            reasoningProviderRequestId: workflow.reasoningProviderRequestId,
            reasoningProviderCheckbackId: workflow.reasoningProviderCheckbackId,
            reasoningProviderWorkflowId: workflow.id,
            reasoningInternalCostAuthorityId: workflow.reasoningInternalCostAuthorityId,
          })
          return detailData(aggregate, reference)
        },
      })
      const aggregate = await requireAggregateAfterReasoningMutation(repository, requestedScope)
      const workflow = requireReasoningProviderWorkflowByCheckback(aggregate, checkbackId)
      return result({
        workflow: structuredClone(workflow),
        disposition: mutation.replayed
          ? 'idempotent_replay'
          : workflow.state === 'terminal'
            ? 'already_terminal'
            : workflow.createdAt === aggregate.updatedAt
              ? 'created'
              : 'checkback_deduplicated',
      }, mutation.replayed)
    },

    async claimStudyChatProviderWorkflow(workflowId, input, idempotencyKey) {
      const normalized = normalizeReasoningProviderWorkflowClaim(input)
      const committedIdempotencyKey = requireIdempotencyKey(idempotencyKey)
      const leaseToken = deriveEditReferenceStudyChatProviderWorkflowLeaseToken(committedIdempotencyKey)
      const leaseTokenHashSha256 = hashEditReferenceStudyChatProviderWorkflowLeaseToken(leaseToken)
      const leaseOwnerIdDigestSha256 = sha256Text(normalized.workerId)
      const leaseClaimIdempotencyKeyHashSha256 = sha256Text(committedIdempotencyKey)
      const requestedScope = scope(normalized.workspaceId)
      const mutation = await repository.mutate({
        scope: requestedScope,
        operation: 'preference_study.reasoning_provider_workflow.claim',
        idempotencyKey: committedIdempotencyKey,
        requestHash: hashEditReferenceRequest({
          workflowId,
          expectedWorkflowRevision: normalized.expectedWorkflowRevision,
          leaseOwnerIdDigestSha256,
          leaseDurationMs: normalized.leaseDurationMs,
        }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const workflow = requireReasoningProviderWorkflow(aggregate, workflowId)
          const checkback = requireReasoningProviderCheckback(aggregate, workflow.reasoningProviderCheckbackId)
          const reference = requireReference(aggregate, workflow.editReferenceId)
          if (checkback.state === 'terminal') {
            if (workflow.state !== 'terminal') {
              markReasoningProviderWorkflowTerminal(workflow, checkback, now)
              addAuditEvent(workflowAudit(workflow, 'preference_study_reasoning_provider_workflow_terminal_recovered'))
            }
            return detailData(aggregate, reference)
          }
          if (['terminal', 'cancelled', 'operator_review_required'].includes(workflow.state)) {
            return detailData(aggregate, reference)
          }
          if (workflow.state === 'leased' && Date.parse(workflow.leaseExpiresAt as string) > Date.parse(now)) {
            return detailData(aggregate, reference)
          }
          assertRevision(workflow.revision, normalized.expectedWorkflowRevision, 'Study Chat provider workflow')
          if (workflow.state !== 'scheduled' && workflow.state !== 'leased') {
            throw new ApiError('VERSION_CONFLICT', 'Provider workflow is not eligible for a lease.', 409)
          }
          if (Date.parse(now) < Date.parse(workflow.nextRunAt)) return detailData(aggregate, reference)
          if (
            Date.parse(now) >= Date.parse(workflow.deadlineAt)
            || workflow.workflowRunCount >= workflow.maxWorkflowRuns
          ) {
            markReasoningProviderWorkflowReview(workflow, checkback, 'automatic_workflow_exhausted', now)
            addAuditEvent(workflowAudit(workflow, 'preference_study_reasoning_provider_workflow_exhausted'))
            return detailData(aggregate, reference)
          }
          clearReasoningProviderWorkflowLease(workflow)
          workflow.state = 'leased'
          workflow.revision += 1
          workflow.workflowRunCount += 1
          workflow.leaseGeneration += 1
          workflow.activeLeaseTokenHashSha256 = leaseTokenHashSha256
          workflow.activeLeaseOwnerIdDigestSha256 = leaseOwnerIdDigestSha256
          workflow.activeLeaseClaimIdempotencyKeyHashSha256 = leaseClaimIdempotencyKeyHashSha256
          workflow.leasedAt = now
          workflow.leaseExpiresAt = new Date(Date.parse(now) + normalized.leaseDurationMs).toISOString()
          workflow.lastRunStartedAt = now
          delete workflow.lastRunCompletedAt
          workflow.updatedAt = now
          reference.updatedAt = now
          addAuditEvent(workflowAudit(workflow, 'preference_study_reasoning_provider_workflow_leased'))
          return detailData(aggregate, reference)
        },
      })
      const aggregate = await requireAggregateAfterReasoningMutation(repository, requestedScope)
      const workflow = requireReasoningProviderWorkflow(aggregate, workflowId)
      const ownsLease = workflow.state === 'leased'
        && workflow.activeLeaseTokenHashSha256 === leaseTokenHashSha256
        && workflow.activeLeaseOwnerIdDigestSha256 === leaseOwnerIdDigestSha256
        && workflow.activeLeaseClaimIdempotencyKeyHashSha256 === leaseClaimIdempotencyKeyHashSha256
      const disposition: EditReferenceStudyChatProviderWorkflowClaimData['disposition'] = ownsLease
        ? mutation.replayed ? 'authorized_replay' : 'authorized'
        : workflow.state === 'leased'
          ? 'already_leased'
          : workflow.state === 'scheduled'
            ? 'not_due'
            : workflow.state === 'operator_review_required'
              ? 'operator_review_required'
              : workflow.state === 'terminal'
                ? 'terminal'
                : 'cancelled'
      return result({
        workflow: structuredClone(workflow),
        disposition,
        workflowRunAuthorized: ownsLease,
        leaseToken: ownsLease ? leaseToken : null,
      }, mutation.replayed)
    },

    async heartbeatStudyChatProviderWorkflow(workflowId, input, idempotencyKey) {
      const normalized = normalizeReasoningProviderWorkflowHeartbeat(input)
      const committedIdempotencyKey = requireIdempotencyKey(idempotencyKey)
      const leaseTokenHashSha256 = hashEditReferenceStudyChatProviderWorkflowLeaseToken(normalized.leaseToken)
      const leaseOwnerIdDigestSha256 = sha256Text(normalized.workerId)
      const requestedScope = scope(normalized.workspaceId)
      const mutation = await repository.mutate({
        scope: requestedScope,
        operation: 'preference_study.reasoning_provider_workflow.heartbeat',
        idempotencyKey: committedIdempotencyKey,
        requestHash: hashEditReferenceRequest({
          workflowId,
          expectedWorkflowRevision: normalized.expectedWorkflowRevision,
          leaseTokenHashSha256,
          leaseOwnerIdDigestSha256,
          extendLeaseDurationMs: normalized.extendLeaseDurationMs,
        }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const workflow = requireReasoningProviderWorkflow(aggregate, workflowId)
          const reference = requireReference(aggregate, workflow.editReferenceId)
          assertRevision(workflow.revision, normalized.expectedWorkflowRevision, 'Study Chat provider workflow')
          if (
            workflow.state !== 'leased'
            || workflow.activeLeaseTokenHashSha256 !== leaseTokenHashSha256
            || workflow.activeLeaseOwnerIdDigestSha256 !== leaseOwnerIdDigestSha256
            || !workflow.leaseExpiresAt
            || Date.parse(workflow.leaseExpiresAt) <= Date.parse(now)
          ) throw new ApiError('VERSION_CONFLICT', 'The provider workflow heartbeat lease is missing, stale, or foreign.', 409)
          const extendedLeaseExpiresAt = new Date(Date.parse(now) + normalized.extendLeaseDurationMs).toISOString()
          if (Date.parse(extendedLeaseExpiresAt) > Date.parse(workflow.deadlineAt)) {
            throw new ApiError('VALIDATION_FAILED', 'The provider workflow heartbeat exceeds its deadline.', 409)
          }
          workflow.revision += 1
          workflow.leaseExpiresAt = extendedLeaseExpiresAt
          workflow.lastHeartbeatAt = now
          workflow.heartbeatCount += 1
          workflow.lastOutcome = 'heartbeat_recorded'
          workflow.lastOutcomeCheckbackRevision = requireReasoningProviderCheckback(
            aggregate,
            workflow.reasoningProviderCheckbackId,
          ).revision
          workflow.updatedAt = now
          reference.updatedAt = now
          addAuditEvent(workflowAudit(workflow, 'preference_study_reasoning_provider_workflow_heartbeat'))
          return detailData(aggregate, reference)
        },
      })
      const aggregate = await requireAggregateAfterReasoningMutation(repository, requestedScope)
      return result({
        workflow: structuredClone(requireReasoningProviderWorkflow(aggregate, workflowId)),
        disposition: mutation.replayed ? 'idempotent_replay' : 'extended',
        providerLookupAuthorized: false,
        providerSubmissionAllowed: false,
      }, mutation.replayed)
    },

    async recordStudyChatProviderCallbackWake(workflowId, input, idempotencyKey) {
      const normalized = normalizeReasoningProviderCallbackWake(input)
      const committedIdempotencyKey = requireIdempotencyKey(idempotencyKey)
      let semanticReplay = false
      const providerEventIdDigestSha256 = sha256Text(normalized.providerEventId)
      const providerRequestIdDigestSha256 = normalized.providerRequestId
        ? sha256Text(normalized.providerRequestId)
        : null
      const requestedScope = scope(normalized.workspaceId)
      const mutation = await repository.mutate({
        scope: requestedScope,
        operation: 'preference_study.reasoning_provider_workflow.callback_wake',
        idempotencyKey: committedIdempotencyKey,
        requestHash: hashEditReferenceRequest({
          workflowId,
          providerEventIdDigestSha256,
          providerRequestIdDigestSha256,
          callbackEnvelopeDigestSha256: normalized.callbackEnvelopeDigestSha256,
          occurredAt: normalized.occurredAt,
          authentication: normalized.authentication,
        }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const workflow = requireReasoningProviderWorkflow(aggregate, workflowId)
          const checkback = requireReasoningProviderCheckback(aggregate, workflow.reasoningProviderCheckbackId)
          const providerRequest = requireReasoningProviderRequest(aggregate, workflow.reasoningProviderRequestId)
          const reference = requireReference(aggregate, workflow.editReferenceId)
          assertRevision(workflow.revision, normalized.expectedWorkflowRevision, 'Study Chat provider workflow')
          assertRevision(checkback.revision, normalized.expectedCheckbackRevision, 'Study Chat provider checkback')
          assertRevision(providerRequest.revision, normalized.expectedProviderRequestRevision, 'Study Chat provider request')
          if (normalized.providerRequestId !== (providerRequest.providerRequestId ?? null)) {
            throw new ApiError('VALIDATION_FAILED', 'The authenticated callback does not match the provider request.', 409)
          }
          const existingEvent = workflow.callbackEvents.find(
            (candidate) => candidate.providerEventIdDigestSha256 === providerEventIdDigestSha256,
          )
          if (existingEvent) {
            if (
              existingEvent.callbackEnvelopeDigestSha256 !== normalized.callbackEnvelopeDigestSha256
              || existingEvent.providerRequestIdDigestSha256 !== providerRequestIdDigestSha256
              || hashEditReferenceRequest(existingEvent.authentication)
                !== hashEditReferenceRequest(normalized.authentication)
            ) throw new ApiError('IDEMPOTENCY_CONFLICT', 'The provider callback event already recorded different truth.', 409)
            semanticReplay = true
            return detailData(aggregate, reference)
          }
          if (workflow.callbackEvents.length >= 64) {
            throw new ApiError('VALIDATION_FAILED', 'The provider workflow callback event limit was reached.', 409)
          }
          workflow.callbackEvents.push({
            providerEventIdDigestSha256,
            callbackEnvelopeDigestSha256: normalized.callbackEnvelopeDigestSha256,
            providerRequestIdDigestSha256,
            receivedAt: normalized.receivedAt,
            occurredAt: normalized.occurredAt,
            authentication: structuredClone(normalized.authentication),
            wakeOnly: true,
            providerTruthSettledByCallback: false,
          })
          workflow.callbackWakeCount += 1
          workflow.revision += 1
          if (workflow.state === 'scheduled') {
            if (Date.parse(normalized.receivedAt) <= Date.parse(workflow.deadlineAt)) {
              workflow.nextRunAt = Date.parse(normalized.receivedAt) < Date.parse(workflow.nextRunAt)
                ? normalized.receivedAt
                : workflow.nextRunAt
              if (
                checkback.state === 'scheduled'
                && Date.parse(normalized.receivedAt) <= Date.parse(checkback.deadlineAt)
              ) {
                checkback.revision += 1
                checkback.nextCheckAt = Date.parse(normalized.receivedAt) < Date.parse(checkback.nextCheckAt)
                  ? normalized.receivedAt
                  : checkback.nextCheckAt
                checkback.updatedAt = now
              }
              workflow.lastOutcome = 'callback_wake_recorded'
              workflow.lastOutcomeCheckbackRevision = checkback.revision
            } else {
              markReasoningProviderWorkflowReview(workflow, checkback, 'automatic_workflow_exhausted', now, false)
            }
          }
          workflow.updatedAt = now
          reference.updatedAt = now
          addAuditEvent({
            ...workflowAudit(workflow, 'preference_study_reasoning_provider_workflow_callback_wake'),
            providerObservationIdDigestSha256: providerEventIdDigestSha256,
            providerObservationDigestSha256: normalized.callbackEnvelopeDigestSha256,
          })
          return detailData(aggregate, reference)
        },
      })
      const aggregate = await requireAggregateAfterReasoningMutation(repository, requestedScope)
      const workflow = requireReasoningProviderWorkflow(aggregate, workflowId)
      const event = workflow.callbackEvents.find(
        (candidate) => candidate.providerEventIdDigestSha256 === providerEventIdDigestSha256,
      )
      if (!event) throw new ApiError('INTERNAL_ERROR', 'The authenticated provider callback wake did not persist.', 500)
      return result({
        workflow: structuredClone(workflow),
        disposition: mutation.replayed || semanticReplay
          ? 'idempotent_replay'
          : workflow.state === 'terminal'
            ? 'already_terminal'
            : ['operator_review_required', 'cancelled'].includes(workflow.state)
              ? 'workflow_stopped'
            : event.receivedAt === normalized.receivedAt && workflow.updatedAt === aggregate.updatedAt
              ? 'wake_recorded'
              : 'idempotent_replay',
        callbackAuthenticated: true,
        callbackWakeOnly: true,
        providerTruthSettledByCallback: false,
      }, mutation.replayed)
    },

    async settleStudyChatProviderWorkflow(workflowId, input, idempotencyKey) {
      const normalized = normalizeReasoningProviderWorkflowSettlement(input)
      const committedIdempotencyKey = requireIdempotencyKey(idempotencyKey)
      const leaseTokenHashSha256 = hashEditReferenceStudyChatProviderWorkflowLeaseToken(normalized.leaseToken)
      const leaseOwnerIdDigestSha256 = sha256Text(normalized.workerId)
      const requestedScope = scope(normalized.workspaceId)
      const mutation = await repository.mutate({
        scope: requestedScope,
        operation: 'preference_study.reasoning_provider_workflow.settle',
        idempotencyKey: committedIdempotencyKey,
        requestHash: hashEditReferenceRequest({
          workflowId,
          expectedWorkflowRevision: normalized.expectedWorkflowRevision,
          expectedCheckbackRevision: normalized.expectedCheckbackRevision,
          leaseTokenHashSha256,
          leaseOwnerIdDigestSha256,
          outcome: normalized.outcome,
          nextRunAt: normalized.nextRunAt,
        }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const workflow = requireReasoningProviderWorkflow(aggregate, workflowId)
          const checkback = requireReasoningProviderCheckback(aggregate, workflow.reasoningProviderCheckbackId)
          const reference = requireReference(aggregate, workflow.editReferenceId)
          if (workflow.state === 'terminal') {
            if (normalized.outcome !== 'terminal_settled' || checkback.state !== 'terminal') {
              throw new ApiError('IDEMPOTENCY_CONFLICT', 'The provider workflow already settled different truth.', 409)
            }
            return detailData(aggregate, reference)
          }
          assertRevision(workflow.revision, normalized.expectedWorkflowRevision, 'Study Chat provider workflow')
          assertRevision(checkback.revision, normalized.expectedCheckbackRevision, 'Study Chat provider checkback')
          if (
            workflow.state !== 'leased'
            || workflow.activeLeaseTokenHashSha256 !== leaseTokenHashSha256
            || workflow.activeLeaseOwnerIdDigestSha256 !== leaseOwnerIdDigestSha256
            || !workflow.leaseExpiresAt
            || Date.parse(workflow.leaseExpiresAt) <= Date.parse(now)
          ) throw new ApiError('VERSION_CONFLICT', 'The provider workflow lease is missing, stale, or foreign.', 409)
          assertReasoningProviderWorkflowOutcomeMatchesCheckback(normalized.outcome, checkback)
          clearReasoningProviderWorkflowLease(workflow)
          workflow.lastRunCompletedAt = now
          workflow.lastOutcome = normalized.outcome
          workflow.lastOutcomeCheckbackRevision = checkback.revision
          workflow.revision += 1
          workflow.updatedAt = now

          // Provider lookup and reconciliation can consume the entire requested
          // delay while the workflow lease remains valid. In that boundary case,
          // persist an immediate due time rather than losing the completed run.
          const effectiveNextRunAt = normalized.nextRunAt === null
            ? null
            : Date.parse(normalized.nextRunAt) <= Date.parse(now)
              ? now
              : normalized.nextRunAt

          let eventType: string
          if (normalized.outcome === 'terminal_settled') {
            markReasoningProviderWorkflowTerminal(workflow, checkback, now, false)
            eventType = 'preference_study_reasoning_provider_workflow_terminal'
          } else if (['operator_review_required', 'invalid_provider_observation'].includes(normalized.outcome)) {
            markReasoningProviderWorkflowReview(workflow, checkback, normalized.outcome, now, false)
            eventType = 'preference_study_reasoning_provider_workflow_review_required'
          } else if (
            workflow.workflowRunCount >= workflow.maxWorkflowRuns
            || Date.parse(now) >= Date.parse(workflow.deadlineAt)
            || Date.parse(effectiveNextRunAt as string) > Date.parse(workflow.deadlineAt)
          ) {
            markReasoningProviderWorkflowReview(workflow, checkback, 'automatic_workflow_exhausted', now, false)
            eventType = 'preference_study_reasoning_provider_workflow_exhausted'
          } else {
            workflow.state = 'scheduled'
            workflow.nextRunAt = effectiveNextRunAt as string
            workflow.operatorReviewRequired = false
            workflow.automaticWorkflowStopped = false
            delete workflow.stopReason
            delete workflow.stoppedAt
            delete workflow.terminalAt
            eventType = 'preference_study_reasoning_provider_workflow_rescheduled'
          }
          reference.updatedAt = now
          addAuditEvent(workflowAudit(workflow, eventType))
          return detailData(aggregate, reference)
        },
      })
      const aggregate = await requireAggregateAfterReasoningMutation(repository, requestedScope)
      const workflow = requireReasoningProviderWorkflow(aggregate, workflowId)
      return result({
        workflow: structuredClone(workflow),
        disposition: mutation.replayed
          ? 'idempotent_replay'
          : workflow.state === 'terminal'
            ? 'terminal'
            : workflow.state === 'scheduled'
              ? 'rescheduled'
              : workflow.state === 'operator_review_required'
                && workflow.lastOutcome === 'automatic_workflow_exhausted'
                ? 'automatic_workflow_exhausted'
                : 'operator_review_required',
        providerSubmissionAllowed: false,
        providerResubmissionAllowed: false,
      }, mutation.replayed)
    },

    async stopStudyChatProviderWorkflow(workflowId, input, idempotencyKey) {
      const normalized = normalizeReasoningProviderWorkflowStop(input)
      const committedIdempotencyKey = requireIdempotencyKey(idempotencyKey)
      const requestedScope = scope(normalized.workspaceId)
      const mutation = await repository.mutate({
        scope: requestedScope,
        operation: 'preference_study.reasoning_provider_workflow.stop',
        idempotencyKey: committedIdempotencyKey,
        requestHash: hashEditReferenceRequest({ workflowId, ...normalized }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const workflow = requireReasoningProviderWorkflow(aggregate, workflowId)
          const checkback = requireReasoningProviderCheckback(aggregate, workflow.reasoningProviderCheckbackId)
          const reference = requireReference(aggregate, workflow.editReferenceId)
          if (workflow.state === 'terminal' || workflow.state === 'cancelled') return detailData(aggregate, reference)
          assertRevision(workflow.revision, normalized.expectedWorkflowRevision, 'Study Chat provider workflow')
          if (workflow.state === 'leased') {
            throw new ApiError('VERSION_CONFLICT', 'An active provider workflow lease must settle or expire before stop.', 409)
          }
          const providerWasTerminal = checkback.state === 'terminal'
          if (providerWasTerminal) {
            markReasoningProviderWorkflowTerminal(workflow, checkback, now)
          } else {
            workflow.state = 'cancelled'
            workflow.revision += 1
            workflow.operatorReviewRequired = true
            workflow.automaticWorkflowStopped = true
            workflow.stopReason = normalized.stopReason
            workflow.stoppedAt = now
            workflow.lastOutcome = 'cancelled'
            workflow.lastOutcomeCheckbackRevision = checkback.revision
            workflow.updatedAt = now
          }
          reference.updatedAt = now
          addAuditEvent(workflowAudit(
            workflow,
            providerWasTerminal
              ? 'preference_study_reasoning_provider_workflow_terminal_recovered'
              : 'preference_study_reasoning_provider_workflow_stopped',
          ))
          return detailData(aggregate, reference)
        },
      })
      const aggregate = await requireAggregateAfterReasoningMutation(repository, requestedScope)
      const workflow = requireReasoningProviderWorkflow(aggregate, workflowId)
      return result({
        workflow: structuredClone(workflow),
        disposition: mutation.replayed
          ? 'idempotent_replay'
          : workflow.state === 'terminal'
            ? 'terminal'
            : 'stopped',
        providerCancellationAttempted: false,
        providerResubmissionAllowed: false,
      }, mutation.replayed)
    },

    async resumeStudyChatProviderWorkflow(workflowId, input, idempotencyKey) {
      const normalized = normalizeReasoningProviderWorkflowResume(input)
      const committedIdempotencyKey = requireIdempotencyKey(idempotencyKey)
      const operatorRecoveryCommandDigestSha256 = sha256Text(normalized.operatorRecoveryCommandId)
      const requestedScope = scope(normalized.workspaceId)
      const mutation = await repository.mutate({
        scope: requestedScope,
        operation: 'preference_study.reasoning_provider_workflow.resume',
        idempotencyKey: committedIdempotencyKey,
        requestHash: hashEditReferenceRequest({
          workflowId,
          ...normalized,
          operatorRecoveryCommandId: operatorRecoveryCommandDigestSha256,
        }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const workflow = requireReasoningProviderWorkflow(aggregate, workflowId)
          const checkback = requireReasoningProviderCheckback(aggregate, workflow.reasoningProviderCheckbackId)
          const providerRequest = requireReasoningProviderRequest(aggregate, workflow.reasoningProviderRequestId)
          const reference = requireReference(aggregate, workflow.editReferenceId)
          if (workflow.state === 'terminal') return detailData(aggregate, reference)
          assertRevision(workflow.revision, normalized.expectedWorkflowRevision, 'Study Chat provider workflow')
          assertRevision(checkback.revision, normalized.expectedCheckbackRevision, 'Study Chat provider checkback')
          assertRevision(providerRequest.revision, normalized.expectedProviderRequestRevision, 'Study Chat provider request')
          const providerWasTerminal = checkback.state === 'terminal'
          if (providerWasTerminal) {
            markReasoningProviderWorkflowTerminal(workflow, checkback, now)
          } else {
            if (!['operator_review_required', 'cancelled'].includes(workflow.state)) {
              throw new ApiError('VERSION_CONFLICT', 'Only a stopped provider workflow can receive operator recovery.', 409)
            }
            if (checkback.state !== 'scheduled') {
              throw new ApiError('VERSION_CONFLICT', 'The provider checkback must be resumed before its workflow.', 409)
            }
            if (Date.parse(normalized.deadlineAt) <= Date.parse(now)) {
              throw new ApiError('VALIDATION_FAILED', 'Recovered provider workflow deadline must remain in the future.', 409)
            }
            if (normalized.maxWorkflowRuns <= workflow.workflowRunCount) {
              throw new ApiError('VALIDATION_FAILED', 'Provider workflow recovery must authorize another run.', 409)
            }
            workflow.state = 'scheduled'
            workflow.revision += 1
            workflow.nextRunAt = normalized.nextRunAt
            workflow.deadlineAt = normalized.deadlineAt
            workflow.maxWorkflowRuns = normalized.maxWorkflowRuns
            workflow.operatorReviewRequired = false
            workflow.automaticWorkflowStopped = false
            delete workflow.stopReason
            delete workflow.stoppedAt
            delete workflow.terminalAt
            workflow.operatorRecoveryCount += 1
            workflow.lastOperatorRecoveryCommandDigestSha256 = operatorRecoveryCommandDigestSha256
            workflow.lastOutcome = 'not_run'
            workflow.lastOutcomeCheckbackRevision = checkback.revision
            workflow.updatedAt = now
          }
          reference.updatedAt = now
          addAuditEvent(workflowAudit(
            workflow,
            providerWasTerminal
              ? 'preference_study_reasoning_provider_workflow_terminal_recovered'
              : 'preference_study_reasoning_provider_workflow_operator_resumed',
          ))
          return detailData(aggregate, reference)
        },
      })
      const aggregate = await requireAggregateAfterReasoningMutation(repository, requestedScope)
      const workflow = requireReasoningProviderWorkflow(aggregate, workflowId)
      return result({
        workflow: structuredClone(workflow),
        disposition: mutation.replayed
          ? 'idempotent_replay'
          : workflow.state === 'terminal'
            ? 'terminal'
            : 'resumed',
        providerCancellationAttempted: false,
        providerResubmissionAllowed: false,
      }, mutation.replayed)
    },

    async settleStudyChatReasoningAttempt(attemptId, input, idempotencyKey) {
      const normalized = normalizeReasoningAttemptSettlement(input)
      const committedIdempotencyKey = requireIdempotencyKey(idempotencyKey)
      const resultDigestSha256 = hashEditReferenceRequest(normalized.result)
      const requestedScope = scope(normalized.workspaceId)
      const mutation = await repository.mutate({
        scope: requestedScope,
        operation: 'preference_study.reasoning_attempt.settle',
        idempotencyKey: committedIdempotencyKey,
        requestHash: hashEditReferenceRequest({
          attemptId,
          expectedAttemptRevision: normalized.expectedAttemptRevision,
          resultDigestSha256,
        }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const attempt = requireReasoningAttempt(aggregate, attemptId)
          const reference = requireReference(aggregate, attempt.editReferenceId)
          if (aggregate.reasoningProviderRequests.some(
            (providerRequest) => providerRequest.reasoningAttemptId === attempt.id,
          )) {
            throw new ApiError(
              'VERSION_CONFLICT',
              'A provider-bound reasoning attempt must settle through provider-request reconciliation.',
              409,
            )
          }
          if (['completed', 'failed', 'cost_unverified'].includes(attempt.state)) {
            if (attempt.resultDigestSha256 !== resultDigestSha256) {
              throw new ApiError('IDEMPOTENCY_CONFLICT', 'This reasoning attempt already settled with a different result.', 409)
            }
            return detailData(aggregate, reference)
          }
          if (attempt.state !== 'running') {
            throw new ApiError('VERSION_CONFLICT', 'Only a running reasoning attempt can settle.', 409)
          }
          assertRevision(attempt.revision, normalized.expectedAttemptRevision, 'Study Chat reasoning attempt')
          const eventType = settleStudyChatReasoningAttemptInAggregate({
            aggregate,
            attempt,
            reference,
            now,
            reasoningResult: normalized.result,
          })
          addAuditEvent({
            eventType,
            editReferenceId: reference.id,
            studySessionId: attempt.studySessionId,
            reasoningAttemptId: attempt.id,
          })
          return detailData(aggregate, reference)
        },
      })
      const aggregate = await requireAggregateAfterReasoningMutation(repository, requestedScope)
      return result(structuredClone(requireReasoningAttempt(aggregate, attemptId)), mutation.replayed)
    },

    async cancelStudyChatReasoningAttempt(attemptId, input, idempotencyKey) {
      const normalized = normalizeReasoningAttemptCancellation(input)
      const committedIdempotencyKey = requireIdempotencyKey(idempotencyKey)
      const requestedScope = scope(normalized.workspaceId)
      const mutation = await repository.mutate({
        scope: requestedScope,
        operation: 'preference_study.reasoning_attempt.cancel',
        idempotencyKey: committedIdempotencyKey,
        requestHash: hashEditReferenceRequest({ attemptId, expectedAttemptRevision: normalized.expectedAttemptRevision }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const attempt = requireReasoningAttempt(aggregate, attemptId)
          const reference = requireReference(aggregate, attempt.editReferenceId)
          if (attempt.state === 'cancelled') return detailData(aggregate, reference)
          if (attempt.state !== 'reserved') {
            throw new ApiError('VERSION_CONFLICT', 'Only a reserved reasoning attempt can be cancelled.', 409)
          }
          assertRevision(attempt.revision, normalized.expectedAttemptRevision, 'Study Chat reasoning attempt')
          attempt.state = 'cancelled'
          attempt.revision = 2
          attempt.providerExecutionState = 'not_called'
          attempt.internalCostStatus = 'not_incurred'
          attempt.terminalReason = 'cancelled_before_execution'
          attempt.settledAt = now
          reference.updatedAt = now
          addAuditEvent({
            eventType: 'preference_study_reasoning_attempt_cancelled',
            editReferenceId: reference.id,
            studySessionId: attempt.studySessionId,
            reasoningAttemptId: attempt.id,
          })
          return detailData(aggregate, reference)
        },
      })
      const aggregate = await requireAggregateAfterReasoningMutation(repository, requestedScope)
      return result(structuredClone(requireReasoningAttempt(aggregate, attemptId)), mutation.replayed)
    },

    async reservePreferenceDnaReasoningAttempt(input, idempotencyKey) {
      const normalized = normalizePreferenceDnaReasoningAttemptReservation(input, ownerUserId)
      const committedIdempotencyKey = requireIdempotencyKey(idempotencyKey)
      const reservationIdempotencyKeyHashSha256 = sha256Text(committedIdempotencyKey)
      const requestDigestSha256 = hashEditReferencePreferenceDnaReasoningRequest(normalized.request)
      const requestedScope = scope(normalized.request.workspaceId)
      const mutation = await repository.mutate({
        scope: requestedScope,
        operation: 'preference_study.dna_reasoning_attempt.reserve',
        idempotencyKey: committedIdempotencyKey,
        requestHash: hashEditReferenceRequest({ requestDigestSha256 }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const reference = requireReference(aggregate, normalized.request.editReferenceId)
          const study = requireStudy(aggregate, normalized.request.studySessionId)
          if (study.editReferenceId !== reference.id || reference.currentStudyId !== study.id) {
            throw new ApiError('VERSION_CONFLICT', 'Preference DNA reasoning is limited to the current Preference Study.', 409)
          }
          if (reference.status === 'archived' || study.status === 'archived') {
            throw new ApiError('VALIDATION_FAILED', 'Archived studies cannot reserve Preference DNA reasoning.', 409)
          }
          const duplicate = aggregate.preferenceDnaReasoningAttempts.find((attempt) => (
            attempt.studySessionId === study.id && attempt.requestDigestSha256 === requestDigestSha256
          ))
          if (duplicate) return detailData(aggregate, reference)
          assertRevision(study.revision, normalized.request.expectedStudyRevision, 'Preference Study')
          const context = buildEditReferencePreferenceDnaStructuredContext({ aggregate, studyId: study.id }).context
          if (
            context.inputEvidenceDigestSha256 !== normalized.request.inputEvidenceDigestSha256
            || hashEditReferencePreferenceDnaStructuredContext(context) !== normalized.request.structuredContextDigestSha256
          ) throw new ApiError('VERSION_CONFLICT', 'The exact Preference DNA reasoning context cannot be reserved.', 409)
          const attempt: EditReferencePreferenceDnaReasoningAttemptRecord = {
            schemaVersion: EDIT_REFERENCE_PREFERENCE_DNA_REASONING_ATTEMPT_VERSION,
            id: `edit-reference-preference-dna-reasoning-attempt-${randomUUID()}`,
            workspaceId: reference.workspaceId,
            actorUserId: ownerUserId,
            editReferenceId: reference.id,
            studySessionId: study.id,
            revision: 1,
            state: 'reserved',
            request: structuredClone(normalized.request),
            requestDigestSha256,
            studyRevisionAtReservation: study.revision,
            reservationIdempotencyKeyHashSha256,
            providerExecutionState: 'not_started',
            internalCostStatus: 'not_incurred',
            meteredInternalCostMicros: null,
            usageEventIds: [],
            internalCostRecordIds: [],
            candidateHandoffAllowed: false,
            deterministicFallbackEligible: false,
            qwenAuthoredDnaVersionCreated: false,
            dnaVersionPersisted: false,
            qaResultPersisted: false,
            deterministicDnaAuthorityReplaced: false,
            customerPriceCalculated: false,
            customerCreditsMutated: false,
            serviceFeeIncluded: false,
            createdAt: now,
            reservedAt: now,
            privateInternalOnly: true,
          }
          aggregate.preferenceDnaReasoningAttempts.push(attempt)
          addAuditEvent({
            eventType: 'preference_dna_reasoning_attempt_reserved',
            editReferenceId: reference.id,
            studySessionId: study.id,
            preferenceDnaReasoningAttemptId: attempt.id,
          })
          return detailData(aggregate, reference)
        },
      })
      const aggregate = await requireAggregateAfterReasoningMutation(repository, requestedScope)
      const attempt = requirePreferenceDnaReasoningAttemptByRequestDigest(
        aggregate,
        normalized.request.studySessionId,
        requestDigestSha256,
      )
      return result({
        attempt: structuredClone(attempt),
        disposition: mutation.replayed
          ? 'idempotent_replay'
          : attempt.reservationIdempotencyKeyHashSha256 === reservationIdempotencyKeyHashSha256
            ? 'created'
            : 'request_deduplicated',
      }, mutation.replayed)
    },

    async startPreferenceDnaReasoningAttempt(attemptId, input, idempotencyKey) {
      const normalized = normalizePreferenceDnaReasoningAttemptStart(input)
      const committedIdempotencyKey = requireIdempotencyKey(idempotencyKey)
      const executionIdempotencyKeyHashSha256 = sha256Text(committedIdempotencyKey)
      const executionCommandDigestSha256 = sha256Text(normalized.executionCommandId)
      const requestedScope = scope(normalized.workspaceId)
      const mutation = await repository.mutate({
        scope: requestedScope,
        operation: 'preference_study.dna_reasoning_attempt.start',
        idempotencyKey: committedIdempotencyKey,
        requestHash: hashEditReferenceRequest({
          attemptId,
          expectedAttemptRevision: normalized.expectedAttemptRevision,
          executionCommandDigestSha256,
        }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const attempt = requirePreferenceDnaReasoningAttempt(aggregate, attemptId)
          const reference = requireReference(aggregate, attempt.editReferenceId)
          const study = requireStudy(aggregate, attempt.studySessionId)
          if (attempt.state === 'running') {
            if (attempt.executionCommandDigestSha256 !== executionCommandDigestSha256) {
              throw new ApiError('VERSION_CONFLICT', 'This Preference DNA reasoning attempt already consumed execution authority.', 409)
            }
            return detailData(aggregate, reference)
          }
          if (attempt.state !== 'reserved') {
            throw new ApiError('VERSION_CONFLICT', 'Only a reserved Preference DNA reasoning attempt can start.', 409)
          }
          assertRevision(attempt.revision, normalized.expectedAttemptRevision, 'Preference DNA reasoning attempt')
          if (reference.currentStudyId !== study.id || study.revision !== attempt.studyRevisionAtReservation) {
            throw new ApiError('VERSION_CONFLICT', 'The Preference Study changed before Preference DNA reasoning could start.', 409)
          }
          const context = buildEditReferencePreferenceDnaStructuredContext({ aggregate, studyId: study.id }).context
          if (
            context.inputEvidenceDigestSha256 !== attempt.request.inputEvidenceDigestSha256
            || hashEditReferencePreferenceDnaStructuredContext(context) !== attempt.request.structuredContextDigestSha256
          ) throw new ApiError('VERSION_CONFLICT', 'The exact Preference DNA reasoning context cannot be reconstructed.', 409)
          attempt.state = 'running'
          attempt.revision = 2
          attempt.executionCommandDigestSha256 = executionCommandDigestSha256
          attempt.executionIdempotencyKeyHashSha256 = executionIdempotencyKeyHashSha256
          attempt.providerExecutionState = 'execution_authorized_once'
          attempt.startedAt = now
          addAuditEvent({
            eventType: 'preference_dna_reasoning_attempt_started',
            editReferenceId: reference.id,
            studySessionId: study.id,
            preferenceDnaReasoningAttemptId: attempt.id,
          })
          return detailData(aggregate, reference)
        },
      })
      const aggregate = await requireAggregateAfterReasoningMutation(repository, requestedScope)
      const attempt = requirePreferenceDnaReasoningAttempt(aggregate, attemptId)
      const providerCallAuthorized = !mutation.replayed
        && attempt.state === 'running'
        && attempt.executionCommandDigestSha256 === executionCommandDigestSha256
        && attempt.executionIdempotencyKeyHashSha256 === executionIdempotencyKeyHashSha256
      return result({
        attempt: structuredClone(attempt),
        disposition: providerCallAuthorized
          ? 'authorized_once'
          : mutation.replayed ? 'idempotent_replay_blocked' : 'duplicate_command_blocked',
        providerCallAuthorized,
      }, mutation.replayed)
    },

    async settlePreferenceDnaReasoningAttempt(attemptId, input, idempotencyKey) {
      const normalized = normalizePreferenceDnaReasoningAttemptSettlement(input)
      const committedIdempotencyKey = requireIdempotencyKey(idempotencyKey)
      const resultDigestSha256 = hashEditReferencePreferenceDnaReasoningResult(normalized.result)
      const requestedScope = scope(normalized.workspaceId)
      const mutation = await repository.mutate({
        scope: requestedScope,
        operation: 'preference_study.dna_reasoning_attempt.settle',
        idempotencyKey: committedIdempotencyKey,
        requestHash: hashEditReferenceRequest({
          attemptId,
          expectedAttemptRevision: normalized.expectedAttemptRevision,
          resultDigestSha256,
        }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const attempt = requirePreferenceDnaReasoningAttempt(aggregate, attemptId)
          const reference = requireReference(aggregate, attempt.editReferenceId)
          const study = requireStudy(aggregate, attempt.studySessionId)
          if (['completed', 'blocked', 'cost_unverified'].includes(attempt.state)) {
            if (attempt.resultDigestSha256 !== resultDigestSha256) {
              throw new ApiError('IDEMPOTENCY_CONFLICT', 'This Preference DNA attempt already settled differently.', 409)
            }
            return detailData(aggregate, reference)
          }
          if (attempt.state !== 'running') {
            throw new ApiError('VERSION_CONFLICT', 'Only a running Preference DNA reasoning attempt can settle.', 409)
          }
          assertRevision(attempt.revision, normalized.expectedAttemptRevision, 'Preference DNA reasoning attempt')
          try {
            validateEditReferencePreferenceDnaReasoningResult(attempt.request, normalized.result)
          } catch {
            throw new ApiError('VALIDATION_FAILED', 'The Preference DNA reasoning settlement result is invalid.', 400)
          }
          const cost = preferenceDnaReasoningResultCost(normalized.result)
          attempt.revision = 3
          attempt.result = structuredClone(normalized.result)
          attempt.resultDigestSha256 = resultDigestSha256
          attempt.providerExecutionState = cost.providerExecutionState
          attempt.internalCostStatus = cost.internalCostStatus
          attempt.meteredInternalCostMicros = cost.meteredInternalCostMicros
          attempt.usageEventIds = [...cost.usageEventIds]
          attempt.internalCostRecordIds = [...cost.internalCostRecordIds]
          attempt.settledAt = now
          if (normalized.result.status === 'validated_candidate') {
            if (study.revision === attempt.studyRevisionAtReservation && reference.currentStudyId === study.id) {
              attempt.state = 'completed'
              attempt.candidateHandoffAllowed = true
              attempt.deterministicFallbackEligible = false
              delete attempt.terminalReason
            } else {
              attempt.state = 'blocked'
              attempt.candidateHandoffAllowed = false
              attempt.deterministicFallbackEligible = false
              attempt.terminalReason = 'study_revision_advanced'
            }
          } else {
            attempt.state = normalized.result.internalCostStatus === 'unverified' ? 'cost_unverified' : 'blocked'
            attempt.candidateHandoffAllowed = false
            attempt.deterministicFallbackEligible = (
              ['model_routing_unavailable', 'reasoning_unavailable'].includes(normalized.result.blockerCode)
              && normalized.result.internalCostStatus !== 'unverified'
            )
            attempt.terminalReason = normalized.result.blockerCode
          }
          addAuditEvent({
            eventType: attempt.state === 'completed'
              ? 'preference_dna_reasoning_attempt_completed'
              : attempt.state === 'cost_unverified'
                ? 'preference_dna_reasoning_attempt_cost_unverified'
                : 'preference_dna_reasoning_attempt_blocked',
            editReferenceId: reference.id,
            studySessionId: study.id,
            preferenceDnaReasoningAttemptId: attempt.id,
          })
          return detailData(aggregate, reference)
        },
      })
      const aggregate = await requireAggregateAfterReasoningMutation(repository, requestedScope)
      return result(structuredClone(requirePreferenceDnaReasoningAttempt(aggregate, attemptId)), mutation.replayed)
    },

    async cancelPreferenceDnaReasoningAttempt(attemptId, input, idempotencyKey) {
      const normalized = normalizePreferenceDnaReasoningAttemptCancellation(input)
      const committedIdempotencyKey = requireIdempotencyKey(idempotencyKey)
      const requestedScope = scope(normalized.workspaceId)
      const mutation = await repository.mutate({
        scope: requestedScope,
        operation: 'preference_study.dna_reasoning_attempt.cancel',
        idempotencyKey: committedIdempotencyKey,
        requestHash: hashEditReferenceRequest({ attemptId, expectedAttemptRevision: normalized.expectedAttemptRevision }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const attempt = requirePreferenceDnaReasoningAttempt(aggregate, attemptId)
          const reference = requireReference(aggregate, attempt.editReferenceId)
          if (attempt.state === 'cancelled') return detailData(aggregate, reference)
          if (attempt.state !== 'reserved') {
            throw new ApiError('VERSION_CONFLICT', 'Only a reserved Preference DNA reasoning attempt can be cancelled.', 409)
          }
          assertRevision(attempt.revision, normalized.expectedAttemptRevision, 'Preference DNA reasoning attempt')
          attempt.state = 'cancelled'
          attempt.revision = 2
          attempt.providerExecutionState = 'not_called'
          attempt.internalCostStatus = 'not_incurred'
          attempt.candidateHandoffAllowed = false
          attempt.deterministicFallbackEligible = false
          attempt.terminalReason = 'cancelled_before_execution'
          attempt.settledAt = now
          addAuditEvent({
            eventType: 'preference_dna_reasoning_attempt_cancelled',
            editReferenceId: reference.id,
            studySessionId: attempt.studySessionId,
            preferenceDnaReasoningAttemptId: attempt.id,
          })
          return detailData(aggregate, reference)
        },
      })
      const aggregate = await requireAggregateAfterReasoningMutation(repository, requestedScope)
      return result(structuredClone(requirePreferenceDnaReasoningAttempt(aggregate, attemptId)), mutation.replayed)
    },

    async materializePreferenceDnaReasoningCandidate(attemptId, input, idempotencyKey) {
      const normalized = normalizePreferenceDnaReasoningCandidateMaterialization(input)
      const committedIdempotencyKey = requireIdempotencyKey(idempotencyKey)
      const requestedScope = scope(normalized.workspaceId)
      const mutation = await repository.mutate({
        scope: requestedScope,
        operation: 'preference_study.dna_reasoning_candidate.materialize_and_qa',
        idempotencyKey: committedIdempotencyKey,
        requestHash: hashEditReferenceRequest({ attemptId, ...normalized }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const attempt = requirePreferenceDnaReasoningAttempt(aggregate, attemptId)
          const reference = requireReference(aggregate, attempt.editReferenceId)
          const study = requireStudy(aggregate, attempt.studySessionId)
          const existingVersion = aggregate.dnaVersions.find((record) => (
            record.reasoningProvenance?.reasoningAttemptId === attempt.id
          ))
          if (existingVersion) {
            if (existingVersion.reasoningProvenance?.resultDigestSha256 !== normalized.expectedResultDigestSha256) {
              throw new ApiError('IDEMPOTENCY_CONFLICT', 'This reasoning attempt was materialized from a different result.', 409)
            }
            return detailData(aggregate, reference)
          }
          assertActiveStudy(reference, study)
          assertRevision(attempt.revision, normalized.expectedAttemptRevision, 'Preference DNA reasoning attempt')
          assertRevision(study.revision, normalized.expectedStudyRevision, 'Preference Study')
          if (
            attempt.state !== 'completed'
            || !attempt.candidateHandoffAllowed
            || attempt.resultDigestSha256 !== normalized.expectedResultDigestSha256
          ) throw new ApiError('VALIDATION_FAILED', 'The exact completed Preference DNA candidate is not eligible for materialization.', 409)
          const context = buildEditReferencePreferenceDnaStructuredContext({ aggregate, studyId: study.id }).context
          if (
            context.inputEvidenceDigestSha256 !== attempt.request.inputEvidenceDigestSha256
            || hashEditReferencePreferenceDnaStructuredContext(context) !== attempt.request.structuredContextDigestSha256
          ) throw new ApiError('VERSION_CONFLICT', 'The exact Preference DNA candidate context cannot be reconstructed.', 409)
          const dnaVersion = materializeEditReferencePreferenceDnaReasoningCandidate({
            reference,
            study,
            evidence: aggregate.evidence.filter((record) => record.studySessionId === study.id),
            inputEvidenceRevisions: context.evidenceItems.map((record) => ({
              evidenceId: record.evidenceId,
              revision: record.revision,
            })),
            existingVersions: aggregate.dnaVersions.filter((record) => record.studySessionId === study.id),
            attempt,
            now,
          })
          for (const previousVersion of aggregate.dnaVersions.filter((record) => (
            record.studySessionId === study.id
            && record.status !== 'approved'
            && record.status !== 'superseded'
          ))) {
            previousVersion.status = 'superseded'
            previousVersion.supersededAt = now
          }
          aggregate.dnaVersions.push(dnaVersion)
          const qaResult = runEditReferenceDNAQA({
            reference,
            study,
            dnaVersion,
            evidence: aggregate.evidence.filter((record) => record.studySessionId === study.id),
            reasoningAttempt: attempt,
            now,
          })
          aggregate.dnaQaResults.push(qaResult)
          dnaVersion.qaStatus = qaResult.status
          dnaVersion.qaResultId = qaResult.id
          study.status = qaResult.status === 'blocked' ? 'qa_blocked' : 'needs_user_review'
          study.dnaStatus = 'review_required'
          study.qaStatus = qaResult.status
          study.revision += 1
          study.updatedAt = now
          reference.dnaStatus = 'review_required'
          reference.qaStatus = qaResult.status
          reference.updatedAt = now
          aggregate.messages.push(dnaSynthesisMessage(reference, study, dnaVersion, now, nextSequence(aggregate, study.id)))
          aggregate.messages.push(dnaQAMessage(reference, study, qaResult, now, nextSequence(aggregate, study.id)))
          aggregate.usageLogs.push(usageLog(reference, 'dna_version_created', now))
          aggregate.usageLogs.push(usageLog(reference, 'dna_qa_completed', now))
          addAuditEvent({
            eventType: 'preference_dna_reasoning_candidate_materialized',
            editReferenceId: reference.id,
            studySessionId: study.id,
            preferenceDnaReasoningAttemptId: attempt.id,
            dnaVersionId: dnaVersion.id,
          })
          addAuditEvent({
            eventType: 'preference_dna_qa_completed',
            editReferenceId: reference.id,
            studySessionId: study.id,
            preferenceDnaReasoningAttemptId: attempt.id,
            dnaVersionId: dnaVersion.id,
            dnaQaResultId: qaResult.id,
          })
          return detailData(aggregate, reference)
        },
      })
      return result(mutation.data, mutation.replayed)
    },

    async createReference(input, idempotencyKey) {
      const normalized = normalizeCreateReference(input)
      const mutation = await repository.mutate({
        scope: scope(normalized.workspaceId),
        operation: 'edit_reference.create',
        idempotencyKey: requireIdempotencyKey(idempotencyKey),
        requestHash: hashEditReferenceRequest(normalized),
        command: {
          schemaVersion: EDIT_REFERENCE_DOMAIN_COMMAND_CONTRACT_VERSION,
          operation: 'edit_reference.create',
          request: normalized,
        },
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const referenceId = `edit-reference-${randomUUID()}`
          const studyId = `preference-study-${randomUUID()}`
          const reference: EditReferenceRecord = {
            id: referenceId,
            workspaceId: normalized.workspaceId,
            name: normalized.name,
            ...(normalized.description ? { description: normalized.description } : {}),
            status: 'active',
            initialGoals: normalized.initialGoals,
            currentStudyId: studyId,
            revision: 1,
            createdAt: now,
            updatedAt: now,
            runtimeSource: 'backend_local_private',
            evidenceStatus: 'not_complete',
            dnaStatus: 'not_generated',
            qaStatus: 'not_run',
          }
          const studyTitle = /\bstudy$/i.test(reference.name) ? reference.name : `${reference.name} study`
          const study = createStudyRecord(reference, studyId, studyTitle, now)
          aggregate.references.push(reference)
          aggregate.studies.push(study)
          aggregate.messages.push(...setupMessages(reference, study, now))
          aggregate.usageLogs.push(
            usageLog(reference, 'created', now),
            usageLog(reference, 'study_created', now),
          )
          addAuditEvent({ eventType: 'edit_reference_created', editReferenceId: reference.id, studySessionId: study.id })
          return detailData(aggregate, reference)
        },
      })
      return result(mutation.data, mutation.replayed)
    },

    async updateReference(referenceId, input, idempotencyKey) {
      const normalized = normalizeUpdateReference(input)
      const mutation = await repository.mutate({
        scope: scope(normalized.workspaceId),
        operation: 'edit_reference.update',
        idempotencyKey: requireIdempotencyKey(idempotencyKey),
        requestHash: hashEditReferenceRequest({ referenceId, ...normalized }),
        command: {
          schemaVersion: EDIT_REFERENCE_DOMAIN_COMMAND_CONTRACT_VERSION,
          operation: 'edit_reference.update',
          request: { referenceId, input: normalized },
        },
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const reference = requireReference(aggregate, referenceId)
          assertRevision(reference.revision, normalized.expectedReferenceRevision, 'Edit Reference')
          if (normalized.name !== undefined) reference.name = normalized.name
          if (normalized.description !== undefined) {
            if (normalized.description) reference.description = normalized.description
            else delete reference.description
          }
          if (normalized.status === 'archived') {
            reference.status = 'archived'
            const study = requireStudy(aggregate, reference.currentStudyId)
            study.status = 'archived'
            study.revision += 1
            study.updatedAt = now
          }
          reference.revision += 1
          reference.updatedAt = now
          aggregate.usageLogs.push(usageLog(reference, normalized.status === 'archived' ? 'archived' : 'updated', now))
          addAuditEvent({ eventType: normalized.status === 'archived' ? 'edit_reference_archived' : 'edit_reference_updated', editReferenceId: reference.id })
          return detailData(aggregate, reference)
        },
      })
      return result(mutation.data, mutation.replayed)
    },

    async createStudy(referenceId, input, idempotencyKey) {
      const normalized = normalizeCreateStudy(input)
      const mutation = await repository.mutate({
        scope: scope(normalized.workspaceId),
        operation: 'preference_study.create',
        idempotencyKey: requireIdempotencyKey(idempotencyKey),
        requestHash: hashEditReferenceRequest({ referenceId, ...normalized }),
        command: {
          schemaVersion: EDIT_REFERENCE_DOMAIN_COMMAND_CONTRACT_VERSION,
          operation: 'preference_study.create',
          request: { referenceId, input: normalized },
        },
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const reference = requireReference(aggregate, referenceId)
          if (reference.status === 'archived') throw new ApiError('VALIDATION_FAILED', 'Archived Edit References cannot start a new study.', 409)
          assertRevision(reference.revision, normalized.expectedReferenceRevision, 'Edit Reference')
          const study = createStudyRecord(reference, `preference-study-${randomUUID()}`, normalized.title, now)
          aggregate.studies.push(study)
          aggregate.messages.push(...setupMessages(reference, study, now))
          reference.currentStudyId = study.id
          reference.evidenceStatus = 'not_complete'
          reference.dnaStatus = 'not_generated'
          reference.qaStatus = 'not_run'
          reference.revision += 1
          reference.updatedAt = now
          aggregate.usageLogs.push(usageLog(reference, 'study_created', now))
          addAuditEvent({ eventType: 'preference_study_created', editReferenceId: reference.id, studySessionId: study.id })
          return detailData(aggregate, reference)
        },
      })
      return result(mutation.data, mutation.replayed)
    },

    async updateStudy(studyId, input, idempotencyKey) {
      const normalized = normalizeUpdateStudy(input)
      const mutation = await repository.mutate({
        scope: scope(normalized.workspaceId),
        operation: 'preference_study.update',
        idempotencyKey: requireIdempotencyKey(idempotencyKey),
        requestHash: hashEditReferenceRequest({ studyId, ...normalized }),
        command: {
          schemaVersion: EDIT_REFERENCE_DOMAIN_COMMAND_CONTRACT_VERSION,
          operation: 'preference_study.update',
          request: { studyId, input: normalized },
        },
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const study = requireStudy(aggregate, studyId)
          assertRevision(study.revision, normalized.expectedStudyRevision, 'Preference Study')
          if (normalized.title !== undefined) study.title = normalized.title
          if (normalized.status !== undefined) {
            assertStudyTransition(study.status, normalized.status)
            study.status = normalized.status
          }
          study.revision += 1
          study.updatedAt = now
          const reference = requireReference(aggregate, study.editReferenceId)
          reference.updatedAt = now
          addAuditEvent({ eventType: 'preference_study_updated', editReferenceId: reference.id, studySessionId: study.id })
          return detailData(aggregate, reference)
        },
      })
      return result(mutation.data, mutation.replayed)
    },

    async appendMessage(studyId, input, idempotencyKey) {
      const normalized = normalizeAppendMessage(input)
      const mutation = await repository.mutate({
        scope: scope(normalized.workspaceId),
        operation: 'preference_study.message.append',
        idempotencyKey: requireIdempotencyKey(idempotencyKey),
        requestHash: hashEditReferenceRequest({ studyId, ...normalized }),
        command: {
          schemaVersion: EDIT_REFERENCE_DOMAIN_COMMAND_CONTRACT_VERSION,
          operation: 'preference_study.message.append',
          request: { studyId, input: normalized },
        },
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const study = requireStudy(aggregate, studyId)
          const reference = requireReference(aggregate, study.editReferenceId)
          if (reference.status === 'archived' || study.status === 'archived') {
            throw new ApiError('VALIDATION_FAILED', 'Archived studies cannot accept messages.', 409)
          }
          assertRevision(study.revision, normalized.expectedStudyRevision, 'Preference Study')
          const existingClientMessage = aggregate.messages.find((message) => message.clientMessageId === normalized.clientMessageId)
          if (existingClientMessage) {
            throw new ApiError('IDEMPOTENCY_CONFLICT', 'The client message ID was already used.', 409)
          }
          let correctionEvidence: PreferenceEvidenceRecord | undefined
          let correctionTargetTitle: string | undefined
          if (normalized.findingCorrectionEvidenceId) {
            assertActiveStudy(reference, study)
            const superseded = aggregate.evidence.find((record) => record.id === normalized.findingCorrectionEvidenceId)
            if (!superseded || superseded.studySessionId !== study.id || superseded.sourceType !== 'manual_user_evidence') {
              throw new ApiError('VALIDATION_FAILED', 'A Study Chat correction must replace saved creative evidence in this study.', 409)
            }
            if (aggregate.evidence.some((record) => record.supersedesEvidenceId === superseded.id)) {
              throw new ApiError('VERSION_CONFLICT', 'That evidence already has a newer correction. Reload before saving.', 409)
            }
            correctionTargetTitle = superseded.title
            correctionEvidence = createEvidenceRecords(reference, study, {
              workspaceId: normalized.workspaceId,
              expectedStudyRevision: normalized.expectedStudyRevision,
              sourceType: 'manual_user_evidence',
              title: `${superseded.title} — Study Chat correction`.slice(0, 160),
              category: requireManualEvidenceCategory(superseded.category),
              summary: normalized.content,
              intendedUse: requireCorrectionTransferability(superseded.transferability),
              supersedesEvidenceId: superseded.id,
            }, now).evidence
          }
          const chatDirectionEvidence = correctionEvidence
            ? undefined
            : createEvidenceRecords(reference, study, {
              workspaceId: normalized.workspaceId,
              expectedStudyRevision: normalized.expectedStudyRevision,
              sourceType: 'manual_user_evidence',
              title: `Study Chat direction ${aggregate.evidence.filter((record) => (
                record.studySessionId === study.id && record.sourceType === 'manual_user_evidence'
              )).length + 1}`,
              category: 'all_goals',
              summary: normalized.content,
              intendedUse: 'transferable',
            }, now).evidence
          const savedDirectionEvidence = correctionEvidence ?? chatDirectionEvidence
          if (!savedDirectionEvidence) {
            throw new ApiError('INTERNAL_ERROR', 'The Study Chat direction could not be saved as reviewable evidence.', 500)
          }
          const sequence = nextSequence(aggregate, study.id)
          const userMessage: PreferenceStudyMessageRecord = {
            id: `preference-study-message-${randomUUID()}`,
            workspaceId: reference.workspaceId,
            editReferenceId: reference.id,
            studySessionId: study.id,
            role: 'user',
            content: normalized.content,
            sequence,
            clientMessageId: normalized.clientMessageId,
            runtimeSource: 'user_input',
            createdAt: now,
          }
          const assistantMessage: PreferenceStudyMessageRecord = {
            id: `preference-study-message-${randomUUID()}`,
            workspaceId: reference.workspaceId,
            editReferenceId: reference.id,
            studySessionId: study.id,
            role: 'assistant',
            content: correctionEvidence
              ? `Your Study Chat correction replaced “${correctionTargetTitle ?? 'the selected evidence'}” as a new evidence version. Run the evidence study again before generating or using Preference DNA.`
              : deterministicAcknowledgement(reference),
            sequence: sequence + 1,
            runtimeSource: 'deterministic_evidence',
            createdAt: now,
          }
          const appendedMessageIds = [userMessage.id, assistantMessage.id]
          aggregate.messages.push(userMessage, assistantMessage)
          aggregate.evidence.push(savedDirectionEvidence)
          let invalidatedDNACandidate = false
          for (const dnaVersion of aggregate.dnaVersions.filter((record) => (
            record.studySessionId === study.id
            && record.status !== 'approved'
            && record.status !== 'superseded'
          ))) {
            dnaVersion.status = 'superseded'
            dnaVersion.supersededAt = now
            invalidatedDNACandidate = true
          }
          study.status = 'ready_to_study'
          study.evidenceStatus = 'ready_to_study'
          study.dnaStatus = 'not_generated'
          study.qaStatus = 'not_run'
          reference.evidenceStatus = 'ready_to_study'
          reference.dnaStatus = 'not_generated'
          reference.qaStatus = 'not_run'
          aggregate.usageLogs.push(usageLog(reference, 'evidence_added', now))
          if (invalidatedDNACandidate) {
            addAuditEvent({ eventType: 'preference_dna_candidate_invalidated', editReferenceId: reference.id, studySessionId: study.id })
          }
          addAuditEvent({ eventType: 'preference_evidence_added', editReferenceId: reference.id, studySessionId: study.id })
          study.revision += 1
          study.updatedAt = now
          reference.updatedAt = now
          aggregate.usageLogs.push(usageLog(reference, 'message_appended', now))
          addAuditEvent({ eventType: 'preference_study_message_appended', editReferenceId: reference.id, studySessionId: study.id })
          return { ...detailData(aggregate, reference), appendedMessageIds }
        },
      })
      if (!mutation.data.appendedMessageIds) {
        throw new ApiError('INTERNAL_ERROR', 'The stored message response is incomplete.', 500)
      }
      return result(mutation.data as EditReferenceDetailData & { appendedMessageIds: string[] }, mutation.replayed)
    },

    async addEvidence(studyId, input, idempotencyKey) {
      const normalized = normalizeCreateEvidence(input)
      const privateMediaInput = normalized.sourceType === 'reference_video_metadata' ? normalized : undefined
      const privateStorageObject = privateMediaInput?.storageObjectRecordId
        ? (await createUploadService(context).getStorageObjectRecord(
          privateMediaInput.storageObjectRecordId,
          privateMediaInput.workspaceId,
        )).storageObjectRecord
        : undefined
      if (privateStorageObject && (
        privateStorageObject.mediaAssetId !== privateMediaInput?.mediaAssetId
        || !privateStorageObject.mimeType?.startsWith('video/')
        || privateStorageObject.status !== 'ready'
      )) {
        throw new ApiError('VALIDATION_FAILED', 'The selected private asset is not a finalized reference video.', 409)
      }
      const mutation = await repository.mutate({
        scope: scope(normalized.workspaceId),
        operation: 'preference_study.evidence.add',
        idempotencyKey: requireIdempotencyKey(idempotencyKey),
        requestHash: hashEditReferenceRequest({ studyId, ...normalized }),
        command: {
          schemaVersion: EDIT_REFERENCE_DOMAIN_COMMAND_CONTRACT_VERSION,
          operation: 'preference_study.evidence.add',
          request: {
            studyId,
            input: normalized,
            privateMediaAuthorityChecked: privateStorageObject !== undefined
              || normalized.sourceType !== 'reference_video_metadata'
              || !normalized.storageObjectRecordId,
          },
        },
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const study = requireStudy(aggregate, studyId)
          const reference = requireReference(aggregate, study.editReferenceId)
          if (
            privateStorageObject
            && (privateStorageObject.editReferenceId ?? privateStorageObject.projectId) !== reference.id
          ) {
            throw new ApiError('WORKSPACE_ACCESS_DENIED', 'The private reference video does not belong to this Edit Reference.', 403)
          }
          assertActiveStudy(reference, study)
          assertRevision(study.revision, normalized.expectedStudyRevision, 'Preference Study')
          if (normalized.sourceType === 'manual_user_evidence' && normalized.supersedesEvidenceId) {
            const superseded = aggregate.evidence.find((record) => record.id === normalized.supersedesEvidenceId)
            if (!superseded || superseded.studySessionId !== study.id || superseded.sourceType !== 'manual_user_evidence') {
              throw new ApiError('VALIDATION_FAILED', 'A correction must point to a saved creative note in this study.', 409)
            }
            if (aggregate.evidence.some((record) => record.supersedesEvidenceId === superseded.id)) {
              throw new ApiError('VERSION_CONFLICT', 'That evidence already has a newer correction. Reload before saving.', 409)
            }
          }
          const { evidence, asset } = createEvidenceRecords(reference, study, normalized, now)
          aggregate.evidence.push(evidence)
          if (asset) aggregate.assets.push(asset)
          let invalidatedDNACandidate = false
          for (const dnaVersion of aggregate.dnaVersions.filter((record) => (
            record.studySessionId === study.id
            && record.status !== 'approved'
            && record.status !== 'superseded'
          ))) {
            dnaVersion.status = 'superseded'
            dnaVersion.supersededAt = now
            invalidatedDNACandidate = true
          }
          study.status = 'ready_to_study'
          study.evidenceStatus = 'ready_to_study'
          study.dnaStatus = 'not_generated'
          study.qaStatus = 'not_run'
          study.revision += 1
          study.updatedAt = now
          reference.evidenceStatus = 'ready_to_study'
          reference.dnaStatus = 'not_generated'
          reference.qaStatus = 'not_run'
          reference.updatedAt = now
          aggregate.messages.push(evidenceSavedMessage(reference, study, evidence, now, nextSequence(aggregate, study.id)))
          aggregate.usageLogs.push(usageLog(reference, 'evidence_added', now))
          if (invalidatedDNACandidate) {
            addAuditEvent({ eventType: 'preference_dna_candidate_invalidated', editReferenceId: reference.id, studySessionId: study.id })
          }
          addAuditEvent({ eventType: 'preference_evidence_added', editReferenceId: reference.id, studySessionId: study.id })
          return detailData(aggregate, reference)
        },
      })
      return result(mutation.data, mutation.replayed)
    },

    async startLongFormStudy(studyId, referenceAssetId, input, idempotencyKey) {
      const normalized = normalizeStartLongFormStudy(input)
      const key = requireIdempotencyKey(idempotencyKey)
      const currentAggregate = await repository.read(scope(normalized.workspaceId))
      if (!currentAggregate) throw studyNotFound(studyId)
      const currentStudy = requireStudy(currentAggregate, studyId)
      const currentReference = requireReference(currentAggregate, currentStudy.editReferenceId)
      assertActiveStudy(currentReference, currentStudy)
      const currentAsset = requireReferenceVideoAsset(currentAggregate, currentStudy, referenceAssetId)
      if (!currentAsset.storageObjectRecordId || !currentAsset.mediaAssetId) {
        throw new ApiError('REFERENCE_VIDEO_NOT_FINALIZED', 'Upload and finalize the private reference video before starting its study.', 409)
      }
      const storage = (await createUploadService(context).getStorageObjectRecord(
        currentAsset.storageObjectRecordId,
        normalized.workspaceId,
      )).storageObjectRecord
      validateLongFormStorageBinding({
        reference: currentReference,
        asset: currentAsset,
        storageObjectRecordId: storage.id,
        storageEditReferenceId: storage.editReferenceId,
        storageProjectId: storage.projectId,
        storageMediaAssetId: storage.mediaAssetId,
        storageStatus: storage.status,
        storageObjectPurpose: storage.objectPurpose,
        storageMimeType: storage.mimeType,
        storageSizeBytes: storage.sizeBytes,
        storageChecksumSha256: storage.checksumSha256,
      })

      const runId = longFormStudyRunId({
        workspaceId: normalized.workspaceId,
        editReferenceId: currentReference.id,
        studySessionId: currentStudy.id,
        referenceAssetId: currentAsset.id,
        storageObjectRecordId: storage.id,
        mediaChecksumSha256: storage.checksumSha256 as string,
      })
      const existingCheckpoint = await longFormStudyRuntime.read({
        scope: scope(normalized.workspaceId),
        runId,
      })
      if (currentAsset.longFormStudy) {
        if (currentAsset.longFormStudy.runId !== runId || !existingCheckpoint) {
          throw new ApiError(
            'LONG_FORM_STUDY_BINDING_CONFLICT',
            'This reference is already bound to a different or incomplete study checkpoint. ReEditPro kept both records unchanged for safe recovery.',
            409,
          )
        }
        validateLongFormStudyIdentity({
          reference: currentReference,
          study: currentStudy,
          asset: currentAsset,
          plan: existingCheckpoint.plan,
          run: existingCheckpoint.run,
        })
        const summary = createPreferenceLongFormStudySummary({
          referenceAssetId: currentAsset.id,
          plan: existingCheckpoint.plan,
          run: existingCheckpoint.run,
        })
        longFormStudyRuntime.schedule({
          env: context.env,
          scope: scope(normalized.workspaceId),
          runId: summary.runId,
          storageObject: storage,
        })
        return {
          ...result(longFormStudyStatusData(currentReference, currentStudy, currentAsset, summary)),
          replayed: true,
        }
      }

      assertRevision(currentStudy.revision, normalized.expectedStudyRevision, 'Preference Study')
      const inspected = await longFormSourceInspector({ env: context.env, storageObject: storage })
      let persisted = existingCheckpoint
      if (!persisted) {
        const createdAt = new Date().toISOString()
        const plan = createEditReferenceLongFormStudyPlan({
          workspaceId: normalized.workspaceId,
          editReferenceId: currentReference.id,
          studySessionId: currentStudy.id,
          source: inspected.source,
          includeCaptionOcr: currentStudy.initialGoals.includes('captions'),
          createdAt,
        })
        const initialRun = createEditReferenceLongFormStudyRun({ runId, plan, createdAt })
        const preparedRun = prepareEditReferenceLongFormStudyRun({
          plan,
          run: initialRun,
          ingestIntegrityDigestSha256: inspected.ingestIntegrityDigestSha256,
          mediaProbeDigestSha256: inspected.mediaProbeDigestSha256,
          mediaProbeObservedWallClockMs: inspected.mediaProbeObservedWallClockMs,
          now: createdAt,
        })
        const created = await longFormStudyRuntime.create({
          scope: scope(normalized.workspaceId),
          plan,
          run: preparedRun,
        })
        persisted = { plan: created.plan, run: created.run }
      }
      validateLongFormStudyIdentity({
        reference: currentReference,
        study: currentStudy,
        asset: currentAsset,
        plan: persisted.plan,
        run: persisted.run,
      })
      if (
        persisted.plan.source.privateMediaArtifactId !== storage.id
        || persisted.plan.source.mediaChecksumSha256 !== storage.checksumSha256
        || persisted.plan.source.sizeBytes !== storage.sizeBytes
        || persisted.plan.source.durationSeconds !== inspected.source.durationSeconds
        || persisted.plan.source.hasAudio !== inspected.source.hasAudio
      ) {
        throw new ApiError(
          'LONG_FORM_STUDY_SOURCE_CHANGED',
          'The exact finalized video no longer matches the retained study checkpoint. ReEditPro did not reuse stale analysis.',
          409,
        )
      }
      const summary = createPreferenceLongFormStudySummary({
        referenceAssetId: currentAsset.id,
        plan: persisted.plan,
        run: persisted.run,
      })
      const mutation = await repository.mutate({
        scope: scope(normalized.workspaceId),
        operation: 'preference_study.long_form_study.start',
        idempotencyKey: key,
        requestHash: hashEditReferenceRequest({ studyId, referenceAssetId, ...normalized }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const study = requireStudy(aggregate, studyId)
          const reference = requireReference(aggregate, study.editReferenceId)
          assertActiveStudy(reference, study)
          assertRevision(study.revision, normalized.expectedStudyRevision, 'Preference Study')
          const asset = requireReferenceVideoAsset(aggregate, study, referenceAssetId)
          if (
            asset.storageObjectRecordId !== currentAsset.storageObjectRecordId
            || asset.mediaAssetId !== currentAsset.mediaAssetId
            || (asset.longFormStudy && asset.longFormStudy.runId !== summary.runId)
          ) {
            throw new ApiError('LONG_FORM_STUDY_BINDING_CONFLICT', 'The selected reference changed while study preparation was running. Reload before retrying.', 409)
          }
          asset.longFormStudy = structuredClone(summary)
          asset.mediaMetadata = structuredClone(inspected.mediaMetadata)
          delete asset.lastStudyBlocker
          const sourceEvidence = aggregate.evidence.find((record) => (
            record.studySessionId === study.id
            && record.sourceType === 'reference_video_metadata'
            && record.provenance.privateAssetId === asset.privateAssetId
          ))
          if (sourceEvidence) {
            sourceEvidence.mediaMetadata = structuredClone(inspected.mediaMetadata)
            sourceEvidence.updatedAt = now
          }
          study.status = 'studying'
          study.revision += 1
          study.updatedAt = now
          reference.updatedAt = now
          aggregate.messages.push(longFormStudyStartedMessage(
            reference,
            study,
            summary,
            now,
            nextSequence(aggregate, study.id),
          ))
          addAuditEvent({
            eventType: 'preference_long_form_study_started',
            editReferenceId: reference.id,
            studySessionId: study.id,
          })
          return detailData(aggregate, reference)
        },
      })
      const storedAsset = mutation.data.detail.assets.find((asset) => asset.id === referenceAssetId)
      if (!storedAsset?.longFormStudy) {
        throw new ApiError('INTERNAL_ERROR', 'The durable study binding was not reconstructable after commit.', 500)
      }
      longFormStudyRuntime.schedule({
        env: context.env,
        scope: scope(normalized.workspaceId),
        runId: storedAsset.longFormStudy.runId,
        storageObject: storage,
      })
      return {
        ...result(longFormStudyStatusData(
          mutation.data.detail.reference,
          mutation.data.detail.study,
          storedAsset,
          storedAsset.longFormStudy,
        ), mutation.replayed),
      }
    },

    async runEvidenceStudy(studyId, input, idempotencyKey) {
      const normalized = normalizeRunEvidenceStudy(input)
      const operation = 'preference_study.evidence.run'
      const key = requireIdempotencyKey(idempotencyKey)
      const requestHash = hashEditReferenceRequest({ studyId, ...normalized })
      if (repository.persistence === 'canonical_supabase_transactional') {
        const requestedScope = scope(normalized.workspaceId)
        const committed = await lookupCanonicalDomainMutation(
          repository,
          requestedScope,
          operation,
          key,
          requestHash,
        )
        if (committed) return result(committed.data, true)
        if (normalized.retryBlockedSkills === true) {
          throw new ApiError(
            'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
            'Retrying a blocked media or model study requires the canonical pre-plan runtime result-commit adapter. No study work was restarted.',
            503,
            {
              requiredGate: 'canonical_pre_plan_study_result_commit_adapter',
              preparedWorkStarted: false,
              providerCallMade: false,
              mediaProcessingStarted: false,
              remoteMutationAttempted: false,
              productionReady: false,
            },
          )
        }
        const aggregate = await repository.read(requestedScope)
        if (!aggregate) throw studyNotFound(studyId)
        const study = requireStudy(aggregate, studyId)
        const reference = requireReference(aggregate, study.editReferenceId)
        assertActiveStudy(reference, study)
        assertRevision(study.revision, normalized.expectedStudyRevision, 'Preference Study')
        if (study.status !== 'ready_to_study') {
          throw new ApiError('VALIDATION_FAILED', 'The saved evidence has already been reviewed. Add or correct evidence before running the study again.', 409)
        }
        const studyEvidence = aggregate.evidence.filter((record) => record.studySessionId === study.id)
        const activeSourceEvidence = activePreferenceSourceEvidence(studyEvidence)
        if (activeSourceEvidence.length < 1) {
          throw new ApiError('PREFERENCE_EVIDENCE_REQUIRED', 'Add evidence before asking ReEditPro to study it.', 409)
        }
        if (
          activeSourceEvidence.some((record) => record.sourceType !== 'manual_user_evidence')
          || aggregate.assets.some((record) => record.studySessionId === study.id)
        ) {
          throw new ApiError(
            'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
            'Reference media and approved-edit evidence must finish through the durable pre-plan study runtime before their results can enter canonical Preference DNA.',
            503,
            {
              requiredGate: 'canonical_pre_plan_study_result_commit_adapter',
              manualDeterministicStudyAllowed: true,
              providerCallMade: false,
              mediaProcessingStarted: false,
              remoteMutationAttempted: false,
              productionReady: false,
            },
          )
        }
        const now = new Date().toISOString()
        const orchestration = orchestratePreferenceEvidenceStudy({
          orchestrationId: `preference-evidence-study-${randomUUID()}`,
          workspaceId: reference.workspaceId,
          editReferenceId: reference.id,
          study,
          evidence: studyEvidence,
          now,
        })
        const canonicalized = canonicalizePreparedEvidenceStudy(orchestration)
        const preparedEvidenceStatus = orchestration.evidenceStatus === 'evidence_ready'
          ? 'evidence_ready' as const
          : orchestration.evidenceStatus === 'needs_clarification'
            ? 'needs_clarification' as const
            : canonicalEvidenceStudyStatusInvalid()
        const prepared: EditReferencePreparedEvidenceStudyCommandResult = {
          referenceId: reference.id,
          orchestrationId: orchestration.orchestrationId,
          studyStatus: orchestration.studyStatus,
          evidenceStatus: preparedEvidenceStatus,
          derivedEvidence: canonicalized.derivedEvidence,
          skillRuns: canonicalized.skillRuns,
          assistantMessage: canonicalizeTopLevelRecordId(studyResultMessage(
            reference,
            study,
            orchestration.assistantMessage,
            now,
            nextSequence(aggregate, study.id),
          )),
          usageLog: canonicalizeTopLevelRecordId(usageLog(reference, 'evidence_study_completed', now)),
          preparationClass: 'manual_deterministic_no_media_no_provider',
          providerCallMade: false,
          modelCallMade: false,
          fileBytesRead: false,
          mediaProcessingStarted: false,
          workerJobCreated: false,
          remoteMutationMade: false,
        }
        const mutation = await repository.mutate({
          scope: requestedScope,
          operation,
          idempotencyKey: key,
          requestHash,
          command: {
            schemaVersion: EDIT_REFERENCE_DOMAIN_COMMAND_CONTRACT_VERSION,
            operation,
            request: { studyId, input: normalized, prepared },
          },
          replay: replayDetailData,
          mutate: canonicalDomainMutationClosureMustNotRun,
        })
        return result(mutation.data, mutation.replayed)
      }
      const mutation = await repository.mutate({
        scope: scope(normalized.workspaceId),
        operation,
        idempotencyKey: key,
        requestHash,
        replay: replayDetailData,
        mutate: async ({ aggregate, now, addAuditEvent }) => {
          const study = requireStudy(aggregate, studyId)
          const reference = requireReference(aggregate, study.editReferenceId)
          assertActiveStudy(reference, study)
          assertRevision(study.revision, normalized.expectedStudyRevision, 'Preference Study')
          const studySkillRuns = aggregate.skillRuns.filter((record) => record.studySessionId === study.id)
          const latestOrchestrationId = studySkillRuns.at(-1)?.orchestrationId
          const latestSkillRuns = latestOrchestrationId
            ? studySkillRuns.filter((record) => record.orchestrationId === latestOrchestrationId)
            : []
          const explicitRetryAvailable = latestSkillRuns.some((record) => record.retryAvailable === true)
          if (normalized.retryBlockedSkills === true && !explicitRetryAvailable) {
            throw new ApiError(
              'VALIDATION_FAILED',
              'No study step is currently retryable. Add or correct evidence when requested instead of rerunning unchanged inputs.',
              409,
            )
          }
          const retryingBlockedSkills = normalized.retryBlockedSkills === true
            && explicitRetryAvailable
            && ['evidence_ready', 'needs_clarification', 'needs_user_review'].includes(study.status)
            && reference.dnaStatus === 'not_generated'
          if (study.status !== 'ready_to_study' && !retryingBlockedSkills) {
            throw new ApiError('VALIDATION_FAILED', 'The saved evidence has already been reviewed. Add or correct evidence before running the study again.', 409)
          }
          const studyEvidence = aggregate.evidence.filter((record) => record.studySessionId === study.id)
          if (!studyEvidence.some((record) => record.sourceType !== 'derived_skill_evidence')) {
            throw new ApiError('PREFERENCE_EVIDENCE_REQUIRED', 'Add evidence before asking ReEditPro to study it.', 409)
          }
          const orchestrationId = `preference-evidence-study-${randomUUID()}`
          const mediaStudies = await prepareEditReferenceMediaStudies({
            context,
            aggregate,
            studyId,
            orchestrationId,
            visualLanguageProvider,
            visualLanguageProductionAuthority: runtimeOptions.visualLanguageProductionAuthority,
            reviewedLocalVisualLanguageRuntime: runtimeOptions.reviewedLocalVisualLanguageRuntime,
            colorTreatmentProductionAuthority: runtimeOptions.colorTreatmentProductionAuthority,
            reviewedLocalColorTreatmentRuntime: runtimeOptions.reviewedLocalColorTreatmentRuntime,
            graphicsMotionProductionAuthority: runtimeOptions.graphicsMotionProductionAuthority,
            reviewedLocalGraphicsMotionRuntime: runtimeOptions.reviewedLocalGraphicsMotionRuntime,
            captionDesignOcrAuthorityResolver: runtimeOptions.captionDesignOcrAuthorityResolver,
            captionDesignProductionAuthority: runtimeOptions.captionDesignProductionAuthority,
            storyEditorialProvider,
            storyEditorialEvidenceAuthorityResolver: runtimeOptions.storyEditorialEvidenceAuthorityResolver,
            storyEditorialProductionAuthority: runtimeOptions.storyEditorialProductionAuthority,
            speechPacingProvider,
            speechPacingTranscriptAuthorityResolver: runtimeOptions.speechPacingTranscriptAuthorityResolver,
            speechPacingProductionAuthority: runtimeOptions.speechPacingProductionAuthority,
            audioSoundDesignProvider,
            audioSoundDesignProductionAuthority: runtimeOptions.audioSoundDesignProductionAuthority,
            reviewedLocalAudioSoundDesignRuntime: runtimeOptions.reviewedLocalAudioSoundDesignRuntime,
          })
          const previousApprovedEditStudies = await preparePreviousApprovedEditStudies({
            aggregate,
            studyId,
            actorUserId: ownerUserId,
            adapter: previousApprovedEditAdapter,
          })
          const orchestration = orchestratePreferenceEvidenceStudy({
            orchestrationId,
            workspaceId: reference.workspaceId,
            editReferenceId: reference.id,
            study,
            evidence: studyEvidence,
            mediaStudies,
            previousApprovedEditStudies,
            now,
          })
          for (const mediaStudy of mediaStudies) {
            const asset = aggregate.assets.find((record) => record.id === mediaStudy.referenceAssetId)
            if (!asset) continue
            asset.mediaStudyStatus = mediaStudy.status === 'verified_local'
              ? 'media_studied_local_partial'
              : 'media_study_blocked'
            asset.representativeFrameCount = mediaStudy.representativeFrameCount
            asset.keyframeSampleCount = mediaStudy.keyframeSampleCount
            asset.mediaAnalysisReportId = mediaStudy.mediaAnalysisReportId
            asset.technicalAudioStatus = mediaStudy.technicalAudio.status
            asset.technicalAudioLowLevel = structuredClone(mediaStudy.technicalAudioLowLevel)
            asset.technicalSceneBoundaryStatus = mediaStudy.shotDetectionStatus
            asset.technicalSceneBoundaryCount = mediaStudy.shotBoundaryCount
            asset.technicalSceneBoundaryTimesSeconds = [...mediaStudy.shotBoundaryTimesSeconds]
            asset.technicalSceneBoundaryCoverage = mediaStudy.shotDetectionCoverage
            asset.technicalSceneBoundaryThreshold = mediaStudy.shotDetectionThreshold
            asset.technicalSceneBoundaryScannedDurationSeconds = mediaStudy.shotDetectionScannedDurationSeconds
            asset.technicalSourceConditionSignal = structuredClone(mediaStudy.technicalSourceCondition)
            asset.technicalEdgeWidthSignal = structuredClone(mediaStudy.technicalEdgeWidth)
            asset.technicalCaptionRegionSignal = structuredClone(mediaStudy.technicalCaptionRegions)
            asset.technicalColorSignal = { ...mediaStudy.technicalColor }
            asset.technicalMotionSignal = structuredClone(mediaStudy.technicalMotion)
            asset.technicalStudyUsage = structuredClone(mediaStudy.technicalStudyUsage)
            asset.lastStudyAt = now
            if (mediaStudy.status === 'blocked') {
              asset.lastStudyBlocker = mediaStudy.blockerMessage ?? 'Private media study blocked.'
            } else {
              delete asset.lastStudyBlocker
            }
          }
          for (const approvedHistoryStudy of previousApprovedEditStudies) {
            const sourceEvidence = studyEvidence.find((record) => record.id === approvedHistoryStudy.sourceEvidenceId)
            const privateAssetId = sourceEvidence?.provenance.privateAssetId
            const asset = privateAssetId
              ? aggregate.assets.find((record) => record.privateAssetId === privateAssetId)
              : undefined
            if (!asset || asset.assetKind !== 'previous_approved_edit_snapshot') continue
            asset.lastStudyAt = now
            if (approvedHistoryStudy.result.status === 'verified') {
              asset.mediaStudyStatus = 'approved_edit_verified'
              delete asset.lastStudyBlocker
            } else {
              asset.mediaStudyStatus = 'approved_edit_identity_not_verified'
              asset.lastStudyBlocker = approvedHistoryStudy.result.blockerCode
            }
          }
          aggregate.evidence.push(...orchestration.derivedEvidence)
          aggregate.skillRuns.push(...orchestration.skillRuns)
          study.status = orchestration.studyStatus
          study.evidenceStatus = orchestration.evidenceStatus
          study.revision += 1
          study.updatedAt = now
          reference.evidenceStatus = orchestration.evidenceStatus
          reference.updatedAt = now
          aggregate.messages.push(studyResultMessage(reference, study, orchestration.assistantMessage, now, nextSequence(aggregate, study.id)))
          aggregate.usageLogs.push(usageLog(reference, 'evidence_study_completed', now))
          addAuditEvent({ eventType: 'preference_evidence_study_completed', editReferenceId: reference.id, studySessionId: study.id })
          return detailData(aggregate, reference)
        },
      })
      return result(mutation.data, mutation.replayed)
    },

    async synthesizePreferenceDNA(studyId, input, idempotencyKey) {
      const normalized = normalizeSynthesizePreferenceDNA(input)
      if (repository.persistence === 'canonical_supabase_transactional') {
        const requestedScope = scope(normalized.workspaceId)
        const key = requireIdempotencyKey(idempotencyKey)
        const requestHash = hashEditReferenceRequest({ studyId, ...normalized })
        const committed = await lookupCanonicalDomainMutation(
          repository,
          requestedScope,
          'preference_study.dna.synthesize',
          key,
          requestHash,
        )
        if (committed) return result(committed.data, true)
        const aggregate = await repository.read(requestedScope)
        if (!aggregate) throw studyNotFound(studyId)
        const study = requireStudy(aggregate, studyId)
        const reference = requireReference(aggregate, study.editReferenceId)
        assertActiveStudy(reference, study)
        assertRevision(study.revision, normalized.expectedStudyRevision, 'Preference Study')
        const now = new Date().toISOString()
        const dnaVersion = canonicalizeTopLevelRecordId(synthesizeEditReferencePreferenceDNA({
          reference,
          study,
          evidence: aggregate.evidence.filter((record) => record.studySessionId === study.id),
          skillRuns: aggregate.skillRuns.filter((record) => record.studySessionId === study.id),
          existingVersions: aggregate.dnaVersions.filter((record) => record.studySessionId === study.id),
          now,
        }))
        const prepared: EditReferencePreparedDnaSynthesisCommandResult = {
          referenceId: reference.id,
          dnaVersion,
          assistantMessage: canonicalizeTopLevelRecordId(dnaSynthesisMessage(
            reference,
            study,
            dnaVersion,
            now,
            nextSequence(aggregate, study.id),
          )),
          usageLog: canonicalizeTopLevelRecordId(usageLog(reference, 'dna_version_created', now)),
        }
        const mutation = await repository.mutate({
          scope: requestedScope,
          operation: 'preference_study.dna.synthesize',
          idempotencyKey: key,
          requestHash,
          command: {
            schemaVersion: EDIT_REFERENCE_DOMAIN_COMMAND_CONTRACT_VERSION,
            operation: 'preference_study.dna.synthesize',
            request: { studyId, input: normalized, prepared },
          },
          replay: replayDetailData,
          mutate: canonicalDomainMutationClosureMustNotRun,
        })
        return result(mutation.data, mutation.replayed)
      }
      const mutation = await repository.mutate({
        scope: scope(normalized.workspaceId),
        operation: 'preference_study.dna.synthesize',
        idempotencyKey: requireIdempotencyKey(idempotencyKey),
        requestHash: hashEditReferenceRequest({ studyId, ...normalized }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const study = requireStudy(aggregate, studyId)
          const reference = requireReference(aggregate, study.editReferenceId)
          assertActiveStudy(reference, study)
          assertRevision(study.revision, normalized.expectedStudyRevision, 'Preference Study')
          const dnaVersion = synthesizeEditReferencePreferenceDNA({
            reference,
            study,
            evidence: aggregate.evidence.filter((record) => record.studySessionId === study.id),
            skillRuns: aggregate.skillRuns.filter((record) => record.studySessionId === study.id),
            existingVersions: aggregate.dnaVersions.filter((record) => record.studySessionId === study.id),
            now,
          })
          for (const previousVersion of aggregate.dnaVersions.filter((record) => (
            record.studySessionId === study.id
            && record.status !== 'approved'
            && record.status !== 'superseded'
          ))) {
            previousVersion.status = 'superseded'
            previousVersion.supersededAt = now
          }
          aggregate.dnaVersions.push(dnaVersion)
          study.status = 'dna_ready'
          study.dnaStatus = 'review_required'
          study.qaStatus = 'not_run'
          study.revision += 1
          study.updatedAt = now
          reference.dnaStatus = 'review_required'
          reference.qaStatus = 'not_run'
          reference.updatedAt = now
          aggregate.messages.push(dnaSynthesisMessage(reference, study, dnaVersion, now, nextSequence(aggregate, study.id)))
          aggregate.usageLogs.push(usageLog(reference, 'dna_version_created', now))
          addAuditEvent({ eventType: 'preference_dna_version_created', editReferenceId: reference.id, studySessionId: study.id })
          return detailData(aggregate, reference)
        },
      })
      return result(mutation.data, mutation.replayed)
    },

    async runPreferenceDNAQA(studyId, dnaVersionId, input, idempotencyKey) {
      const normalized = normalizeRunPreferenceDNAQA(input)
      if (repository.persistence === 'canonical_supabase_transactional') {
        const requestedScope = scope(normalized.workspaceId)
        const key = requireIdempotencyKey(idempotencyKey)
        const requestHash = hashEditReferenceRequest({ studyId, dnaVersionId, ...normalized })
        const committed = await lookupCanonicalDomainMutation(
          repository,
          requestedScope,
          'preference_study.dna.qa.run',
          key,
          requestHash,
        )
        if (committed) return result(committed.data, true)
        const aggregate = await repository.read(requestedScope)
        if (!aggregate) throw studyNotFound(studyId)
        const study = requireStudy(aggregate, studyId)
        const reference = requireReference(aggregate, study.editReferenceId)
        assertActiveStudy(reference, study)
        assertRevision(study.revision, normalized.expectedStudyRevision, 'Preference Study')
        const dnaVersion = requireDNAVersion(aggregate, dnaVersionId, study)
        assertDNAContentDigest(dnaVersion.contentDigest, normalized.expectedDNAContentDigest)
        if (dnaVersion.status !== 'review_required' || dnaVersion.qaStatus !== 'not_run') {
          throw new ApiError('VALIDATION_FAILED', 'Quality review already ran or this DNA version is no longer the active review candidate.', 409)
        }
        if (aggregate.dnaQaResults.some((record) => record.dnaVersionId === dnaVersion.id)) {
          throw new ApiError('VERSION_CONFLICT', 'This exact DNA version already has a quality-review result.', 409)
        }
        const now = new Date().toISOString()
        const qaResult = canonicalizeTopLevelRecordId(runEditReferenceDNAQA({
          reference,
          study,
          dnaVersion,
          evidence: aggregate.evidence.filter((record) => record.studySessionId === study.id),
          now,
        }))
        const prepared: EditReferencePreparedDnaQaCommandResult = {
          referenceId: reference.id,
          qaResult,
          assistantMessage: canonicalizeTopLevelRecordId(dnaQAMessage(
            reference,
            study,
            qaResult,
            now,
            nextSequence(aggregate, study.id),
          )),
          usageLog: canonicalizeTopLevelRecordId(usageLog(reference, 'dna_qa_completed', now)),
        }
        const mutation = await repository.mutate({
          scope: requestedScope,
          operation: 'preference_study.dna.qa.run',
          idempotencyKey: key,
          requestHash,
          command: {
            schemaVersion: EDIT_REFERENCE_DOMAIN_COMMAND_CONTRACT_VERSION,
            operation: 'preference_study.dna.qa.run',
            request: { studyId, dnaVersionId, input: normalized, prepared },
          },
          replay: replayDetailData,
          mutate: canonicalDomainMutationClosureMustNotRun,
        })
        return result(mutation.data, mutation.replayed)
      }
      const mutation = await repository.mutate({
        scope: scope(normalized.workspaceId),
        operation: 'preference_study.dna.qa.run',
        idempotencyKey: requireIdempotencyKey(idempotencyKey),
        requestHash: hashEditReferenceRequest({ studyId, dnaVersionId, ...normalized }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const study = requireStudy(aggregate, studyId)
          const reference = requireReference(aggregate, study.editReferenceId)
          assertActiveStudy(reference, study)
          assertRevision(study.revision, normalized.expectedStudyRevision, 'Preference Study')
          const dnaVersion = requireDNAVersion(aggregate, dnaVersionId, study)
          assertDNAContentDigest(dnaVersion.contentDigest, normalized.expectedDNAContentDigest)
          if (dnaVersion.status !== 'review_required' || dnaVersion.qaStatus !== 'not_run') {
            throw new ApiError('VALIDATION_FAILED', 'Quality review already ran or this DNA version is no longer the active review candidate.', 409)
          }
          if (aggregate.dnaQaResults.some((record) => record.dnaVersionId === dnaVersion.id)) {
            throw new ApiError('VERSION_CONFLICT', 'This exact DNA version already has a quality-review result.', 409)
          }
          const qaResult = runEditReferenceDNAQA({
            reference,
            study,
            dnaVersion,
            evidence: aggregate.evidence.filter((record) => record.studySessionId === study.id),
            now,
          })
          aggregate.dnaQaResults.push(qaResult)
          dnaVersion.qaStatus = qaResult.status
          dnaVersion.qaResultId = qaResult.id
          study.qaStatus = qaResult.status
          study.status = qaResult.status === 'blocked' ? 'qa_blocked' : 'needs_user_review'
          study.revision += 1
          study.updatedAt = now
          reference.qaStatus = qaResult.status
          reference.updatedAt = now
          aggregate.messages.push(dnaQAMessage(reference, study, qaResult, now, nextSequence(aggregate, study.id)))
          aggregate.usageLogs.push(usageLog(reference, 'dna_qa_completed', now))
          addAuditEvent({
            eventType: 'preference_dna_qa_completed',
            editReferenceId: reference.id,
            studySessionId: study.id,
            dnaVersionId: dnaVersion.id,
            dnaQaResultId: qaResult.id,
          })
          return detailData(aggregate, reference)
        },
      })
      return result(mutation.data, mutation.replayed)
    },

    async approvePreferenceDNA(studyId, dnaVersionId, input, idempotencyKey) {
      const normalized = normalizeApprovePreferenceDNA(input)
      if (repository.persistence === 'canonical_supabase_transactional') {
        const requestedScope = scope(normalized.workspaceId)
        const key = requireIdempotencyKey(idempotencyKey)
        const requestHash = hashEditReferenceRequest({ studyId, dnaVersionId, ...normalized })
        const committed = await lookupCanonicalDomainMutation(
          repository,
          requestedScope,
          'preference_study.dna.approve',
          key,
          requestHash,
        )
        if (committed) return result(committed.data, true)
        const aggregate = await repository.read(requestedScope)
        if (!aggregate) throw studyNotFound(studyId)
        const study = requireStudy(aggregate, studyId)
        const reference = requireReference(aggregate, study.editReferenceId)
        assertActiveStudy(reference, study)
        assertRevision(study.revision, normalized.expectedStudyRevision, 'Preference Study')
        const dnaVersion = requireDNAVersion(aggregate, dnaVersionId, study)
        assertDNAContentDigest(dnaVersion.contentDigest, normalized.expectedDNAContentDigest)
        const qaResult = requireDNAQAResult(aggregate, normalized.qaResultId, dnaVersion)
        if (dnaVersion.status !== 'review_required' || dnaVersion.qaResultId !== qaResult.id) {
          throw new ApiError('VALIDATION_FAILED', 'Only the active quality-reviewed DNA version can be approved.', 409)
        }
        if (qaResult.status === 'blocked' || qaResult.blockingCheckIds.length > 0) {
          throw new ApiError('VALIDATION_FAILED', 'Blocking DNA quality findings must be corrected before approval.', 409)
        }
        if (qaResult.status === 'requires_user_review' && normalized.acknowledgeQAReview !== true) {
          throw new ApiError('VALIDATION_FAILED', 'Review the quality warnings and acknowledge them before approval.', 409)
        }
        if (dnaVersion.reasoningProvenance || normalized.reasoningReviewAcknowledgement) {
          throw new ApiError(
            'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
            'AI-assisted Preference DNA approval requires the canonical reasoning-attempt projection before it can be committed through this domain command.',
            503,
            {
              requiredGate: 'canonical_preference_dna_reasoning_projection',
              deterministicDnaApprovalAllowed: true,
              remoteMutationAttempted: false,
              productionReady: false,
            },
          )
        }
        const now = new Date().toISOString()
        const approval = {
          id: randomUUID(),
          qaResultId: qaResult.id,
          acknowledgedAdaptNotCopy: true,
          acknowledgedQAReview: normalized.acknowledgeQAReview,
          approvedBy: 'authenticated_user',
          approvedAt: now,
        } as const
        const prepared: EditReferencePreparedDnaApprovalCommandResult = {
          referenceId: reference.id,
          approval,
          assistantMessage: canonicalizeTopLevelRecordId(dnaApprovalMessage(
            reference,
            study,
            { ...dnaVersion, status: 'approved', approval },
            now,
            nextSequence(aggregate, study.id),
          )),
          usageLog: canonicalizeTopLevelRecordId(usageLog(reference, 'dna_version_approved', now)),
        }
        const mutation = await repository.mutate({
          scope: requestedScope,
          operation: 'preference_study.dna.approve',
          idempotencyKey: key,
          requestHash,
          command: {
            schemaVersion: EDIT_REFERENCE_DOMAIN_COMMAND_CONTRACT_VERSION,
            operation: 'preference_study.dna.approve',
            request: { studyId, dnaVersionId, input: normalized, prepared },
          },
          replay: replayDetailData,
          mutate: canonicalDomainMutationClosureMustNotRun,
        })
        return result(mutation.data, mutation.replayed)
      }
      const mutation = await repository.mutate({
        scope: scope(normalized.workspaceId),
        operation: 'preference_study.dna.approve',
        idempotencyKey: requireIdempotencyKey(idempotencyKey),
        requestHash: hashEditReferenceRequest({ studyId, dnaVersionId, ...normalized }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const study = requireStudy(aggregate, studyId)
          const reference = requireReference(aggregate, study.editReferenceId)
          assertActiveStudy(reference, study)
          assertRevision(study.revision, normalized.expectedStudyRevision, 'Preference Study')
          const dnaVersion = requireDNAVersion(aggregate, dnaVersionId, study)
          assertDNAContentDigest(dnaVersion.contentDigest, normalized.expectedDNAContentDigest)
          const qaResult = requireDNAQAResult(aggregate, normalized.qaResultId, dnaVersion)
          if (dnaVersion.status !== 'review_required' || dnaVersion.qaResultId !== qaResult.id) {
            throw new ApiError('VALIDATION_FAILED', 'Only the active quality-reviewed DNA version can be approved.', 409)
          }
          if (qaResult.status === 'blocked' || qaResult.blockingCheckIds.length > 0) {
            throw new ApiError('VALIDATION_FAILED', 'Blocking DNA quality findings must be corrected before approval.', 409)
          }
          if (qaResult.status === 'requires_user_review' && normalized.acknowledgeQAReview !== true) {
            throw new ApiError('VALIDATION_FAILED', 'Review the quality warnings and acknowledge them before approval.', 409)
          }
          const reasoningReview = dnaVersion.reasoningProvenance
            ? createEditReferencePreferenceDnaReasoningApprovalSnapshot({
                version: dnaVersion,
                qaResult,
                attempt: requirePreferenceDnaReasoningAttempt(
                  aggregate,
                  dnaVersion.reasoningProvenance.reasoningAttemptId,
                ),
                acknowledgement: normalized.reasoningReviewAcknowledgement,
              })
            : undefined
          if (!dnaVersion.reasoningProvenance && normalized.reasoningReviewAcknowledgement) {
            throw new ApiError('VALIDATION_FAILED', 'AI-assisted review acknowledgement does not apply to this deterministic version.', 409)
          }
          for (const previousApproved of aggregate.dnaVersions.filter((record) => (
            record.studySessionId === study.id
            && record.id !== dnaVersion.id
            && record.status === 'approved'
          ))) {
            previousApproved.status = 'superseded'
            previousApproved.supersededAt = now
          }
          dnaVersion.status = 'approved'
          dnaVersion.approval = {
            id: `preference-dna-approval-${randomUUID()}`,
            qaResultId: qaResult.id,
            acknowledgedAdaptNotCopy: true,
            acknowledgedQAReview: normalized.acknowledgeQAReview,
            ...(reasoningReview ? { reasoningReview } : {}),
            approvedBy: 'authenticated_user',
            approvedAt: now,
          }
          study.status = 'approved'
          study.dnaStatus = 'approved'
          study.qaStatus = qaResult.status
          study.revision += 1
          study.updatedAt = now
          reference.dnaStatus = 'approved'
          reference.qaStatus = qaResult.status
          reference.updatedAt = now
          aggregate.messages.push(dnaApprovalMessage(reference, study, dnaVersion, now, nextSequence(aggregate, study.id)))
          aggregate.usageLogs.push(usageLog(reference, 'dna_version_approved', now))
          addAuditEvent({
            eventType: 'preference_dna_version_approved',
            editReferenceId: reference.id,
            studySessionId: study.id,
            dnaVersionId: dnaVersion.id,
            dnaQaResultId: qaResult.id,
          })
          return detailData(aggregate, reference)
        },
      })
      return result(mutation.data, mutation.replayed)
    },

    async createPreferenceApplication(studyId, dnaVersionId, input, idempotencyKey) {
      const normalized = normalizeCreatePreferenceApplication(input)
      const targetUnderstanding = await readReadyTargetUnderstanding({
        repository: targetVideoUnderstandingRepository,
        scope: scope(normalized.workspaceId),
        studyId,
        editReferenceId: await resolveEditReferenceIdForStudy(repository, scope(normalized.workspaceId), studyId),
        input: normalized,
      })
      const authoritativeTargetContext = authoritativeTargetContextFromUnderstanding(
        normalized.targetContext,
        targetUnderstanding,
      )
      const mutation = await repository.mutate({
        scope: scope(normalized.workspaceId),
        operation: 'preference_study.dna.application.create',
        idempotencyKey: requireIdempotencyKey(idempotencyKey),
        requestHash: hashEditReferenceRequest({ studyId, dnaVersionId, ...normalized }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const study = requireStudy(aggregate, studyId)
          const reference = requireReference(aggregate, study.editReferenceId)
          assertActiveStudy(reference, study)
          assertRevision(reference.revision, normalized.expectedReferenceRevision, 'Edit Reference')
          const dnaVersion = requireDNAVersion(aggregate, dnaVersionId, study)
          assertDNAContentDigest(dnaVersion.contentDigest, normalized.expectedDNAContentDigest)
          if (!dnaVersion.approval || !dnaVersion.qaResultId) {
            throw new ApiError('VALIDATION_FAILED', 'Approve this exact Preference DNA version before preparing it for a target edit.', 409)
          }
          const qaResult = requireDNAQAResult(aggregate, dnaVersion.qaResultId, dnaVersion)
          const existingTargetApplication = aggregate.applications.find((record) => (
            record.projectId === authoritativeTargetContext.projectId
            && record.editSessionId === authoritativeTargetContext.editSessionId
            && record.status === 'prepared'
          ))
          if (existingTargetApplication && !normalized.replacesApplicationId) {
            throw new ApiError(
              'VERSION_CONFLICT',
              'This target edit already has prepared Preference DNA. Replace or clear it from the target edit before preparing another version.',
              409,
              { applicationId: existingTargetApplication.id },
            )
          }
          if (!existingTargetApplication && normalized.replacesApplicationId) {
            throw new ApiError('VERSION_CONFLICT', 'The Preference Application selected for replacement is no longer active.', 409)
          }
          if (existingTargetApplication && normalized.replacesApplicationId !== existingTargetApplication.id) {
            throw new ApiError('VERSION_CONFLICT', 'The active Preference Application changed before replacement. Reload this Edit Chat.', 409)
          }
          let replacedReference: EditReferenceRecord | undefined
          let replacedStudy: PreferenceStudySessionRecord | undefined
          if (existingTargetApplication) {
            if (!normalized.invalidationReceipt || normalized.expectedReplacedReferenceRevision === undefined) {
              throw new ApiError('VALIDATION_FAILED', 'Replacement requires the exact downstream invalidation receipt and prior reference revision.', 409)
            }
            if (existingTargetApplication.targetIntegrationStatus !== 'connected') {
              throw new ApiError('VERSION_CONFLICT', 'Only connected target guidance can be replaced through the downstream invalidation flow.', 409)
            }
            replacedReference = requireReference(aggregate, existingTargetApplication.editReferenceId)
            replacedStudy = requireStudy(aggregate, existingTargetApplication.studySessionId)
            assertRevision(replacedReference.revision, normalized.expectedReplacedReferenceRevision, 'Replaced Edit Reference')
            assertDownstreamInvalidationReceipt(existingTargetApplication, normalized.invalidationReceipt, 'replace')
          }
          const application = createEditReferenceTargetApplication({
            reference,
            study,
            dnaVersion,
            qaResult,
            targetContext: authoritativeTargetContext,
            targetUnderstanding,
            applicationSource: normalized.applicationSource ?? 'session_panel',
            existingApplications: aggregate.applications,
            now,
          })
          if (existingTargetApplication) {
            application.replacesApplicationId = existingTargetApplication.id
            existingTargetApplication.status = 'replaced'
            existingTargetApplication.targetIntegrationStatus = 'invalidated'
            existingTargetApplication.downstreamInvalidationStatus = 'completed'
            existingTargetApplication.replacedByApplicationId = application.id
            existingTargetApplication.invalidatedAt = now
            existingTargetApplication.updatedAt = now
            existingTargetApplication.invalidationReason = 'replace'
            existingTargetApplication.downstreamInvalidationReceipt = normalized.invalidationReceipt
            if (replacedReference && replacedStudy) {
              if (replacedReference.id !== reference.id) {
                replacedReference.revision += 1
                replacedReference.updatedAt = now
              }
              aggregate.messages.push(preferenceApplicationLifecycleMessage(
                replacedReference,
                replacedStudy,
                `Target guidance was replaced by “${reference.name}” for ${application.targetContext.editName}. Approved DNA and application history remain immutable.`,
                now,
                nextSequence(aggregate, replacedStudy.id),
              ))
              aggregate.usageLogs.push(usageLog(replacedReference, 'replaced', now))
            }
          }
          aggregate.applications.push(application)
          reference.revision += 1
          reference.updatedAt = now
          aggregate.messages.push(targetApplicationMessage(reference, study, application, now, nextSequence(aggregate, study.id)))
          aggregate.usageLogs.push(usageLog(reference, 'application_prepared', now))
          if (existingTargetApplication && replacedReference && replacedStudy) {
            addAuditEvent({
              eventType: 'preference_application_replaced',
              editReferenceId: replacedReference.id,
              studySessionId: replacedStudy.id,
              dnaVersionId: existingTargetApplication.dnaVersionId,
              dnaQaResultId: existingTargetApplication.dnaQaResultId,
              applicationId: existingTargetApplication.id,
            })
          }
          addAuditEvent({
            eventType: 'preference_application_prepared',
            editReferenceId: reference.id,
            studySessionId: study.id,
            dnaVersionId: dnaVersion.id,
            dnaQaResultId: qaResult.id,
            applicationId: application.id,
          })
          return detailData(aggregate, reference)
        },
      })
      if (normalized.replacesApplicationId && normalized.invalidationReceipt) {
        recordPreferenceApplicationPlanInvalidation({
          workspaceId: normalized.workspaceId,
          projectId: normalized.invalidationReceipt.projectId,
          editSessionId: normalized.invalidationReceipt.editSessionId,
          preferenceApplicationId: normalized.invalidationReceipt.applicationId,
          applicationContentDigest: normalized.invalidationReceipt.applicationContentDigest,
          contextHash: normalized.invalidationReceipt.contextHash,
          reason: normalized.invalidationReceipt.reason,
          invalidatedAt: normalized.invalidationReceipt.invalidatedAt,
        })
      }
      return result(mutation.data, mutation.replayed)
    },

    async connectPreferenceApplication(applicationId, input, idempotencyKey) {
      const normalized = normalizeConnectPreferenceApplication(input)
      const mutation = await repository.mutate({
        scope: scope(normalized.workspaceId),
        operation: 'preference_application.connect_mock_session',
        idempotencyKey: requireIdempotencyKey(idempotencyKey),
        requestHash: hashEditReferenceRequest({ applicationId, ...normalized }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const application = aggregate.applications.find((record) => record.id === applicationId)
          if (!application) {
            throw new ApiError('PREFERENCE_APPLICATION_NOT_FOUND', 'Preference Application was not found.', 404, { applicationId })
          }
          const reference = requireReference(aggregate, application.editReferenceId)
          const study = requireStudy(aggregate, application.studySessionId)
          assertRevision(reference.revision, normalized.expectedReferenceRevision, 'Edit Reference')
          if (application.contentDigest !== normalized.expectedApplicationContentDigest) {
            throw new ApiError('VERSION_CONFLICT', 'Preference Application changed since it was staged. Reload before connecting it.', 409)
          }
          if (application.status !== 'prepared' || application.targetIntegrationStatus !== 'not_connected') {
            throw new ApiError('VERSION_CONFLICT', 'Only one unconnected prepared Preference Application can be connected.', 409)
          }
          const context = createPreferenceApplicationDownstreamContext(application, 'connected_mock')
          assertTargetSessionReceipt(application, context.packageHash, normalized.targetSessionReceipt)
          if (application.applicationVersion === 'edit-reference-target-application-v1') {
            application.targetIdentityStatus = 'verified_mock_project_edit_session'
          }
          application.targetIntegrationStatus = 'connected'
          application.targetEditMutationMade = true
          application.downstreamContextWritten = true
          application.downstreamContext = context
          application.targetSessionReceipt = normalized.targetSessionReceipt
          application.connectedAt = now
          application.updatedAt = now
          reference.revision += 1
          reference.updatedAt = now
          aggregate.messages.push({
            id: `preference-study-message-${randomUUID()}`,
            workspaceId: reference.workspaceId,
            editReferenceId: reference.id,
            studySessionId: study.id,
            role: 'assistant',
            content: `Target-adapted Preference DNA was connected to “${application.targetContext.editName}” as planning guidance. Current instructions and confirmed Edit Brief markers remain higher priority; no production work started.`,
            sequence: nextSequence(aggregate, study.id),
            runtimeSource: 'deterministic_dna_application',
            createdAt: now,
          })
          aggregate.usageLogs.push(usageLog(reference, 'applied', now))
          addAuditEvent({
            eventType: 'preference_application_connected_mock',
            editReferenceId: reference.id,
            studySessionId: study.id,
            dnaVersionId: application.dnaVersionId,
            dnaQaResultId: application.dnaQaResultId,
            applicationId: application.id,
          })
          return detailData(aggregate, reference)
        },
      })
      return result(mutation.data, mutation.replayed)
    },

    async clearPreferenceApplication(applicationId, input, idempotencyKey) {
      const normalized = normalizeClearPreferenceApplication(input)
      const mutation = await repository.mutate({
        scope: scope(normalized.workspaceId),
        operation: 'preference_application.clear_connected_context',
        idempotencyKey: requireIdempotencyKey(idempotencyKey),
        requestHash: hashEditReferenceRequest({ applicationId, ...normalized }),
        replay: replayDetailData,
        mutate: ({ aggregate, now, addAuditEvent }) => {
          const application = aggregate.applications.find((record) => record.id === applicationId)
          if (!application) {
            throw new ApiError('PREFERENCE_APPLICATION_NOT_FOUND', 'Preference Application was not found.', 404, { applicationId })
          }
          const reference = requireReference(aggregate, application.editReferenceId)
          const study = requireStudy(aggregate, application.studySessionId)
          assertRevision(reference.revision, normalized.expectedReferenceRevision, 'Edit Reference')
          if (application.contentDigest !== normalized.expectedApplicationContentDigest) {
            throw new ApiError('VERSION_CONFLICT', 'Preference Application changed before it could be removed. Reload this Edit Chat.', 409)
          }
          if (application.status !== 'prepared' || application.targetIntegrationStatus !== 'connected') {
            throw new ApiError('VERSION_CONFLICT', 'Only the currently connected target guidance can be removed.', 409)
          }
          assertDownstreamInvalidationReceipt(application, normalized.invalidationReceipt, 'remove')
          application.status = 'cleared'
          application.targetIntegrationStatus = 'invalidated'
          application.downstreamInvalidationStatus = 'completed'
          application.clearedAt = now
          application.updatedAt = now
          application.invalidatedAt = now
          application.invalidationReason = 'remove'
          application.downstreamInvalidationReceipt = normalized.invalidationReceipt
          reference.revision += 1
          reference.updatedAt = now
          aggregate.messages.push(preferenceApplicationLifecycleMessage(
            reference,
            study,
            `Target-adapted guidance was removed from ${application.targetContext.editName}. Approved Preference DNA and application history remain unchanged.`,
            now,
            nextSequence(aggregate, study.id),
          ))
          aggregate.usageLogs.push(usageLog(reference, 'cleared', now))
          addAuditEvent({
            eventType: 'preference_application_cleared',
            editReferenceId: reference.id,
            studySessionId: study.id,
            dnaVersionId: application.dnaVersionId,
            dnaQaResultId: application.dnaQaResultId,
            applicationId: application.id,
          })
          return detailData(aggregate, reference)
        },
      })
      recordPreferenceApplicationPlanInvalidation({
        workspaceId: normalized.workspaceId,
        projectId: normalized.invalidationReceipt.projectId,
        editSessionId: normalized.invalidationReceipt.editSessionId,
        preferenceApplicationId: normalized.invalidationReceipt.applicationId,
        applicationContentDigest: normalized.invalidationReceipt.applicationContentDigest,
        contextHash: normalized.invalidationReceipt.contextHash,
        reason: normalized.invalidationReceipt.reason,
        invalidatedAt: normalized.invalidationReceipt.invalidatedAt,
      })
      return result(mutation.data, mutation.replayed)
    },
  }
  return runtimeOptions.observabilitySink
    ? instrumentEditReferenceService(service, context, runtimeOptions.observabilitySink)
    : service
}

async function preparePreviousApprovedEditStudies(input: {
  readonly aggregate: EditReferenceAggregate
  readonly studyId: string
  readonly actorUserId: string
  readonly adapter: EditReferencePreviousApprovedEditStudyAdapter
}): Promise<Array<{
  sourceEvidenceId: string
  result: EditReferencePreviousApprovedEditStudyResult
}>> {
  const study = input.aggregate.studies.find((record) => record.id === input.studyId)
  if (!study) return []
  const supersededEvidenceIds = new Set(input.aggregate.evidence
    .filter((record) => record.studySessionId === input.studyId)
    .map((record) => record.supersedesEvidenceId)
    .filter((value): value is string => Boolean(value)))
  const evidenceRecords = input.aggregate.evidence.filter((record) => (
    record.studySessionId === input.studyId
    && record.sourceType === 'previous_approved_edit_snapshot'
    && !supersededEvidenceIds.has(record.id)
  ))
  const requestedLayers: EditReferencePreviousApprovedEditStudyLayer[] = [
    'media_structure',
    ...study.initialGoals,
  ]
  const studies: Array<{
    sourceEvidenceId: string
    result: EditReferencePreviousApprovedEditStudyResult
  }> = []
  for (const evidence of evidenceRecords) {
    const provenance = evidence.provenance
    const request = {
      schemaVersion: EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_STUDY_REQUEST_VERSION,
      workspaceId: evidence.workspaceId,
      actorUserId: input.actorUserId,
      sourceEvidenceId: evidence.id,
      projectId: provenance.projectId ?? 'missing-project-identity',
      editSessionId: provenance.editSessionId ?? 'missing-edit-session-identity',
      approvedSnapshotId: provenance.approvedSnapshotId ?? 'missing-snapshot-identity',
      requestedLayers,
      maxEvidenceItems: 64,
    } as const
    const asset = provenance.privateAssetId
      ? input.aggregate.assets.find((record) => record.privateAssetId === provenance.privateAssetId)
      : undefined
    const exactAssetIdentity = asset?.assetKind === 'previous_approved_edit_snapshot'
      && asset.workspaceId === request.workspaceId
      && asset.projectId === request.projectId
      && asset.editSessionId === request.editSessionId
      && asset.approvedSnapshotId === request.approvedSnapshotId
      && asset.rightsBasis === 'workspace_approved_edit'
    const result = exactAssetIdentity
      ? await input.adapter.analyze(request)
      : createBlockedEditReferencePreviousApprovedEditStudyResult({
          request,
          blockerCode: 'private_artifact_unavailable',
          blockerMessage: 'The exact approved-edit identity asset is unavailable or does not match its private source provenance.',
          retryAvailable: true,
          retryReason: 'Restore the exact workspace-owned approved-edit identity asset before retrying.',
        })
    studies.push({ sourceEvidenceId: evidence.id, result })
  }
  return studies
}

async function prepareEditReferenceMediaStudies(input: {
  readonly context: ServiceContext
  readonly aggregate: EditReferenceAggregate
  readonly studyId: string
  readonly orchestrationId: string
  readonly visualLanguageProvider: QwenVisualUnderstandingProvider
  readonly visualLanguageProductionAuthority?: EditReferenceVisualLanguageProductionAuthority
  readonly reviewedLocalVisualLanguageRuntime?: EditReferenceReviewedLocalVisualLanguageRuntimeOptions
  readonly colorTreatmentProductionAuthority?: EditReferenceColorTreatmentProductionAuthority
  readonly reviewedLocalColorTreatmentRuntime?: EditReferenceReviewedLocalColorTreatmentRuntimeOptions
  readonly graphicsMotionProductionAuthority?: EditReferenceGraphicsMotionProductionAuthority
  readonly reviewedLocalGraphicsMotionRuntime?: EditReferenceReviewedLocalGraphicsMotionRuntimeOptions
  readonly captionDesignOcrAuthorityResolver?: EditReferenceCaptionDesignOcrAuthorityResolver
  readonly captionDesignProductionAuthority?: EditReferenceCaptionDesignProductionAuthority
  readonly storyEditorialProvider: QwenStoryEditorialReasoningProvider
  readonly storyEditorialEvidenceAuthorityResolver?: EditReferenceStoryEditorialEvidenceAuthorityResolver
  readonly storyEditorialProductionAuthority?: EditReferenceStoryEditorialProductionAuthority
  readonly speechPacingProvider: QwenSpeechPacingReasoningProvider
  readonly speechPacingTranscriptAuthorityResolver?: EditReferenceSpeechPacingTranscriptAuthorityResolver
  readonly speechPacingProductionAuthority?: EditReferenceSpeechPacingProductionAuthority
  readonly audioSoundDesignProvider: EditReferenceAudioSoundDesignProvider
  readonly audioSoundDesignProductionAuthority?: EditReferenceAudioSoundDesignProductionAuthority
  readonly reviewedLocalAudioSoundDesignRuntime?: EditReferenceReviewedLocalAudioSoundDesignRuntimeOptions
}): Promise<EditReferenceLocalMediaStudyResult[]> {
  const { context, aggregate, studyId } = input
  const study = aggregate.studies.find((record) => record.id === studyId)
  if (!study) return []
  const reference = aggregate.references.find((record) => record.id === study.editReferenceId)
  if (!reference) return []
  const uploadService = createUploadService(context)
  const studies: EditReferenceLocalMediaStudyResult[] = []
  for (const asset of aggregate.assets.filter((record) => (
    record.studySessionId === studyId
    && record.assetKind === 'reference_video_metadata'
    && Boolean(record.storageObjectRecordId)
    && Boolean(record.mediaAssetId)
  ))) {
    const sourceEvidence = aggregate.evidence.find((record) => (
      record.studySessionId === studyId
      && record.sourceType === 'reference_video_metadata'
      && record.provenance.privateAssetId === asset.privateAssetId
    ))
    if (!sourceEvidence || !asset.storageObjectRecordId) continue
    try {
      const storage = await uploadService.getStorageObjectRecord(asset.storageObjectRecordId, reference.workspaceId)
      if (
        (storage.storageObjectRecord.editReferenceId ?? storage.storageObjectRecord.projectId) !== reference.id
        || storage.storageObjectRecord.mediaAssetId !== asset.mediaAssetId
      ) {
        studies.push(createBlockedEditReferenceMediaStudy({
          referenceAssetId: asset.id,
          privateAssetId: asset.privateAssetId,
          sourceEvidenceId: sourceEvidence.id,
        }, 'reference_media_identity_mismatch', 'The private reference asset identity no longer matches this Edit Reference. Reconnect it before retrying.'))
        continue
      }
      studies.push(await runEditReferenceLocalMediaStudy({
        env: context.env,
        referenceAssetId: asset.id,
        privateAssetId: asset.privateAssetId,
        sourceEvidenceId: sourceEvidence.id,
        storageObject: storage.storageObjectRecord,
        visualLanguageRuntime: createVisualLanguageRuntime({
          orchestrationId: input.orchestrationId,
          studySessionId: study.id,
          studyGoalEvidenceId: `${study.id}:visual-language-goal`,
          provider: input.visualLanguageProvider,
          productionAuthority: input.visualLanguageProductionAuthority,
          reviewedLocalRuntime: input.reviewedLocalVisualLanguageRuntime,
        }),
        colorTreatmentRuntime: createColorTreatmentRuntime({
          orchestrationId: input.orchestrationId,
          studySessionId: study.id,
          studyGoalEvidenceId: `${study.id}:color-treatment-goal`,
          provider: input.visualLanguageProvider,
          productionAuthority: input.colorTreatmentProductionAuthority,
          reviewedLocalRuntime: input.reviewedLocalColorTreatmentRuntime,
        }),
        graphicsMotionRuntime: createGraphicsMotionRuntime({
          orchestrationId: input.orchestrationId,
          studySessionId: study.id,
          studyGoalEvidenceId: `${study.id}:graphics-motion-goal`,
          provider: input.visualLanguageProvider,
          productionAuthority: input.graphicsMotionProductionAuthority,
          reviewedLocalRuntime: input.reviewedLocalGraphicsMotionRuntime,
        }),
        captionDesignRuntime: {
          orchestrationId: input.orchestrationId,
          studySessionId: study.id,
          studyGoalEvidenceId: `${study.id}:caption-design-goal`,
          provider: input.visualLanguageProvider,
          captionOcrAuthorityResolver: input.captionDesignOcrAuthorityResolver,
          productionAuthority: input.captionDesignProductionAuthority,
        },
        storyEditorialRuntime: {
          orchestrationId: input.orchestrationId,
          studySessionId: study.id,
          studyGoalEvidence: study.initialGoals.map((goal) => ({
            evidenceId: `${study.id}:story-editorial-goal:${goal}`,
            summary: `The saved Edit Reference study goal authorizes generalized ${goal.replaceAll('_', ' ')} analysis without copying source wording, sequence, timing, or identity.`,
            confidence: 1,
            requiresUserReview: false,
          })),
          provider: input.storyEditorialProvider,
          evidenceAuthorityResolver: input.storyEditorialEvidenceAuthorityResolver,
          productionAuthority: input.storyEditorialProductionAuthority,
        },
        speechPacingRuntime: {
          orchestrationId: input.orchestrationId,
          studySessionId: study.id,
          studyGoalEvidence: study.initialGoals.map((goal) => ({
            evidenceId: `${study.id}:speech-pacing-goal:${goal}`,
            summary: `The saved Edit Reference study goal authorizes generalized ${goal.replaceAll('_', ' ')} speech and pacing analysis without copying source wording, timing, voice identity, captions, or cut maps.`,
          })),
          provider: input.speechPacingProvider,
          transcriptAuthorityResolver: input.speechPacingTranscriptAuthorityResolver,
          productionAuthority: input.speechPacingProductionAuthority,
        },
        audioSoundDesignRuntime: createAudioSoundDesignRuntime({
          orchestrationId: input.orchestrationId,
          studySessionId: study.id,
          studyGoalEvidenceId: `${study.id}:audio-sound-design-goal`,
          provider: input.audioSoundDesignProvider,
          sourceAudioRightsBasis: sourceEvidence.provenance.rightsBasis === 'workspace_approved_edit'
            ? 'unknown'
            : sourceEvidence.provenance.rightsBasis ?? 'unknown',
          productionAuthority: input.audioSoundDesignProductionAuthority,
          reviewedLocalRuntime: input.reviewedLocalAudioSoundDesignRuntime,
        }),
      }))
    } catch {
      studies.push(createBlockedEditReferenceMediaStudy({
        referenceAssetId: asset.id,
        privateAssetId: asset.privateAssetId,
        sourceEvidenceId: sourceEvidence.id,
      }, 'reference_media_private_asset_unavailable', 'The private reference asset could not be opened by the approved local runtime. Reconnect it and retry.'))
    }
  }
  return studies
}

function createVisualLanguageRuntime(input: {
  readonly orchestrationId: string
  readonly studySessionId: string
  readonly studyGoalEvidenceId: string
  readonly provider: QwenVisualUnderstandingProvider
  readonly productionAuthority?: EditReferenceVisualLanguageProductionAuthority
  readonly reviewedLocalRuntime?: EditReferenceReviewedLocalVisualLanguageRuntimeOptions
}): EditReferenceVisualLanguageRuntimeInput {
  const identity = {
    orchestrationId: input.orchestrationId,
    studySessionId: input.studySessionId,
    studyGoalEvidenceId: input.studyGoalEvidenceId,
  }
  if (input.reviewedLocalRuntime) {
    return {
      ...identity,
      runtimeKind: 'reviewed_local_qwen25vl_mlx',
      ...input.reviewedLocalRuntime,
    }
  }
  return {
    ...identity,
    runtimeKind: 'provider',
    provider: input.provider,
    productionAuthority: input.productionAuthority,
  }
}

function createColorTreatmentRuntime(input: {
  readonly orchestrationId: string
  readonly studySessionId: string
  readonly studyGoalEvidenceId: string
  readonly provider: QwenVisualUnderstandingProvider
  readonly productionAuthority?: EditReferenceColorTreatmentProductionAuthority
  readonly reviewedLocalRuntime?: EditReferenceReviewedLocalColorTreatmentRuntimeOptions
}): EditReferenceColorTreatmentRuntimeInput {
  const identity = {
    orchestrationId: input.orchestrationId,
    studySessionId: input.studySessionId,
    studyGoalEvidenceId: input.studyGoalEvidenceId,
  }
  if (input.reviewedLocalRuntime) {
    return {
      ...identity,
      runtimeKind: 'reviewed_local_qwen25vl_mlx',
      ...input.reviewedLocalRuntime,
    }
  }
  return {
    ...identity,
    runtimeKind: 'provider',
    provider: input.provider,
    productionAuthority: input.productionAuthority,
  }
}

function createGraphicsMotionRuntime(input: {
  readonly orchestrationId: string
  readonly studySessionId: string
  readonly studyGoalEvidenceId: string
  readonly provider: QwenVisualUnderstandingProvider
  readonly productionAuthority?: EditReferenceGraphicsMotionProductionAuthority
  readonly reviewedLocalRuntime?: EditReferenceReviewedLocalGraphicsMotionRuntimeOptions
}): EditReferenceGraphicsMotionRuntimeInput {
  const identity = {
    orchestrationId: input.orchestrationId,
    studySessionId: input.studySessionId,
    studyGoalEvidenceId: input.studyGoalEvidenceId,
  }
  if (input.reviewedLocalRuntime) {
    return {
      ...identity,
      runtimeKind: 'reviewed_local_qwen25vl_mlx',
      ...input.reviewedLocalRuntime,
    }
  }
  return {
    ...identity,
    runtimeKind: 'provider',
    provider: input.provider,
    productionAuthority: input.productionAuthority,
  }
}

function createAudioSoundDesignRuntime(input: {
  readonly orchestrationId: string
  readonly studySessionId: string
  readonly studyGoalEvidenceId: string
  readonly sourceAudioRightsBasis: 'user_owned' | 'licensed_or_authorized' | 'reference_only' | 'unknown'
  readonly provider: EditReferenceAudioSoundDesignProvider
  readonly productionAuthority?: EditReferenceAudioSoundDesignProductionAuthority
  readonly reviewedLocalRuntime?: EditReferenceReviewedLocalAudioSoundDesignRuntimeOptions
}): EditReferenceAudioSoundDesignRuntimeInput {
  const identity = {
    orchestrationId: input.orchestrationId,
    studySessionId: input.studySessionId,
    studyGoalEvidenceId: input.studyGoalEvidenceId,
    sourceAudioRightsBasis: input.sourceAudioRightsBasis,
  }
  if (input.reviewedLocalRuntime) {
    return {
      ...identity,
      runtimeKind: 'reviewed_local_ast_audioset',
      ...input.reviewedLocalRuntime,
    }
  }
  return {
    ...identity,
    runtimeKind: 'provider',
    provider: input.provider,
    productionAuthority: input.productionAuthority,
  }
}

function requireReferenceVideoAsset(
  aggregate: EditReferenceAggregate,
  study: PreferenceStudySessionRecord,
  referenceAssetId: string,
): PreferenceAssetRecord {
  const asset = aggregate.assets.find((record) => (
    record.id === referenceAssetId
    && record.studySessionId === study.id
    && record.editReferenceId === study.editReferenceId
    && record.assetKind === 'reference_video_metadata'
  ))
  if (!asset) {
    throw new ApiError('REFERENCE_VIDEO_ASSET_NOT_FOUND', 'The selected reference video is unavailable in this Preference Study.', 404)
  }
  return asset
}

function validateLongFormStorageBinding(input: {
  readonly reference: EditReferenceRecord
  readonly asset: PreferenceAssetRecord
  readonly storageObjectRecordId: string
  readonly storageEditReferenceId?: string
  readonly storageProjectId?: string
  readonly storageMediaAssetId?: string
  readonly storageStatus: string
  readonly storageObjectPurpose: string
  readonly storageMimeType?: string
  readonly storageSizeBytes?: number
  readonly storageChecksumSha256?: string
}): void {
  if (
    input.asset.storageObjectRecordId !== input.storageObjectRecordId
    || input.asset.mediaAssetId !== input.storageMediaAssetId
    || (input.storageEditReferenceId ?? input.storageProjectId) !== input.reference.id
    || input.storageStatus !== 'ready'
    || input.storageObjectPurpose !== 'reference_media'
    || !input.storageMimeType?.startsWith('video/')
    || !Number.isSafeInteger(input.storageSizeBytes)
    || (input.storageSizeBytes ?? 0) <= 0
    || !/^[a-f0-9]{64}$/.test(input.storageChecksumSha256 ?? '')
  ) {
    throw new ApiError(
      'REFERENCE_VIDEO_NOT_FINALIZED',
      'The selected reference must remain bound to its exact finalized private video, verified size, and checksum before study can start.',
      409,
    )
  }
}

function validateLongFormStudyIdentity(input: {
  readonly reference: EditReferenceRecord
  readonly study: PreferenceStudySessionRecord
  readonly asset: PreferenceAssetRecord
  readonly plan: EditReferenceLongFormStudyPlan
  readonly run: EditReferenceLongFormStudyRunRecord
}): void {
  try {
    validateRunAgainstPlan(input.run, input.plan)
  } catch {
    throw new ApiError(
      'LONG_FORM_STUDY_CHECKPOINT_INVALID',
      'The retained whole-video study checkpoint failed its exact plan binding. ReEditPro stopped before reusing untrusted progress.',
      409,
    )
  }
  if (
    input.plan.workspaceId !== input.reference.workspaceId
    || input.plan.editReferenceId !== input.reference.id
    || input.plan.studySessionId !== input.study.id
    || input.asset.storageObjectRecordId !== input.plan.source.privateMediaArtifactId
  ) {
    throw new ApiError(
      'LONG_FORM_STUDY_IDENTITY_MISMATCH',
      'The retained study no longer belongs to this exact Edit Reference, Preference Study, and private video.',
      409,
    )
  }
  if (input.asset.longFormStudy) {
    const current = input.asset.longFormStudy
    const expected = createPreferenceLongFormStudySummary({
      referenceAssetId: input.asset.id,
      plan: input.plan,
      run: input.run,
    })
    if (
      current.runId !== expected.runId
      || current.planId !== expected.planId
      || current.planDigestSha256 !== expected.planDigestSha256
      || current.sourceBindingDigestSha256 !== expected.sourceBindingDigestSha256
    ) {
      throw new ApiError(
        'LONG_FORM_STUDY_SUMMARY_MISMATCH',
        'The public study summary no longer matches its private source and plan authority.',
        409,
      )
    }
    if (current.updatedAt === input.run.updatedAt) {
      try {
        assertPreferenceLongFormStudySummaryMatches({
          summary: current,
          referenceAssetId: input.asset.id,
          plan: input.plan,
          run: input.run,
        })
      } catch {
        throw new ApiError(
          'LONG_FORM_STUDY_SUMMARY_TAMPERED',
          'The exact current study summary failed verification. ReEditPro stopped before reporting false progress.',
          409,
        )
      }
    }
  }
}

function longFormStudyRunId(input: {
  readonly workspaceId: string
  readonly editReferenceId: string
  readonly studySessionId: string
  readonly referenceAssetId: string
  readonly storageObjectRecordId: string
  readonly mediaChecksumSha256: string
}): string {
  const digest = createHash('sha256').update(JSON.stringify({
    ...input,
    policyVersion: EDIT_REFERENCE_LONG_FORM_STUDY_POLICY_VERSION,
  })).digest('hex')
  return `edit-reference-long-form-run-${digest.slice(0, 48)}`
}

function longFormStudyStatusData(
  reference: EditReferenceRecord,
  study: PreferenceStudySessionRecord,
  asset: PreferenceAssetRecord,
  summary: PreferenceLongFormStudySummary,
): EditReferenceLongFormStudyStatusData {
  return {
    editReferenceId: reference.id,
    studySessionId: study.id,
    referenceAssetId: asset.id,
    sourceLabel: asset.label,
    study: structuredClone(summary),
    persistence: 'backend_local_private_segmented',
    productionPersistence: 'blocked_by_migration_baseline',
    safety: {
      providerCallMade: false,
      customerPriceCalculated: false,
      customerCreditsMutated: false,
      remoteMutationMade: false,
    },
  }
}

interface LoadedLongFormStudyReviewAuthority {
  readonly reference: EditReferenceRecord
  readonly study: PreferenceStudySessionRecord
  readonly asset: PreferenceAssetRecord
  readonly reviewPackage: EditReferenceLongFormStudyReviewPackage
  readonly selection: EditReferenceLongFormStudyReviewSelectionSummary
}

async function loadLongFormStudyReviewAuthority(input: {
  readonly aggregate: EditReferenceAggregate
  readonly studyId: string
  readonly referenceAssetId: string
  readonly scope: EditReferenceRepositoryScope
  readonly runtime: EditReferenceLongFormStudyRuntimePort
}): Promise<LoadedLongFormStudyReviewAuthority> {
  const study = requireStudy(input.aggregate, input.studyId)
  const reference = requireReference(input.aggregate, study.editReferenceId)
  const asset = requireReferenceVideoAsset(input.aggregate, study, input.referenceAssetId)
  if (!asset.longFormStudy) {
    throw new ApiError(
      'LONG_FORM_STUDY_NOT_FOUND',
      'Complete the private video study before reviewing what ReEditPro learned.',
      404,
    )
  }
  const persisted = await input.runtime.read({
    scope: input.scope,
    runId: asset.longFormStudy.runId,
  })
  if (!persisted) {
    throw new ApiError(
      'LONG_FORM_STUDY_CHECKPOINT_MISSING',
      'The retained study checkpoint is unavailable. ReEditPro kept the reference unchanged and did not create review guidance.',
      409,
    )
  }
  validateLongFormStudyIdentity({ reference, study, asset, plan: persisted.plan, run: persisted.run })
  const sourceEvidence = requireLongFormStudySourceEvidence(
    input.aggregate,
    findLongFormStudySourceEvidenceId(input.aggregate, study, asset),
    study,
    asset,
  )
  const semanticWorkItems = persisted.run.workItems
    .filter((workItem) => workItem.stageId === 'semantic_chunk_synthesis')
    .sort((left, right) => left.sourceCoverageStartSeconds - right.sourceCoverageStartSeconds)
  const chunks: EditReferenceLongFormStudyReviewChunkInput[] = []

  try {
    for (const semanticWorkItem of semanticWorkItems) {
      if (!semanticWorkItem.chunkId) throw new Error('Semantic study work lacks its exact section identity.')
      const visualWorkItem = requireLongFormStudyChunkWorkItem(
        persisted.run,
        semanticWorkItem.chunkId,
        'visual_sampling',
      )
      const sceneWorkItem = requireLongFormStudyChunkWorkItem(
        persisted.run,
        semanticWorkItem.chunkId,
        'scene_boundary_scan',
      )
      const speechWorkItem = persisted.run.workItems.find((workItem) => (
        workItem.chunkId === semanticWorkItem.chunkId && workItem.stageId === 'speech_transcript'
      ))
      const [visualSamplingOutput, sceneBoundaryOutput, speechTranscriptOutput] = await Promise.all([
        input.runtime.readWorkOutput({
          scope: input.scope,
          runId: persisted.run.runId,
          workItemId: visualWorkItem.workItemId,
        }),
        input.runtime.readWorkOutput({
          scope: input.scope,
          runId: persisted.run.runId,
          workItemId: sceneWorkItem.workItemId,
        }),
        speechWorkItem
          ? input.runtime.readWorkOutput({
            scope: input.scope,
            runId: persisted.run.runId,
            workItemId: speechWorkItem.workItemId,
          })
          : Promise.resolve(undefined),
      ])
      if (!visualSamplingOutput || !sceneBoundaryOutput) {
        throw new Error('The review is waiting for verified visual and scene evidence from every section.')
      }
      const semanticWindowPlan = createEditReferenceLongFormSemanticWindowPlan({
        plan: persisted.plan,
        chunkId: semanticWorkItem.chunkId,
        visualSamplingOutput,
        sceneBoundaryOutput,
        ...(speechTranscriptOutput ? { speechTranscriptOutput } : {}),
      })
      const checkpoints = await Promise.all(semanticWindowPlan.windows.flatMap((window) => (
        EDIT_REFERENCE_SEMANTIC_SPECIALISTS.map((specialist) => input.runtime.readSemanticWindowCheckpoint({
          scope: input.scope,
          runId: persisted.run.runId,
          workItemId: semanticWorkItem.workItemId,
          semanticWindowId: window.semanticWindowId,
          specialistId: specialist.specialistId,
          semanticWindowPlan,
        }))
      )))
      if (checkpoints.some((checkpoint) => !checkpoint)) {
        throw new Error('The review is waiting for every specialist checkpoint across the complete video.')
      }
      chunks.push({
        workItemId: semanticWorkItem.workItemId,
        semanticWindowPlan,
        checkpoints: checkpoints.filter((checkpoint): checkpoint is NonNullable<typeof checkpoint> => Boolean(checkpoint)),
      })
    }
    const reviewPackage = createEditReferenceLongFormStudyReviewPackage({
      plan: persisted.plan,
      run: persisted.run,
      sourceEvidenceId: sourceEvidence.id,
      chunks,
      createdAt: persisted.run.completionAttestation?.finalizedAt ?? persisted.run.updatedAt,
    })
    return {
      reference,
      study,
      asset,
      reviewPackage,
      selection: longFormStudyReviewSelection(input.aggregate, reviewPackage),
    }
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(
      'LONG_FORM_STUDY_REVIEW_NOT_READY',
      error instanceof Error
        ? error.message
        : 'The complete video study is not ready for evidence review yet.',
      409,
    )
  }
}

function requireLongFormStudyChunkWorkItem(
  run: EditReferenceLongFormStudyRunRecord,
  chunkId: string,
  stageId: 'visual_sampling' | 'scene_boundary_scan',
): EditReferenceLongFormStudyRunRecord['workItems'][number] {
  const workItem = run.workItems.find((candidate) => (
    candidate.chunkId === chunkId && candidate.stageId === stageId
  ))
  if (!workItem) throw new Error(`The ${stageId.replaceAll('_', ' ')} checkpoint is unavailable for one section.`)
  return workItem
}

function findLongFormStudySourceEvidenceId(
  aggregate: EditReferenceAggregate,
  study: PreferenceStudySessionRecord,
  asset: PreferenceAssetRecord,
): string {
  const matches = aggregate.evidence.filter((record) => (
    record.studySessionId === study.id
    && record.editReferenceId === study.editReferenceId
    && record.sourceType === 'reference_video_metadata'
    && record.provenance.privateAssetId === asset.privateAssetId
  ))
  if (matches.length !== 1) {
    throw new ApiError(
      'LONG_FORM_STUDY_IDENTITY_MISMATCH',
      'The studied video does not have one exact saved evidence record. ReEditPro stopped before exposing ambiguous guidance.',
      409,
    )
  }
  return matches[0]!.id
}

function requireLongFormStudySourceEvidence(
  aggregate: EditReferenceAggregate,
  sourceEvidenceId: string,
  study: PreferenceStudySessionRecord,
  asset: PreferenceAssetRecord,
): PreferenceEvidenceRecord {
  const sourceEvidence = aggregate.evidence.find((record) => record.id === sourceEvidenceId)
  if (
    !sourceEvidence
    || sourceEvidence.studySessionId !== study.id
    || sourceEvidence.editReferenceId !== study.editReferenceId
    || sourceEvidence.sourceType !== 'reference_video_metadata'
    || sourceEvidence.provenance.privateAssetId !== asset.privateAssetId
  ) {
    throw new ApiError(
      'LONG_FORM_STUDY_IDENTITY_MISMATCH',
      'The study review is no longer bound to its exact saved reference video.',
      409,
    )
  }
  return sourceEvidence
}

function longFormStudyReviewData(
  authority: LoadedLongFormStudyReviewAuthority,
): EditReferenceLongFormStudyReviewData {
  const selectedByFinding = new Map(authority.selection.decisions.map((decision) => (
    [decision.findingId, decision.decision]
  )))
  return {
    editReferenceId: authority.reference.id,
    studySessionId: authority.study.id,
    studyRevision: authority.study.revision,
    referenceAssetId: authority.asset.id,
    sourceLabel: authority.asset.label,
    reviewPackageId: authority.reviewPackage.packageId,
    reviewPackageDigestSha256: authority.reviewPackage.packageDigestSha256,
    reviewAuthority: authority.reviewPackage.reviewAuthority,
    sourceDurationSeconds: authority.reviewPackage.sourceDurationSeconds,
    sourceHasAudio: authority.reviewPackage.sourceHasAudio,
    chunkCount: authority.reviewPackage.chunkCount,
    semanticWindowCount: authority.reviewPackage.semanticWindowCount,
    checkpointCount: authority.reviewPackage.checkpointCount,
    findings: authority.reviewPackage.findings.map((finding) => ({
      findingId: finding.findingId,
      specialistId: finding.specialistId,
      title: finding.title,
      status: finding.status,
      summary: finding.summary,
      confidence: finding.confidence,
      semanticWindowCount: finding.semanticWindowCount,
      copyRiskKinds: [...finding.copyRiskKinds],
      canAdapt: finding.status === 'analyzed' && finding.copyRiskKinds.length === 0,
      requiresUserSelection: finding.requiresUserSelection,
      ...(selectedByFinding.has(finding.findingId)
        ? { selectedDecision: selectedByFinding.get(finding.findingId)! }
        : {}),
    })),
    selection: authority.selection,
    boundaries: structuredClone(authority.reviewPackage.boundaries),
    persistence: 'backend_local_private_segmented',
    productionPersistence: 'blocked_by_migration_baseline',
  }
}

function longFormStudyReviewSelection(
  aggregate: EditReferenceAggregate,
  reviewPackage: EditReferenceLongFormStudyReviewPackage,
): EditReferenceLongFormStudyReviewSelectionSummary {
  const orchestrationId = longFormStudyReviewOrchestrationId(reviewPackage.packageDigestSha256)
  const selectionRuns = aggregate.skillRuns.filter((record) => (
    record.orchestrationId === orchestrationId
    && record.skillId.startsWith('edit_reference.long_form.review_selection.')
  ))
  const notApplicableFindingCount = reviewPackage.findings.filter((finding) => (
    finding.status === 'not_applicable'
  )).length
  if (selectionRuns.length === 0) {
    return {
      status: 'needs_selection',
      decisions: [],
      adaptedFindingCount: 0,
      contextOnlyFindingCount: 0,
      avoidedFindingCount: 0,
      notApplicableFindingCount,
    }
  }
  const decisions: EditReferenceLongFormStudyReviewDecision[] = []
  for (const finding of reviewPackage.findings.filter((candidate) => candidate.status === 'analyzed')) {
    const matchingRuns = selectionRuns.filter((record) => (
      record.skillId === `edit_reference.long_form.review_selection.${finding.specialistId}`
    ))
    if (matchingRuns.length !== 1 || matchingRuns[0]!.outputEvidenceIds.length !== 1) {
      throw new ApiError(
        'LONG_FORM_STUDY_REVIEW_CHECKPOINT_INVALID',
        'The saved review selection is incomplete or ambiguous. ReEditPro did not infer a missing choice.',
        409,
      )
    }
    const evidence = aggregate.evidence.find((record) => (
      record.id === matchingRuns[0]!.outputEvidenceIds[0]
      && record.orchestrationId === orchestrationId
    ))
    const decision = evidence ? longFormReviewDecisionFromTransferability(evidence.transferability) : undefined
    if (!decision) {
      throw new ApiError(
        'LONG_FORM_STUDY_REVIEW_CHECKPOINT_INVALID',
        'The saved review selection cannot be reconstructed from exact evidence.',
        409,
      )
    }
    decisions.push({
      schemaVersion: EDIT_REFERENCE_LONG_FORM_STUDY_REVIEW_DECISION_VERSION,
      findingId: finding.findingId,
      decision,
    })
  }
  const selectedAt = selectionRuns
    .map((record) => record.createdAt)
    .sort()[0]
  return {
    status: 'selected',
    decisions,
    ...(selectedAt ? { selectedAt } : {}),
    adaptedFindingCount: decisions.filter((record) => record.decision === 'adapt').length,
    contextOnlyFindingCount: decisions.filter((record) => record.decision === 'context_only').length,
    avoidedFindingCount: decisions.filter((record) => record.decision === 'avoid').length,
    notApplicableFindingCount,
  }
}

function longFormReviewDecisionFromTransferability(
  transferability: PreferenceEvidenceTransferability,
): EditReferenceLongFormStudyReviewDecision['decision'] | undefined {
  if (transferability === 'transferable') return 'adapt'
  if (transferability === 'non_transferable') return 'context_only'
  if (transferability === 'do_not_copy') return 'avoid'
  return undefined
}

function longFormStudyReviewOrchestrationId(packageDigestSha256: string): string {
  return `preference-long-form-review-${packageDigestSha256.slice(0, 40)}`
}

function assertLongFormStudyReviewPackageDigest(actual: string, expected: string): void {
  if (actual !== expected) {
    throw new ApiError(
      'VERSION_CONFLICT',
      'The video study changed before your review was saved. Reload the findings and review the current version.',
      409,
    )
  }
}

function assertLongFormStudyReviewIsEditable(
  aggregate: EditReferenceAggregate,
  study: PreferenceStudySessionRecord,
): void {
  if (aggregate.dnaVersions.some((record) => (
    record.studySessionId === study.id && record.status !== 'superseded'
  ))) {
    throw new ApiError(
      'VERSION_CONFLICT',
      'Preference DNA review has already started. Start a new Preference Study before changing the studied-video decisions.',
      409,
    )
  }
}

function sameLongFormReviewDecisions(
  left: readonly EditReferenceLongFormStudyReviewDecision[],
  right: readonly EditReferenceLongFormStudyReviewDecision[],
): boolean {
  const normalized = (records: readonly EditReferenceLongFormStudyReviewDecision[]) => records
    .map((record) => ({ findingId: record.findingId, decision: record.decision }))
    .sort((a, b) => a.findingId.localeCompare(b.findingId))
  return JSON.stringify(normalized(left)) === JSON.stringify(normalized(right))
}

function longFormStudyStartedMessage(
  reference: EditReferenceRecord,
  study: PreferenceStudySessionRecord,
  summary: PreferenceLongFormStudySummary,
  now: string,
  sequence: number,
): PreferenceStudyMessageRecord {
  return {
    id: `preference-study-message-${randomUUID()}`,
    workspaceId: reference.workspaceId,
    editReferenceId: reference.id,
    studySessionId: study.id,
    role: 'assistant',
    content: `ReEditPro verified the private video and started a checkpointed whole-video study across ${summary.chunkCount} bounded section${summary.chunkCount === 1 ? '' : 's'}. It can continue for a long session and recover without losing completed work. Progress reflects completed analysis only.`,
    sequence,
    runtimeSource: 'deterministic_evidence',
    createdAt: now,
  }
}

function longFormStudyControlMessage(
  reference: EditReferenceRecord,
  study: PreferenceStudySessionRecord,
  action: ControlEditReferenceLongFormStudyRequest['action'],
  activeWorkFinishesBeforePause: boolean,
  recoveredWorkItemCount: number,
  now: string,
  sequence: number,
): PreferenceStudyMessageRecord {
  const content = action === 'pause'
    ? activeWorkFinishesBeforePause
      ? 'Pause requested. The active bounded study step can finish safely, then ReEditPro will remain paused. Every completed checkpoint is preserved.'
      : 'Study paused safely. Every completed checkpoint is preserved and the next step will not start until you resume.'
    : action === 'resume'
      ? 'Study resumed from the last verified checkpoint. Completed work was not repeated.'
      : action === 'recover'
        ? `Recovery authorized for ${recoveredWorkItemCount} blocked study step${recoveredWorkItemCount === 1 ? '' : 's'}. ReEditPro will retry only that work and preserve every completed checkpoint.`
        : 'Study cancelled. The original video and completed checkpoints remain retained; no new study step will start.'
  return {
    id: `preference-study-message-${randomUUID()}`,
    workspaceId: reference.workspaceId,
    editReferenceId: reference.id,
    studySessionId: study.id,
    role: 'assistant',
    content,
    sequence,
    runtimeSource: 'deterministic_evidence',
    createdAt: now,
  }
}

function replayDetailData(
  { aggregate, receipt }: EditReferenceMutationReplayContext,
): EditReferenceDetailData & { appendedMessageIds?: string[] } {
  const storedReference = requireReference(aggregate, receipt.result.editReferenceId)
  requireStudy(aggregate, receipt.result.studySessionId)
  const retainedIds = new Set([
    ...aggregate.references,
    ...aggregate.studies,
    ...aggregate.messages,
    ...aggregate.reasoningAttempts,
    ...aggregate.reasoningProviderRequests,
    ...aggregate.reasoningProviderCheckbacks,
    ...aggregate.reasoningProviderWorkflows,
    ...aggregate.reasoningInternalCostAuthorities,
    ...aggregate.preferenceDnaReasoningAttempts,
    ...aggregate.evidence,
    ...aggregate.assets,
    ...aggregate.skillRuns,
    ...aggregate.dnaVersions,
    ...aggregate.dnaQaResults,
    ...aggregate.applications,
    ...aggregate.usageLogs,
  ].map((record) => record.id))
  if (receipt.result.stableResultIds.some((id) => !retainedIds.has(id))) {
    throw new ApiError('INTERNAL_ERROR', 'The committed Edit Reference idempotency result is no longer reconstructable.', 500)
  }
  const reference = structuredClone(storedReference)
  reference.currentStudyId = receipt.result.studySessionId
  const data = detailData(aggregate, reference)
  return receipt.result.appendedMessageIds
    ? { ...data, appendedMessageIds: [...receipt.result.appendedMessageIds] }
    : data
}

function detailData(aggregate: EditReferenceAggregate, reference: EditReferenceRecord): EditReferenceDetailData {
  const study = requireStudy(aggregate, reference.currentStudyId)
  const skillRuns = aggregate.skillRuns.filter((record) => record.studySessionId === study.id)
  const reasoningAttempts = aggregate.reasoningAttempts.filter((record) => record.studySessionId === study.id)
  const preferenceDnaReasoningAttempts = aggregate.preferenceDnaReasoningAttempts
    .filter((record) => record.studySessionId === study.id)
  const longFormStudies = aggregate.assets
    .filter((record) => record.studySessionId === study.id && Boolean(record.longFormStudy))
  const dnaQaResults = aggregate.dnaQaResults.filter((record) => aggregate.dnaVersions.some((dna) => dna.id === record.dnaVersionId && dna.studySessionId === study.id))
  const detail: EditReferenceDetail = {
    reference,
    study,
    messages: studyMessages(aggregate, study.id),
    studyChatReasoning: reasoningAttempts
      .slice()
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id))
      .map((attempt) => studyChatReasoningStatus(aggregate, attempt)),
    evidence: aggregate.evidence.filter((record) => record.studySessionId === study.id),
    assets: aggregate.assets.filter((record) => record.studySessionId === study.id),
    skillRuns,
    dnaVersions: aggregate.dnaVersions
      .filter((record) => record.studySessionId === study.id)
      .map((record) => toPublicPreferenceDnaVersion(aggregate, record, dnaQaResults)),
    dnaQaResults,
    applications: aggregate.applications.filter((record) => record.editReferenceId === reference.id),
    usageLogs: aggregate.usageLogs.filter((record) => record.editReferenceId === reference.id),
    nextAction: nextActionForDetail(aggregate, reference, study),
    safety: {
      ...EDIT_REFERENCE_SAFETY_FLAGS,
      providerCallMade: skillRuns.some((record) => record.providerCallMade)
        || reasoningAttempts.some((record) => record.result?.status === 'answered'
          ? record.result.execution.providerCallMade
          : record.result?.providerCallMade === true)
        || preferenceDnaReasoningAttempts.some((record) => record.result?.status === 'validated_candidate'
          ? record.result.execution.providerCallMade
          : record.result?.providerCallMade === true),
      modelCallMade: skillRuns.some((record) => record.modelCallMade)
        || reasoningAttempts.some((record) => record.result?.status === 'answered'
          ? record.result.execution.modelCallMade
          : record.result?.modelCallMade === true)
        || preferenceDnaReasoningAttempts.some((record) => record.result?.status === 'validated_candidate'
          ? record.result.execution.modelCallMade
          : record.result?.modelCallMade === true),
      fileBytesRead: skillRuns.some((record) => record.fileBytesRead) || longFormStudies.length > 0,
      mediaProcessingStarted: skillRuns.some((record) => record.mediaProcessingStarted) || longFormStudies.length > 0,
    },
  }
  return { detail, replayed: false }
}

function studyChatReasoningStatus(
  aggregate: EditReferenceAggregate,
  attempt: EditReferenceStudyChatReasoningAttemptRecord,
): EditReferenceStudyChatReasoningStatus {
  const providerRequest = aggregate.reasoningProviderRequests.find(
    (record) => record.reasoningAttemptId === attempt.id,
  )
  const checkback = providerRequest
    ? aggregate.reasoningProviderCheckbacks.find(
        (record) => record.reasoningProviderRequestId === providerRequest.id,
      )
    : undefined
  const workflow = checkback
    ? aggregate.reasoningProviderWorkflows.find(
        (record) => record.reasoningProviderCheckbackId === checkback.id,
      )
    : undefined
  const needsReview = providerRequest?.operatorReviewRequired === true
    || checkback?.operatorReviewRequired === true
    || workflow?.operatorReviewRequired === true
    || attempt.state === 'cost_unverified'
  const state: EditReferenceStudyChatReasoningStatus['state'] = attempt.state === 'completed'
    ? 'answered'
    : attempt.state === 'reserved'
      ? 'queued'
      : attempt.state === 'running'
        ? needsReview
          ? 'needs_review'
          : providerRequest && ['submission_unknown', 'submitted'].includes(providerRequest.state)
            ? 'waiting'
            : 'thinking'
        : attempt.state === 'cancelled'
          ? 'cancelled'
          : needsReview
            ? 'needs_review'
            : 'failed'
  const statusText = state === 'answered'
    ? 'Response ready.'
    : state === 'queued'
      ? 'Saved. ReEditPro is preparing a response.'
      : state === 'thinking'
        ? 'ReEditPro is studying this direction.'
        : state === 'waiting'
          ? 'Your direction is saved. ReEditPro is waiting for the reasoning result.'
          : state === 'needs_review'
            ? 'Your direction is saved, but the response needs review before it can continue.'
            : state === 'cancelled'
              ? 'Your direction is saved. The response was cancelled.'
              : 'Your direction is saved. ReEditPro could not complete the response.'
  const retryAvailable = attempt.result?.status === 'blocked'
    ? attempt.result.retryAvailable
    : needsReview
  const providerCallMayHaveOccurred = providerRequest?.providerCallMayHaveOccurred === true
    || ['called_no_cost', 'called_metered', 'called_cost_unverified'].includes(attempt.providerExecutionState)
  const updatedAt = [
    attempt.settledAt,
    workflow?.updatedAt,
    checkback?.updatedAt,
    providerRequest?.updatedAt,
    attempt.startedAt,
    attempt.reservedAt,
  ].filter((value): value is string => Boolean(value)).sort().at(-1) ?? attempt.createdAt
  return {
    attemptId: attempt.id,
    userMessageId: attempt.userMessageId,
    ...(attempt.assistantMessageId ? { assistantMessageId: attempt.assistantMessageId } : {}),
    state,
    statusText,
    retryAvailable,
    providerCallMayHaveOccurred,
    createdAt: attempt.createdAt,
    updatedAt,
  }
}

function toPublicPreferenceDnaVersion(
  aggregate: EditReferenceAggregate,
  record: PreferenceDNAVersionRecord,
  qaResults: EditReferenceAggregate['dnaQaResults'],
): PreferenceDNAVersionRecord {
  const publicVersion = structuredClone(record)
  const provenance = record.reasoningProvenance
  if (!provenance) return publicVersion
  const qaResult = qaResults.find((candidate) => candidate.id === record.qaResultId)
  if (!qaResult) {
    throw new ApiError('INTERNAL_ERROR', 'AI-assisted Preference DNA review is missing its exact quality result.', 500)
  }
  publicVersion.reasoningReview = createEditReferencePreferenceDnaReasoningReviewSummary({
    version: record,
    qaResult,
    attempt: requirePreferenceDnaReasoningAttempt(aggregate, provenance.reasoningAttemptId),
  })
  delete publicVersion.reasoningProvenance
  return publicVersion
}

function nextActionForDetail(
  aggregate: EditReferenceAggregate,
  reference: EditReferenceRecord,
  study: PreferenceStudySessionRecord,
): EditReferenceDetail['nextAction'] {
  if (reference.status === 'archived') return 'archived'
  if (study.status === 'studying') return 'monitor_evidence_study'
  if (study.status === 'evidence_ready') return 'generate_preference_dna'
  const activeDNAVersion = reference.dnaStatus === 'not_generated'
    ? undefined
    : aggregate.dnaVersions
      .filter((record) => record.studySessionId === study.id && record.status !== 'superseded')
      .sort((left, right) => right.version - left.version)[0]
  if (activeDNAVersion) {
    if (activeDNAVersion.status === 'approved') return 'prepare_target_application'
    if (activeDNAVersion.qaStatus === 'not_run') return 'run_preference_dna_qa'
    if (activeDNAVersion.qaStatus === 'blocked') return 'correct_preference_dna'
    return 'approve_preference_dna'
  }
  if (study.status === 'qa_blocked') return 'correct_preference_dna'
  if (study.status === 'needs_user_review') return 'review_study_findings'
  if (study.status === 'needs_clarification') return 'add_missing_evidence'
  const sourceEvidence = aggregate.evidence.filter((record) => record.studySessionId === study.id && record.sourceType !== 'derived_skill_evidence')
  if (sourceEvidence.length > 0) return 'run_evidence_study'
  return aggregate.messages.some((message) => message.studySessionId === study.id && message.role === 'user')
    ? 'add_reference_evidence'
    : 'answer_setup_questions'
}

function createStudyRecord(reference: EditReferenceRecord, id: string, title: string, now: string): PreferenceStudySessionRecord {
  return {
    id,
    workspaceId: reference.workspaceId,
    editReferenceId: reference.id,
    title,
    status: 'collecting_evidence',
    initialGoals: reference.initialGoals,
    revision: 1,
    createdAt: now,
    updatedAt: now,
    runtimeSource: 'backend_local_private',
    evidenceStatus: 'not_complete',
    dnaStatus: 'not_generated',
    qaStatus: 'not_run',
  }
}

function setupMessages(reference: EditReferenceRecord, study: PreferenceStudySessionRecord, now: string): PreferenceStudyMessageRecord[] {
  return [
    {
      id: `preference-study-message-${randomUUID()}`,
      workspaceId: reference.workspaceId,
      editReferenceId: reference.id,
      studySessionId: study.id,
      role: 'system',
      content: 'This study uses only evidence you deliberately add. Saving video details does not mean the video itself has been studied.',
      sequence: 1,
      runtimeSource: 'deterministic_setup',
      createdAt: now,
    },
    {
      id: `preference-study-message-${randomUUID()}`,
      workspaceId: reference.workspaceId,
      editReferenceId: reference.id,
      studySessionId: study.id,
      role: 'assistant',
      content: setupQuestion(reference),
      sequence: 2,
      runtimeSource: 'deterministic_setup',
      createdAt: now,
    },
  ]
}

function setupQuestion(reference: EditReferenceRecord): string {
  return `Let’s build “${reference.name}.” Tell me how you want ReEditPro to edit, upload a reference video you like, or use one of your approved edits. I’ll study the editing choices deeply and show you what I learned before anything can be used.`
}

function deterministicAcknowledgement(reference: EditReferenceRecord): string {
  return `Got it — I saved that direction for “${reference.name}.” Keep describing the style, or add a reference video when an example would help. Nothing will be applied until you review and approve the finished preference.`
}

function evidenceSavedMessage(
  reference: EditReferenceRecord,
  study: PreferenceStudySessionRecord,
  evidence: PreferenceEvidenceRecord,
  now: string,
  sequence: number,
): PreferenceStudyMessageRecord {
  const boundary = evidence.sourceType === 'reference_video_metadata'
    ? ' Only the details you entered were saved; the video itself was not studied.'
    : evidence.sourceType === 'previous_approved_edit_snapshot'
      ? ' Its identity was recorded, but no project history, snapshot content, or media was opened.'
      : ''
  return {
    id: `preference-study-message-${randomUUID()}`,
    workspaceId: reference.workspaceId,
    editReferenceId: reference.id,
    studySessionId: study.id,
    role: 'assistant',
    content: `“${evidence.title}” was added to this study.${boundary} You can study the saved evidence now or add more context first.`,
    sequence,
    runtimeSource: 'deterministic_evidence',
    createdAt: now,
  }
}

function studyResultMessage(
  reference: EditReferenceRecord,
  study: PreferenceStudySessionRecord,
  content: string,
  now: string,
  sequence: number,
): PreferenceStudyMessageRecord {
  return {
    id: `preference-study-message-${randomUUID()}`,
    workspaceId: reference.workspaceId,
    editReferenceId: reference.id,
    studySessionId: study.id,
    role: 'assistant',
    content,
    sequence,
    runtimeSource: 'deterministic_evidence',
    createdAt: now,
  }
}

function dnaSynthesisMessage(
  reference: EditReferenceRecord,
  study: PreferenceStudySessionRecord,
  dnaVersion: EditReferenceDetail['dnaVersions'][number],
  now: string,
  sequence: number,
): PreferenceStudyMessageRecord {
  return {
    id: `preference-study-message-${randomUUID()}`,
    workspaceId: reference.workspaceId,
    editReferenceId: reference.id,
    studySessionId: study.id,
    role: 'assistant',
    content: `Preference DNA version ${dnaVersion.version} was prepared from ${dnaVersion.inputEvidenceRevisions.length} exact evidence records. It remains locked for quality review; nothing has been approved or applied.`,
    sequence,
    runtimeSource: 'deterministic_dna',
    createdAt: now,
  }
}

function dnaQAMessage(
  reference: EditReferenceRecord,
  study: PreferenceStudySessionRecord,
  qaResult: EditReferenceDetail['dnaQaResults'][number],
  now: string,
  sequence: number,
): PreferenceStudyMessageRecord {
  const next = qaResult.status === 'blocked'
    ? 'Correct the evidence and create a new version before approval.'
    : qaResult.status === 'requires_user_review'
      ? 'Review and acknowledge the flagged limits before approving this exact version.'
      : 'The exact version can now be reviewed for approval.'
  return {
    id: `preference-study-message-${randomUUID()}`,
    workspaceId: reference.workspaceId,
    editReferenceId: reference.id,
    studySessionId: study.id,
    role: 'assistant',
    content: `${qaResult.summary} ${next} No edit was changed and no production work started.`,
    sequence,
    runtimeSource: 'deterministic_dna_qa',
    createdAt: now,
  }
}

function dnaApprovalMessage(
  reference: EditReferenceRecord,
  study: PreferenceStudySessionRecord,
  dnaVersion: EditReferenceDetail['dnaVersions'][number],
  now: string,
  sequence: number,
): PreferenceStudyMessageRecord {
  return {
    id: `preference-study-message-${randomUUID()}`,
    workspaceId: reference.workspaceId,
    editReferenceId: reference.id,
    studySessionId: study.id,
    role: 'assistant',
    content: `Preference DNA version ${dnaVersion.version} was approved with the quality review tied to this exact version. Approval saves reusable guidance only; it has not been applied to an edit and no production work started.`,
    sequence,
    runtimeSource: 'deterministic_dna_approval',
    createdAt: now,
  }
}

function targetApplicationMessage(
  reference: EditReferenceRecord,
  study: PreferenceStudySessionRecord,
  application: EditReferenceDetail['applications'][number],
  now: string,
  sequence: number,
): PreferenceStudyMessageRecord {
  return {
    id: `preference-study-message-${randomUUID()}`,
    workspaceId: reference.workspaceId,
    editReferenceId: reference.id,
    studySessionId: study.id,
    role: 'assistant',
    content: `${application.summary} The guidance is saved for review, but “${application.targetContext.editName}” has not changed and no production work started.`,
    sequence,
    runtimeSource: 'deterministic_dna_application',
    createdAt: now,
  }
}

function preferenceApplicationLifecycleMessage(
  reference: EditReferenceRecord,
  study: PreferenceStudySessionRecord,
  content: string,
  now: string,
  sequence: number,
): PreferenceStudyMessageRecord {
  return {
    id: `preference-study-message-${randomUUID()}`,
    workspaceId: reference.workspaceId,
    editReferenceId: reference.id,
    studySessionId: study.id,
    role: 'assistant',
    content: `${content} No provider, production, rendering, or credit action started.`,
    sequence,
    runtimeSource: 'deterministic_dna_application',
    createdAt: now,
  }
}

function createEvidenceRecords(
  reference: EditReferenceRecord,
  study: PreferenceStudySessionRecord,
  input: CreatePreferenceEvidenceRequest,
  now: string,
): { evidence: PreferenceEvidenceRecord; asset?: PreferenceAssetRecord } {
  const evidenceId = `preference-evidence-${randomUUID()}`
  if (input.sourceType === 'manual_user_evidence') {
    return {
      evidence: {
        id: evidenceId,
        workspaceId: reference.workspaceId,
        editReferenceId: reference.id,
        studySessionId: study.id,
        sourceType: input.sourceType,
        ...(input.supersedesEvidenceId ? { supersedesEvidenceId: input.supersedesEvidenceId } : {}),
        category: input.category,
        title: input.title,
        summary: input.summary,
        revision: 1,
        confidence: 0.65,
        confidenceBasis: 'user_asserted',
        transferability: input.intendedUse,
        provenance: {
          runtimeSource: 'user_input',
          sourceEvidenceIds: input.supersedesEvidenceId ? [input.supersedesEvidenceId] : [],
          mediaStudyStatus: 'not_applicable',
          toolIds: [],
          skillIds: [],
          fallbackUsed: false,
          notes: ['Saved as user-described evidence. No media or model analysis is implied.'],
        },
        createdAt: now,
        updatedAt: now,
      },
    }
  }

  const privateAssetId = input.sourceType === 'reference_video_metadata' && input.mediaAssetId
    ? input.mediaAssetId
    : `preference-private-asset-${randomUUID()}`
  if (input.sourceType === 'reference_video_metadata') {
    const mediaMetadata = normalizeMediaMetadata(input)
    const asset: PreferenceAssetRecord = {
      id: `preference-asset-${randomUUID()}`,
      workspaceId: reference.workspaceId,
      editReferenceId: reference.id,
      studySessionId: study.id,
      privateAssetId,
      ...(input.storageObjectRecordId ? { storageObjectRecordId: input.storageObjectRecordId } : {}),
      ...(input.mediaAssetId ? { mediaAssetId: input.mediaAssetId } : {}),
      assetKind: 'reference_video_metadata',
      label: input.sourceLabel,
      rightsBasis: input.rightsBasis,
      mediaStudyStatus: 'media_not_studied',
      mediaMetadata,
      createdAt: now,
    }
    return {
      asset,
      evidence: {
        id: evidenceId,
        workspaceId: reference.workspaceId,
        editReferenceId: reference.id,
        studySessionId: study.id,
        sourceType: input.sourceType,
        category: 'media_structure',
        title: input.title,
        summary: input.storageObjectRecordId
          ? `${input.sourceLabel} was stored as a private reference asset. Its media has not been studied yet.`
          : `${input.sourceLabel} metadata was supplied for this study. The media itself has not been studied.`,
        revision: 1,
        confidence: 1,
        confidenceBasis: 'metadata_verified',
        transferability: 'requires_user_review',
        mediaMetadata,
        provenance: {
          runtimeSource: 'user_input',
          sourceEvidenceIds: [],
          privateAssetId,
          sourceLabel: input.sourceLabel,
          rightsBasis: input.rightsBasis,
          mediaStudyStatus: 'media_not_studied',
          toolIds: [],
          skillIds: [],
          fallbackUsed: false,
          notes: input.storageObjectRecordId
            ? ['Only canonical private asset identities were persisted. No signed URL, filesystem path, raw frame, transcript, or provider payload was stored.']
            : ['No URL, path, media bytes, frames, transcript, audio, or provider payload was accepted or persisted.'],
        },
        createdAt: now,
        updatedAt: now,
      },
    }
  }

  const asset: PreferenceAssetRecord = {
    id: `preference-asset-${randomUUID()}`,
    workspaceId: reference.workspaceId,
    editReferenceId: reference.id,
    studySessionId: study.id,
    privateAssetId,
    assetKind: 'previous_approved_edit_snapshot',
    label: input.title,
    rightsBasis: input.rightsBasis,
    mediaStudyStatus: 'approved_edit_identity_not_verified',
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    approvedSnapshotId: input.approvedSnapshotId,
    createdAt: now,
  }
  return {
    asset,
    evidence: {
      id: evidenceId,
      workspaceId: reference.workspaceId,
      editReferenceId: reference.id,
      studySessionId: study.id,
      sourceType: input.sourceType,
      category: 'media_structure',
      title: input.title,
      summary: input.summary ?? 'A previous approved edit identity was supplied for future private study.',
      revision: 1,
      confidence: 0.5,
      confidenceBasis: 'user_asserted',
      transferability: 'requires_user_review',
      provenance: {
        runtimeSource: 'user_input',
        sourceEvidenceIds: [],
        privateAssetId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        approvedSnapshotId: input.approvedSnapshotId,
        rightsBasis: input.rightsBasis,
        mediaStudyStatus: 'approved_edit_identity_not_verified',
        toolIds: [],
        skillIds: [],
        fallbackUsed: false,
        notes: ['Exact identity was saved. No project history, approved snapshot content, preview, or media bytes were opened.'],
      },
      createdAt: now,
      updatedAt: now,
    },
  }
}

function normalizeMediaMetadata(input: Extract<CreatePreferenceEvidenceRequest, { sourceType: 'reference_video_metadata' }>): PreferenceEvidenceMediaMetadata {
  const width = input.width
  const height = input.height
  const orientation = width && height
    ? width === height ? 'square' : width > height ? 'landscape' : 'portrait'
    : 'unknown'
  return {
    ...(input.durationSeconds === undefined ? {} : { durationSeconds: input.durationSeconds }),
    ...(width === undefined ? {} : { width }),
    ...(height === undefined ? {} : { height }),
    ...(input.hasAudio === undefined ? {} : { hasAudio: input.hasAudio }),
    orientation,
  }
}

function nextSequence(aggregate: EditReferenceAggregate, studyId: string): number {
  return aggregate.messages.reduce((maximum, message) => message.studySessionId === studyId ? Math.max(maximum, message.sequence) : maximum, 0) + 1
}

function activePreferenceSourceEvidence(
  evidence: readonly PreferenceEvidenceRecord[],
): PreferenceEvidenceRecord[] {
  const sourceEvidence = evidence.filter((record) => record.sourceType !== 'derived_skill_evidence')
  const supersededIds = new Set(sourceEvidence
    .map((record) => record.supersedesEvidenceId)
    .filter((value): value is string => Boolean(value)))
  return sourceEvidence.filter((record) => !supersededIds.has(record.id))
}

function canonicalizePreparedEvidenceStudy(
  orchestration: ReturnType<typeof orchestratePreferenceEvidenceStudy>,
): {
  derivedEvidence: PreferenceEvidenceRecord[]
  skillRuns: EditReferenceDetail['skillRuns']
} {
  const evidenceIdMap = new Map(orchestration.derivedEvidence.map((record) => [record.id, randomUUID()]))
  const skillRunIdMap = new Map(orchestration.skillRuns.map((record) => [record.id, randomUUID()]))
  const replaceEvidenceId = (id: string): string => evidenceIdMap.get(id) ?? id
  const replaceSkillRunId = (id: string): string => skillRunIdMap.get(id) ?? id
  const derivedEvidence = orchestration.derivedEvidence.map((record) => ({
    ...structuredClone(record),
    id: replaceEvidenceId(record.id),
    provenance: {
      ...structuredClone(record.provenance),
      sourceEvidenceIds: record.provenance.sourceEvidenceIds.map(replaceEvidenceId),
      ...(record.provenance.skillRunId
        ? { skillRunId: replaceSkillRunId(record.provenance.skillRunId) }
        : {}),
    },
  }))
  const skillRuns = orchestration.skillRuns.map((record) => ({
    ...structuredClone(record),
    id: replaceSkillRunId(record.id),
    inputEvidenceIds: record.inputEvidenceIds.map(replaceEvidenceId),
    outputEvidenceIds: record.outputEvidenceIds.map(replaceEvidenceId),
  }))
  return { derivedEvidence, skillRuns }
}

function canonicalizeTopLevelRecordId<T extends { id: string }>(record: T): T {
  return { ...structuredClone(record), id: randomUUID() }
}

async function lookupCanonicalDomainMutation(
  repository: EditReferenceRepository,
  requestedScope: EditReferenceRepositoryScope,
  operation: string,
  idempotencyKey: string,
  requestHash: string,
): Promise<EditReferenceMutationResult | undefined> {
  if (!repository.lookupCommittedMutation) {
    throw new ApiError(
      'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
      'The canonical Edit Reference repository cannot safely check a prepared command replay.',
      503,
      {
        requiredGate: 'canonical_domain_idempotency_lookup',
        preparedWorkStarted: false,
        remoteMutationAttempted: false,
        productionReady: false,
      },
    )
  }
  return repository.lookupCommittedMutation({
    scope: requestedScope,
    operation,
    idempotencyKey,
    requestHash,
    replay: replayDetailData,
  })
}

function canonicalDomainMutationClosureMustNotRun(): never {
  throw new ApiError(
    'EDIT_REFERENCE_PERSISTENCE_BLOCKED',
    'The canonical Edit Reference repository must execute the bounded domain command, never an aggregate mutation callback.',
    503,
    {
      browserSuppliedAggregateAccepted: false,
      remoteMutationAttempted: false,
      productionReady: false,
    },
  )
}

function canonicalEvidenceStudyStatusInvalid(): never {
  throw new ApiError(
    'INTERNAL_ERROR',
    'The deterministic evidence study produced an invalid canonical status.',
    500,
  )
}

function usageLog(
  reference: EditReferenceRecord,
  eventType: 'created' | 'study_created' | 'message_appended' | 'evidence_added' | 'evidence_study_completed' | 'dna_version_created' | 'dna_qa_completed' | 'dna_version_approved' | 'application_prepared' | 'updated' | 'archived' | 'applied' | 'replaced' | 'cleared',
  now: string,
) {
  return {
    id: `preference-usage-${randomUUID()}`,
    workspaceId: reference.workspaceId,
    editReferenceId: reference.id,
    eventType,
    createdAt: now,
  } as const
}

function requireReference(aggregate: EditReferenceAggregate, referenceId: string): EditReferenceRecord {
  const reference = aggregate.references.find((candidate) => candidate.id === referenceId)
  if (!reference) throw referenceNotFound(referenceId)
  return reference
}

function requireStudy(aggregate: EditReferenceAggregate, studyId: string): PreferenceStudySessionRecord {
  const study = aggregate.studies.find((candidate) => candidate.id === studyId)
  if (!study) throw studyNotFound(studyId)
  return study
}

function requireReasoningAttempt(
  aggregate: EditReferenceAggregate,
  attemptId: string,
): EditReferenceStudyChatReasoningAttemptRecord {
  const attempt = aggregate.reasoningAttempts.find((candidate) => candidate.id === attemptId)
  if (!attempt) throw reasoningAttemptNotFound(attemptId)
  return attempt
}

function requireReasoningProviderRequest(
  aggregate: EditReferenceAggregate,
  providerRequestRecordId: string,
): EditReferenceStudyChatProviderRequestRecord {
  const providerRequest = aggregate.reasoningProviderRequests.find(
    (candidate) => candidate.id === providerRequestRecordId,
  )
  if (!providerRequest) throw reasoningProviderRequestNotFound(providerRequestRecordId)
  return providerRequest
}

function requireReasoningProviderRequestByAttempt(
  aggregate: EditReferenceAggregate,
  attemptId: string,
): EditReferenceStudyChatProviderRequestRecord {
  const providerRequest = aggregate.reasoningProviderRequests.find(
    (candidate) => candidate.reasoningAttemptId === attemptId,
  )
  if (!providerRequest) {
    throw new ApiError('INTERNAL_ERROR', 'The committed reasoning provider request could not be read back.', 500)
  }
  return providerRequest
}

function requireReasoningProviderCheckback(
  aggregate: EditReferenceAggregate,
  checkbackId: string,
): EditReferenceStudyChatProviderCheckbackRecord {
  const checkback = aggregate.reasoningProviderCheckbacks.find(
    (candidate) => candidate.id === checkbackId,
  )
  if (!checkback) throw reasoningProviderCheckbackNotFound(checkbackId)
  return checkback
}

function requireReasoningProviderCheckbackByRequest(
  aggregate: EditReferenceAggregate,
  providerRequestRecordId: string,
): EditReferenceStudyChatProviderCheckbackRecord {
  const checkback = aggregate.reasoningProviderCheckbacks.find(
    (candidate) => candidate.reasoningProviderRequestId === providerRequestRecordId,
  )
  if (!checkback) {
    throw new ApiError('INTERNAL_ERROR', 'The committed reasoning provider checkback could not be read back.', 500)
  }
  return checkback
}

function requireReasoningProviderWorkflow(
  aggregate: EditReferenceAggregate,
  workflowId: string,
): EditReferenceStudyChatProviderWorkflowRecord {
  const workflow = aggregate.reasoningProviderWorkflows.find(
    (candidate) => candidate.id === workflowId,
  )
  if (!workflow) throw reasoningProviderWorkflowNotFound(workflowId)
  return workflow
}

function requireReasoningProviderWorkflowByCheckback(
  aggregate: EditReferenceAggregate,
  checkbackId: string,
): EditReferenceStudyChatProviderWorkflowRecord {
  const workflow = aggregate.reasoningProviderWorkflows.find(
    (candidate) => candidate.reasoningProviderCheckbackId === checkbackId,
  )
  if (!workflow) {
    throw new ApiError('INTERNAL_ERROR', 'The committed reasoning provider workflow could not be read back.', 500)
  }
  return workflow
}

function requireReasoningInternalCostAuthority(
  aggregate: EditReferenceAggregate,
  authorityRecordId: string,
): EditReferenceStudyChatInternalCostAuthorityRecord {
  const authority = aggregate.reasoningInternalCostAuthorities.find(
    (candidate) => candidate.id === authorityRecordId,
  )
  if (!authority) throw reasoningInternalCostAuthorityNotFound(authorityRecordId)
  return authority
}

function requireReasoningInternalCostAuthorityByRegistration(
  aggregate: EditReferenceAggregate,
  registrationIdempotencyKeyHashSha256: string,
): EditReferenceStudyChatInternalCostAuthorityRecord {
  const authority = aggregate.reasoningInternalCostAuthorities.find(
    (candidate) => candidate.registrationIdempotencyKeyHashSha256 === registrationIdempotencyKeyHashSha256,
  )
  if (!authority) {
    throw new ApiError('INTERNAL_ERROR', 'The committed Study Chat internal-cost authority could not be read back.', 500)
  }
  return authority
}

function requireReasoningInternalCostAuthorityByRequest(
  aggregate: EditReferenceAggregate,
  request: AuthorizeEditReferenceStudyChatInternalCostInput['request'],
): EditReferenceStudyChatInternalCostAuthorityRecord {
  if (
    request.executionScope !== 'production'
    || !request.approvedUsageEstimateId
    || !request.internalCostBudgetId
    || !request.immutableRateCardSnapshotId
    || !request.maximumAuthorizedInternalCostMicros
  ) throw new ApiError('VALIDATION_FAILED', 'Production Study Chat cost authority identities are required.', 400)
  const authority = aggregate.reasoningInternalCostAuthorities.find((candidate) => (
    candidate.approvedUsageEstimateId === request.approvedUsageEstimateId
    && candidate.internalCostBudgetId === request.internalCostBudgetId
    && candidate.immutableRateCardSnapshotId === request.immutableRateCardSnapshotId
  ))
  if (!authority) {
    throw new ApiError('PREFERENCE_STUDY_NOT_FOUND', 'Study Chat internal-cost authority was not found.', 404)
  }
  if (
    authority.workspaceId !== request.workspaceId
    || authority.actorUserId !== request.actorUserId
    || authority.editReferenceId !== request.editReferenceId
    || authority.studySessionId !== request.studySessionId
    || authority.maximumAuthorizedInternalCostMicros !== request.maximumAuthorizedInternalCostMicros
  ) throw new ApiError('VERSION_CONFLICT', 'The Study Chat request does not match its exact internal-cost authority.', 409)
  return authority
}

function requireReasoningAttemptByClientDigest(
  aggregate: EditReferenceAggregate,
  studyId: string,
  clientMessageDigestSha256: string,
): EditReferenceStudyChatReasoningAttemptRecord {
  const attempt = aggregate.reasoningAttempts.find((candidate) => (
    candidate.studySessionId === studyId
    && candidate.clientMessageDigestSha256 === clientMessageDigestSha256
  ))
  if (!attempt) throw new ApiError('INTERNAL_ERROR', 'The committed reasoning attempt could not be read back.', 500)
  return attempt
}

function requirePreferenceDnaReasoningAttempt(
  aggregate: EditReferenceAggregate,
  attemptId: string,
): EditReferencePreferenceDnaReasoningAttemptRecord {
  const attempt = aggregate.preferenceDnaReasoningAttempts.find((candidate) => candidate.id === attemptId)
  if (!attempt) throw preferenceDnaReasoningAttemptNotFound(attemptId)
  return attempt
}

function requirePreferenceDnaReasoningAttemptByRequestDigest(
  aggregate: EditReferenceAggregate,
  studyId: string,
  requestDigestSha256: string,
): EditReferencePreferenceDnaReasoningAttemptRecord {
  const attempt = aggregate.preferenceDnaReasoningAttempts.find((candidate) => (
    candidate.studySessionId === studyId && candidate.requestDigestSha256 === requestDigestSha256
  ))
  if (!attempt) {
    throw new ApiError('INTERNAL_ERROR', 'The committed Preference DNA reasoning attempt could not be read back.', 500)
  }
  return attempt
}

async function requireAggregateAfterReasoningMutation(
  repository: EditReferenceRepository,
  requestedScope: EditReferenceRepositoryScope,
): Promise<EditReferenceAggregate> {
  const aggregate = await repository.read(requestedScope)
  if (!aggregate) throw new ApiError('INTERNAL_ERROR', 'The committed reasoning authority could not be read back.', 500)
  return aggregate
}

function requireDNAVersion(
  aggregate: EditReferenceAggregate,
  dnaVersionId: string,
  study: PreferenceStudySessionRecord,
): EditReferenceDetail['dnaVersions'][number] {
  const version = aggregate.dnaVersions.find((candidate) => candidate.id === dnaVersionId)
  if (!version || version.studySessionId !== study.id || version.editReferenceId !== study.editReferenceId) {
    throw new ApiError('VALIDATION_FAILED', 'Preference DNA version was not found in this study.', 404, { dnaVersionId })
  }
  return version
}

function requireDNAQAResult(
  aggregate: EditReferenceAggregate,
  qaResultId: string,
  dnaVersion: EditReferenceDetail['dnaVersions'][number],
): EditReferenceDetail['dnaQaResults'][number] {
  const result = aggregate.dnaQaResults.find((candidate) => candidate.id === qaResultId)
  if (!result || result.dnaVersionId !== dnaVersion.id) {
    throw new ApiError('VALIDATION_FAILED', 'Quality-review result does not belong to this DNA version.', 409, { qaResultId })
  }
  return result
}

function assertDNAContentDigest(actual: string, expected: string): void {
  if (actual !== expected) {
    throw new ApiError('VERSION_CONFLICT', 'Preference DNA changed since it was reviewed. Reload before continuing.', 409, { expected, actual })
  }
}

function assertActiveStudy(reference: EditReferenceRecord, study: PreferenceStudySessionRecord): void {
  if (reference.status === 'archived' || study.status === 'archived') {
    throw new ApiError('VALIDATION_FAILED', 'Archived studies cannot accept or analyze evidence.', 409)
  }
}

function studyMessages(aggregate: EditReferenceAggregate, studyId: string): PreferenceStudyMessageRecord[] {
  return aggregate.messages.filter((message) => message.studySessionId === studyId).sort((left, right) => left.sequence - right.sequence)
}

function studyNotFound(studyId: string): ApiError {
  return new ApiError('PREFERENCE_STUDY_NOT_FOUND', 'Preference Study was not found.', 404, { studyId })
}

function reasoningAttemptNotFound(attemptId: string): ApiError {
  return new ApiError('PREFERENCE_STUDY_NOT_FOUND', 'Study Chat reasoning attempt was not found.', 404, { attemptId })
}

function preferenceDnaReasoningAttemptNotFound(attemptId: string): ApiError {
  return new ApiError('PREFERENCE_STUDY_NOT_FOUND', 'Preference DNA reasoning attempt was not found.', 404, { attemptId })
}

function reasoningProviderRequestNotFound(providerRequestRecordId: string): ApiError {
  return new ApiError(
    'PREFERENCE_STUDY_NOT_FOUND',
    'Study Chat provider request was not found.',
    404,
    { providerRequestRecordId },
  )
}

function reasoningProviderCheckbackNotFound(checkbackId: string): ApiError {
  return new ApiError(
    'PREFERENCE_STUDY_NOT_FOUND',
    'Study Chat provider checkback was not found.',
    404,
    { checkbackId },
  )
}

function reasoningProviderWorkflowNotFound(workflowId: string): ApiError {
  return new ApiError(
    'PREFERENCE_STUDY_NOT_FOUND',
    'Study Chat provider workflow was not found.',
    404,
    { workflowId },
  )
}

function reasoningInternalCostAuthorityNotFound(authorityRecordId: string): ApiError {
  return new ApiError(
    'PREFERENCE_STUDY_NOT_FOUND',
    'Study Chat internal-cost authority was not found.',
    404,
    { authorityRecordId },
  )
}

function assertStudyTransition(
  current: PreferenceStudySessionRecord['status'],
  next: PreferenceStudySessionRecord['status'],
): void {
  if (current === next) return
  const gateOneTransitions: Partial<Record<PreferenceStudySessionRecord['status'], PreferenceStudySessionRecord['status'][]>> = {
    draft: ['collecting_evidence', 'archived'],
    collecting_evidence: ['ready_to_study', 'needs_clarification', 'archived'],
    ready_to_study: ['collecting_evidence', 'needs_clarification', 'archived'],
    needs_clarification: ['collecting_evidence', 'ready_to_study', 'archived'],
  }
  if (!gateOneTransitions[current]?.includes(next)) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'That Preference Study lifecycle transition is not available in Gate 1.',
      409,
      { current, requested: next },
    )
  }
}

function referenceNotFound(referenceId: string): ApiError {
  return new ApiError('EDIT_REFERENCE_NOT_FOUND', 'Edit Reference was not found.', 404, { referenceId })
}

function assertRevision(actual: number, expected: number, label: string): void {
  if (actual !== expected) {
    throw new ApiError('VERSION_CONFLICT', `${label} changed since it was loaded. Reload before saving.`, 409, { expected, actual })
  }
}

function normalizeReasoningAttemptReservation(
  input: ReserveEditReferenceStudyChatReasoningAttemptInput,
  ownerUserId: string,
): ReserveEditReferenceStudyChatReasoningAttemptInput {
  try {
    validateEditReferenceStudyChatReasoningRequest(input.request)
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'The Study Chat reasoning reservation request is invalid.', 400)
  }
  const clientMessageId = requireText(input.clientMessageId, 'clientMessageId', 160)
  const userMessage = requireText(input.userMessage, 'userMessage', 8_000)
  const findingCorrectionEvidenceId = input.findingCorrectionEvidenceId
    ? requireText(input.findingCorrectionEvidenceId, 'findingCorrectionEvidenceId', 200)
    : undefined
  if (input.request.actorUserId !== ownerUserId) {
    throw new ApiError('WORKSPACE_ACCESS_DENIED', 'The reasoning request actor does not match the authenticated user.', 403)
  }
  if (input.request.workspaceId !== requireWorkspaceId(input.request.workspaceId)) {
    throw new ApiError('VALIDATION_FAILED', 'The reasoning request workspace is invalid.', 400)
  }
  if (input.request.clientMessageDigestSha256 !== sha256Text(clientMessageId)) {
    throw new ApiError('VALIDATION_FAILED', 'The reasoning request does not match the client message identity.', 400)
  }
  return {
    request: structuredClone(input.request),
    clientMessageId,
    userMessage,
    ...(findingCorrectionEvidenceId ? { findingCorrectionEvidenceId } : {}),
  }
}

function normalizeReasoningInternalCostRegistration(
  input: RegisterEditReferenceStudyChatInternalCostAuthorityInput,
): RegisterEditReferenceStudyChatInternalCostAuthorityInput {
  try {
    validateRegisterEditReferenceStudyChatInternalCostAuthorityInput(input)
    validateEditReferenceStudyChatProviderIdentity(input.providerIdentity)
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'The Study Chat internal-cost registration is invalid.', 400)
  }
  if (input.workspaceId !== requireWorkspaceId(input.workspaceId)) {
    throw new ApiError('VALIDATION_FAILED', 'The Study Chat internal-cost workspace is invalid.', 400)
  }
  return structuredClone(input)
}

function normalizeReasoningInternalCostAuthorization(
  input: AuthorizeEditReferenceStudyChatInternalCostInput,
  ownerUserId: string,
): AuthorizeEditReferenceStudyChatInternalCostInput {
  try {
    validateEditReferenceStudyChatReasoningRequest(input.request)
    validateEditReferenceStudyChatProviderIdentity(input.providerIdentity)
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'The Study Chat internal-cost authorization is invalid.', 400)
  }
  if (input.request.actorUserId !== ownerUserId) {
    throw new ApiError('WORKSPACE_ACCESS_DENIED', 'The internal-cost request actor does not match the authenticated user.', 403)
  }
  if (input.request.executionScope !== 'production') {
    throw new ApiError('VALIDATION_FAILED', 'Controlled tests cannot claim production internal-cost authority.', 400)
  }
  return structuredClone(input)
}

function normalizeReasoningInternalCostProviderBinding(
  input: BindEditReferenceStudyChatInternalCostProviderRequestInput,
  ownerUserId: string,
): BindEditReferenceStudyChatInternalCostProviderRequestInput {
  try {
    validateEditReferenceStudyChatReasoningRequest(input.request)
    validateEditReferenceStudyChatProviderIdentity(input.providerIdentity)
    validateBindEditReferenceStudyChatInternalCostProviderRequestInput(input)
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'The Study Chat internal-cost provider binding is invalid.', 400)
  }
  if (input.request.actorUserId !== ownerUserId) {
    throw new ApiError('WORKSPACE_ACCESS_DENIED', 'The internal-cost provider binding actor is invalid.', 403)
  }
  if (input.request.executionScope !== 'production') {
    throw new ApiError('VALIDATION_FAILED', 'Controlled tests cannot bind production provider cost authority.', 400)
  }
  return structuredClone(input)
}

function normalizeReasoningInternalCostSettlement(
  input: SettleEditReferenceStudyChatInternalCostInput,
  ownerUserId: string,
): SettleEditReferenceStudyChatInternalCostInput {
  try {
    validateEditReferenceStudyChatReasoningRequest(input.request)
    validateEditReferenceStudyChatProviderIdentity(input.providerIdentity)
    validateEditReferenceStudyChatProviderTransportObservation({
      observation: input.providerObservation,
      request: input.request,
      providerIdentity: input.providerIdentity,
    })
    if (input.usageMeasurement) validateEditReferenceStudyChatProviderUsageMeasurement(input.usageMeasurement)
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'The Study Chat internal-cost settlement is invalid.', 400)
  }
  if (input.request.actorUserId !== ownerUserId) {
    throw new ApiError('WORKSPACE_ACCESS_DENIED', 'The internal-cost settlement actor does not match the authenticated user.', 403)
  }
  if (
    input.request.executionScope !== 'production'
    || typeof input.providerCallMade !== 'boolean'
    || (!input.providerCallMade && input.usageMeasurement !== null)
  ) throw new ApiError('VALIDATION_FAILED', 'The Study Chat internal-cost settlement exceeds its execution boundary.', 400)
  const reasoningProviderRequestId = requireText(
    input.reasoningProviderRequestId,
    'reasoningProviderRequestId',
    200,
  )
  return {
    ...structuredClone(input),
    reasoningProviderRequestId,
  }
}

function assertReasoningInternalCostProviderIdentity(
  authority: EditReferenceStudyChatInternalCostAuthorityRecord,
  identity: AuthorizeEditReferenceStudyChatInternalCostInput['providerIdentity'],
): void {
  if (
    authority.providerRoute !== identity.providerRoute
    || authority.providerModelId !== identity.providerModelId
    || authority.providerModelRevision !== identity.providerModelRevision
    || authority.providerModelAggregateSha256 !== identity.providerModelAggregateSha256
  ) throw new ApiError('VERSION_CONFLICT', 'The Study Chat provider identity does not match the internal-cost authority.', 409)
}

function reasoningInternalCostSettlementEvidenceMatches(
  authority: EditReferenceStudyChatInternalCostAuthorityRecord,
  providerCallMade: boolean,
  usage: SettleEditReferenceStudyChatInternalCostInput['usageMeasurement'],
): boolean {
  if (authority.state === 'released_not_incurred') return !providerCallMade && usage === null
  if (!providerCallMade) return false
  if (!authority.usageMeasurement) return usage === null
  if (!usage) return false
  return authority.usageMeasurement.providerUsageRecordIdDigestSha256 === sha256Text(usage.providerUsageRecordId)
    && authority.usageMeasurement.inputTokens === usage.inputTokens
    && authority.usageMeasurement.outputTokens === usage.outputTokens
    && authority.usageMeasurement.totalTokens === usage.totalTokens
    && authority.usageMeasurement.billableRequestCount === usage.billableRequestCount
    && authority.usageMeasurement.evidenceSource === usage.evidenceSource
    && authority.usageMeasurement.rawProviderUsagePersisted === usage.rawProviderUsagePersisted
}

function normalizeReasoningAttemptStart(
  input: StartEditReferenceStudyChatReasoningAttemptInput,
): StartEditReferenceStudyChatReasoningAttemptInput {
  return {
    workspaceId: requireWorkspaceId(input.workspaceId),
    expectedAttemptRevision: requirePositiveInteger(input.expectedAttemptRevision, 'expectedAttemptRevision'),
    executionCommandId: requireText(input.executionCommandId, 'executionCommandId', 200),
  }
}

function normalizeReasoningAttemptSettlement(
  input: SettleEditReferenceStudyChatReasoningAttemptInput,
): SettleEditReferenceStudyChatReasoningAttemptInput {
  if (!input.result || typeof input.result !== 'object') {
    throw new ApiError('VALIDATION_FAILED', 'The reasoning settlement result is required.', 400)
  }
  return {
    workspaceId: requireWorkspaceId(input.workspaceId),
    expectedAttemptRevision: requirePositiveInteger(input.expectedAttemptRevision, 'expectedAttemptRevision'),
    result: structuredClone(input.result),
  }
}

function normalizeReasoningAttemptCancellation(
  input: CancelEditReferenceStudyChatReasoningAttemptInput,
): CancelEditReferenceStudyChatReasoningAttemptInput {
  return {
    workspaceId: requireWorkspaceId(input.workspaceId),
    expectedAttemptRevision: requirePositiveInteger(input.expectedAttemptRevision, 'expectedAttemptRevision'),
  }
}

function normalizePreferenceDnaReasoningAttemptReservation(
  input: ReserveEditReferencePreferenceDnaReasoningAttemptInput,
  ownerUserId: string,
): ReserveEditReferencePreferenceDnaReasoningAttemptInput {
  try {
    validateEditReferencePreferenceDnaReasoningRequest(input.request)
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'The Preference DNA reasoning reservation request is invalid.', 400)
  }
  if (input.request.actorUserId !== ownerUserId) {
    throw new ApiError('WORKSPACE_ACCESS_DENIED', 'The Preference DNA reasoning actor is invalid.', 403)
  }
  if (input.request.workspaceId !== requireWorkspaceId(input.request.workspaceId)) {
    throw new ApiError('VALIDATION_FAILED', 'The Preference DNA reasoning workspace is invalid.', 400)
  }
  if (input.request.executionScope !== 'controlled_test') {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Durable Preference DNA reasoning attempts are controlled-private until production cost/workflow authority is integrated.',
      400,
    )
  }
  return { request: structuredClone(input.request) }
}

function normalizePreferenceDnaReasoningAttemptStart(
  input: StartEditReferencePreferenceDnaReasoningAttemptInput,
): StartEditReferencePreferenceDnaReasoningAttemptInput {
  return {
    workspaceId: requireWorkspaceId(input.workspaceId),
    expectedAttemptRevision: requirePositiveInteger(input.expectedAttemptRevision, 'expectedAttemptRevision'),
    executionCommandId: requireText(input.executionCommandId, 'executionCommandId', 200),
  }
}

function normalizePreferenceDnaReasoningAttemptSettlement(
  input: SettleEditReferencePreferenceDnaReasoningAttemptInput,
): SettleEditReferencePreferenceDnaReasoningAttemptInput {
  if (!input.result || typeof input.result !== 'object') {
    throw new ApiError('VALIDATION_FAILED', 'The Preference DNA reasoning settlement result is required.', 400)
  }
  return {
    workspaceId: requireWorkspaceId(input.workspaceId),
    expectedAttemptRevision: requirePositiveInteger(input.expectedAttemptRevision, 'expectedAttemptRevision'),
    result: structuredClone(input.result),
  }
}

function normalizePreferenceDnaReasoningAttemptCancellation(
  input: CancelEditReferencePreferenceDnaReasoningAttemptInput,
): CancelEditReferencePreferenceDnaReasoningAttemptInput {
  return {
    workspaceId: requireWorkspaceId(input.workspaceId),
    expectedAttemptRevision: requirePositiveInteger(input.expectedAttemptRevision, 'expectedAttemptRevision'),
  }
}

function normalizePreferenceDnaReasoningCandidateMaterialization(
  input: MaterializeEditReferencePreferenceDnaReasoningCandidateInput,
): MaterializeEditReferencePreferenceDnaReasoningCandidateInput {
  return {
    workspaceId: requireWorkspaceId(input.workspaceId),
    expectedAttemptRevision: requirePositiveInteger(input.expectedAttemptRevision, 'expectedAttemptRevision'),
    expectedStudyRevision: requirePositiveInteger(input.expectedStudyRevision, 'expectedStudyRevision'),
    expectedResultDigestSha256: requireSha256(input.expectedResultDigestSha256, 'expectedResultDigestSha256'),
  }
}

function preferenceDnaReasoningResultCost(
  reasoningResult: SettleEditReferencePreferenceDnaReasoningAttemptInput['result'],
): {
  providerExecutionState: EditReferencePreferenceDnaReasoningAttemptRecord['providerExecutionState']
  internalCostStatus: EditReferencePreferenceDnaReasoningAttemptRecord['internalCostStatus']
  meteredInternalCostMicros: string | null
  usageEventIds: readonly string[]
  internalCostRecordIds: readonly string[]
} {
  if (reasoningResult.status === 'validated_candidate') {
    return {
      providerExecutionState: reasoningResult.execution.providerCallMade
        ? reasoningResult.usage.mode === 'production_metered' ? 'called_metered' : 'called_no_cost'
        : 'not_called',
      internalCostStatus: reasoningResult.usage.mode === 'production_metered' ? 'metered' : 'not_incurred',
      meteredInternalCostMicros: reasoningResult.usage.meteredInternalCostMicros,
      usageEventIds: reasoningResult.usage.usageEventIds,
      internalCostRecordIds: reasoningResult.usage.internalCostRecordIds,
    }
  }
  return {
    providerExecutionState: reasoningResult.providerCallMade
      ? reasoningResult.internalCostStatus === 'unverified' ? 'called_cost_unverified'
        : reasoningResult.internalCostStatus === 'metered' ? 'called_metered' : 'called_no_cost'
      : 'not_called',
    internalCostStatus: reasoningResult.internalCostStatus,
    meteredInternalCostMicros: reasoningResult.meteredInternalCostMicros,
    usageEventIds: reasoningResult.usageEventIds,
    internalCostRecordIds: reasoningResult.internalCostRecordIds,
  }
}

function normalizeReasoningProviderRequestReservation(
  input: ReserveEditReferenceStudyChatProviderRequestInput,
): ReserveEditReferenceStudyChatProviderRequestInput {
  try {
    validateReserveEditReferenceStudyChatProviderRequestInput(input)
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'The Study Chat provider request reservation is invalid.', 400)
  }
  return structuredClone(input)
}

function normalizeReasoningProviderSubmissionAuthorization(
  input: AuthorizeEditReferenceStudyChatProviderSubmissionInput,
): AuthorizeEditReferenceStudyChatProviderSubmissionInput {
  try {
    validateAuthorizeEditReferenceStudyChatProviderSubmissionInput(input)
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'The Study Chat provider submission authorization is invalid.', 400)
  }
  return structuredClone(input)
}

function normalizeReasoningProviderRequestReconciliation(
  input: ReconcileEditReferenceStudyChatProviderRequestInput,
): ReconcileEditReferenceStudyChatProviderRequestInput {
  try {
    validateReconcileEditReferenceStudyChatProviderRequestInput(input)
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'The Study Chat provider reconciliation observation is invalid.', 400)
  }
  return structuredClone(input)
}

function normalizeReasoningProviderCheckbackSchedule(
  input: ScheduleEditReferenceStudyChatProviderCheckbackInput,
): ScheduleEditReferenceStudyChatProviderCheckbackInput {
  try {
    validateScheduleEditReferenceStudyChatProviderCheckbackInput(input)
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'The Study Chat provider checkback schedule is invalid.', 400)
  }
  return structuredClone(input)
}

function normalizeReasoningProviderCheckbackClaim(
  input: ClaimEditReferenceStudyChatProviderCheckbackInput,
): ClaimEditReferenceStudyChatProviderCheckbackInput {
  try {
    validateClaimEditReferenceStudyChatProviderCheckbackInput(input)
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'The Study Chat provider checkback lease claim is invalid.', 400)
  }
  return structuredClone(input)
}

function normalizeReasoningProviderCheckbackSettlement(
  input: SettleEditReferenceStudyChatProviderCheckbackInput,
): SettleEditReferenceStudyChatProviderCheckbackInput {
  try {
    validateSettleEditReferenceStudyChatProviderCheckbackInput(input)
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'The Study Chat provider checkback settlement is invalid.', 400)
  }
  return structuredClone(input)
}

function normalizeReasoningProviderCheckbackStop(
  input: StopEditReferenceStudyChatProviderCheckbackInput,
): StopEditReferenceStudyChatProviderCheckbackInput {
  try {
    validateStopEditReferenceStudyChatProviderCheckbackInput(input)
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'The Study Chat provider checkback stop command is invalid.', 400)
  }
  return structuredClone(input)
}

function normalizeReasoningProviderCheckbackResume(
  input: ResumeEditReferenceStudyChatProviderCheckbackInput,
): ResumeEditReferenceStudyChatProviderCheckbackInput {
  try {
    validateResumeEditReferenceStudyChatProviderCheckbackInput(input)
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'The Study Chat provider checkback recovery command is invalid.', 400)
  }
  return structuredClone(input)
}

function normalizeReasoningProviderWorkflowRegistration(
  input: RegisterEditReferenceStudyChatProviderWorkflowInput,
): RegisterEditReferenceStudyChatProviderWorkflowInput {
  try {
    validateRegisterEditReferenceStudyChatProviderWorkflowInput(input)
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'The Study Chat provider workflow registration is invalid.', 400)
  }
  return structuredClone(input)
}

function normalizeReasoningProviderWorkflowClaim(
  input: ClaimEditReferenceStudyChatProviderWorkflowInput,
): ClaimEditReferenceStudyChatProviderWorkflowInput {
  try {
    validateClaimEditReferenceStudyChatProviderWorkflowInput(input)
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'The Study Chat provider workflow lease claim is invalid.', 400)
  }
  return structuredClone(input)
}

function normalizeReasoningProviderWorkflowHeartbeat(
  input: HeartbeatEditReferenceStudyChatProviderWorkflowInput,
): HeartbeatEditReferenceStudyChatProviderWorkflowInput {
  try {
    validateHeartbeatEditReferenceStudyChatProviderWorkflowInput(input)
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'The Study Chat provider workflow heartbeat is invalid.', 400)
  }
  return structuredClone(input)
}

function normalizeReasoningProviderCallbackWake(
  input: RecordEditReferenceStudyChatProviderCallbackWakeInput,
): RecordEditReferenceStudyChatProviderCallbackWakeInput {
  try {
    validateRecordEditReferenceStudyChatProviderCallbackWakeInput(input)
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'The Study Chat provider callback wake is invalid.', 400)
  }
  return structuredClone(input)
}

function normalizeReasoningProviderWorkflowSettlement(
  input: SettleEditReferenceStudyChatProviderWorkflowInput,
): SettleEditReferenceStudyChatProviderWorkflowInput {
  try {
    validateSettleEditReferenceStudyChatProviderWorkflowInput(input)
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'The Study Chat provider workflow settlement is invalid.', 400)
  }
  return structuredClone(input)
}

function normalizeReasoningProviderWorkflowStop(
  input: StopEditReferenceStudyChatProviderWorkflowInput,
): StopEditReferenceStudyChatProviderWorkflowInput {
  try {
    validateStopEditReferenceStudyChatProviderWorkflowInput(input)
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'The Study Chat provider workflow stop command is invalid.', 400)
  }
  return structuredClone(input)
}

function normalizeReasoningProviderWorkflowResume(
  input: ResumeEditReferenceStudyChatProviderWorkflowInput,
): ResumeEditReferenceStudyChatProviderWorkflowInput {
  try {
    validateResumeEditReferenceStudyChatProviderWorkflowInput(input)
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'The Study Chat provider workflow recovery command is invalid.', 400)
  }
  return structuredClone(input)
}

function assertReasoningProviderCheckbackOutcomeMatchesProvider(
  outcome: SettleEditReferenceStudyChatProviderCheckbackInput['outcome'],
  providerRequest: EditReferenceStudyChatProviderRequestRecord,
): void {
  const compatible = outcome === 'terminal_settled'
    ? ['completed', 'failed'].includes(providerRequest.state)
    : outcome === 'provider_pending'
      ? providerRequest.state === 'submitted'
      : outcome === 'operator_review_required'
        ? providerRequest.state === 'operator_review_required'
        : outcome === 'lookup_unavailable'
          ? ['submission_unknown', 'submitted'].includes(providerRequest.state)
          : outcome === 'invalid_provider_observation'
            ? ['submission_unknown', 'submitted', 'operator_review_required'].includes(providerRequest.state)
            : false
  if (!compatible) {
    throw new ApiError(
      'VERSION_CONFLICT',
      'The checkback outcome does not match the exact durable provider-request truth.',
      409,
    )
  }
}

function clearReasoningProviderCheckbackLease(
  checkback: EditReferenceStudyChatProviderCheckbackRecord,
): void {
  delete checkback.activeLeaseTokenHashSha256
  delete checkback.activeLeaseOwnerIdDigestSha256
  delete checkback.activeLeaseClaimIdempotencyKeyHashSha256
  delete checkback.leasedAt
  delete checkback.leaseExpiresAt
}

function markReasoningProviderCheckbackTerminal(
  checkback: EditReferenceStudyChatProviderCheckbackRecord,
  providerRequest: EditReferenceStudyChatProviderRequestRecord,
  now: string,
  incrementRevision = true,
): void {
  clearReasoningProviderCheckbackLease(checkback)
  checkback.state = 'terminal'
  if (incrementRevision) checkback.revision += 1
  checkback.lastOutcome = 'terminal_settled'
  checkback.lastOutcomeProviderRequestRevision = providerRequest.revision
  checkback.operatorReviewRequired = false
  checkback.automaticLookupStopped = true
  delete checkback.stopReason
  delete checkback.stoppedAt
  checkback.terminalAt = now
  checkback.updatedAt = now
}

function markReasoningProviderCheckbackReview(
  checkback: EditReferenceStudyChatProviderCheckbackRecord,
  outcome: Extract<
    EditReferenceStudyChatProviderCheckbackRecord['lastOutcome'],
    | 'operator_review_required'
    | 'invalid_provider_observation'
    | 'lookup_unavailable'
    | 'provider_pending'
    | 'automatic_lookup_exhausted'
  >,
  providerRequestRevision: number,
  now: string,
  incrementRevision = true,
): void {
  clearReasoningProviderCheckbackLease(checkback)
  checkback.state = 'operator_review_required'
  if (incrementRevision) checkback.revision += 1
  checkback.lastOutcome = outcome
  checkback.lastOutcomeProviderRequestRevision = providerRequestRevision
  checkback.operatorReviewRequired = true
  checkback.automaticLookupStopped = true
  delete checkback.stopReason
  checkback.stoppedAt = now
  delete checkback.terminalAt
  checkback.updatedAt = now
}

function assertReasoningProviderWorkflowOutcomeMatchesCheckback(
  outcome: SettleEditReferenceStudyChatProviderWorkflowInput['outcome'],
  checkback: EditReferenceStudyChatProviderCheckbackRecord,
): void {
  const compatible = outcome === 'terminal_settled'
    ? checkback.state === 'terminal'
    : outcome === 'provider_pending' || outcome === 'provider_reconciliation_unavailable'
      ? checkback.state === 'scheduled'
      : outcome === 'operator_review_required' || outcome === 'invalid_provider_observation'
        ? ['operator_review_required', 'cancelled'].includes(checkback.state)
        : false
  if (!compatible) {
    throw new ApiError(
      'VERSION_CONFLICT',
      'The provider workflow outcome does not match the exact durable checkback truth.',
      409,
    )
  }
}

function clearReasoningProviderWorkflowLease(
  workflow: EditReferenceStudyChatProviderWorkflowRecord,
): void {
  delete workflow.activeLeaseTokenHashSha256
  delete workflow.activeLeaseOwnerIdDigestSha256
  delete workflow.activeLeaseClaimIdempotencyKeyHashSha256
  delete workflow.leasedAt
  delete workflow.leaseExpiresAt
}

function markReasoningProviderWorkflowTerminal(
  workflow: EditReferenceStudyChatProviderWorkflowRecord,
  checkback: EditReferenceStudyChatProviderCheckbackRecord,
  now: string,
  incrementRevision = true,
): void {
  clearReasoningProviderWorkflowLease(workflow)
  workflow.state = 'terminal'
  if (incrementRevision) workflow.revision += 1
  workflow.lastOutcome = 'terminal_settled'
  workflow.lastOutcomeCheckbackRevision = checkback.revision
  workflow.operatorReviewRequired = false
  workflow.automaticWorkflowStopped = true
  delete workflow.stopReason
  delete workflow.stoppedAt
  workflow.terminalAt = now
  workflow.updatedAt = now
}

function markReasoningProviderWorkflowReview(
  workflow: EditReferenceStudyChatProviderWorkflowRecord,
  checkback: EditReferenceStudyChatProviderCheckbackRecord,
  outcome: Extract<
    EditReferenceStudyChatProviderWorkflowRecord['lastOutcome'],
    | 'operator_review_required'
    | 'invalid_provider_observation'
    | 'provider_reconciliation_unavailable'
    | 'provider_pending'
    | 'automatic_workflow_exhausted'
  >,
  now: string,
  incrementRevision = true,
): void {
  clearReasoningProviderWorkflowLease(workflow)
  workflow.state = 'operator_review_required'
  if (incrementRevision) workflow.revision += 1
  workflow.lastOutcome = outcome
  workflow.lastOutcomeCheckbackRevision = checkback.revision
  workflow.operatorReviewRequired = true
  workflow.automaticWorkflowStopped = true
  delete workflow.stopReason
  workflow.stoppedAt = now
  delete workflow.terminalAt
  workflow.updatedAt = now
}

function workflowAudit(
  workflow: EditReferenceStudyChatProviderWorkflowRecord,
  eventType: string,
) {
  return {
    eventType,
    editReferenceId: workflow.editReferenceId,
    studySessionId: workflow.studySessionId,
    reasoningAttemptId: workflow.reasoningAttemptId,
    reasoningProviderRequestId: workflow.reasoningProviderRequestId,
    reasoningProviderCheckbackId: workflow.reasoningProviderCheckbackId,
    reasoningProviderWorkflowId: workflow.id,
    reasoningInternalCostAuthorityId: workflow.reasoningInternalCostAuthorityId,
  }
}

function settleStudyChatReasoningAttemptInAggregate(input: {
  aggregate: EditReferenceAggregate
  attempt: EditReferenceStudyChatReasoningAttemptRecord
  reference: EditReferenceRecord
  now: string
  reasoningResult: EditReferenceStudyChatReasoningResult
}): string {
  const study = requireStudy(input.aggregate, input.attempt.studySessionId)
  try {
    validateEditReferenceStudyChatReasoningResult(input.attempt.request, input.reasoningResult)
  } catch {
    throw new ApiError('VALIDATION_FAILED', 'The reasoning result does not match the reserved request.', 409)
  }
  input.attempt.revision = 3
  input.attempt.result = structuredClone(input.reasoningResult)
  input.attempt.resultDigestSha256 = hashEditReferenceRequest(input.reasoningResult)
  input.attempt.settledAt = input.now
  applyReasoningAttemptCostEvidence(input.attempt, input.reasoningResult)

  let eventType: string
  if (input.reasoningResult.status === 'answered') {
    if (
      study.revision === input.attempt.studyRevisionAfterReservation
      && input.reference.currentStudyId === study.id
    ) {
      const assistantMessage: PreferenceStudyMessageRecord = {
        id: `preference-study-message-${randomUUID()}`,
        workspaceId: input.reference.workspaceId,
        editReferenceId: input.reference.id,
        studySessionId: study.id,
        role: 'assistant',
        content: input.reasoningResult.answer.assistantMessage,
        sequence: nextSequence(input.aggregate, study.id),
        reasoningAttemptId: input.attempt.id,
        runtimeSource: 'model_reasoning',
        createdAt: input.now,
      }
      input.aggregate.messages.push(assistantMessage)
      input.attempt.assistantMessageId = assistantMessage.id
      input.attempt.state = 'completed'
      study.revision += 1
      study.updatedAt = input.now
      input.aggregate.usageLogs.push(usageLog(input.reference, 'message_appended', input.now))
      eventType = 'preference_study_reasoning_attempt_completed'
    } else {
      input.attempt.state = 'failed'
      input.attempt.terminalReason = 'study_revision_advanced'
      eventType = 'preference_study_reasoning_attempt_stale_result_recorded'
    }
  } else {
    input.attempt.state = input.reasoningResult.internalCostStatus === 'unverified'
      ? 'cost_unverified'
      : 'failed'
    input.attempt.terminalReason = input.reasoningResult.blockerCode
    eventType = input.attempt.state === 'cost_unverified'
      ? 'preference_study_reasoning_attempt_cost_unverified'
      : 'preference_study_reasoning_attempt_failed'
  }
  input.reference.updatedAt = input.now
  return eventType
}

function assertProviderResultMatchesReservedIdentity(
  providerRequest: EditReferenceStudyChatProviderRequestRecord,
  reasoningResult: EditReferenceStudyChatReasoningResult,
): void {
  if (reasoningResult.status === 'blocked') return
  if (
    reasoningResult.model.providerId !== providerRequest.providerRoute
    || reasoningResult.model.modelId !== providerRequest.providerModelId
    || reasoningResult.model.modelRevision !== providerRequest.providerModelRevision
    || reasoningResult.model.modelAggregateSha256 !== providerRequest.providerModelAggregateSha256
  ) throw new ApiError('VALIDATION_FAILED', 'The reconciled provider result does not match the reserved provider identity.', 409)
}

function sameTerminalProviderObservation(
  providerRequest: EditReferenceStudyChatProviderRequestRecord,
  input: ReconcileEditReferenceStudyChatProviderRequestInput,
): boolean {
  if (!input.result || !input.providerRequestId || providerRequest.providerRequestId !== input.providerRequestId) {
    return false
  }
  const expectedState = input.observationStatus === 'answered'
    ? 'completed'
    : input.observationStatus === 'failed'
      ? 'failed'
      : null
  return providerRequest.state === expectedState
    && providerRequest.resultDigestSha256 === hashEditReferenceRequest(input.result)
}

function applyReasoningAttemptCostEvidence(
  attempt: EditReferenceStudyChatReasoningAttemptRecord,
  reasoningResult: EditReferenceStudyChatReasoningResult,
): void {
  if (reasoningResult.status === 'answered') {
    attempt.providerExecutionState = 'called_metered'
    attempt.internalCostStatus = 'metered'
    attempt.meteredInternalCostMicros = reasoningResult.usage.meteredInternalCostMicros
    attempt.usageEventIds = [...reasoningResult.usage.usageEventIds]
    attempt.internalCostRecordIds = [...reasoningResult.usage.internalCostRecordIds]
    return
  }
  attempt.providerExecutionState = reasoningResult.providerCallMade
    ? reasoningResult.internalCostStatus === 'unverified'
      ? 'called_cost_unverified'
      : reasoningResult.internalCostStatus === 'metered'
        ? 'called_metered'
        : 'called_no_cost'
    : 'not_called'
  attempt.internalCostStatus = reasoningResult.internalCostStatus
  attempt.meteredInternalCostMicros = reasoningResult.meteredInternalCostMicros
  attempt.usageEventIds = [...reasoningResult.usageEventIds]
  attempt.internalCostRecordIds = [...reasoningResult.internalCostRecordIds]
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function normalizeCreateReference(input: CreateEditReferenceRequest): CreateEditReferenceRequest {
  return {
    workspaceId: requireWorkspaceId(input.workspaceId),
    name: requireText(input.name, 'name', 120),
    ...(input.description?.trim() ? { description: requireText(input.description, 'description', 2_000) } : {}),
    initialGoals: [...new Set(input.initialGoals)],
  }
}

function normalizeUpdateReference(input: UpdateEditReferenceRequest): UpdateEditReferenceRequest {
  return {
    workspaceId: requireWorkspaceId(input.workspaceId),
    expectedReferenceRevision: input.expectedReferenceRevision,
    ...(input.name === undefined ? {} : { name: requireText(input.name, 'name', 120) }),
    ...(input.description === undefined ? {} : { description: input.description.trim().slice(0, 2_000) }),
    ...(input.status ? { status: input.status } : {}),
  }
}

function normalizeCreateStudy(input: CreatePreferenceStudyRequest): CreatePreferenceStudyRequest {
  return { workspaceId: requireWorkspaceId(input.workspaceId), expectedReferenceRevision: input.expectedReferenceRevision, title: requireText(input.title, 'title', 160) }
}

function normalizeUpdateStudy(input: UpdatePreferenceStudyRequest): UpdatePreferenceStudyRequest {
  const allowedStatuses = new Set(['draft', 'collecting_evidence', 'ready_to_study', 'needs_clarification', 'archived'])
  if (input.status && !allowedStatuses.has(input.status)) {
    throw new ApiError('VALIDATION_FAILED', 'That study status belongs to a later evidence, DNA, QA, or application gate.', 409)
  }
  return {
    workspaceId: requireWorkspaceId(input.workspaceId),
    expectedStudyRevision: input.expectedStudyRevision,
    ...(input.title === undefined ? {} : { title: requireText(input.title, 'title', 160) }),
    ...(input.status ? { status: input.status } : {}),
  }
}

function normalizeAppendMessage(input: AppendPreferenceStudyMessageRequest): AppendPreferenceStudyMessageRequest {
  return {
    workspaceId: requireWorkspaceId(input.workspaceId),
    expectedStudyRevision: input.expectedStudyRevision,
    clientMessageId: requireText(input.clientMessageId, 'clientMessageId', 160),
    content: requireText(input.content, 'content', 8_000),
    ...(input.findingCorrectionEvidenceId
      ? { findingCorrectionEvidenceId: requireText(input.findingCorrectionEvidenceId, 'findingCorrectionEvidenceId', 200) }
      : {}),
  }
}

function requireManualEvidenceCategory(
  value: PreferenceEvidenceCategory,
): Exclude<PreferenceEvidenceCategory, 'media_structure' | 'copy_safety'> {
  if (value === 'media_structure' || value === 'copy_safety') {
    throw new ApiError('VALIDATION_FAILED', 'Study Chat can correct saved creative evidence only.', 409)
  }
  return value
}

function requireCorrectionTransferability(
  value: PreferenceEvidenceTransferability,
): Exclude<PreferenceEvidenceTransferability, 'unknown'> {
  return value === 'unknown' ? 'requires_user_review' : value
}

function normalizeCreateEvidence(input: CreatePreferenceEvidenceRequest): CreatePreferenceEvidenceRequest {
  const workspaceId = requireWorkspaceId(input.workspaceId)
  const expectedStudyRevision = requirePositiveInteger(input.expectedStudyRevision, 'expectedStudyRevision')
  const title = requireText(input.title, 'title', 160)
  if (input.sourceType === 'manual_user_evidence') {
    return {
      workspaceId,
      expectedStudyRevision,
      sourceType: input.sourceType,
      title,
      category: input.category,
      summary: requireText(input.summary, 'summary', 4_000),
      intendedUse: input.intendedUse,
      ...(input.supersedesEvidenceId ? { supersedesEvidenceId: requireText(input.supersedesEvidenceId, 'supersedesEvidenceId', 200) } : {}),
    }
  }
  if (input.sourceType === 'reference_video_metadata') {
    if (Boolean(input.storageObjectRecordId) !== Boolean(input.mediaAssetId)) {
      throw new ApiError('VALIDATION_FAILED', 'A private reference upload requires both storageObjectRecordId and mediaAssetId.', 400)
    }
    return {
      workspaceId,
      expectedStudyRevision,
      sourceType: input.sourceType,
      title,
      sourceLabel: requireText(input.sourceLabel, 'sourceLabel', 240),
      rightsBasis: input.rightsBasis,
      ...(input.durationSeconds === undefined ? {} : { durationSeconds: requireNonNegativeNumber(input.durationSeconds, 'durationSeconds', 30 * 24 * 60 * 60) }),
      ...(input.width === undefined ? {} : { width: requirePositiveIntegerBounded(input.width, 'width', 16_384) }),
      ...(input.height === undefined ? {} : { height: requirePositiveIntegerBounded(input.height, 'height', 16_384) }),
      ...(input.hasAudio === undefined ? {} : { hasAudio: input.hasAudio }),
      ...(input.storageObjectRecordId ? { storageObjectRecordId: requireText(input.storageObjectRecordId, 'storageObjectRecordId', 200) } : {}),
      ...(input.mediaAssetId ? { mediaAssetId: requireText(input.mediaAssetId, 'mediaAssetId', 200) } : {}),
    }
  }
  return {
    workspaceId,
    expectedStudyRevision,
    sourceType: input.sourceType,
    title,
    projectId: requireText(input.projectId, 'projectId', 200),
    editSessionId: requireText(input.editSessionId, 'editSessionId', 200),
    approvedSnapshotId: requireText(input.approvedSnapshotId, 'approvedSnapshotId', 200),
    ...(input.summary?.trim() ? { summary: requireText(input.summary, 'summary', 2_000) } : {}),
    rightsBasis: 'workspace_approved_edit',
  }
}

function normalizeRunEvidenceStudy(input: RunPreferenceEvidenceStudyRequest): RunPreferenceEvidenceStudyRequest {
  return {
    workspaceId: requireWorkspaceId(input.workspaceId),
    expectedStudyRevision: requirePositiveInteger(input.expectedStudyRevision, 'expectedStudyRevision'),
    ...(input.retryBlockedSkills ? { retryBlockedSkills: true } : {}),
  }
}

function normalizeStartLongFormStudy(
  input: StartEditReferenceLongFormStudyRequest,
): StartEditReferenceLongFormStudyRequest {
  return {
    workspaceId: requireWorkspaceId(input.workspaceId),
    expectedStudyRevision: requirePositiveInteger(input.expectedStudyRevision, 'expectedStudyRevision'),
  }
}

function normalizeApplyLongFormStudyReview(
  input: ApplyEditReferenceLongFormStudyReviewRequest,
): ApplyEditReferenceLongFormStudyReviewRequest {
  if (!Array.isArray(input.decisions) || input.decisions.length < 1 || input.decisions.length > 7) {
    throw new ApiError('VALIDATION_FAILED', 'Review every available study area before saving these choices.', 400)
  }
  const decisions = input.decisions.map((record) => {
    if (
      record?.schemaVersion !== EDIT_REFERENCE_LONG_FORM_STUDY_REVIEW_DECISION_VERSION
      || !['adapt', 'context_only', 'avoid'].includes(record.decision)
    ) {
      throw new ApiError('VALIDATION_FAILED', 'One studied-video review choice is invalid.', 400)
    }
    return {
      schemaVersion: EDIT_REFERENCE_LONG_FORM_STUDY_REVIEW_DECISION_VERSION,
      findingId: requireText(record.findingId, 'findingId', 240),
      decision: record.decision,
    }
  })
  if (new Set(decisions.map((record) => record.findingId)).size !== decisions.length) {
    throw new ApiError('VALIDATION_FAILED', 'Each study area can have only one review choice.', 400)
  }
  if (
    typeof input.acknowledgeAdaptNotCopy !== 'boolean'
    || typeof input.acknowledgeFactSafetyReview !== 'boolean'
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Review acknowledgements must be explicit boolean choices.', 400)
  }
  return {
    workspaceId: requireWorkspaceId(input.workspaceId),
    expectedStudyRevision: requirePositiveInteger(input.expectedStudyRevision, 'expectedStudyRevision'),
    expectedReviewPackageDigestSha256: requireSha256(
      input.expectedReviewPackageDigestSha256,
      'expectedReviewPackageDigestSha256',
    ),
    decisions,
    acknowledgeAdaptNotCopy: input.acknowledgeAdaptNotCopy,
    acknowledgeFactSafetyReview: input.acknowledgeFactSafetyReview,
  }
}

function normalizeControlLongFormStudy(
  input: ControlEditReferenceLongFormStudyRequest,
): ControlEditReferenceLongFormStudyRequest {
  if (!['pause', 'resume', 'cancel', 'recover'].includes(input.action)) {
    throw new ApiError('VALIDATION_FAILED', 'The requested whole-video study action is invalid.', 400)
  }
  return {
    workspaceId: requireWorkspaceId(input.workspaceId),
    expectedRunRevision: requirePositiveInteger(input.expectedRunRevision, 'expectedRunRevision'),
    action: input.action,
  }
}

function normalizeSynthesizePreferenceDNA(input: SynthesizePreferenceDNARequest): SynthesizePreferenceDNARequest {
  return {
    workspaceId: requireWorkspaceId(input.workspaceId),
    expectedStudyRevision: requirePositiveInteger(input.expectedStudyRevision, 'expectedStudyRevision'),
  }
}

function normalizeRunPreferenceDNAQA(input: RunEditReferenceDNAQARequest): RunEditReferenceDNAQARequest {
  return {
    workspaceId: requireWorkspaceId(input.workspaceId),
    expectedStudyRevision: requirePositiveInteger(input.expectedStudyRevision, 'expectedStudyRevision'),
    expectedDNAContentDigest: requireSha256(input.expectedDNAContentDigest, 'expectedDNAContentDigest'),
  }
}

function normalizeApprovePreferenceDNA(input: ApproveEditReferenceDNAVersionRequest): ApproveEditReferenceDNAVersionRequest {
  if (input.acknowledgeAdaptNotCopy !== true) {
    throw new ApiError('VALIDATION_FAILED', 'Approval requires confirmation that the reference will be adapted, not copied.', 400)
  }
  if (typeof input.acknowledgeQAReview !== 'boolean') {
    throw new ApiError('VALIDATION_FAILED', 'acknowledgeQAReview must be a boolean.', 400)
  }
  const reasoningReviewAcknowledgement = input.reasoningReviewAcknowledgement
  if (reasoningReviewAcknowledgement !== undefined && (
    !reasoningReviewAcknowledgement
    || reasoningReviewAcknowledgement.schemaVersion !== 'edit-reference-qwen-dna-approval-request-v1'
    || reasoningReviewAcknowledgement.acknowledgeAiAssistedSynthesis !== true
    || reasoningReviewAcknowledgement.acknowledgeConfidenceAndLimitations !== true
  )) throw new ApiError('VALIDATION_FAILED', 'AI-assisted review acknowledgement is incomplete.', 400)
  return {
    workspaceId: requireWorkspaceId(input.workspaceId),
    expectedStudyRevision: requirePositiveInteger(input.expectedStudyRevision, 'expectedStudyRevision'),
    expectedDNAContentDigest: requireSha256(input.expectedDNAContentDigest, 'expectedDNAContentDigest'),
    qaResultId: requireText(input.qaResultId, 'qaResultId', 200),
    acknowledgeAdaptNotCopy: true,
    acknowledgeQAReview: input.acknowledgeQAReview,
    ...(reasoningReviewAcknowledgement ? {
      reasoningReviewAcknowledgement: {
        schemaVersion: 'edit-reference-qwen-dna-approval-request-v1',
        expectedApprovalBindingDigestSha256: requireSha256(
          reasoningReviewAcknowledgement.expectedApprovalBindingDigestSha256,
          'reasoningReviewAcknowledgement.expectedApprovalBindingDigestSha256',
        ),
        acknowledgeAiAssistedSynthesis: true,
        acknowledgeConfidenceAndLimitations: true,
      },
    } : {}),
  }
}

function normalizeCreatePreferenceApplication(input: CreatePreferenceApplicationRequest): CreatePreferenceApplicationRequest {
  if (input.acknowledgeAdaptNotCopy !== true) {
    throw new ApiError('VALIDATION_FAILED', 'Target preparation requires confirmation that the reference will be adapted, not copied.', 400)
  }
  const target = input.targetContext
  if (!target || typeof target !== 'object') {
    throw new ApiError('VALIDATION_FAILED', 'A complete target-edit context is required.', 400)
  }
  if (target.outputFrameConfirmed !== true) {
    throw new ApiError('VALIDATION_FAILED', 'Confirm the target output frame before preparing Preference DNA.', 409)
  }
  const sourceModes = new Set(['voice_first', 'mixed', 'silent_visual'])
  const contentTypes = new Set(['tutorial', 'documentary', 'lifestyle_montage', 'talking_head', 'product_demo', 'custom'])
  const editLevels = new Set(['normal', 'premium', 'ultra_premium'])
  const aspectRatios = new Set(['9:16', '16:9', '1:1', '4:5'])
  const platforms = new Set(['tiktok_reel', 'instagram_reel', 'instagram_feed', 'youtube_shorts', 'youtube_standard', 'linkedin', 'website', 'podcast_clip', 'ad_creative', 'internal_review', 'custom'])
  const budgetPreferences = new Set(['efficient', 'balanced', 'cinematic'])
  const directiveValues = new Set(['adapt', 'required', 'avoid'])
  if (!sourceModes.has(target.sourceMode) || !contentTypes.has(target.contentType)) {
    throw new ApiError('VALIDATION_FAILED', 'The target source mode or content type is not supported.', 400)
  }
  if (!editLevels.has(target.selectedEditLevel) || !aspectRatios.has(target.aspectRatio) || !platforms.has(target.platformTarget)) {
    throw new ApiError('VALIDATION_FAILED', 'The target edit level, output frame, or platform is not supported.', 400)
  }
  if (!budgetPreferences.has(target.budgetPreference)) {
    throw new ApiError('VALIDATION_FAILED', 'The target budget preference is not supported.', 400)
  }
  if (
    !target.directives
    || !directiveValues.has(target.directives.captions)
    || !directiveValues.has(target.directives.music)
    || !directiveValues.has(target.directives.sfx)
    || !['adapt', 'preserve'].includes(target.directives.sourceOrder)
  ) {
    throw new ApiError('VALIDATION_FAILED', 'The target creative directives are incomplete.', 400)
  }
  if (!Array.isArray(target.approvedConstraints) || target.approvedConstraints.length > 12) {
    throw new ApiError('VALIDATION_FAILED', 'Approved target constraints must be a bounded list.', 400)
  }
  const approvedConstraints = [...new Set(target.approvedConstraints.map((value) => requireText(value, 'approvedConstraint', 500)))]
  const normalizedTarget: PreferenceApplicationTargetContextSnapshot = {
    projectId: requireText(target.projectId, 'targetContext.projectId', 200),
    editSessionId: requireText(target.editSessionId, 'targetContext.editSessionId', 200),
    projectName: requireText(target.projectName, 'targetContext.projectName', 160),
    editName: requireText(target.editName, 'targetContext.editName', 160),
    sourceMode: target.sourceMode,
    contentType: target.contentType,
    sourceSummary: requireText(target.sourceSummary, 'targetContext.sourceSummary', 2_000),
    currentUserInstruction: requireText(target.currentUserInstruction, 'targetContext.currentUserInstruction', 4_000),
    selectedEditLevel: target.selectedEditLevel,
    aspectRatio: target.aspectRatio,
    outputFrameConfirmed: true,
    platformTarget: target.platformTarget,
    storyRole: requireText(target.storyRole, 'targetContext.storyRole', 500),
    budgetPreference: target.budgetPreference,
    directives: {
      captions: target.directives.captions,
      music: target.directives.music,
      sfx: target.directives.sfx,
      sourceOrder: target.directives.sourceOrder,
    },
    approvedConstraints,
  }
  const replacementValues = [
    input.replacesApplicationId,
    input.expectedReplacedReferenceRevision,
    input.invalidationReceipt,
  ]
  const replacementValueCount = replacementValues.filter((value) => value !== undefined).length
  if (replacementValueCount !== 0 && replacementValueCount !== replacementValues.length) {
    throw new ApiError('VALIDATION_FAILED', 'Replacement requires the exact prior application, reference revision, and downstream invalidation receipt.', 400)
  }
  const invalidationReceipt = input.invalidationReceipt
    ? normalizeDownstreamInvalidationReceipt(input.invalidationReceipt, 'replace')
    : undefined
  return {
    workspaceId: requireWorkspaceId(input.workspaceId),
    expectedReferenceRevision: requirePositiveInteger(input.expectedReferenceRevision, 'expectedReferenceRevision'),
    expectedDNAContentDigest: requireSha256(input.expectedDNAContentDigest, 'expectedDNAContentDigest'),
    acknowledgeAdaptNotCopy: true,
    applicationSource: input.applicationSource ?? 'session_panel',
    targetContext: normalizedTarget,
    targetUnderstandingPackageId: requireText(input.targetUnderstandingPackageId, 'targetUnderstandingPackageId', 240),
    targetUnderstandingPackageDigestSha256: requireSha256(
      input.targetUnderstandingPackageDigestSha256,
      'targetUnderstandingPackageDigestSha256',
    ),
    targetUnderstandingSourceStorageObjectRecordId: requireText(
      input.targetUnderstandingSourceStorageObjectRecordId,
      'targetUnderstandingSourceStorageObjectRecordId',
      200,
    ),
    targetUnderstandingSourceMediaAssetId: requireText(
      input.targetUnderstandingSourceMediaAssetId,
      'targetUnderstandingSourceMediaAssetId',
      200,
    ),
    targetUnderstandingEditBriefDigestSha256: requireSha256(
      input.targetUnderstandingEditBriefDigestSha256,
      'targetUnderstandingEditBriefDigestSha256',
    ),
    ...(input.replacesApplicationId ? {
      replacesApplicationId: requireText(input.replacesApplicationId, 'replacesApplicationId', 200),
      expectedReplacedReferenceRevision: requirePositiveInteger(input.expectedReplacedReferenceRevision as number, 'expectedReplacedReferenceRevision'),
      invalidationReceipt,
    } : {}),
  }
}

async function resolveEditReferenceIdForStudy(
  repository: EditReferenceRepository,
  requestedScope: EditReferenceRepositoryScope,
  studyId: string,
): Promise<string> {
  const aggregate = await repository.read(requestedScope)
  const study = aggregate?.studies.find((candidate) => candidate.id === studyId)
  if (!study) throw studyNotFound(studyId)
  return study.editReferenceId
}

async function readReadyTargetUnderstanding(input: {
  readonly repository: PrivateTargetVideoUnderstandingRepository
  readonly scope: EditReferenceRepositoryScope
  readonly studyId: string
  readonly editReferenceId: string
  readonly input: CreatePreferenceApplicationRequest
}): Promise<TargetVideoUnderstandingPackage> {
  const target = input.input.targetContext
  const packageRecord = await input.repository.readLatest({
    scope: input.scope,
    binding: {
      projectId: target.projectId,
      editSessionId: target.editSessionId,
      editReferenceId: input.editReferenceId,
      studySessionId: input.studyId,
      storageObjectRecordId: input.input.targetUnderstandingSourceStorageObjectRecordId,
      editBriefDigestSha256: input.input.targetUnderstandingEditBriefDigestSha256,
    },
  })
  if (!packageRecord) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Study the exact target video and finish its authoritative understanding package before preparing Preference Application.',
      409,
    )
  }
  if (
    packageRecord.packageId !== input.input.targetUnderstandingPackageId
    || packageRecord.packageDigestSha256 !== input.input.targetUnderstandingPackageDigestSha256
    || packageRecord.workspaceId !== input.scope.workspaceId
    || packageRecord.editReferenceId !== input.editReferenceId
    || packageRecord.studySessionId !== input.studyId
    || packageRecord.projectId !== target.projectId
    || packageRecord.editSessionId !== target.editSessionId
    || packageRecord.source.storageObjectRecordId !== input.input.targetUnderstandingSourceStorageObjectRecordId
    || packageRecord.source.mediaAssetId !== input.input.targetUnderstandingSourceMediaAssetId
    || packageRecord.declaredContext.editBriefDigestSha256 !== input.input.targetUnderstandingEditBriefDigestSha256
    || packageRecord.status !== 'ready'
    || packageRecord.readyForPreferenceApplication !== true
    || packageRecord.callerSourceSummaryUsedAsStudyEvidence !== false
  ) {
    throw new ApiError(
      'VERSION_CONFLICT',
      'The requested target understanding package is stale, incomplete, or belongs to a different source, Edit Brief, Edit Reference, or edit session.',
      409,
    )
  }
  assertCallerTargetEchoMatchesPackage(target, packageRecord)
  return packageRecord
}

function assertCallerTargetEchoMatchesPackage(
  target: PreferenceApplicationTargetContextSnapshot,
  packageRecord: TargetVideoUnderstandingPackage,
): void {
  const declared = packageRecord.declaredContext
  const mismatchedFields = [
    target.projectId !== packageRecord.projectId ? 'projectId' : undefined,
    target.editSessionId !== packageRecord.editSessionId ? 'editSessionId' : undefined,
    target.projectName !== declared.projectName ? 'projectName' : undefined,
    target.editName !== declared.editName ? 'editName' : undefined,
    target.sourceMode !== packageRecord.audioState.sourceMode ? 'sourceMode' : undefined,
    target.sourceSummary !== packageRecord.sourceSummary ? 'sourceSummary' : undefined,
    target.contentType !== declared.contentType ? 'contentType' : undefined,
    target.currentUserInstruction !== declared.currentUserInstruction ? 'currentUserInstruction' : undefined,
    target.selectedEditLevel !== declared.selectedEditLevel ? 'selectedEditLevel' : undefined,
    target.aspectRatio !== declared.aspectRatio ? 'aspectRatio' : undefined,
    target.outputFrameConfirmed !== true ? 'outputFrameConfirmed' : undefined,
    target.platformTarget !== declared.platformTarget ? 'platformTarget' : undefined,
    target.storyRole !== declared.storyRole ? 'storyRole' : undefined,
    target.budgetPreference !== declared.budgetPreference ? 'budgetPreference' : undefined,
    JSON.stringify(target.directives) !== JSON.stringify(declared.directives) ? 'directives' : undefined,
    JSON.stringify(target.approvedConstraints) !== JSON.stringify(declared.approvedConstraints) ? 'approvedConstraints' : undefined,
  ].filter((field): field is string => Boolean(field))
  if (mismatchedFields.length > 0) {
    throw new ApiError(
      'VERSION_CONFLICT',
      `The target context no longer echoes the exact studied video package (${mismatchedFields.join(', ')}). Reload the studied target context before preparing Preference Application.`,
      409,
      { mismatchedFields },
    )
  }
}

function authoritativeTargetContextFromUnderstanding(
  _callerEcho: PreferenceApplicationTargetContextSnapshot,
  packageRecord: TargetVideoUnderstandingPackage,
): PreferenceApplicationTargetContextSnapshot {
  const declared = packageRecord.declaredContext
  return {
    projectId: packageRecord.projectId,
    editSessionId: packageRecord.editSessionId,
    projectName: declared.projectName,
    editName: declared.editName,
    sourceMode: packageRecord.audioState.sourceMode,
    contentType: declared.contentType,
    sourceSummary: packageRecord.sourceSummary,
    currentUserInstruction: declared.currentUserInstruction,
    selectedEditLevel: declared.selectedEditLevel,
    aspectRatio: declared.aspectRatio,
    outputFrameConfirmed: true,
    platformTarget: declared.platformTarget,
    storyRole: declared.storyRole,
    budgetPreference: declared.budgetPreference,
    directives: structuredClone(declared.directives),
    approvedConstraints: [...declared.approvedConstraints],
  }
}

function normalizeClearPreferenceApplication(input: ClearPreferenceApplicationRequest): ClearPreferenceApplicationRequest {
  return {
    workspaceId: requireWorkspaceId(input.workspaceId),
    expectedReferenceRevision: requirePositiveInteger(input.expectedReferenceRevision, 'expectedReferenceRevision'),
    expectedApplicationContentDigest: requireSha256(input.expectedApplicationContentDigest, 'expectedApplicationContentDigest'),
    invalidationReceipt: normalizeDownstreamInvalidationReceipt(input.invalidationReceipt, 'remove'),
  }
}

function normalizeDownstreamInvalidationReceipt(
  receipt: PreferenceApplicationDownstreamInvalidationReceipt,
  expectedReason: PreferenceApplicationInvalidationReason,
): PreferenceApplicationDownstreamInvalidationReceipt {
  if (!receipt || typeof receipt !== 'object' || receipt.receiptVersion !== 'edit-reference-downstream-invalidation-receipt-v1') {
    throw new ApiError('VALIDATION_FAILED', 'A supported downstream invalidation receipt is required.', 400)
  }
  if (
    receipt.reason !== expectedReason
    || receipt.sessionContextInvalidated !== true
    || receipt.approvedPlanMutationMade !== false
    || receipt.mockOnly !== true
  ) {
    throw new ApiError('VALIDATION_FAILED', 'The downstream invalidation receipt does not match this lifecycle action.', 409)
  }
  if (!receipt.safety || Object.entries(PREFERENCE_APPLICATION_INTEGRATION_SAFETY_FLAGS).some(
    ([key, value]) => receipt.safety[key as keyof typeof PREFERENCE_APPLICATION_INTEGRATION_SAFETY_FLAGS] !== value,
  )) {
    throw new ApiError('VALIDATION_FAILED', 'The downstream invalidation receipt contains an unsafe side effect.', 409)
  }
  const approvalStatuses = new Set(['not_requested', 'requested', 'approved', 'rejected', 'reset_after_revision'])
  if (!approvalStatuses.has(receipt.approvalStatusBefore) || !approvalStatuses.has(receipt.approvalStatusAfter)) {
    throw new ApiError('VALIDATION_FAILED', 'The invalidation approval state is not supported.', 400)
  }
  return {
    receiptVersion: receipt.receiptVersion,
    applicationId: requireText(receipt.applicationId, 'invalidationReceipt.applicationId', 200),
    applicationContentDigest: requireSha256(receipt.applicationContentDigest, 'invalidationReceipt.applicationContentDigest'),
    contextHash: requireText(receipt.contextHash, 'invalidationReceipt.contextHash', 80),
    projectId: requireText(receipt.projectId, 'invalidationReceipt.projectId', 200),
    editSessionId: requireText(receipt.editSessionId, 'invalidationReceipt.editSessionId', 200),
    reason: expectedReason,
    sessionUpdatedAt: requireISODate(receipt.sessionUpdatedAt, 'invalidationReceipt.sessionUpdatedAt'),
    approvalStatusBefore: receipt.approvalStatusBefore,
    approvalStatusAfter: receipt.approvalStatusAfter,
    approvalResetRequired: receipt.approvalResetRequired === true,
    sessionContextInvalidated: true,
    approvedPlanMutationMade: false,
    invalidatedAt: requireISODate(receipt.invalidatedAt, 'invalidationReceipt.invalidatedAt'),
    mockOnly: true,
    safety: PREFERENCE_APPLICATION_INTEGRATION_SAFETY_FLAGS,
  }
}

function normalizeConnectPreferenceApplication(input: ConnectPreferenceApplicationRequest): ConnectPreferenceApplicationRequest {
  const receipt = input.targetSessionReceipt
  if (!receipt || typeof receipt !== 'object' || receipt.mockOnly !== true) {
    throw new ApiError('VALIDATION_FAILED', 'A staged mock Project Edit Session receipt is required.', 400)
  }
  if (receipt.outputFrameConfirmed !== true) {
    throw new ApiError('VALIDATION_FAILED', 'The staged target receipt must confirm the output frame.', 400)
  }
  if (receipt.receiptVersion !== 'edit-reference-project-session-receipt-v1') {
    throw new ApiError('VALIDATION_FAILED', 'The target session receipt version is not supported.', 400)
  }
  return {
    workspaceId: requireWorkspaceId(input.workspaceId),
    expectedReferenceRevision: requirePositiveInteger(input.expectedReferenceRevision, 'expectedReferenceRevision'),
    expectedApplicationContentDigest: requireSha256(input.expectedApplicationContentDigest, 'expectedApplicationContentDigest'),
    targetSessionReceipt: {
      receiptVersion: receipt.receiptVersion,
      projectId: requireText(receipt.projectId, 'targetSessionReceipt.projectId', 200),
      editSessionId: requireText(receipt.editSessionId, 'targetSessionReceipt.editSessionId', 200),
      sessionName: requireText(receipt.sessionName, 'targetSessionReceipt.sessionName', 160),
      sessionUpdatedAt: requireISODate(receipt.sessionUpdatedAt, 'targetSessionReceipt.sessionUpdatedAt'),
      aspectRatio: receipt.aspectRatio,
      platformTarget: receipt.platformTarget,
      selectedEditLevel: receipt.selectedEditLevel,
      outputFrameConfirmed: true,
      approvalStatusBefore: receipt.approvalStatusBefore,
      approvalStatusAfter: receipt.approvalStatusAfter,
      approvalResetRequired: receipt.approvalResetRequired === true,
      stagedContextHash: requireText(receipt.stagedContextHash, 'targetSessionReceipt.stagedContextHash', 80),
      stagedApplicationContentDigest: requireSha256(receipt.stagedApplicationContentDigest, 'targetSessionReceipt.stagedApplicationContentDigest'),
      stagedAt: requireISODate(receipt.stagedAt, 'targetSessionReceipt.stagedAt'),
      mockOnly: true,
    },
  }
}

function assertTargetSessionReceipt(
  application: EditReferenceDetail['applications'][number],
  expectedContextHash: string,
  receipt: ConnectPreferenceApplicationRequest['targetSessionReceipt'],
): void {
  const validApprovalReset = receipt.approvalResetRequired
    ? receipt.approvalStatusAfter === 'reset_after_revision'
    : receipt.approvalStatusAfter === receipt.approvalStatusBefore
  if (
    receipt.projectId !== application.projectId
    || receipt.editSessionId !== application.editSessionId
    || receipt.aspectRatio !== application.targetContext.aspectRatio
    || receipt.platformTarget !== application.targetContext.platformTarget
    || receipt.selectedEditLevel !== application.targetContext.selectedEditLevel
    || receipt.outputFrameConfirmed !== true
    || receipt.stagedContextHash !== expectedContextHash
    || receipt.stagedApplicationContentDigest !== application.contentDigest
    || !validApprovalReset
  ) {
    throw new ApiError('VALIDATION_FAILED', 'The staged Project Edit Session receipt does not match this exact Preference Application.', 409)
  }
}

function assertDownstreamInvalidationReceipt(
  application: EditReferenceDetail['applications'][number],
  receipt: PreferenceApplicationDownstreamInvalidationReceipt,
  reason: PreferenceApplicationInvalidationReason,
): void {
  const validApprovalReset = receipt.approvalResetRequired
    ? receipt.approvalStatusAfter === 'reset_after_revision'
    : receipt.approvalStatusAfter === receipt.approvalStatusBefore
  if (
    application.targetIntegrationStatus !== 'connected'
    || !application.downstreamContext
    || receipt.applicationId !== application.id
    || receipt.applicationContentDigest !== application.contentDigest
    || receipt.contextHash !== application.downstreamContext.packageHash
    || receipt.projectId !== application.projectId
    || receipt.editSessionId !== application.editSessionId
    || receipt.reason !== reason
    || receipt.sessionContextInvalidated !== true
    || receipt.approvedPlanMutationMade !== false
    || receipt.mockOnly !== true
    || !validApprovalReset
    || Object.entries(PREFERENCE_APPLICATION_INTEGRATION_SAFETY_FLAGS).some(
      ([key, value]) => receipt.safety[key as keyof typeof PREFERENCE_APPLICATION_INTEGRATION_SAFETY_FLAGS] !== value,
    )
  ) {
    throw new ApiError('VALIDATION_FAILED', 'The downstream invalidation receipt does not match this exact connected Preference Application.', 409)
  }
}

function requireISODate(value: string, field: string): string {
  const normalized = requireText(value, field, 80)
  if (Number.isNaN(Date.parse(normalized))) throw new ApiError('VALIDATION_FAILED', `${field} must be an ISO date.`, 400)
  return normalized
}

function requireWorkspaceId(value: string): string {
  return requireText(value, 'workspaceId', 160)
}

function requireIdempotencyKey(value: string): string {
  return requireText(value, 'Idempotency-Key', 200)
}

function requireSha256(value: string, field: string): string {
  const normalized = value?.trim().toLowerCase()
  if (!/^[a-f0-9]{64}$/.test(normalized)) {
    throw new ApiError('VALIDATION_FAILED', `${field} must be a SHA-256 digest.`, 400)
  }
  return normalized
}

function requirePositiveInteger(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 1) throw new ApiError('VALIDATION_FAILED', `${field} must be a positive integer.`, 400)
  return value
}

function requirePositiveIntegerBounded(value: number, field: string, maximum: number): number {
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
    throw new ApiError('VALIDATION_FAILED', `${field} must be an integer between 1 and ${maximum}.`, 400)
  }
  return value
}

function requireNonNegativeNumber(value: number, field: string, maximum: number): number {
  if (!Number.isFinite(value) || value < 0 || value > maximum) {
    throw new ApiError('VALIDATION_FAILED', `${field} must be between 0 and ${maximum}.`, 400)
  }
  return value
}

function requireText(value: string, field: string, maximum: number): string {
  const normalized = value?.trim()
  if (!normalized || normalized.length > maximum) {
    throw new ApiError('VALIDATION_FAILED', `${field} must contain between 1 and ${maximum} characters.`, 400)
  }
  return normalized
}
