import type { ProfessionalQaState } from '../../types'

export function getProfessionalQaReadinessMessage(state: ProfessionalQaState | null) {
  const status = state?.summary.status ?? 'not_run'
  if (status === 'passed') return 'QA passed. The project is ready for preview planning.'
  if (status === 'needs_review') return 'Review QA warnings before preview/generation.'
  if (status === 'accepted_with_warnings') return 'Warnings were accepted. The project can move forward with caution.'
  if (status === 'blocked') return 'Resolve blocking QA issues before preview/generation.'
  if (status === 'failed') return 'QA failed. Review issues and rerun.'
  return 'Run QA before treating the preview as ready.'
}

export function hasBlockingQaIssues(state: ProfessionalQaState | null) {
  return (state?.summary.blockingCount ?? 0) > 0
}

export function canPreviewProceed(state: ProfessionalQaState | null) {
  const status = state?.summary.status
  return status === 'passed' || status === 'accepted_with_warnings'
}

export function getProfessionalQaNextActions(state: ProfessionalQaState | null) {
  if (!state?.report) return ['Run QA']
  if (state.summary.blockingCount > 0) return ['Resolve blocking QA issues', 'Rerun QA']
  if (state.summary.warningCount > 0) return ['Accept warnings', 'Mark QA reviewed', 'Rerun QA']
  if (state.summary.status === 'accepted_with_warnings') return ['Continue to preview planning', 'Rerun QA after changes']
  return ['Continue to preview planning']
}
