import type { ProjectEditSessionMemoryLayer, ProjectEditSessionRecord } from './project-edit-session'
import type {
  PreferenceApplicationDownstreamContext,
  PreferenceApplicationIntegrationStatus,
} from './edit-reference-integration'

export type ProjectEditSessionPreferenceApplicationStatus =
  | 'not_selected'
  | 'legacy_preference_applied'
  | 'dna_applied_mock'
  | 'dna_applied_with_warnings_mock'
  | 'dna_conservative_hints_only'
  | 'dna_requires_user_review'
  | 'dna_blocked_by_qa'
  | 'cleared'
  | 'failed_validation'

export type ProjectEditSessionPreferenceApplicationAction =
  | 'list_options'
  | 'apply_preference'
  | 'apply_dna'
  | 'apply_legacy_fallback'
  | 'clear_preference'
  | 'replace_preference'
  | 'create_memory_update'
  | 'create_history_event'
  | 'create_snapshot'

export type ProjectEditSessionPreferenceSourceKind =
  | 'saved_edit_preference'
  | 'created_from_reference'
  | 'previous_approved_edit_preference'
  | 'legacy_no_dna'
  | 'none'
  | 'mock_fixture'

export interface ProjectEditSessionPreferenceSafetyFlags {
  providerCallMade: false
  supabaseWriteMade: false
  storageWriteMade: false
  fileBytesRead: false
  externalUrlFetched: false
  mediaProcessingStarted: false
  workerJobCreated: false
  generationRequestCreated: false
  renderJobCreated: false
  creditReservedOrSpent: false
}

export interface ProjectEditSessionPreferenceOption {
  id: string
  handle?: string
  name: string
  sourceKind: ProjectEditSessionPreferenceSourceKind
  description?: string
  hasDNA: boolean
  dnaStatusLabel?: string
  dnaQAStatusLabel?: string
  doNotCopyRulesActive: boolean
  requiresUserReview: boolean
  mockOnly: boolean
}

export interface ProjectEditSessionPreferenceState {
  id: string
  projectId: string
  editSessionId: string
  selectedEditPreferenceId?: string
  selectedPreferenceVersionId?: string
  selectedEditPreferenceHandle?: string
  selectedEditPreferenceName?: string
  status: ProjectEditSessionPreferenceApplicationStatus
  dnaApplicationId?: string
  dnaStatusLabel?: string
  dnaQAStatusLabel?: string
  doNotCopyRulesActive: boolean
  requiresUserReview: boolean
  blockedReasons: string[]
  warnings: string[]
  integrationStatus?: PreferenceApplicationIntegrationStatus
  applicationContext?: PreferenceApplicationDownstreamContext
  mockOnly: boolean
}

export interface ProjectEditSessionPreferenceMemoryUpdate {
  layer: ProjectEditSessionMemoryLayer
  summary: string
  facts: string[]
  preferences: string[]
  warnings: string[]
}

export interface ProjectEditSessionPreferenceApplicationPlan {
  id: string
  projectId: string
  editSessionId: string
  option: ProjectEditSessionPreferenceOption
  status: ProjectEditSessionPreferenceApplicationStatus
  actions: ProjectEditSessionPreferenceApplicationAction[]
  sessionUpdates: Partial<ProjectEditSessionRecord>
  memoryUpdates: ProjectEditSessionPreferenceMemoryUpdate[]
  historyEvents: string[]
  snapshotSummary?: string
  shouldResetApproval: boolean
  mockOnly: boolean
  warnings: string[]
}

export interface ProjectEditSessionPreferencePanelModel {
  editSessionId: string
  title: string
  statusLabel: string
  selectedPreferenceName?: string
  selectedPreferenceHandle?: string
  dnaStatusLabel?: string
  dnaQAStatusLabel?: string
  doNotCopyRules: string[]
  badges: string[]
  canApplyPreference: boolean
  canClearPreference: boolean
  requiresUserReview: boolean
  blockedReasons: string[]
  warnings: string[]
  integrationStatus?: PreferenceApplicationIntegrationStatus
  applicationContext?: PreferenceApplicationDownstreamContext
  mockOnly: boolean
}

export interface ProjectEditSessionPreferenceValidationResult extends ProjectEditSessionPreferenceSafetyFlags {
  ok: boolean
  blocked: boolean
  blockedReasons: string[]
  warnings: string[]
}

export interface MockProjectEditSessionPreferenceScenario {
  id: string
  title: string
  input: Record<string, unknown>
  expectedOk: boolean
  expectedStatus: ProjectEditSessionPreferenceApplicationStatus
  expectedSideEffectsFalse: boolean
  mockOnly: true
}

export interface MockProjectEditSessionPreferenceOrchestratorResult {
  options: ProjectEditSessionPreferenceOption[]
  state: ProjectEditSessionPreferenceState
  applicationPlan?: ProjectEditSessionPreferenceApplicationPlan
  panelModel: ProjectEditSessionPreferencePanelModel
  memoryUpdates: ProjectEditSessionPreferenceMemoryUpdate[]
  historyEvents: string[]
  validation: ProjectEditSessionPreferenceValidationResult
  summary: string[]
  warnings: string[]
  nextStep: 'RP-EDITSESSION-11 — Editor Route and Navigation Model'
}

export const REEDITPRO_PROJECT_EDIT_SESSION_PREFERENCE_RULE =
  'A ProjectEditSession may use an Edit Preference, but it is not itself an Edit Preference.'

export const REEDITPRO_PROJECT_EDIT_SESSION_PREFERENCE_DNA_RULE =
  'Preference DNA may guide an Edit Chat only after mock DNA QA permits it, and must not copy reference media or bypass approval gates.'

export const REEDITPRO_PROJECT_EDIT_SESSION_PREFERENCE_NO_EXECUTION_RULE =
  'RP-EDITSESSION-10 applies Edit Preference/DNA to Edit Sessions as mock metadata, memory, and history only; it must not start generation, rendering, workers, providers, media processing, Supabase, or credits.'
