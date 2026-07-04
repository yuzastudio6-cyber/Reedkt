import type {
  ProjectEditSessionApprovalStatus,
  ProjectEditSessionEventRecord,
  ProjectEditSessionPreviewRecord,
  ProjectEditSessionRevisionRecord,
  ProjectEditSessionSnapshotRecord,
  ProjectEditSessionVersionRecord,
} from './project-edit-session'

export type ProjectEditSessionHistoryAction =
  | 'save_manual_checkpoint'
  | 'save_mock_version'
  | 'create_mock_preview_placeholder'
  | 'approve_mock_version'
  | 'reject_mock_version'
  | 'supersede_version'
  | 'capture_revision'
  | 'reset_approval_after_revision'
  | 'append_history_event'

export type ProjectEditSessionHistorySafetyStatus =
  | 'safe_mock_history_update'
  | 'blocked_real_render_required'
  | 'blocked_worker_required'
  | 'blocked_provider_required'
  | 'blocked_credit_required'
  | 'failed_validation'

export type ProjectEditSessionHistoryItemKind =
  | 'snapshot'
  | 'version'
  | 'preview'
  | 'revision'
  | 'approval'
  | 'event'

export interface ProjectEditSessionHistoryActionPlan {
  id: string
  projectId: string
  editSessionId: string
  action: ProjectEditSessionHistoryAction
  summary: string
  expectedWrites: ProjectEditSessionHistoryItemKind[]
  safetyStatus: ProjectEditSessionHistorySafetyStatus
  shouldPersist: boolean
  mockOnly: boolean
  warnings: string[]
}

export interface ProjectEditSessionHistoryPackage {
  id: string
  projectId: string
  editSessionId: string
  snapshots: ProjectEditSessionSnapshotRecord[]
  versions: ProjectEditSessionVersionRecord[]
  previews: ProjectEditSessionPreviewRecord[]
  revisions: ProjectEditSessionRevisionRecord[]
  events: ProjectEditSessionEventRecord[]
  latestSnapshot?: ProjectEditSessionSnapshotRecord
  latestVersion?: ProjectEditSessionVersionRecord
  latestPreview?: ProjectEditSessionPreviewRecord
  approvalStatus: ProjectEditSessionApprovalStatus
  readableSummary: string
  timelineItems: ProjectEditSessionHistoryTimelineItem[]
  mockOnly: boolean
  warnings: string[]
}

export interface ProjectEditSessionHistoryTimelineItem {
  id: string
  kind: ProjectEditSessionHistoryItemKind
  title: string
  summary: string
  createdAt: string
  statusLabel?: string
  mockOnly: boolean
}

export interface ProjectEditSessionHistoryValidationResult {
  ok: boolean
  blocked: boolean
  blockedReasons: string[]
  warnings: string[]
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

export interface ProjectEditSessionHistoryScenario {
  id: string
  title: string
  input: string
  expectedOk: boolean
  expectedSafetyStatus: ProjectEditSessionHistorySafetyStatus
  expectedWrites: ProjectEditSessionHistoryItemKind[]
  mockOnly: true
}

export interface ProjectEditSessionHistoryOrchestratorResult {
  actionPlan?: ProjectEditSessionHistoryActionPlan
  historyPackage?: ProjectEditSessionHistoryPackage
  snapshots: ProjectEditSessionSnapshotRecord[]
  versions: ProjectEditSessionVersionRecord[]
  previews: ProjectEditSessionPreviewRecord[]
  revisions: ProjectEditSessionRevisionRecord[]
  events: ProjectEditSessionEventRecord[]
  validation: ProjectEditSessionHistoryValidationResult
  summary: string[]
  warnings: string[]
  nextStep: 'RP-EDITSESSION-10 — Wire Edit Preference + DNA into Edit Sessions'
}

export const REEDITPRO_PROJECT_EDIT_SESSION_HISTORY_RULE =
  'Project Edit Session history records mock snapshots, versions, previews, revisions, approvals, and events so users can return later without losing context.'

export const REEDITPRO_PROJECT_EDIT_SESSION_HISTORY_NO_RENDER_RULE =
  'RP-EDITSESSION-09 may create mock preview placeholders but must not run render, progress, workers, providers, or media processing.'

export const REEDITPRO_PROJECT_EDIT_SESSION_HISTORY_APPROVAL_GATE_RULE =
  'Revision history may reset approval state, but approval must not trigger progress, render, worker jobs, provider calls, or credit spend in this milestone.'
