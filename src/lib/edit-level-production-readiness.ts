import type {
  EditLevelProductionReadiness,
  EditLevelProductionReadinessEvidence,
  EditLevelProductionReadinessEvidenceSnapshot,
} from '../types'

const editLevelProductionEvidenceDefaults: EditLevelProductionReadinessEvidenceSnapshot = {
  profileContractApproved: false,
  repositoryPersistenceApproved: false,
  apiRouteApproved: false,
  clientRuntimeWiringApproved: false,
  plannerWiringApproved: false,
  providerRoutingApproved: false,
  mediaWorkerApproved: false,
  renderExportApproved: false,
  creditReservationApproved: false,
  supabasePersistenceApproved: false,
  deploymentApproved: false,
  qaApproved: false,
}

const requiredEditLevelProductionEvidence: Array<{
  key: keyof EditLevelProductionReadinessEvidenceSnapshot
  blocker: string
}> = [
  {
    key: 'profileContractApproved',
    blocker: 'Edit Level profile contracts need owner-approved production profile evidence.',
  },
  {
    key: 'repositoryPersistenceApproved',
    blocker: 'Edit Level selections/readiness need approved production persistence.',
  },
  {
    key: 'apiRouteApproved',
    blocker: 'Edit Level routes need approved backend production route contracts.',
  },
  {
    key: 'clientRuntimeWiringApproved',
    blocker: 'Edit Level UI/client wiring needs approved runtime integration evidence.',
  },
  {
    key: 'plannerWiringApproved',
    blocker: 'Edit Level planner routing needs approved plan-snapshot integration evidence.',
  },
  {
    key: 'providerRoutingApproved',
    blocker: 'Edit Level provider routing needs approved provider/model policy evidence.',
  },
  {
    key: 'mediaWorkerApproved',
    blocker: 'Edit Level media-worker behavior needs approved worker evidence.',
  },
  {
    key: 'renderExportApproved',
    blocker: 'Edit Level render/export behavior needs approved render evidence.',
  },
  {
    key: 'creditReservationApproved',
    blocker: 'Edit Level credit reservation/spend behavior needs approved cost gate evidence.',
  },
  {
    key: 'supabasePersistenceApproved',
    blocker: 'Edit Level Supabase persistence needs approved migration/RLS evidence.',
  },
  {
    key: 'deploymentApproved',
    blocker: 'Edit Level production deployment needs approved deployment evidence.',
  },
  {
    key: 'qaApproved',
    blocker: 'Edit Level production QA needs passing evidence.',
  },
]

export function normalizeEditLevelProductionReadinessEvidence(
  evidence: EditLevelProductionReadinessEvidence = {},
): EditLevelProductionReadinessEvidenceSnapshot {
  return {
    ...editLevelProductionEvidenceDefaults,
    ...evidence,
  }
}

export function evaluateEditLevelProductionReadiness(
  evidence: EditLevelProductionReadinessEvidence = {},
): EditLevelProductionReadiness {
  const normalizedEvidence = normalizeEditLevelProductionReadinessEvidence(evidence)
  const blockers = requiredEditLevelProductionEvidence
    .filter((requirement) => normalizedEvidence[requirement.key] !== true)
    .map((requirement) => requirement.blocker)
  const productionReady = blockers.length === 0

  return {
    productionReady,
    blockers,
    warnings: productionReady
      ? []
      : ['Edit Level production readiness is evidence-gated; mock/local profile availability alone is not enough.'],
    evidence: normalizedEvidence,
  }
}

export const defaultEditLevelProductionReadiness = evaluateEditLevelProductionReadiness()
