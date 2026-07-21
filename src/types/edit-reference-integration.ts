import type {
  PreferenceApplicationAdaptationDecision,
  PreferenceApplicationPrecedence,
  PreferenceApplicationRecord,
} from './edit-reference'
import type { PreferenceDNALayerId } from './preference-dna-builder'
import type {
  ProjectEditSessionApprovalStatus,
  ProjectEditSessionAspectRatio,
  ProjectEditSessionMemoryLayer,
  ProjectEditSessionPlatformTarget,
  ProjectEditSessionRecord,
} from './project-edit-session'
import type { UserFacingEditLevel } from './reeditpro'

export const PREFERENCE_APPLICATION_DOWNSTREAM_CONTEXT_VERSION =
  'edit-reference-downstream-context-v1' as const

export const PREFERENCE_APPLICATION_INTEGRATION_SAFETY_FLAGS = {
  providerCallMade: false,
  modelCallMade: false,
  fileBytesRead: false,
  externalUrlFetched: false,
  mediaProcessingStarted: false,
  workerJobCreated: false,
  generationRequestCreated: false,
  renderJobCreated: false,
  creditReservedOrSpent: false,
  approvedPlanMutationMade: false,
  supabaseWriteMade: false,
} as const

export type PreferenceApplicationIntegrationStatus =
  | 'staged_unconfirmed'
  | 'connected_mock'
  | 'invalidated'

export type PreferenceApplicationInvalidationReason = 'replace' | 'remove'

export interface PreferenceApplicationDownstreamGuidanceItem {
  id: string
  layerId: PreferenceDNALayerId
  title: string
  instruction: string
  decision: Extract<PreferenceApplicationAdaptationDecision, 'applied' | 'adapted'>
  precedence: PreferenceApplicationPrecedence
  sourceDecisionId: string
}

export interface PreferenceApplicationHeldBackItem {
  id: string
  layerId: PreferenceDNALayerId
  title: string
  reason: string
  sourceDecisionId: string
}

export interface PreferenceApplicationDownstreamContext {
  packageVersion: typeof PREFERENCE_APPLICATION_DOWNSTREAM_CONTEXT_VERSION
  packageHash: string
  applicationId: string
  applicationContentDigest: string
  /** Omitted only when hydrating a pre-Gate-8.1 legacy application package. */
  applicationSource?: PreferenceApplicationRecord['applicationSource']
  editReferenceId: string
  editReferenceName: string
  dnaVersionId: string
  dnaVersionNumber: number
  targetContextDigest: string
  projectId: string
  editSessionId: string
  currentUserInstruction: string
  approvedConstraints: string[]
  guidance: PreferenceApplicationDownstreamGuidanceItem[]
  heldBack: PreferenceApplicationHeldBackItem[]
  doNotCopyRules: string[]
  precedencePolicy: PreferenceApplicationRecord['precedencePolicy']
  summary: string
  integrationStatus: PreferenceApplicationIntegrationStatus
  mockOnly: true
  safety: typeof PREFERENCE_APPLICATION_INTEGRATION_SAFETY_FLAGS
}

export interface PreferenceApplicationTargetSessionReceipt {
  receiptVersion: 'edit-reference-project-session-receipt-v1'
  projectId: string
  editSessionId: string
  sessionName: string
  sessionUpdatedAt: string
  aspectRatio: Exclude<ProjectEditSessionAspectRatio, 'custom'>
  platformTarget: ProjectEditSessionPlatformTarget
  selectedEditLevel: UserFacingEditLevel
  outputFrameConfirmed: true
  approvalStatusBefore: ProjectEditSessionApprovalStatus
  approvalStatusAfter: ProjectEditSessionApprovalStatus
  approvalResetRequired: boolean
  stagedContextHash: string
  stagedApplicationContentDigest: string
  stagedAt: string
  mockOnly: true
}

export interface PreferenceApplicationDownstreamInvalidationReceipt {
  receiptVersion: 'edit-reference-downstream-invalidation-receipt-v1'
  applicationId: string
  applicationContentDigest: string
  contextHash: string
  projectId: string
  editSessionId: string
  reason: PreferenceApplicationInvalidationReason
  sessionUpdatedAt: string
  approvalStatusBefore: ProjectEditSessionApprovalStatus
  approvalStatusAfter: ProjectEditSessionApprovalStatus
  approvalResetRequired: boolean
  sessionContextInvalidated: true
  approvedPlanMutationMade: false
  invalidatedAt: string
  mockOnly: true
  safety: typeof PREFERENCE_APPLICATION_INTEGRATION_SAFETY_FLAGS
}

export interface ConnectPreferenceApplicationRequest {
  workspaceId: string
  expectedReferenceRevision: number
  expectedApplicationContentDigest: string
  targetSessionReceipt: PreferenceApplicationTargetSessionReceipt
}

export interface ClearPreferenceApplicationRequest {
  workspaceId: string
  expectedReferenceRevision: number
  expectedApplicationContentDigest: string
  invalidationReceipt: PreferenceApplicationDownstreamInvalidationReceipt
}

export interface ProjectEditSessionPreferenceIntegrationState {
  status: PreferenceApplicationIntegrationStatus
  applicationId: string
  editReferenceId: string
  editReferenceName: string
  dnaVersionId: string
  dnaVersionNumber: number
  context: PreferenceApplicationDownstreamContext
  stagedAt: string
  connectedAt?: string
  invalidatedAt?: string
  invalidationReason?: PreferenceApplicationInvalidationReason
  invalidationApprovalStatusBefore?: ProjectEditSessionApprovalStatus
  invalidationApprovalStatusAfter?: ProjectEditSessionApprovalStatus
  invalidationApprovalResetRequired?: boolean
  mockOnly: true
}

export interface PreferenceApplicationPlanGuidanceItem {
  id: string
  layerId: PreferenceDNALayerId
  title: string
  instruction: string
  status: 'active_hint' | 'held_back_by_confirmed_marker'
  reason: string
  priority: 'edit_preference_dna'
}

export interface PreferenceApplicationQAContextSummary {
  applicationId: string
  contextHash: string
  status: 'passed' | 'warning' | 'blocked'
  activeGuidanceCount: number
  heldBackGuidanceCount: number
  doNotCopyRuleCount: number
  findings: string[]
  prioritySummary: string
  mockOnly: true
}

export interface ProjectEditSessionPreferenceIntegrationMemoryUpdate {
  layer: ProjectEditSessionMemoryLayer
  summary: string
  facts: string[]
  preferences: string[]
  warnings: string[]
}

export interface ProjectEditSessionPreferenceIntegrationPlan {
  id: string
  action: 'stage_exact_application' | 'activate_connected_application' | 'invalidate_connected_application'
  projectId: string
  editSessionId: string
  applicationId: string
  context: PreferenceApplicationDownstreamContext
  sessionUpdates: Partial<ProjectEditSessionRecord>
  memoryUpdates: ProjectEditSessionPreferenceIntegrationMemoryUpdate[]
  historyEvents: string[]
  snapshotSummary: string
  shouldResetApproval: boolean
  invalidationReason?: PreferenceApplicationInvalidationReason
  mockOnly: true
  safety: typeof PREFERENCE_APPLICATION_INTEGRATION_SAFETY_FLAGS
}
