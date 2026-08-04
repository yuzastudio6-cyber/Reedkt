import type {
  ProfessionalIntegrationReadinessStatus,
  ProfessionalIntegrationState,
} from '../../types'

export function hasBlockingProfessionalIntegrationIssues(state: ProfessionalIntegrationState | null) {
  return Boolean(state?.issues.some((issue) => issue.severity === 'blocking'))
}

export function getProfessionalIntegrationReadinessStatus(
  state: ProfessionalIntegrationState | null,
): ProfessionalIntegrationReadinessStatus {
  if (!state || !state.professionalIntegrationPlan) return 'draft'
  if (state.summary.accepted) return 'accepted'
  if (hasBlockingProfessionalIntegrationIssues(state)) return 'blocked'
  if (state.issues.some((issue) => issue.severity === 'warning')) return 'needs_review'
  if (
    state.assetTreatmentPlans.length > 0 ||
    state.brollIntegrationPlans.length > 0 ||
    state.overlayCompositionPlans.length > 0 ||
    state.cueComplianceChecks.length > 0
  ) {
    return 'ready'
  }
  return 'draft'
}

export function getProfessionalIntegrationNextActions(state: ProfessionalIntegrationState | null) {
  if (!state || !state.professionalIntegrationPlan) return ['Create Professional Integration']

  const actions: string[] = []
  const status = getProfessionalIntegrationReadinessStatus(state)

  if (status === 'blocked') {
    actions.push('Resolve planning context blocking issues')
  }

  if (state.issues.some((issue) =>
    issue.type === 'privacy_blur_required' ||
    issue.type === 'caption_collision_risk' ||
    issue.type === 'face_collision_risk' ||
    issue.type === 'raw_edge_treatment_risk',
  )) {
    actions.push('Review overlay privacy and readability risks')
  }

  if (state.issues.some((issue) => issue.type === 'audio_conflict_risk')) {
    actions.push('Review audio treatment risks')
  }

  if (status !== 'accepted' && status !== 'blocked') {
    actions.push('Accept Professional Integration')
  }

  if (status === 'accepted') {
    actions.push('Continue to QA planning')
  }

  actions.push('Regenerate Professional Integration')

  return Array.from(new Set(actions))
}

export function getProfessionalIntegrationReadinessMessage(state: ProfessionalIntegrationState | null) {
  const status = getProfessionalIntegrationReadinessStatus(state)

  if (status === 'accepted') return 'Professional Integration accepted.'
  if (status === 'blocked') return 'Resolve blocking planning or treatment issues before generation.'
  if (status === 'needs_review') return 'Review professional treatment warnings before generation.'
  if (status === 'ready') return 'Professional treatment decisions are ready for QA planning.'
  return 'Create Professional Integration to turn planning direction into polished treatment decisions.'
}
