import type {
  ProjectEditSessionApprovalStatus,
  ProjectEditSessionVersionRecord,
} from '../../types/project-edit-session'

export function createApprovalStateSummary(status: ProjectEditSessionApprovalStatus): string {
  if (status === 'approved') return 'Approved state is recorded only; no progress, render, worker, provider, or credit flow starts.'
  if (status === 'rejected') return 'Rejected state is recorded only; no render or worker flow starts.'
  if (status === 'reset_after_revision') return 'Approval reset after a revision request. A future edit-planning milestone must review it.'
  if (status === 'requested') return 'Mock approval requested. Approval remains a state gate only.'
  return 'Approval has not been requested.'
}

export function resetApprovalAfterRevision(): ProjectEditSessionApprovalStatus {
  return 'reset_after_revision'
}

export function requestMockApproval(): ProjectEditSessionApprovalStatus {
  return 'requested'
}

export function approveMockVersionStateOnly(version?: ProjectEditSessionVersionRecord): ProjectEditSessionApprovalStatus {
  void version
  return 'approved'
}

export function rejectMockVersionStateOnly(version?: ProjectEditSessionVersionRecord): ProjectEditSessionApprovalStatus {
  void version
  return 'rejected'
}

export function createApprovalHistorySummary(status: ProjectEditSessionApprovalStatus): string {
  return `Approval state: ${status.replace(/_/g, ' ')}. ${createApprovalStateSummary(status)}`
}
