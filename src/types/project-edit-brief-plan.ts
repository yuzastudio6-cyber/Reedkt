import type {
  ProjectEditBriefApplicationLogRecord,
  ProjectEditBriefMarkerPriority,
  ProjectEditBriefMarkerRecord,
  ProjectEditBriefQAStatus,
  ProjectEditBriefMarkerType,
  ProjectEditSessionExportSettingsRecord,
} from './project-edit-brief'
import type {
  PreferenceApplicationPlanGuidanceItem,
  PreferenceApplicationQAContextSummary,
} from './edit-reference-integration'

export type ProjectEditBriefPlanReadinessStatus =
  | 'not_prepared'
  | 'ready_for_mock_plan_hints'
  | 'ready_with_warnings_mock'
  | 'needs_user_review'
  | 'blocked_by_qa'
  | 'blocked_by_missing_asset'
  | 'blocked_by_copy_risk'
  | 'failed_validation'

export type ProjectEditBriefPlanInstructionKind =
  | 'broll_insert'
  | 'cut_or_remove'
  | 'keep_or_emphasize'
  | 'caption_or_text'
  | 'graphic_or_card'
  | 'music_or_soundtrack_hint'
  | 'sfx_hint'
  | 'voiceover_hint'
  | 'transition_hint'
  | 'pacing_adjustment'
  | 'color_tone_adjustment'
  | 'restriction'
  | 'general_note'

export type ProjectEditBriefPlanInstructionPriority =
  | 'safety_policy'
  | 'confirmed_marker'
  | 'main_chat'
  | 'edit_preference_dna'
  | 'auto_professional'
  | 'default_style'

export type ProjectEditBriefPlanMarkerEligibility =
  | 'included'
  | 'included_with_warning'
  | 'skipped_needs_asset'
  | 'skipped_needs_clarification'
  | 'skipped_conflict'
  | 'skipped_copy_risk'
  | 'skipped_invalid_time_range'
  | 'skipped_missing_intent'
  | 'skipped_not_confirmed'

export type ProjectEditBriefPlanApplicationAction =
  | 'prepare_plan_hints'
  | 'create_instruction'
  | 'skip_marker'
  | 'append_application_log'
  | 'refresh_plan_summary'

export interface ProjectEditBriefPlanSafetyFlags {
  plannerExecuted: false
  editPlanCreated: false
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

export interface ProjectEditBriefMarkerPlanInstruction extends ProjectEditBriefPlanSafetyFlags {
  id: string
  projectId: string
  editSessionId: string
  briefId: string
  markerId: string
  markerTitle: string
  markerType: ProjectEditBriefMarkerType
  sourceIntentId?: string
  instructionKind: ProjectEditBriefPlanInstructionKind
  instructionText: string
  timeRangeLabel: string
  startTimeSeconds: number
  endTimeSeconds?: number
  priority: ProjectEditBriefPlanInstructionPriority
  markerPriority: ProjectEditBriefMarkerPriority
  requiredAssets: string[]
  providedAssetIds: string[]
  warnings: string[]
  plannerNotes: string[]
  doNotCopyNotes: string[]
  qaStatus: ProjectEditBriefQAStatus
  includedInMockPlanHints: true
  mockOnly: true
}

export interface ProjectEditBriefSkippedMarker {
  markerId: string
  markerTitle: string
  markerType?: ProjectEditBriefMarkerType
  eligibility: ProjectEditBriefPlanMarkerEligibility
  reason: string
  recommendedFix: string
  qaStatus?: ProjectEditBriefQAStatus
  mockOnly: true
}

export interface ProjectEditBriefMarkerEligibilityResult {
  marker: ProjectEditBriefMarkerRecord
  eligibility: ProjectEditBriefPlanMarkerEligibility
  reason: string
  recommendedFix: string
  warnings: string[]
  canCreateInstruction: boolean
  mockOnly: true
}

export interface ProjectEditBriefPlannerInputPackage extends ProjectEditBriefPlanSafetyFlags {
  id: string
  projectId: string
  editSessionId: string
  briefId: string
  readinessStatus: ProjectEditBriefPlanReadinessStatus
  exportSettings?: ProjectEditSessionExportSettingsRecord
  eligibleMarkers: ProjectEditBriefMarkerRecord[]
  skippedMarkerRecords: ProjectEditBriefMarkerRecord[]
  eligibleMarkerCount: number
  skippedMarkerCount: number
  warningCount: number
  blockedCount: number
  planInstructions: ProjectEditBriefMarkerPlanInstruction[]
  preferenceGuidance: PreferenceApplicationPlanGuidanceItem[]
  preferenceApplicationQA?: PreferenceApplicationQAContextSummary
  preferenceApplicationId?: string
  preferenceApplicationContextHash?: string
  skippedMarkers: ProjectEditBriefSkippedMarker[]
  priorityPolicy: string[]
  qaSummary: string
  applicationLogSummary?: string
  warnings: string[]
  mockOnly: true
}

export interface ProjectEditBriefPlanApplicationResult extends ProjectEditBriefPlanSafetyFlags {
  ok: boolean
  package: ProjectEditBriefPlannerInputPackage
  applicationLog?: ProjectEditBriefApplicationLogRecord
  includedMarkers: ProjectEditBriefMarkerPlanInstruction[]
  skippedMarkers: ProjectEditBriefSkippedMarker[]
  warnings: string[]
  mockOnly: true
}

export interface ProjectEditBriefPlanPanelModel extends ProjectEditBriefPlanSafetyFlags {
  briefId: string
  title: string
  readinessStatus: ProjectEditBriefPlanReadinessStatus
  readinessLabel: string
  eligibleMarkerCount: number
  skippedMarkerCount: number
  warningCount: number
  blockedCount: number
  instructions: ProjectEditBriefMarkerPlanInstruction[]
  preferenceGuidance: PreferenceApplicationPlanGuidanceItem[]
  preferenceApplicationQA?: PreferenceApplicationQAContextSummary
  preferenceApplicationId?: string
  preferenceApplicationContextHash?: string
  skippedMarkers: ProjectEditBriefSkippedMarker[]
  exportSettingsSummary?: string
  priorityPolicySummary: string
  applicationLogSummary?: string
  canPreparePlanHints: boolean
  boundarySummary: string
  warnings: string[]
  mockOnly: true
}

export interface ProjectEditBriefPlanValidationResult extends ProjectEditBriefPlanSafetyFlags {
  ok: boolean
  blocked: boolean
  blockedReasons: string[]
  warnings: string[]
}

export interface ProjectEditBriefPlanScenario extends ProjectEditBriefPlanSafetyFlags {
  id: string
  title: string
  input: string
  expectedOk: boolean
  expectedReadinessStatus: ProjectEditBriefPlanReadinessStatus
  expectedInstructionKind?: ProjectEditBriefPlanInstructionKind
  expectedSideEffectsFalse: true
  mockOnly: true
}

export interface ProjectEditBriefPlanOrchestratorResult extends ProjectEditBriefPlanSafetyFlags {
  priorityPolicy: string[]
  eligibleMarkers: ProjectEditBriefMarkerRecord[]
  skippedMarkers: ProjectEditBriefSkippedMarker[]
  planInstructions: ProjectEditBriefMarkerPlanInstruction[]
  plannerInputPackage: ProjectEditBriefPlannerInputPackage
  applicationResult: ProjectEditBriefPlanApplicationResult
  panelModel: ProjectEditBriefPlanPanelModel
  validation: ProjectEditBriefPlanValidationResult
  summary: string
  warnings: string[]
  nextStep: 'RP-EDITBRIEF-12 — Internal Testing + Playwright Coverage'
  mockOnly: true
}

export const REEDITPRO_PROJECT_EDIT_BRIEF_PLAN_RULE =
  'Edit Brief plan application converts eligible markers into mock planner hints only; it does not run the real edit planner or execute media work.'

export const REEDITPRO_PROJECT_EDIT_BRIEF_PLAN_PRIORITY_RULE =
  'Safety and do-not-copy policy outrank confirmed Edit Brief markers, which outrank main chat instructions, Edit Preference DNA, Auto Professional suggestions, and default style.'

export const REEDITPRO_PROJECT_EDIT_BRIEF_PLAN_NO_EXECUTION_RULE =
  'RP-EDITBRIEF-11 must not create generation requests, worker jobs, render jobs, provider calls, media processing, remote persistence, or credit effects.'
