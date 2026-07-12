import type {
  ProjectEditBriefMarkerConflictRecord,
  ProjectEditBriefQAStatus,
} from './project-edit-brief'
import type { PreferenceApplicationQAContextSummary } from './edit-reference-integration'

export type ProjectEditBriefQAReadinessStatus =
  | 'not_checked'
  | 'ready_for_plan_mock'
  | 'ready_with_warnings_mock'
  | 'needs_user_review'
  | 'blocked_by_conflict'
  | 'blocked_by_missing_asset'
  | 'blocked_by_copy_risk'
  | 'failed_validation'

export type ProjectEditBriefQAFindingType =
  | 'missing_asset'
  | 'needs_clarification'
  | 'invalid_time_range'
  | 'overlap_conflict'
  | 'audio_conflict'
  | 'copy_risk'
  | 'export_warning'
  | 'policy_warning'
  | 'passed'

export type ProjectEditBriefQAFindingSeverity =
  | 'info'
  | 'warning'
  | 'review'
  | 'blocking'

export type ProjectEditBriefQAConflictKind =
  | 'cut_vs_broll'
  | 'cut_vs_keep'
  | 'do_not_use_vs_action'
  | 'music_vs_no_music'
  | 'sfx_vs_no_fake_sounds'
  | 'copy_reference_risk'
  | 'invalid_time_range'
  | 'missing_required_asset'
  | 'caption_safe_area_warning'
  | 'custom_export_warning'

export type ProjectEditBriefQAAction =
  | 'run_marker_qa'
  | 'run_brief_qa'
  | 'save_conflict'
  | 'update_marker_qa_status'
  | 'refresh_qa_summary'

export interface ProjectEditBriefQASafetyFlags {
  providerCallMade: false
  modelCallMade: false
  qwenCallMade: false
  deepSeekCallMade: false
  embeddingsUsed: false
  vectorDbUsed: false
  soundRuntimeStarted: false
  dockerCommandRun: false
  supabaseReadMade: false
  supabaseWriteMade: false
  storageReadMade: false
  storageWriteMade: false
  signedUrlCreated: false
  fileBytesRead: false
  externalUrlFetched: false
  mediaProcessingStarted: false
  workerJobCreated: false
  generationRequestCreated: false
  renderJobCreated: false
  exportJobCreated: false
  progressStarted: false
  creditReservedOrSpent: false
}

export interface ProjectEditBriefQAFinding extends ProjectEditBriefQASafetyFlags {
  id: string
  projectId: string
  editSessionId: string
  briefId: string
  markerId?: string
  relatedMarkerId?: string
  findingType: ProjectEditBriefQAFindingType
  conflictKind?: ProjectEditBriefQAConflictKind
  severity: ProjectEditBriefQAFindingSeverity
  qaStatus: ProjectEditBriefQAStatus
  title: string
  summary: string
  recommendedResolution: string
  blocksPlan: boolean
  requiresUserReview: boolean
  mockOnly: true
}

export interface ProjectEditBriefMarkerQAPackage extends ProjectEditBriefQASafetyFlags {
  markerId: string
  markerTitle: string
  qaStatus: ProjectEditBriefQAStatus
  readinessStatus: ProjectEditBriefQAReadinessStatus
  findings: ProjectEditBriefQAFinding[]
  conflictRecords: ProjectEditBriefMarkerConflictRecord[]
  recommendedNextAction: string
  mockOnly: true
  warnings: string[]
}

export interface ProjectEditBriefQAPackage extends ProjectEditBriefQASafetyFlags {
  briefId: string
  projectId: string
  editSessionId: string
  readinessStatus: ProjectEditBriefQAReadinessStatus
  markerPackages: ProjectEditBriefMarkerQAPackage[]
  findings: ProjectEditBriefQAFinding[]
  markerCount: number
  passedCount: number
  warningCount: number
  needsAssetCount: number
  needsClarificationCount: number
  conflictCount: number
  blockedCount: number
  readableSummary: string
  preferenceApplicationQA?: PreferenceApplicationQAContextSummary
  mockOnly: true
  warnings: string[]
}

export interface ProjectEditBriefQAValidationResult extends ProjectEditBriefQASafetyFlags {
  ok: boolean
  blocked: boolean
  blockedReasons: string[]
  warnings: string[]
  mockOnly: true
}

export interface ProjectEditBriefQASummaryModel extends ProjectEditBriefQASafetyFlags {
  briefId: string
  readinessStatus: ProjectEditBriefQAReadinessStatus
  readinessLabel: string
  markerCountLabel: string
  passedCount: number
  warningCount: number
  needsAssetCount: number
  needsClarificationCount: number
  conflictCount: number
  blockedCount: number
  readableSummary: string
  preferenceApplicationQA?: PreferenceApplicationQAContextSummary
  canRunMockQA: boolean
  boundarySummary: string
  mockOnly: true
  warnings: string[]
}

export interface ProjectEditBriefMarkerQAPanelModel extends ProjectEditBriefQASafetyFlags {
  markerId: string
  title: string
  qaStatus: ProjectEditBriefQAStatus
  qaStatusLabel: string
  readinessStatus: ProjectEditBriefQAReadinessStatus
  findings: ProjectEditBriefQAFinding[]
  conflicts: ProjectEditBriefMarkerConflictRecord[]
  recommendedNextAction: string
  boundarySummary: string
  canRunMockQA: boolean
  mockOnly: true
  warnings: string[]
  preferenceApplicationQA?: PreferenceApplicationQAContextSummary
}

export interface ProjectEditBriefQAScenario extends ProjectEditBriefQASafetyFlags {
  id: string
  title: string
  input: string
  expectedOk: boolean
  expectedReadinessStatus: ProjectEditBriefQAReadinessStatus
  expectedFindingType: ProjectEditBriefQAFindingType
  expectedSideEffectsFalse: true
  mockOnly: true
}

export interface ProjectEditBriefQAOrchestratorResult extends ProjectEditBriefQASafetyFlags {
  qaPackage?: ProjectEditBriefQAPackage
  markerPackage?: ProjectEditBriefMarkerQAPackage
  findings: ProjectEditBriefQAFinding[]
  conflicts: ProjectEditBriefMarkerConflictRecord[]
  validation: ProjectEditBriefQAValidationResult
  summary: string
  warnings: string[]
  nextStep: 'RP-EDITBRIEF-11 — Apply Brief Markers to Edit Plan'
  mockOnly: true
}

export const REEDITPRO_PROJECT_EDIT_BRIEF_QA_RULE =
  'Edit Brief Marker QA checks whether marker instructions are clear, complete, non-conflicting, and safe to use as future planning hints.'

export const REEDITPRO_PROJECT_EDIT_BRIEF_QA_NO_EXECUTION_RULE =
  'RP-EDITBRIEF-10 must not apply markers to plans, call models/providers, process media, run workers, render, or spend credits.'

export const REEDITPRO_PROJECT_EDIT_BRIEF_QA_PRIORITY_RULE =
  'Safety and do-not-copy policy outrank confirmed markers, which outrank main chat instructions, Edit Preference DNA, Auto Professional suggestions, and default style.'
