import type {
  ProjectEditSessionHistoryAction,
  ProjectEditSessionHistoryActionPlan,
  ProjectEditSessionHistoryItemKind,
  ProjectEditSessionHistorySafetyStatus,
} from '../../types/project-edit-session-history'

const ACTION_WRITES: Record<ProjectEditSessionHistoryAction, ProjectEditSessionHistoryItemKind[]> = {
  save_manual_checkpoint: ['snapshot', 'event'],
  save_mock_version: ['version', 'snapshot', 'event'],
  create_mock_preview_placeholder: ['preview', 'snapshot', 'event'],
  approve_mock_version: ['version', 'approval', 'event'],
  reject_mock_version: ['version', 'approval', 'event'],
  supersede_version: ['version', 'event'],
  capture_revision: ['revision', 'snapshot', 'approval', 'event'],
  reset_approval_after_revision: ['approval', 'event'],
  append_history_event: ['event'],
}

const BLOCKED_SUMMARIES: Record<ProjectEditSessionHistorySafetyStatus, string> = {
  safe_mock_history_update: 'Mock/local history update is allowed.',
  blocked_real_render_required: 'Blocked because real render or preview generation would be required.',
  blocked_worker_required: 'Blocked because worker execution would be required.',
  blocked_provider_required: 'Blocked because provider or model execution would be required.',
  blocked_credit_required: 'Blocked because credit reservation or spend would be required.',
  failed_validation: 'Blocked because the history action failed validation.',
}

export function classifyProjectEditSessionHistorySafety(input: {
  requiresRender?: boolean
  requiresWorker?: boolean
  requiresProvider?: boolean
  requiresCredit?: boolean
  failedValidation?: boolean
} = {}): ProjectEditSessionHistorySafetyStatus {
  if (input.requiresRender) return 'blocked_real_render_required'
  if (input.requiresWorker) return 'blocked_worker_required'
  if (input.requiresProvider) return 'blocked_provider_required'
  if (input.requiresCredit) return 'blocked_credit_required'
  if (input.failedValidation) return 'failed_validation'
  return 'safe_mock_history_update'
}

export function createProjectEditSessionHistoryActionPlan(input: {
  id?: string
  projectId: string
  editSessionId: string
  action: ProjectEditSessionHistoryAction
  summary?: string
  safetyStatus?: ProjectEditSessionHistorySafetyStatus
  warnings?: string[]
}): ProjectEditSessionHistoryActionPlan {
  const safetyStatus = input.safetyStatus ?? 'safe_mock_history_update'
  return {
    id: input.id ?? `history-plan-${input.editSessionId}-${input.action}`,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    action: input.action,
    summary: input.summary ?? BLOCKED_SUMMARIES[safetyStatus],
    expectedWrites: ACTION_WRITES[input.action],
    safetyStatus,
    shouldPersist: safetyStatus === 'safe_mock_history_update',
    mockOnly: true,
    warnings: input.warnings ?? [],
  }
}

export function validateHistoryActionDoesNotRequireExecution(input: {
  requiresRender?: boolean
  requiresWorker?: boolean
  requiresProvider?: boolean
  requiresCredit?: boolean
}): ProjectEditSessionHistoryActionPlan {
  return createProjectEditSessionHistoryActionPlan({
    projectId: 'mock-project-edit-chat-foundation',
    editSessionId: 'edit-session-vertical-dna',
    action: 'append_history_event',
    safetyStatus: classifyProjectEditSessionHistorySafety(input),
  })
}

export function createProjectEditSessionHistoryPolicySummary(plan: ProjectEditSessionHistoryActionPlan): string {
  return plan.shouldPersist
    ? `${plan.action.replace(/_/g, ' ')} may write mock ${plan.expectedWrites.join(', ')} records only.`
    : `${plan.action.replace(/_/g, ' ')} is blocked: ${plan.summary}`
}
